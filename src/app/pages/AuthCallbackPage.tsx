import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Alert, LinkButton, Skeleton, Sticker } from '@ui/atoms'

/** Traduce los códigos de error que Supabase devuelve en la URL. */
const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'El enlace ya venció o se usó antes. Pide uno nuevo.',
  otp_expired: 'El enlace ya venció. Los enlaces duran poco por seguridad.',
  invalid_request: 'El enlace llegó incompleto. Pide uno nuevo.',
  server_error: 'Supabase tuvo un problema al validar el enlace.',
  unauthorized_client: 'Esta dirección no está autorizada en el proyecto de Supabase.',
}

interface CallbackError {
  readonly code: string
  readonly description: string | null
}

/**
 * Lee el error tanto del query string como del fragmento.
 *
 * Supabase usa uno u otro según el flujo: PKCE lo manda en `?`, el flujo
 * implícito en `#`. Mirar solo uno de los dos es perder la mitad de los casos.
 */
const readErrorFromUrl = (): CallbackError | null => {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const code = query.get('error_code') ?? query.get('error') ?? hash.get('error_code') ?? hash.get('error')
  if (!code) return null

  const description =
    query.get('error_description') ?? hash.get('error_description') ?? null

  return { code, description: description ? description.replace(/\+/g, ' ') : null }
}

/**
 * Aterrizaje del enlace mágico.
 *
 * Esta pantalla NO redirige al login cuando algo falla. Antes lo hacía, y el
 * resultado era que la persona volvía al formulario sin ninguna explicación:
 * el error existía pero nadie llegaba a leerlo. Un fallo silencioso es peor
 * que un fallo ruidoso, porque no se puede diagnosticar.
 */
export const AuthCallbackPage = () => {
  const { status, user } = useAuth()
  const navigate = useNavigate()
  const [timedOut, setTimedOut] = useState(false)

  // Se lee una sola vez: Supabase limpia la URL después de procesarla.
  const urlError = useMemo(readErrorFromUrl, [])

  useEffect(() => {
    if (status !== 'loading') return

    const timer = window.setTimeout(() => setTimedOut(true), 10_000)
    return () => window.clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (status === 'authenticated' && user) {
      navigate(user.needsOnboarding ? '/perfil' : '/grupos', { replace: true })
    }
  }, [status, user, navigate])

  const failed = urlError !== null || status === 'anonymous' || timedOut

  if (failed) {
    const message = urlError
      ? (ERROR_MESSAGES[urlError.code] ?? 'No pudimos validar el enlace.')
      : timedOut
        ? 'La validación tardó demasiado. Revisa tu conexión e inténtalo otra vez.'
        : 'El enlace no creó una sesión válida.'

    return (
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Alert tone="error" title="No pudimos validar el enlace">
          {message}
        </Alert>

        {/* El detalle crudo se conserva: es lo que permite diagnosticar si el
            problema es la lista de URLs permitidas, el flujo PKCE o el token. */}
        {urlError && (
          <Sticker className="p-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                Ver el detalle técnico
              </summary>
              <dl className="mt-2 space-y-1 font-mono text-xs text-ink-soft">
                <div>
                  <dt className="inline font-semibold">código: </dt>
                  <dd className="inline">{urlError.code}</dd>
                </div>
                {urlError.description && (
                  <div>
                    <dt className="inline font-semibold">detalle: </dt>
                    <dd className="inline">{urlError.description}</dd>
                  </div>
                )}
              </dl>
            </details>
          </Sticker>
        )}

        <div className="flex justify-center">
          <LinkButton to="/entrar">Pedir un enlace nuevo</LinkButton>
        </div>

        <p className="text-center text-sm text-ink-faint">
          Abre el enlace en el mismo navegador donde lo pediste. Si lo abres desde otra
          app, la sesión no puede completarse.
        </p>
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
