import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useContainer } from '@app/composition/ContainerProvider'
import type { DomainError } from '@core/domain/DomainError'
import type { AuthenticatedUser } from '../domain/entities/AuthenticatedUser'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  readonly status: AuthStatus
  readonly user: AuthenticatedUser | null
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
  const { auth } = useContainer()
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
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
  }, [auth.repository])

  const requestMagicLink = useCallback(
    async (email: string) => {
      const result = await auth.requestMagicLink.execute({
        email,
        redirectTo: `${window.location.origin}/entrar/confirmar`,
      })
      return result.match<{ sentTo: string } | DomainError>({
        ok: (value) => value,
        err: (error) => error,
      })
    },
    [auth.requestMagicLink],
  )

  const completeProfile = useCallback(
    async (input: { displayName: string; avatarEmoji: string }) => {
      const result = await auth.completeProfile.execute(input)
      return result.match<AuthenticatedUser | DomainError>({
        ok: (updated) => {
          setUser(updated)
          return updated
        },
        err: (error) => error,
      })
    },
    [auth.completeProfile],
  )

  const signOut = useCallback(async () => {
    await auth.signOut.execute()
    setUser(null)
    setStatus('anonymous')
  }, [auth.signOut])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, requestMagicLink, completeProfile, signOut }),
    [status, user, requestMagicLink, completeProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return context
}
