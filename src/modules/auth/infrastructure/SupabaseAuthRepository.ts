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

  async signInWithGoogle(redirectTo: string): Promise<Result<void, DomainError>> {
    try {
      const { error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            // `select_account` obliga a Google a mostrar el selector de cuenta.
            // Sin esto, quien tiene varias cuentas entra siempre con la última
            // y no hay forma visible de cambiarla: un clásico de soporte.
            prompt: 'select_account',
          },
        },
      })

      if (error) return err(this.mapAuthError(error))

      // Si no hubo error, el navegador ya está saliendo hacia Google. El código
      // posterior a esta línea normalmente no llega a ejecutarse.
      return ok(undefined)
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

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

      // Upsert y no update: si la fila de `profiles` no existe, un UPDATE no
      // afecta ninguna fila y falla al pedir `.single()`. Eso pasa de verdad —
      // le ocurrió al primer usuario de producción, creado antes de que el
      // trigger `handle_new_user` existiera — y también puede pasar por una
      // carrera entre el alta en auth.users y el disparo del trigger.
      //
      // Es seguro: las políticas de INSERT y UPDATE sobre `profiles` exigen
      // ambas `id = auth.uid()`, así que nadie puede crear ni pisar un perfil
      // ajeno por esta vía.
      const { data, error } = await this.client
        .from('profiles')
        .upsert(
          {
            id: userData.user.id,
            display_name: input.displayName,
            avatar_emoji: input.avatarEmoji,
          },
          { onConflict: 'id' },
        )
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
    //
    // NO prometemos una duración concreta. Conviven dos límites distintos y
    // desde aquí no sabemos cuál se disparó: el intervalo mínimo entre correos
    // al mismo destinatario (60s por defecto) y el tope del servicio de correo
    // (2 por hora en el integrado de Supabase, 30 por hora con SMTP propio).
    // Decir "espera un minuto" cuando en realidad falta una hora es peor que
    // no decir nada: la persona reintenta, falla, y pierde la confianza.
    if (error.status === 429) {
      return DomainErrors.conflict(
        'auth.rate_limited',
        'Ya te enviamos un enlace hace poco. Revísalo en tu correo, incluida la ' +
          'carpeta de spam. Si necesitas otro, tendrás que esperar un rato.',
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
