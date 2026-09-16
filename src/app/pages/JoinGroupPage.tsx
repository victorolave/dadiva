import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useContainer } from '@app/composition/ContainerProvider'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import type { DomainError } from '@core/domain/DomainError'
import { InviteCode } from '@modules/groups/domain/value-objects/InviteCode'
import { Alert, Button, Sticker, TextField } from '@ui/atoms'

export const JoinGroupPage = () => {
  const { groups } = useContainer()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { code: codeFromUrl } = useParams<{ code?: string }>()

  const [code, setCode] = useState(codeFromUrl ?? '')
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [error, setError] = useState<DomainError | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  // Si el nombre llega después (la sesión carga asíncrona), lo adoptamos —
  // pero sin pisar lo que la persona ya haya escrito.
  useEffect(() => {
    if (user?.displayName) setDisplayName((current) => current || user.displayName)
  }, [user?.displayName])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsJoining(true)

    const result = await groups.join.execute({ inviteCode: code, displayName })
    setIsJoining(false)

    result.match({
      ok: (group) => navigate(`/grupos/${group.id}`, { replace: true }),
      err: (domainError) => setError(domainError),
    })
  }

  const fieldError = (field: string) => (error?.field === field ? error.message : undefined)
  const generalError = error && !error.field ? error.message : null

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <header className="text-center">
        <h1 className="text-display-lg">Unirme a un grupo</h1>
        <p className="mt-1 text-ink-soft">Escribe el código que te compartieron.</p>
      </header>

      <Sticker tone="sky" className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <TextField
            label="Código de invitación"
            name="inviteCode"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ABCD-2345"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={12}
            className="text-center font-mono text-xl tracking-[0.22em]"
            hint={`${InviteCode.LENGTH} caracteres. No distinguimos mayúsculas ni guiones.`}
            error={fieldError('inviteCode')}
            required
          />

          <TextField
            label="Tu nombre en este grupo"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="María José"
            error={fieldError('displayName')}
            required
          />

          {generalError && <Alert tone="error">{generalError}</Alert>}

          <Button type="submit" size="lg" fullWidth isLoading={isJoining}>
            Entrar al grupo
          </Button>
        </form>
      </Sticker>
    </div>
  )
}
