import type { UseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId } from '@core/domain/Entity'
import type { PromiseCard } from '../../domain/entities/PromiseCard'
import type { PromiseRepository } from '../../domain/repositories/PromiseRepository'

/** Recupera la promesa guardada. Es lo que hace que persista entre visitas. */
export class GetMyPromise implements UseCase<GroupId, PromiseCard | null> {
  constructor(private readonly promiseRepository: PromiseRepository) {}

  execute(groupId: GroupId): Promise<Result<PromiseCard | null, DomainError>> {
    return this.promiseRepository.findMine(groupId)
  }
}
