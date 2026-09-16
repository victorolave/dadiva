import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { isSafeReturnPath, rememberReturnTo } from '../routes/returnTo'
import { useEntranceAnimation } from '@animations'
import { Alert, Button, GoogleMark, Sticker } from '@ui/atoms'

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
    <div ref={containerRef} className="mx-auto flex max-w-md flex-col gap-6">
      <div data-animate className="text-center">
        <h1 className="text-display-lg">Entra a Dádiva</h1>
        <p className="mt-2 text-ink-soft">
          Un toque y listo. No necesitas crear ninguna contraseña.
        </p>
      </div>

      <Sticker data-animate className="flex flex-col gap-5 p-6">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => void handleGoogle()}
          isLoading={isRedirecting}
          iconStart={<GoogleMark className="size-5" />}
        >
          Continuar con Google
        </Button>

        {error && <Alert tone="error">{error}</Alert>}

        <p className="text-center text-xs leading-relaxed text-ink-faint">
          Usamos tu cuenta solo para saber quién eres dentro de tus grupos.
          No publicamos nada ni leemos tu correo.
        </p>
      </Sticker>

      <p data-animate className="text-center text-sm text-ink-soft">
        ¿Te invitaron a un grupo? Entra primero y luego usa el código que te compartieron.
      </p>
    </div>
  )
}
