import type { UseCase } from '@core/application/UseCase'
import { err, type Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { MemberId, WishlistItemId } from '@core/domain/Entity'
import { WishlistItemDraft, type WishlistItemInput } from '../../domain/value-objects/WishlistItemDraft'
import type { WishlistItem } from '../../domain/entities/WishlistItem'
import type { WishlistRepository } from '../../domain/repositories/WishlistRepository'

export interface UpdateWishlistItemInput extends WishlistItemInput {
  readonly itemId: WishlistItemId
  /** Miembro propio del grupo, resuelto desde el grupo ya cargado. */
  readonly memberId: MemberId
}

export class UpdateWishlistItem implements UseCase<UpdateWishlistItemInput, WishlistItem> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  execute(input: UpdateWishlistItemInput): Promise<Result<WishlistItem, DomainError>> {
    const draftResult = WishlistItemDraft.create(input)
    if (draftResult.isErr) return Promise.resolve(err(draftResult.error))

    const draft = draftResult.value
    return this.wishlistRepository.update(input.itemId, input.memberId, {
      title: draft.title,
      url: draft.url,
      notes: draft.notes,
    })
  }
}
