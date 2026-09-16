import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Alert, Skeleton, Sticker } from '@ui/atoms'

/**
 * Aterrizaje del enlace mágico.
 *
 * Supabase lee el token del fragmento de la URL de forma asíncrona
 * (`detectSessionInUrl`), así que aquí solo esperamos a que el AuthProvider
 * cambie de estado. El límite de tiempo evita dejar a alguien mirando un
 * esqueleto para siempre si el enlace ya venció.
 */
export const AuthCallbackPage = () => {
  const { status, user } = useAuth()
  const navigate = useNavigate()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (status !== 'loading') return

    const timer = window.setTimeout(() => setTimedOut(true), 8000)
    return () => window.clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate(user.needsOnboarding ? '/perfil' : '/grupos', { replace: true })
    }
  }, [status, user, navigate])

  if (status === 'anonymous' || timedOut) {
    return (
      <div className="mx-auto max-w-md">
        <Alert tone="error" title="No pudimos validar el enlace">
          Puede que ya haya vencido o que se haya usado antes. Pide uno nuevo.
        </Alert>
        <div className="mt-4 text-center">
          <Navigate to="/entrar" replace />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md" aria-busy="true">
      <Sticker className="flex flex-col gap-3 p-8">
        <p className="label-mono text-ink-soft">Validando tu enlace…</p>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </Sticker>
    </div>
  )
}
