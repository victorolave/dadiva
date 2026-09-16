import type { UseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'

export interface SignInWithGoogleInput {
  readonly redirectTo: string
}

/**
 * Entrada con Google.
 *
 * El caso de uso es delgado a propósito: aquí no hay ninguna regla de negocio
 * que imponer. La validación de identidad la hace Google y la verificación del
 * token la hace Supabase. Inventarle lógica sería ceremonia vacía.
 *
 * Existe igual, y no llamamos al repositorio directo desde el componente,
 * porque así la capa de presentación sigue hablando un solo idioma: casos de
 * uso. El día que haya que registrar analítica o aceptar términos antes de
 * redirigir, el lugar ya está.
 */
export class SignInWithGoogle implements UseCase<SignInWithGoogleInput, void> {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: SignInWithGoogleInput): Promise<Result<void, DomainError>> {
    return this.authRepository.signInWithGoogle(input.redirectTo)
  }
}
