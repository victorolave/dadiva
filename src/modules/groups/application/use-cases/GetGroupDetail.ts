import type { UseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId } from '@core/domain/Entity'
import type { Group } from '../../domain/entities/Group'
import type { GroupRepository } from '../../domain/repositories/GroupRepository'

export class GetGroupDetail implements UseCase<GroupId, Group> {
  constructor(private readonly groupRepository: GroupRepository) {}

  execute(groupId: GroupId): Promise<Result<Group, DomainError>> {
    return this.groupRepository.findById(groupId)
  }
}
