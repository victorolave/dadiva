import type { Result } from '../domain/Result'
import type { DomainError } from '../domain/DomainError'

/**
 * Un caso de uso es una unidad de intención del usuario: "crear un grupo",
 * "hacer el sorteo", "sacar mi promesa". Una entrada, una salida, un Result.
 *
 * Interfaz Segregation en la práctica: cada caso de uso es su propia interfaz
 * de un solo método en vez de un "GroupService" con quince responsabilidades.
 */
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Result<Output, DomainError>>
}

/** Casos de uso sin parámetros de entrada (ej. "obtener la sesión actual"). */
export interface QueryUseCase<Output> {
  execute(): Promise<Result<Output, DomainError>>
}
