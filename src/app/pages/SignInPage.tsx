import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { isSafeReturnPath, rememberReturnTo } from '../routes/returnTo'
import { usePageMeta } from '../seo/usePageMeta'
import { useEntranceAnimation } from '@animations'
import { Alert, Button, GoogleMark, Sticker, VisibilityNote } from '@ui/atoms'
import { Blob, Isotipo } from '@ui/brand'

/**
 * Puerta de entrada.
 *
 * Solo ofrecemos Google. El enlace por correo sigue implementado y probado en
 * el módulo de auth, pero NO se expone: sin un dominio verificado el proveedor
 * de correo solo entrega a la dirección dueña de la cuenta, así que para
 * cualquier invitado el enlace no llegaría jamás. Un formulario que traga la
 * petición y no entrega nada es exactamente el fallo silencioso que ya nos
 * costó una tarde de depuración. Se reactiva el día que haya dominio.
 */
export const SignInPage = () => {
  usePageMeta({
    title: 'Entrar · Dádiva',
    description: 'Entra a Dádiva con tu cuenta de Google para organizar o unirte a un amigo secreto.',
    canonicalPath: '/entrar',
  })

  const { user, status, signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const containerRef = useEntranceAnimation<HTMLDivElement>()
  const location = useLocation()

  // A dónde iba antes de que ProtectedRoute lo mandara aquí (p. ej. /unirse/CODIGO).
  const from = (location.state as { from?: unknown } | null)?.from

  if (status === 'authenticated' && user) {
    return <Navigate to={isSafeReturnPath(from) ? from : '/grupos'} replace />
  }

  const handleGoogle = async () => {
    setError(null)
    setIsRedirecting(true)
    rememberReturnTo(from)

    const failure = await signInWithGoogle()

    // Si todo salió bien el navegador ya va camino a Google y esto no corre.
    if (failure) {
      setError(failure.message)
      setIsRedirecting(false)
    }
  }

  return (
    <div ref={containerRef} className="mx-auto flex max-w-narrow flex-col gap-6">
      <div data-animate className="text-center">
        <div className="relative isolate mx-auto grid size-44 place-items-center">
          <Blob shape="a" tone="lilac" className="absolute inset-0 -z-10 size-full" />
          <Isotipo size={96} />
        </div>

        <p className="eyebrow mt-4">Entrada</p>
        <h1 className="mt-2 text-h1">Entra a Dádiva.</h1>
        <p className="mt-2 text-ink-soft">
          Un toque y listo. No necesitas crear ninguna contraseña.
        </p>
      </div>

      <Sticker data-animate size="card" className="flex flex-col gap-5 p-6">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => void handleGoogle()}
          // `status === 'loading'` incluye el `import()` del contenedor de
          // dependencias (ver `ContainerProvider`): sin este flag, un clic
          // en el instante en que la página se monta llamaría a
          // `signInWithGoogle` antes de que el contenedor exista y
          // devolvería el error de "todavía estamos preparando la sesión"
          // en vez de ir a Google. Con `isLoading` el botón se ve ocupado
          // (mismo patrón que `isRedirecting`) hasta que de verdad puede
          // responder al primer clic.
          isLoading={isRedirecting || status === 'loading'}
          iconStart={<GoogleMark className="size-5" />}
        >
          Continuar con Google
        </Button>

        {error && <Alert tone="error">{error}</Alert>}

        <VisibilityNote>
          Usamos tu cuenta solo para saber quién eres dentro de tus grupos. No
          publicamos nada ni leemos tu correo.
        </VisibilityNote>
      </Sticker>

      {/*
        Antes decía "Entra primero y luego usa el código que te compartieron",
        que quedó FALSO desde el fix del enlace de invitación (ver
        src/app/routes/returnTo.ts): quien llega por invitación vuelve directo
        a ese grupo, sin pasos extra.
      */}
      <p data-animate className="text-center text-sm text-ink-soft">
        ¿Llegaste por un enlace de invitación? Al entrar, vuelves directo a ese grupo.
      </p>
    </div>
  )
}
