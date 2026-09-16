import { asMemberId, asWishlistItemId } from '@core/domain/Entity'
import { WishlistItem } from '../domain/entities/WishlistItem'

/** Fila de `wishlist_items` tal como llega de Supabase. */
export interface WishlistItemRow {
  readonly id: string
  readonly member_id: string
  readonly title: string
  readonly url: string | null
  readonly notes: string | null
  readonly position: number
  readonly created_at: string
}

export const WishlistMapper = {
  toEntity(row: WishlistItemRow): WishlistItem {
    return WishlistItem.create({
      id: asWishlistItemId(row.id),
      memberId: asMemberId(row.member_id),
      title: row.title,
      url: row.url,
      notes: row.notes,
      position: row.position,
      createdAt: new Date(row.created_at),
    })
  },
}
