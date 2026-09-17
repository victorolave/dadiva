import { asUserId } from '@core/domain/Entity'
import { ok, type Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { AuthRepository } from '@modules/auth/domain/repositories/AuthRepository'
import type { Email } from '@modules/auth/domain/value-objects/Email'
import { AuthenticatedUser } from '@modules/auth/domain/entities/AuthenticatedUser'

/**
 * Doble en memoria de `AuthRepository` para tests de UI.
 *
 * No hace red ni Supabase: sirve para montar `AuthProvider` de verdad (y por
 * lo tanto `AppShell`/páginas que llaman `useAuth`) sin depender del
 * contenedor de producción. `getCurrentUser`/`onSessionChange` son los dos
 * únicos métodos que `AuthProvider` llama al montar; el resto solo hace falta
 * si el test dispara una acción (entrar, salir, completar perfil).
 */
export class FakeAuthRepository implements AuthRepository {
  constructor(private user: AuthenticatedUser | null = null) {}

  async signInWithGoogle(): Promise<Result<void, DomainError>> {
    return ok(undefined)
  }

  async sendMagicLink(_email: Email, _redirectTo: string): Promise<Result<void, DomainError>> {
    return ok(undefined)
  }

  async getCurrentUser(): Promise<Result<AuthenticatedUser | null, DomainError>> {
    return ok(this.user)
  }

  async updateProfile(input: {
    readonly displayName: string
    readonly avatarEmoji: string
  }): Promise<Result<AuthenticatedUser, DomainError>> {
    this.user = this.user?.withDisplayName(input.displayName) ?? this.user
    return ok(this.user ?? buildFakeUser())
  }

  async signOut(): Promise<Result<void, DomainError>> {
    this.user = null
    return ok(undefined)
  }

  onSessionChange(_listener: (user: AuthenticatedUser | null) => void): () => void {
    // Ningún test dispara un cambio de sesión asíncrono todavía: basta con
    // devolver un "cancelar" que no hace nada.
    return () => {}
  }
}

/**
 * Variante cuyo `getCurrentUser()` nunca resuelve.
 *
 * Sirve para aislar, en un test, el estado 'loading' que viene de Supabase
 * (la promesa de sesión sigue pendiente) del que viene de que el contenedor
 * de dependencias todavía no cargó (ver `ContainerProvider`) — sin esto, un
 * `getCurrentUser()` que resuelve casi al instante tapa esa segunda causa.
 */
export class NeverResolvingAuthRepository extends FakeAuthRepository {
  override async getCurrentUser(): Promise<Result<AuthenticatedUser | null, DomainError>> {
    return new Promise(() => {})
  }
}

/** Usuario listo para pruebas que necesitan sesión iniciada. */
export const buildFakeUser = (
  overrides: Partial<{
    id: string
    email: string
    displayName: string
    avatarEmoji: string
  }> = {},
): AuthenticatedUser =>
  AuthenticatedUser.create({
    id: asUserId(overrides.id ?? 'user-1'),
    email: overrides.email ?? 'persona@example.com',
    displayName: overrides.displayName ?? 'Persona de prueba',
    avatarEmoji: overrides.avatarEmoji ?? '🎁',
  })
