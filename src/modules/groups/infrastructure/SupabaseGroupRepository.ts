import type { DadivaClient } from '@core/infrastructure/supabase/client'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, unexpectedError, type DomainError } from '@core/domain/DomainError'
import { mapPostgrestError } from '@core/infrastructure/supabase/mapPostgrestError'
import { asGroupId, type GroupId, type MemberId, type UserId } from '@core/domain/Entity'
import type { Group } from '../domain/entities/Group'
import type { InviteCode } from '../domain/value-objects/InviteCode'
import type {
  CreateGroupData,
  GroupRepository,
  GroupSummary,
} from '../domain/repositories/GroupRepository'
import { GroupMapper, type GroupRow, type MemberRow } from './GroupMapper'

const GROUP_COLUMNS =
  'id, name, description, owner_id, exchange_date, budget_amount, budget_currency, invite_code, status, created_at'

// Sin join a `profiles`: esa tabla tiene lectura solo-propia por RLS, así que
// el avatar de los demás llegaría siempre null. Vive en group_members (ver
// migración 0005), igual que display_name.
const MEMBER_COLUMNS = 'id, user_id, display_name, avatar_emoji, role, joined_at'

export class SupabaseGroupRepository implements GroupRepository {
  constructor(private readonly client: DadivaClient) {}

  async create(data: CreateGroupData): Promise<Result<Group, DomainError>> {
    try {
      const { data: userData } = await this.client.auth.getUser()
      if (!userData.user) {
        return err(
          DomainErrors.unauthenticated('auth.no_session', 'Entra de nuevo para crear tu grupo.'),
        )
      }

      const { data: created, error } = await this.client
        .from('groups')
        .insert({
          name: data.name,
          description: data.description,
          owner_id: userData.user.id,
          // La base espera DATE (YYYY-MM-DD); recortamos el ISO al día.
          exchange_date: data.exchangeDate ? data.exchangeDate.toISOString().slice(0, 10) : null,
          budget_amount: data.budgetAmount,
          budget_currency: data.budgetCurrency,
        })
        .select(GROUP_COLUMNS)
        .single()

      if (error) return err(mapPostgrestError(error, 'group.create'))

      // El creador entra como primer miembro con rol owner. Si esto fallara,
      // quedaría un grupo sin dueño adentro: por eso lo revisamos y no lo
      // dejamos pasar en silencio.
      const { error: memberError } = await this.client.from('group_members').insert({
        group_id: created.id,
        user_id: userData.user.id,
        display_name: data.ownerDisplayName,
        role: 'owner',
      })

      if (memberError) return err(mapPostgrestError(memberError, 'group.create_owner_member'))

      return this.findById(asGroupId(created.id))
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async findById(groupId: GroupId): Promise<Result<Group, DomainError>> {
    try {
      const { data: groupRow, error } = await this.client
        .from('groups')
        .select(GROUP_COLUMNS)
        .eq('id', groupId)
        .maybeSingle()

      if (error) return err(mapPostgrestError(error, 'group.find'))
      if (!groupRow) {
        return err(
          DomainErrors.notFound('group.not_found', 'No encontramos ese grupo o no perteneces a él.'),
        )
      }

      const { data: memberRows, error: membersError } = await this.client
        .from('group_members')
        .select(MEMBER_COLUMNS)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })

      if (membersError) return err(mapPostgrestError(membersError, 'group.find_members'))

      const memberIds = (memberRows ?? []).map((row) => row.id)
      const flags = await this.loadMemberFlags(groupId, memberIds)

      const members = (memberRows ?? []).map((row) =>
        GroupMapper.toMember(row as MemberRow, {
          hasWishlist: flags.withWishlist.has(row.id),
          hasDrawnPromise: flags.withPromise.has(row.id),
        }),
      )

      // Solo el owner puede leer `exclusions` (RLS). Para el resto el conteo
      // llega en 0, que es correcto: la regla de imposibilidad solo la necesita
      // quien puede disparar el sorteo.
      const { count: exclusionCount } = await this.client
        .from('exclusions')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)

      return ok(GroupMapper.toGroup(groupRow as GroupRow, members, exclusionCount ?? 0))
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async listForUser(userId: UserId): Promise<Result<readonly GroupSummary[], DomainError>> {
    try {
      const { data, error } = await this.client
        .from('group_members')
        .select('group_id, groups(id, name, status, exchange_date, owner_id)')
        .eq('user_id', userId)

      if (error) return err(mapPostgrestError(error, 'group.list'))

      const groupIds = (data ?? [])
        .map((row) => row.groups?.id)
        .filter((id): id is string => typeof id === 'string')

      if (groupIds.length === 0) return ok([])

      // Un conteo por grupo en una sola consulta: traemos solo los ids de
      // miembro y agrupamos en memoria. Con grupos de decenas de personas esto
      // es más barato que N consultas de count.
      const { data: countRows, error: countError } = await this.client
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)

      if (countError) return err(mapPostgrestError(countError, 'group.list_counts'))

      const counts = new Map<string, number>()
      for (const row of countRows ?? []) {
        counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1)
      }

      const summaries: GroupSummary[] = []
      for (const row of data ?? []) {
        const group = row.groups
        if (!group) continue

        summaries.push({
          id: asGroupId(group.id),
          name: group.name,
          status: group.status,
          memberCount: counts.get(group.id) ?? 0,
          exchangeDate: group.exchange_date ? new Date(`${group.exchange_date}T12:00:00`) : null,
          isOwner: group.owner_id === userId,
        })
      }

      // Los grupos con intercambio más próximo arriba; los que no tienen fecha
      // al final. Es el orden en que la gente realmente los necesita.
      summaries.sort((a, b) => {
        if (a.exchangeDate && b.exchangeDate) {
          return a.exchangeDate.getTime() - b.exchangeDate.getTime()
        }
        if (a.exchangeDate) return -1
        if (b.exchangeDate) return 1
        return a.name.localeCompare(b.name, 'es')
      })

      return ok(summaries)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async joinByCode(code: InviteCode, displayName: string): Promise<Result<Group, DomainError>> {
    try {
      const { data, error } = await this.client.rpc('join_group_by_code', {
        p_invite_code: code.value,
        p_display_name: displayName,
      })

      if (error) return err(mapPostgrestError(error, 'group.join'))
      if (!data) {
        return err(
          DomainErrors.notFound('group.invalid_code', 'Ese código no corresponde a ningún grupo.'),
        )
      }

      return this.findById(asGroupId(data.group_id))
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async runDraw(groupId: GroupId): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client.rpc('draw_group', { p_group_id: groupId })
      if (error) return err(mapPostgrestError(error, 'group.draw'))
      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async leave(groupId: GroupId, memberId: MemberId): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client
        .from('group_members')
        .delete()
        .eq('id', memberId)
        .eq('group_id', groupId)

      if (error) return err(mapPostgrestError(error, 'group.leave'))
      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async close(groupId: GroupId): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client
        .from('groups')
        .update({ status: 'closed' })
        .eq('id', groupId)

      if (error) return err(mapPostgrestError(error, 'group.close'))
      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  /**
   * Quién tiene lista de deseos y quién ya sacó su promesa.
   *
   * Son dos consultas planas en vez de subconsultas por miembro. Devolvemos
   * Sets vacíos si algo falla: son indicadores decorativos y no vale la pena
   * tumbar la pantalla del grupo por ellos.
   */
  private async loadMemberFlags(
    groupId: GroupId,
    memberIds: readonly string[],
  ): Promise<{ withWishlist: Set<string>; withPromise: Set<string> }> {
    if (memberIds.length === 0) {
      return { withWishlist: new Set(), withPromise: new Set() }
    }

    const [wishlistResult, promisesResult] = await Promise.all([
      this.client.from('wishlist_items').select('member_id').in('member_id', memberIds),
      this.client.from('member_promises').select('member_id').eq('group_id', groupId),
    ])

    return {
      withWishlist: new Set((wishlistResult.data ?? []).map((row) => row.member_id)),
      withPromise: new Set((promisesResult.data ?? []).map((row) => row.member_id)),
    }
  }
}
