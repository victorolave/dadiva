import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOptionalContainer } from '@app/composition/ContainerProvider'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Alert, LinkButton, Skeleton, Sticker } from '@ui/atoms'
import { Isotipo } from '@ui/brand'
import { clearReturnTo, readReturnTo } from '../routes/returnTo'
import { usePageMeta } from '../seo/usePageMeta'

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
  // Sin descripción ni canonical: es una pantalla de tránsito, nadie llega
  // a ella desde un buscador (y va con `X-Robots-Tag: noindex`, ver
  // vercel.json).
  usePageMeta({ title: 'Entrando… · Dádiva' })

  const { status, user } = useAuth()
  const navigate = useNavigate()
  const [timedOut, setTimedOut] = useState(false)
  // 'loading' ahora también cubre el `import()` dinámico del contenedor de
  // dependencias (ver `ContainerProvider`), que en una conexión lenta puede
  // tardar más que la validación de Supabase en sí. Arrancar la cuenta
  // regresiva antes de que el contenedor exista mediría ESE tiempo de
  // descarga como si fuera la validación del enlace, y produciría un falso
  // "no pudimos validar el enlace" para alguien que solo tiene internet
  // lento, no un enlace roto.
  const container = useOptionalContainer()

  // Se lee una sola vez: Supabase limpia la URL después de procesarla.
  const urlError = useMemo(readErrorFromUrl, [])
  // useState y no useMemo: React no garantiza conservar un memo, y este valor
  // tiene que ser el mismo en ambas pasadas de StrictMode.
  const [returnTo] = useState(readReturnTo)

  useEffect(() => {
    if (status !== 'loading' || !container) return

    const timer = window.setTimeout(() => setTimedOut(true), 10_000)
    return () => window.clearTimeout(timer)
  }, [status, container])

  useEffect(() => {
    if (status !== 'authenticated' || !user) return

    // Si venía de un enlace de invitación, ese es su destino. Quien entra por
    // primera vez pasa antes por /perfil, que lo reenvía ahí al guardar.
    const destination = returnTo ?? '/grupos'
    clearReturnTo()

    if (user.needsOnboarding) {
      navigate('/perfil', { replace: true, state: { from: destination } })
    } else {
      navigate(destination, { replace: true })
    }
  }, [status, user, navigate, returnTo])

  const failed = urlError !== null || status === 'anonymous' || timedOut

  if (failed) {
    const message = urlError
      ? (ERROR_MESSAGES[urlError.code] ?? 'No pudimos validar el enlace.')
      : timedOut
        ? 'La validación tardó demasiado. Revisa tu conexión e inténtalo otra vez.'
        : 'El enlace no creó una sesión válida.'

    return (
      <div className="mx-auto flex max-w-narrow flex-col gap-4">
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

        {/* "Volver a entrar", no "Pedir un enlace nuevo": ya no hay enlace
            por correo expuesto (ver comentario de SignInPage), solo Google. */}
        <div className="flex justify-center">
          <LinkButton to="/entrar">Volver a entrar</LinkButton>
        </div>

        <p className="text-center text-sm text-ink-soft">
          Abre el enlace en el mismo navegador donde lo pediste. Si lo abres desde otra
          app, la sesión no puede completarse.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-narrow" aria-busy="true">
      <Sticker className="flex flex-col items-center gap-3 p-8 text-center">
        <Isotipo size={48} />
        <p className="eyebrow">Entrada</p>
        <p className="font-display text-h3">Validando tu entrada…</p>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </Sticker>
    </div>
  )
}
