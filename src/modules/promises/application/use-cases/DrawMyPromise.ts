import type { UseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId } from '@core/domain/Entity'
import type { PromiseCard } from '../../domain/entities/PromiseCard'
import type { PromiseRepository } from '../../domain/repositories/PromiseRepository'

/**
 * Saca la promesa del grupo.
 *
 * El azar vive en el servidor a propósito. Si barajáramos en el cliente, dos
 * pestañas abiertas darían dos tarjetas distintas y la "promesa personal" se
 * volvería un sorteo de máquina tragamonedas: pedirías otra hasta que te
 * gustara. Una sola vez, y es tuya.
 */
export class DrawMyPromise implements UseCase<GroupId, PromiseCard> {
  constructor(private readonly promiseRepository: PromiseRepository) {}

  execute(groupId: GroupId): Promise<Result<PromiseCard, DomainError>> {
    return this.promiseRepository.draw(groupId)
  }
}
