import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import { asWishlistItemId, type MemberId, type WishlistItemId } from '@core/domain/Entity'
import { WishlistItem } from '../../../domain/entities/WishlistItem'
import type { WishlistItemData, WishlistRepository } from '../../../domain/repositories/WishlistRepository'

/**
 * Doble en memoria del puerto de lista de deseos.
 *
 * Ejercita los casos de uso completos sin tocar la red, igual que describe el
 * comentario de `Container` en `src/app/composition/container.ts`.
 */
export class FakeWishlistRepository implements WishlistRepository {
  private items: WishlistItem[] = []
  private nextId = 0

  seed(items: readonly WishlistItem[]): void {
    this.items = [...items]
  }

  async listForMember(memberId: MemberId): Promise<Result<readonly WishlistItem[], DomainError>> {
    return ok(this.items.filter((item) => item.memberId === memberId))
  }

  async add(memberId: MemberId, data: WishlistItemData): Promise<Result<WishlistItem, DomainError>> {
    const position = this.items.filter((item) => item.memberId === memberId).length
    const item = WishlistItem.create({
      id: asWishlistItemId(`fake-${this.nextId++}`),
      memberId,
      title: data.title,
      url: data.url,
      notes: data.notes,
      position,
      createdAt: new Date(),
    })
    this.items.push(item)
    return ok(item)
  }

  async update(
    itemId: WishlistItemId,
    memberId: MemberId,
    data: WishlistItemData,
  ): Promise<Result<WishlistItem, DomainError>> {
    const index = this.items.findIndex((item) => item.id === itemId && item.memberId === memberId)
    if (index === -1) {
      return err(DomainErrors.notFound('wishlist.not_found', 'No encontramos ese deseo.'))
    }

    const current = this.items[index] as WishlistItem
    const updated = WishlistItem.create({
      id: current.id,
      memberId: current.memberId,
      title: data.title,
      url: data.url,
      notes: data.notes,
      position: current.position,
      createdAt: current.createdAt,
    })
    this.items[index] = updated
    return ok(updated)
  }

  async remove(itemId: WishlistItemId, memberId: MemberId): Promise<Result<void, DomainError>> {
    const index = this.items.findIndex((item) => item.id === itemId && item.memberId === memberId)
    if (index === -1) {
      return err(DomainErrors.notFound('wishlist.not_found', 'No encontramos ese deseo.'))
    }

    this.items.splice(index, 1)
    return ok(undefined)
  }
}
