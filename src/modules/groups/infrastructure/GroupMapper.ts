import { asGroupId, asMemberId, asUserId } from '@core/domain/Entity'
import { Group } from '../domain/entities/Group'
import { Member, type MemberRole } from '../domain/entities/Member'
import { InviteCode } from '../domain/value-objects/InviteCode'
import type { GroupStatus } from '../domain/value-objects/GroupStatus'

/** Fila de grupo tal como llega de Supabase, con sus relaciones expandidas. */
export interface GroupRow {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly owner_id: string
  readonly exchange_date: string | null
  readonly budget_amount: number | null
  readonly budget_currency: string
  readonly invite_code: string
  readonly status: GroupStatus
  readonly created_at: string
}

export interface MemberRow {
  readonly id: string
  readonly user_id: string
  readonly display_name: string
  readonly avatar_emoji: string
  readonly role: MemberRole
  readonly joined_at: string
}

/**
 * Traduce filas de base de datos a objetos de dominio.
 *
 * Tener el mapeo aislado significa que un `ALTER TABLE ... RENAME COLUMN` toca
 * exactamente un archivo. Si cada componente leyera `row.display_name` directo,
 * ese rename sería una cacería por todo el proyecto.
 */
export const GroupMapper = {
  toMember(
    row: MemberRow,
    flags: { readonly hasWishlist: boolean; readonly hasDrawnPromise: boolean },
  ): Member {
    return Member.create({
      id: asMemberId(row.id),
      userId: asUserId(row.user_id),
      displayName: row.display_name,
      avatarEmoji: row.avatar_emoji,
      role: row.role,
      joinedAt: new Date(row.joined_at),
      hasWishlist: flags.hasWishlist,
      hasDrawnPromise: flags.hasDrawnPromise,
    })
  },

  toGroup(row: GroupRow, members: readonly Member[], exclusionCount = 0): Group {
    return Group.create({
      id: asGroupId(row.id),
      name: row.name,
      description: row.description,
      ownerId: asUserId(row.owner_id),
      // `exchange_date` es DATE sin hora. Interpretarlo como UTC medianoche
      // haría que en Colombia (UTC-5) se muestre el día anterior. Lo anclamos
      // al mediodía local para que nunca cruce de día por zona horaria.
      exchangeDate: row.exchange_date ? new Date(`${row.exchange_date}T12:00:00`) : null,
      budget:
        row.budget_amount !== null
          ? { amount: row.budget_amount, currency: row.budget_currency }
          : null,
      inviteCode: InviteCode.fromPersistence(row.invite_code),
      status: row.status,
      members,
      exclusionCount,
      createdAt: new Date(row.created_at),
    })
  },
}
