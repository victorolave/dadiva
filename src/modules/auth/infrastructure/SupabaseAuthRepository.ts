import type { AuthError } from '@supabase/supabase-js'
import type { DadivaClient } from '@core/infrastructure/supabase/client'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, unexpectedError, type DomainError } from '@core/domain/DomainError'
import { mapPostgrestError } from '@core/infrastructure/supabase/mapPostgrestError'
import { asUserId } from '@core/domain/Entity'
import { AuthenticatedUser } from '../domain/entities/AuthenticatedUser'
import type { Email } from '../domain/value-objects/Email'
import type { AuthRepository } from '../domain/repositories/AuthRepository'

/**
 * Adaptador de Supabase Auth.
 *
 * Es el único archivo del módulo que menciona a Supabase. Todo lo que entra
 * sale traducido al dominio, y todo error del SDK se convierte en DomainError:
 * hacia arriba no se escapa una sola excepción.
 */
export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: DadivaClient) {}

  async sendMagicLink(email: Email, redirectTo: string): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client.auth.signInWithOtp({
        email: email.value,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      })

      if (error) return err(this.mapAuthError(error))
      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async getCurrentUser(): Promise<Result<AuthenticatedUser | null, DomainError>> {
    try {
      const { data, error } = await this.client.auth.getUser()

      // Sin sesión no es un error: es simplemente una visita anónima.
      if (error || !data.user) return ok(null)

      return this.loadProfile(data.user.id, data.user.email ?? '')
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async updateProfile(input: {
    readonly displayName: string
    readonly avatarEmoji: string
  }): Promise<Result<AuthenticatedUser, DomainError>> {
    try {
      const { data: userData, error: userError } = await this.client.auth.getUser()
      if (userError || !userData.user) {
        return err(
          DomainErrors.unauthenticated('auth.no_session', 'Tu sesión expiró. Entra de nuevo.'),
        )
      }

      const { data, error } = await this.client
        .from('profiles')
        .update({ display_name: input.displayName, avatar_emoji: input.avatarEmoji })
        .eq('id', userData.user.id)
        .select('id, display_name, avatar_emoji')
        .single()

      if (error) return err(mapPostgrestError(error, 'profile.update'))

      return ok(
        AuthenticatedUser.create({
          id: asUserId(data.id),
          email: userData.user.email ?? '',
          displayName: data.display_name,
          avatarEmoji: data.avatar_emoji,
        }),
      )
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async signOut(): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client.auth.signOut()
      if (error) return err(this.mapAuthError(error))
      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  onSessionChange(listener: (user: AuthenticatedUser | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        listener(null)
        return
      }

      void this.loadProfile(session.user.id, session.user.email ?? '').then((result) => {
        listener(result.isOk ? result.value : null)
      })
    })

    return () => data.subscription.unsubscribe()
  }

  /** Trae la fila de `profiles`. El trigger de la base la crea al registrarse. */
  private async loadProfile(
    userId: string,
    email: string,
  ): Promise<Result<AuthenticatedUser | null, DomainError>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, display_name, avatar_emoji')
      .eq('id', userId)
      .maybeSingle()

    if (error) return err(mapPostgrestError(error, 'profile.load'))

    // Carrera posible: la sesión existe pero el trigger aún no insertó el
    // perfil. Devolvemos un usuario sin nombre para que la app lo mande a
    // completar su perfil en vez de romperse.
    if (!data) {
      return ok(
        AuthenticatedUser.create({
          id: asUserId(userId),
          email,
          displayName: '',
          avatarEmoji: '🎁',
        }),
      )
    }

    return ok(
      AuthenticatedUser.create({
        id: asUserId(data.id),
        email,
        displayName: data.display_name,
        avatarEmoji: data.avatar_emoji,
      }),
    )
  }

  private mapAuthError(error: AuthError): DomainError {
    // Supabase limita la frecuencia de envío de magic links. Es el error más
    // común que verá una persona real, así que merece su propio mensaje.
    if (error.status === 429) {
      return DomainErrors.conflict(
        'auth.rate_limited',
        'Acabamos de enviarte un enlace. Espera un minuto antes de pedir otro.',
      )
    }

    if (error.status === 401 || error.status === 403) {
      return DomainErrors.unauthenticated('auth.invalid', 'Tu sesión expiró. Entra de nuevo.')
    }

    return DomainErrors.infrastructure(
      'auth.failed',
      'No pudimos enviar el enlace. Revisa tu conexión e inténtalo otra vez.',
      { cause: error },
    )
  }
}
