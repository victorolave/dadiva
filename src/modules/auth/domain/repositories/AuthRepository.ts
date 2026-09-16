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
  /**
   * Inicia sesión con Google.
   *
   * Es la puerta principal de la app. A diferencia del enlace por correo, no
   * depende de que un mensaje se entregue: todo ocurre por redirección dentro
   * del mismo navegador. Eso elimina de un golpe la cuota de envío, el dominio
   * verificado, el spam y la fragilidad de PKCE entre dispositivos.
   *
   * No devuelve nada porque el navegador abandona la página: la sesión se
   * recoge al volver a `redirectTo`.
   */
  signInWithGoogle(redirectTo: string): Promise<Result<void, DomainError>>

  /**
   * Envía el enlace mágico al correo indicado.
   *
   * Se conserva completo y probado, pero HOY NO SE OFRECE en la interfaz: sin
   * un dominio verificado el proveedor de correo solo entrega a la dirección
   * dueña de la cuenta, así que para cualquier otra persona el enlace no
   * llegaría nunca. Exponer un formulario que falla en silencio es peor que no
   * exponerlo. Se reactiva en cuanto haya dominio.
   */
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
