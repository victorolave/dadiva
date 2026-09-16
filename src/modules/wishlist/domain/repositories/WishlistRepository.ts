import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { MemberId, WishlistItemId } from '@core/domain/Entity'
import type { WishlistItem } from '../entities/WishlistItem'

/** Título, enlace y notas ya validados por `WishlistItemDraft`. */
export interface WishlistItemData {
  readonly title: string
  readonly url: string | null
  readonly notes: string | null
}

/**
 * Puerto de la lista de deseos.
 *
 * Todo método recibe el `memberId` de quien llama, resuelto SIEMPRE desde el
 * grupo ya cargado (`Group.memberForUser`), nunca desde un id que llegue del
 * cliente sin verificar. Aun así, quien de verdad impide leer o tocar la lista
 * de otra persona son las políticas RLS de `wishlist_items`
 * (supabase/migrations/0003_rls_policies.sql §7): este filtro es defensa en
 * profundidad, no el guardia real.
 */
export interface WishlistRepository {
  listForMember(memberId: MemberId): Promise<Result<readonly WishlistItem[], DomainError>>
  add(memberId: MemberId, data: WishlistItemData): Promise<Result<WishlistItem, DomainError>>
  update(
    itemId: WishlistItemId,
    memberId: MemberId,
    data: WishlistItemData,
  ): Promise<Result<WishlistItem, DomainError>>
  remove(itemId: WishlistItemId, memberId: MemberId): Promise<Result<void, DomainError>>
}
