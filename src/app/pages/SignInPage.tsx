import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { useEntranceAnimation } from '@animations'
import { Alert, Button, Sticker, TextField } from '@ui/atoms'

export const SignInPage = () => {
  const { user, status, requestMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const containerRef = useEntranceAnimation<HTMLDivElement>()

  if (status === 'authenticated' && user) return <Navigate to="/grupos" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSending(true)

    const result = await requestMagicLink(email)
    setIsSending(false)

    if ('sentTo' in result) {
      setSentTo(result.sentTo)
      return
    }

    setError(result.message)
  }

  if (sentTo) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <Sticker tone="sage" className="flex flex-col items-center gap-4 p-8">
          <MailCheck className="size-10" aria-hidden="true" />
          <h1 className="text-display-sm">Revisa tu correo</h1>
          <p className="text-ink-soft">
            Enviamos un enlace de acceso a <strong className="font-semibold">{sentTo}</strong>.
            Ábrelo desde este mismo dispositivo y entras directo.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSentTo(null)
              setError(null)
            }}
          >
            Usar otro correo
          </Button>
        </Sticker>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="mx-auto flex max-w-md flex-col gap-6">
      <div data-animate className="text-center">
        <h1 className="text-display-lg">Entra a Dádiva</h1>
        <p className="mt-2 text-ink-soft">
          Sin contraseñas. Te mandamos un enlace y listo.
        </p>
      </div>

      <Sticker data-animate className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <TextField
            label="Tu correo"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="maria@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            hint="Te llegará un enlace de un solo uso."
            required
          />

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" size="lg" fullWidth isLoading={isSending}>
            Enviarme el enlace
          </Button>
        </form>
      </Sticker>
    </div>
  )
}
