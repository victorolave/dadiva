import type { UseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { MemberId } from '@core/domain/Entity'
import type { WishlistItem } from '../../domain/entities/WishlistItem'
import type { WishlistRepository } from '../../domain/repositories/WishlistRepository'

export class ListMyWishlist implements UseCase<MemberId, readonly WishlistItem[]> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  execute(memberId: MemberId): Promise<Result<readonly WishlistItem[], DomainError>> {
    return this.wishlistRepository.listForMember(memberId)
  }
}
