import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContainer } from '@app/composition/ContainerProvider'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import type { DomainError } from '@core/domain/DomainError'
import { useEntranceAnimation } from '@animations'
import { Alert, Button, LinkButton, Sticker, TextAreaField, TextField } from '@ui/atoms'

export const CreateGroupPage = () => {
  const { groups } = useContainer()
  const { user } = useAuth()
  const navigate = useNavigate()
  const containerRef = useEntranceAnimation<HTMLDivElement>()

  const [form, setForm] = useState({
    name: '',
    description: '',
    exchangeDate: '',
    budgetAmount: '',
  })
  const [error, setError] = useState<DomainError | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    setError(null)
    setIsSaving(true)

    const result = await groups.create.execute({
      name: form.name,
      description: form.description,
      exchangeDate: form.exchangeDate,
      budgetAmount: form.budgetAmount,
      ownerDisplayName: user.displayName,
    })

    setIsSaving(false)

    result.match({
      ok: (group) => navigate(`/grupos/${group.id}`, { replace: true }),
      err: (domainError) => setError(domainError),
    })
  }

  // El error de validación se muestra bajo SU campo; los demás van arriba.
  const fieldError = (field: string) => (error?.field === field ? error.message : undefined)
  const generalError = error && !error.field ? error.message : null

  return (
    <div ref={containerRef} className="mx-auto flex max-w-form flex-col gap-6">
      <header data-animate>
        <p className="eyebrow">Crear grupo</p>
        <h1 className="mt-2 text-h1">Un grupo, un regalo por persona.</h1>
        <p className="mt-2 text-lead text-ink-soft">
          Después podrás invitar a quien quieras con un código.
        </p>
      </header>

      <Sticker data-animate className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <TextField
            label="Nombre del grupo"
            name="name"
            value={form.name}
            onChange={(event) => update('name')(event.target.value)}
            placeholder="Amigo secreto de la célula"
            error={fieldError('name')}
            required
          />

          <TextAreaField
            label="Descripción"
            name="description"
            value={form.description}
            onChange={(event) => update('description')(event.target.value)}
            placeholder="Nos vemos el 20 en casa de Ana. ¡Traigan postre!"
            hint="Opcional. Máximo 280 caracteres."
            error={fieldError('description')}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Fecha del intercambio"
              name="exchangeDate"
              type="date"
              value={form.exchangeDate}
              onChange={(event) => update('exchangeDate')(event.target.value)}
              error={fieldError('exchangeDate')}
            />

            <TextField
              label="Presupuesto"
              name="budgetAmount"
              inputMode="numeric"
              value={form.budgetAmount}
              onChange={(event) => update('budgetAmount')(event.target.value)}
              placeholder="50.000"
              hint="En pesos. Opcional."
              error={fieldError('budgetAmount')}
            />
          </div>

          {generalError && <Alert tone="error">{generalError}</Alert>}

          <Button type="submit" size="lg" fullWidth isLoading={isSaving}>
            Crear mi grupo
          </Button>
        </form>
      </Sticker>

      {/* Wrapper con `data-animate`, no el `LinkButton` directo: el botón usa
          `active:translate-*` y GSAP escribiría `transform` inline sobre el
          mismo elemento, componiendo un desplazamiento doble. */}
      <div data-animate className="self-center">
        <LinkButton to="/unirse" variant="ghost">
          Ya tengo un código
        </LinkButton>
      </div>
    </div>
  )
}
