import { Entity, type UserId } from '@core/domain/Entity'

interface AuthenticatedUserProps {
  readonly id: UserId
  readonly email: string
  readonly displayName: string
  readonly avatarEmoji: string
}

/**
 * La persona que está usando la app ahora mismo.
 *
 * Solo contiene lo que el dominio necesita. El token de acceso, el refresh
 * token y los metadatos del proveedor son asunto de la infraestructura y no
 * cruzan esta frontera.
 */
export class AuthenticatedUser extends Entity<UserId> {
  readonly email: string
  readonly displayName: string
  readonly avatarEmoji: string

  private constructor(props: AuthenticatedUserProps) {
    super(props.id)
    this.email = props.email
    this.displayName = props.displayName
    this.avatarEmoji = props.avatarEmoji
  }

  static create(props: AuthenticatedUserProps): AuthenticatedUser {
    return new AuthenticatedUser(props)
  }

  /** Iniciales para el avatar cuando no hay emoji. */
  get initials(): string {
    return this.displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }

  /** Alguien que entró por magic link pero aún no eligió su nombre. */
  get needsOnboarding(): boolean {
    return this.displayName.trim().length === 0
  }

  withDisplayName(displayName: string): AuthenticatedUser {
    return new AuthenticatedUser({
      id: this.id,
      email: this.email,
      displayName,
      avatarEmoji: this.avatarEmoji,
    })
  }
}
