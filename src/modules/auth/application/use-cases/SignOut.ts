import type { QueryUseCase } from '@core/application/UseCase'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'

export class SignOut implements QueryUseCase<void> {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<Result<void, DomainError>> {
    return this.authRepository.signOut()
  }
}
