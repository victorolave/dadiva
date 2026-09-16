import { ValueObject } from '@core/domain/Entity'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'

interface EmailProps {
  readonly value: string
}

/**
 * Email válido por construcción.
 *
 * No existe un `new Email('basura')`. Si tienes una instancia de Email en la
 * mano, el valor ya pasó la validación. Eso elimina la pregunta "¿esto ya lo
 * validaron?" de todo el resto del código.
 */
export class Email extends ValueObject<EmailProps> {
  // Deliberadamente permisiva. Validar emails con regex estricta rechaza
  // direcciones legítimas; la verificación real la hace el magic link al
  // llegar (o no llegar) a la bandeja.
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  private constructor(props: EmailProps) {
    super(props)
  }

  static create(raw: string): Result<Email, DomainError> {
    const value = raw.trim().toLowerCase()

    if (value.length === 0) {
      return err(
        DomainErrors.validation('email.empty', 'Escribe tu correo para continuar.', {
          field: 'email',
        }),
      )
    }

    if (value.length > 254) {
      return err(
        DomainErrors.validation('email.too_long', 'Ese correo es demasiado largo.', {
          field: 'email',
        }),
      )
    }

    if (!Email.PATTERN.test(value)) {
      return err(
        DomainErrors.validation('email.invalid', 'Revisa el correo, parece incompleto.', {
          field: 'email',
        }),
      )
    }

    return ok(new Email({ value }))
  }

  get value(): string {
    return this.props.value
  }

  /** Versión enmascarada para mostrar sin exponer la dirección completa. */
  get masked(): string {
    const [user = '', domain = ''] = this.props.value.split('@')
    const head = user.slice(0, 2)
    return `${head}${'•'.repeat(Math.max(user.length - 2, 1))}@${domain}`
  }

  toString(): string {
    return this.props.value
  }
}
