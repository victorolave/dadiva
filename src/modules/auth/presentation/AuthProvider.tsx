import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useOptionalContainer } from '@app/composition/ContainerProvider'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import type { AuthenticatedUser } from '../domain/entities/AuthenticatedUser'

/**
 * Error de las acciones de sesión (entrar, pedir enlace, completar perfil,
 * salir) cuando se llaman antes de que el contenedor de dependencias termine
 * de cargar (ver `ContainerProvider`). En la práctica no debería pasar: los
 * botones que disparan estas acciones solo existen una vez que hay usuario o
 * en rutas donde el contenedor se carga de inmediato, pero un guard explícito
 * es mejor que un `Cannot read properties of null` si algún día cambia esa
 * garantía.
 */
const containerNotReadyError = (): DomainError =>
  DomainErrors.infrastructure(
    'CONTAINER_NOT_READY',
    'Danos un segundo, todavía estamos preparando la sesión. Intenta de nuevo.',
  )

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  readonly status: AuthStatus
  readonly user: AuthenticatedUser | null
  readonly signInWithGoogle: () => Promise<DomainError | null>
  readonly requestMagicLink: (email: string) => Promise<{ sentTo: string } | DomainError>
  readonly completeProfile: (input: {
    displayName: string
    avatarEmoji: string
  }) => Promise<AuthenticatedUser | DomainError>
  readonly signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Estado de sesión para toda la app.
 *
 * El estado arranca en 'loading' a propósito. Si arrancara en 'anonymous',
 * quien ya tiene sesión vería la pantalla de login parpadear antes de que
 * Supabase confirme el token — un bug visual clásico y muy feo.
 */
export const AuthProvider = ({ children }: { readonly children: ReactNode }) => {
  // Nullable a propósito: `ContainerProvider` carga el contenedor (y con él
  // Supabase) bajo demanda, y `AuthProvider` es lo primero que lo consume.
  // Mientras sea `null`, el estado se queda en 'loading' — nunca 'anonymous',
  // que confundiría a quien sí tiene sesión con un parpadeo al login.
  const container = useOptionalContainer()
  const auth = container?.auth ?? null
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    if (!auth) return

    let active = true

    void auth.repository.getCurrentUser().then((result) => {
      if (!active) return
      const current = result.isOk ? result.value : null
      setUser(current)
      setStatus(current ? 'authenticated' : 'anonymous')
    })

    const unsubscribe = auth.repository.onSessionChange((nextUser) => {
      if (!active) return
      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'anonymous')
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [auth])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return containerNotReadyError()

    const result = await auth.signInWithGoogle.execute({
      redirectTo: `${window.location.origin}/entrar/confirmar`,
    })
    // Devolvemos el error o null: si todo va bien el navegador ya se fue a
    // Google y nadie llega a leer esta respuesta.
    return result.match<DomainError | null>({ ok: () => null, err: (error) => error })
  }, [auth])

  const requestMagicLink = useCallback(
    async (email: string) => {
      if (!auth) return containerNotReadyError()

      const result = await auth.requestMagicLink.execute({
        email,
        redirectTo: `${window.location.origin}/entrar/confirmar`,
      })
      return result.match<{ sentTo: string } | DomainError>({
        ok: (value) => value,
        err: (error) => error,
      })
    },
    [auth],
  )

  const completeProfile = useCallback(
    async (input: { displayName: string; avatarEmoji: string }) => {
      if (!auth) return containerNotReadyError()

      const result = await auth.completeProfile.execute(input)
      return result.match<AuthenticatedUser | DomainError>({
        ok: (updated) => {
          setUser(updated)
          return updated
        },
        err: (error) => error,
      })
    },
    [auth],
  )

  const signOut = useCallback(async () => {
    if (!auth) return

    await auth.signOut.execute()
    setUser(null)
    setStatus('anonymous')
  }, [auth])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signInWithGoogle, requestMagicLink, completeProfile, signOut }),
    [status, user, signInWithGoogle, requestMagicLink, completeProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return context
}
