import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId } from '@core/domain/Entity'
import type { PromiseCard } from '../entities/PromiseCard'

export interface PromiseRepository {
  /** La promesa ya sacada en este grupo, o null si todavía no sacó ninguna. */
  findMine(groupId: GroupId): Promise<Result<PromiseCard | null, DomainError>>

  /**
   * Saca una promesa. Es IDEMPOTENTE: llamarla dos veces devuelve la misma
   * tarjeta. La aleatoriedad ocurre una sola vez, en el servidor.
   */
  draw(groupId: GroupId): Promise<Result<PromiseCard, DomainError>>
}
