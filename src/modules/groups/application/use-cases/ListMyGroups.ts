import type { UseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { UserId } from '@core/domain/Entity'
import type { GroupRepository, GroupSummary } from '../../domain/repositories/GroupRepository'

export class ListMyGroups implements UseCase<UserId, readonly GroupSummary[]> {
  constructor(private readonly groupRepository: GroupRepository) {}

  execute(userId: UserId): Promise<Result<readonly GroupSummary[], DomainError>> {
    return this.groupRepository.listForUser(userId)
  }
}
