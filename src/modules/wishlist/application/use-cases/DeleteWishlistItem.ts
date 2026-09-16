import type { UseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { MemberId, WishlistItemId } from '@core/domain/Entity'
import type { WishlistRepository } from '../../domain/repositories/WishlistRepository'

export interface DeleteWishlistItemInput {
  readonly itemId: WishlistItemId
  readonly memberId: MemberId
}

export class DeleteWishlistItem implements UseCase<DeleteWishlistItemInput, void> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  execute(input: DeleteWishlistItemInput): Promise<Result<void, DomainError>> {
    return this.wishlistRepository.remove(input.itemId, input.memberId)
  }
}
