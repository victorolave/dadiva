import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { Email } from '../value-objects/Email'
import type { AuthenticatedUser } from '../entities/AuthenticatedUser'

/**
 * Puerto de autenticación (Dependency Inversion).
 *
 * El dominio DECLARA lo que necesita; la infraestructura lo implementa. La
 * flecha de dependencia apunta hacia adentro: `SupabaseAuthRepository` depende
 * de esta interfaz, nunca al revés. Por eso un test puede inyectar un repo en
 * memoria y ejercitar los casos de uso sin red ni base de datos.
 */
export interface AuthRepository {
  /** Envía el enlace mágico al correo indicado. */
  sendMagicLink(email: Email, redirectTo: string): Promise<Result<void, DomainError>>

  /** Usuario de la sesión actual, o null si no hay sesión. */
  getCurrentUser(): Promise<Result<AuthenticatedUser | null, DomainError>>

  /** Actualiza el perfil de la persona autenticada. */
  updateProfile(input: {
    readonly displayName: string
    readonly avatarEmoji: string
  }): Promise<Result<AuthenticatedUser, DomainError>>

  signOut(): Promise<Result<void, DomainError>>

  /**
   * Notifica cambios de sesión (login, logout, refresh de token).
   * Devuelve la función para cancelar la suscripción.
   */
  onSessionChange(listener: (user: AuthenticatedUser | null) => void): () => void
}
