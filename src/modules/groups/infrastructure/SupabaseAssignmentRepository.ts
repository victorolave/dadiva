import type { DadivaClient } from '@core/infrastructure/supabase/client'
import { ok, err, type Result } from '@core/domain/Result'
import { unexpectedError, type DomainError } from '@core/domain/DomainError'
import { mapPostgrestError } from '@core/infrastructure/supabase/mapPostgrestError'
import { asMemberId, type GroupId } from '@core/domain/Entity'
import type {
  AssignmentRepository,
  MyAssignment,
} from '../domain/repositories/AssignmentRepository'

/**
 * Adaptador de asignaciones.
 *
 * Aquí NO hay ningún filtro del tipo `.eq('giver_member_id', yo)`. No hace
 * falta: las políticas RLS ya restringen la tabla a la fila propia de quien
 * consulta. Si mañana alguien borra ese `.eq` por error, el secreto sigue
 * protegido — la seguridad vive en la base, no en este archivo.
 */
export class SupabaseAssignmentRepository implements AssignmentRepository {
  constructor(private readonly client: DadivaClient) {}

  async findMine(groupId: GroupId): Promise<Result<MyAssignment | null, DomainError>> {
    try {
      const { data, error } = await this.client
        .from('assignments')
        .select('receiver_member_id, revealed_at')
        .eq('group_id', groupId)
        .maybeSingle()

      if (error) return err(mapPostgrestError(error, 'assignment.find'))
      if (!data) return ok(null)

      const { data: receiver, error: receiverError } = await this.client
        .from('group_members')
        .select('id, display_name, avatar_emoji')
        .eq('id', data.receiver_member_id)
        .single()

      if (receiverError) return err(mapPostgrestError(receiverError, 'assignment.receiver'))

      const { data: wishlist, error: wishlistError } = await this.client
        .from('wishlist_items')
        .select('title, url, notes')
        .eq('member_id', data.receiver_member_id)
        .order('position', { ascending: true })

      if (wishlistError) return err(mapPostgrestError(wishlistError, 'assignment.wishlist'))

      return ok({
        receiverMemberId: asMemberId(receiver.id),
        receiverName: receiver.display_name,
        receiverAvatarEmoji: receiver.avatar_emoji,
        revealedAt: data.revealed_at ? new Date(data.revealed_at) : null,
        wishlist: (wishlist ?? []).map((item) => ({
          title: item.title,
          url: item.url,
          notes: item.notes,
        })),
      })
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async markAsRevealed(groupId: GroupId): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client.rpc('reveal_assignment', { p_group_id: groupId })
      if (error) return err(mapPostgrestError(error, 'assignment.reveal'))
      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }
}
