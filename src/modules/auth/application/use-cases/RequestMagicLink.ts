import type { UseCase } from '@core/application/UseCase'
import { ok, err, type Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import { Email } from '../../domain/value-objects/Email'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'

export interface RequestMagicLinkInput {
  readonly email: string
  readonly redirectTo: string
}

export interface RequestMagicLinkOutput {
  /** Correo enmascarado para confirmarle a la persona a dónde lo enviamos. */
  readonly sentTo: string
}

/**
 * Envía el enlace de acceso.
 *
 * Nota de seguridad: el resultado es idéntico exista o no una cuenta con ese
 * correo. Si dijéramos "ese correo no está registrado" convertiríamos el
 * formulario en un oráculo para descubrir quién tiene cuenta.
 */
export class RequestMagicLink implements UseCase<RequestMagicLinkInput, RequestMagicLinkOutput> {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: RequestMagicLinkInput): Promise<Result<RequestMagicLinkOutput, DomainError>> {
    const emailResult = Email.create(input.email)
    if (emailResult.isErr) return err(emailResult.error)

    const email = emailResult.value
    const sendResult = await this.authRepository.sendMagicLink(email, input.redirectTo)
    if (sendResult.isErr) return err(sendResult.error)

    return ok({ sentTo: email.masked })
  }
}
