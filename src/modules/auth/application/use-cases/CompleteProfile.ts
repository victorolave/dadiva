import type { UseCase } from '@core/application/UseCase'
import { err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import type { AuthenticatedUser } from '../../domain/entities/AuthenticatedUser'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'

export interface CompleteProfileInput {
  readonly displayName: string
  readonly avatarEmoji: string
}

/** Regla de dominio: el nombre es lo que verán los demás, no puede estar vacío. */
export class CompleteProfile implements UseCase<CompleteProfileInput, AuthenticatedUser> {
  private static readonly MIN_LENGTH = 2
  private static readonly MAX_LENGTH = 40

  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: CompleteProfileInput): Promise<Result<AuthenticatedUser, DomainError>> {
    const displayName = input.displayName.trim().replace(/\s+/g, ' ')

    if (displayName.length < CompleteProfile.MIN_LENGTH) {
      return err(
        DomainErrors.validation('profile.name_too_short', 'Tu nombre necesita al menos 2 letras.', {
          field: 'displayName',
        }),
      )
    }

    if (displayName.length > CompleteProfile.MAX_LENGTH) {
      return err(
        DomainErrors.validation('profile.name_too_long', 'Usa un nombre de 40 letras o menos.', {
          field: 'displayName',
        }),
      )
    }

    return this.authRepository.updateProfile({
      displayName,
      avatarEmoji: input.avatarEmoji,
    })
  }
}
