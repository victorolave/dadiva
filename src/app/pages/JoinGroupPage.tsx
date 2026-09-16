import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useContainer } from '@app/composition/ContainerProvider'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import type { DomainError } from '@core/domain/DomainError'
import { InviteCode } from '@modules/groups/domain/value-objects/InviteCode'
import { useEntranceAnimation } from '@animations'
import { Alert, Button, Sticker, TextField, VisibilityNote } from '@ui/atoms'
import { Blob, Isotipo } from '@ui/brand'

export const JoinGroupPage = () => {
  const { groups } = useContainer()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { code: codeFromUrl } = useParams<{ code?: string }>()
  const containerRef = useEntranceAnimation<HTMLDivElement>()

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
    <div ref={containerRef} className="mx-auto flex max-w-narrow flex-col gap-6">
      <div data-animate className="text-center">
        <Isotipo size={56} />
        {/* «Te invitaron» cuando el código llegó por enlace: ya sabe a qué
            viene. «Invitación» cuando entra a mano desde /unirse. */}
        <p className="eyebrow mt-4">{codeFromUrl ? 'Te invitaron' : 'Invitación'}</p>
        <h1 className="mt-2 text-h1">Hay un lugar para ti.</h1>
        <p className="mt-2 text-lead text-ink-soft">
          {codeFromUrl
            ? 'Revisa el código y confirma tu nombre.'
            : `Únete con el enlace del grupo o escribe tu código de ${InviteCode.LENGTH} caracteres.`}
        </p>
      </div>

      <Sticker data-animate tone="blush" className="relative isolate overflow-hidden p-6">
        <Blob shape="b" tone="blush" className="absolute -right-10 -top-10 -z-10 size-40" />

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
            className="h-16 text-center font-mono font-medium text-code uppercase"
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
            Unirme al grupo
          </Button>
        </form>
      </Sticker>

      <div data-animate>
        <VisibilityNote>
          Al unirte, los demás verán tu nombre y tu emoji en la lista del grupo.
        </VisibilityNote>
      </div>
    </div>
  )
}
