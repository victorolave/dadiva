import { ValueObject } from '@core/domain/Entity'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'

interface InviteCodeProps {
  readonly value: string
}

/**
 * Código de invitación de 8 caracteres.
 *
 * El alfabeto excluye O, 0, I, 1 y L a propósito. Este código se dicta por
 * WhatsApp y se teclea a mano: si alguien confunde un cero con una O no entra
 * al grupo y culpa a la app. Como esos caracteres NUNCA aparecen en un código
 * válido, verlos solo puede significar dos cosas: o la persona se equivocó al
 * teclear, o leyó mal un carácter parecido. Por eso los mapeamos a su vecino
 * visual DENTRO del alfabeto en vez de rechazarlos de entrada.
 */
export class InviteCode extends ValueObject<InviteCodeProps> {
  static readonly ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  static readonly LENGTH = 8

  /**
   * Confusiones visuales, siempre resolviendo HACIA un carácter que sí existe
   * en el alfabeto. Mapear hacia O o I sería un error: no están en el alfabeto
   * y el código resultante no podría coincidir con ninguno real.
   */
  private static readonly CONFUSIONS: Readonly<Record<string, string>> = {
    O: 'Q', // la O redonda se confunde con la Q
    '0': 'Q',
    I: 'J',
    L: 'J',
    '1': 'J',
    S: 'S',
  }

  private constructor(props: InviteCodeProps) {
    super(props)
  }

  static create(raw: string): Result<InviteCode, DomainError> {
    // La gente pega el código con espacios, guiones o en minúscula.
    // Todo eso debe funcionar igual.
    const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (cleaned.length === 0) {
      return err(
        DomainErrors.validation('invite.empty', 'Escribe el código que te compartieron.', {
          field: 'inviteCode',
        }),
      )
    }

    const normalized = [...cleaned]
      .map((char) => InviteCode.CONFUSIONS[char] ?? char)
      .join('')

    if (normalized.length !== InviteCode.LENGTH) {
      return err(
        DomainErrors.validation(
          'invite.bad_length',
          `El código tiene ${InviteCode.LENGTH} caracteres y escribiste ${normalized.length}.`,
          { field: 'inviteCode' },
        ),
      )
    }

    const invalid = [...normalized].find((char) => !InviteCode.ALPHABET.includes(char))
    if (invalid !== undefined) {
      return err(
        DomainErrors.validation(
          'invite.bad_charset',
          'Ese código tiene caracteres que no usamos. Revísalo y vuelve a escribirlo.',
          { field: 'inviteCode' },
        ),
      )
    }

    return ok(new InviteCode({ value: normalized }))
  }

  /** Reconstruye desde la base de datos, donde el valor ya es canónico. */
  static fromPersistence(value: string): InviteCode {
    return new InviteCode({ value })
  }

  get value(): string {
    return this.props.value
  }

  /** Agrupado de a cuatro: más fácil de leer en voz alta y de teclear. */
  get formatted(): string {
    return `${this.props.value.slice(0, 4)}-${this.props.value.slice(4)}`
  }

  toString(): string {
    return this.props.value
  }
}
