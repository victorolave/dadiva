import type { DadivaClient } from '@core/infrastructure/supabase/client'
import { ok, err, type Result } from '@core/domain/Result'
import { unexpectedError, type DomainError } from '@core/domain/DomainError'
import { mapPostgrestError } from '@core/infrastructure/supabase/mapPostgrestError'
import type { MemberId, WishlistItemId } from '@core/domain/Entity'
import type { WishlistItem } from '../domain/entities/WishlistItem'
import type { WishlistItemData, WishlistRepository } from '../domain/repositories/WishlistRepository'
import { WishlistMapper, type WishlistItemRow } from './WishlistMapper'

const COLUMNS = 'id, member_id, title, url, notes, position, created_at'

/**
 * Adaptador de la lista de deseos.
 *
 * Cada escritura filtra ADEMÁS por `member_id` (no solo por `id`), siguiendo
 * el mismo patrón que `SupabaseGroupRepository.leave`: es cinturón y tirantes,
 * porque quien de verdad bloquea tocar el ítem de otra persona son las
 * políticas RLS de `wishlist_items` (`wishlist_update_own` / `wishlist_delete_own`,
 * supabase/migrations/0003_rls_policies.sql §7), que comparan contra
 * `auth.uid()` en el servidor.
 */
export class SupabaseWishlistRepository implements WishlistRepository {
  constructor(private readonly client: DadivaClient) {}

  async listForMember(memberId: MemberId): Promise<Result<readonly WishlistItem[], DomainError>> {
    try {
      const { data, error } = await this.client
        .from('wishlist_items')
        .select(COLUMNS)
        .eq('member_id', memberId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) return err(mapPostgrestError(error, 'wishlist.list'))

      return ok((data ?? []).map((row) => WishlistMapper.toEntity(row as WishlistItemRow)))
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async add(memberId: MemberId, data: WishlistItemData): Promise<Result<WishlistItem, DomainError>> {
    try {
      // Cuenta actual para anexar al final. Hay una ventana de carrera teórica
      // si la misma persona agrega desde dos pestañas a la vez: en el peor
      // caso dos ítems comparten posición, que solo desempata el orden visual
      // (sin índice único sobre position), nunca corrompe datos.
      const { count, error: countError } = await this.client
        .from('wishlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', memberId)

      if (countError) return err(mapPostgrestError(countError, 'wishlist.count'))

      const { data: created, error } = await this.client
        .from('wishlist_items')
        .insert({
          member_id: memberId,
          title: data.title,
          url: data.url,
          notes: data.notes,
          position: count ?? 0,
        })
        .select(COLUMNS)
        .single()

      if (error) return err(mapPostgrestError(error, 'wishlist.add'))

      return ok(WishlistMapper.toEntity(created as WishlistItemRow))
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async update(
    itemId: WishlistItemId,
    memberId: MemberId,
    data: WishlistItemData,
  ): Promise<Result<WishlistItem, DomainError>> {
    try {
      const { data: updated, error } = await this.client
        .from('wishlist_items')
        .update({ title: data.title, url: data.url, notes: data.notes })
        .eq('id', itemId)
        .eq('member_id', memberId)
        .select(COLUMNS)
        .single()

      if (error) return err(mapPostgrestError(error, 'wishlist.update'))

      return ok(WishlistMapper.toEntity(updated as WishlistItemRow))
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async remove(itemId: WishlistItemId, memberId: MemberId): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('member_id', memberId)

      if (error) return err(mapPostgrestError(error, 'wishlist.remove'))

      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }
}
