import { useState, type FormEvent } from 'react'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { WishlistItem } from '../../domain/entities/WishlistItem'
import { Alert, Button, TextField, TextAreaField } from '@ui/atoms'

export interface WishlistItemFormValues {
  readonly title: string
  readonly url: string
  readonly notes: string
}

export interface WishlistItemFormProps {
  readonly initialValues?: WishlistItemFormValues | undefined
  readonly submitLabel: string
  readonly onSubmit: (values: {
    title: string
    url: string
    notes: string
  }) => Promise<Result<WishlistItem, DomainError>>
  readonly onCancel?: (() => void) | undefined
  readonly onSuccess?: (() => void) | undefined
  /** Vacía los campos tras guardar. Para "agregar"; "editar" cierra en su lugar. */
  readonly resetOnSuccess?: boolean | undefined
}

const EMPTY_VALUES: WishlistItemFormValues = { title: '', url: '', notes: '' }

/**
 * Formulario de un deseo, compartido entre "agregar" y "editar".
 *
 * Los mensajes de error que muestra son los MISMOS que valida
 * `WishlistItemDraft` en el dominio: si el título viene vacío, este formulario
 * nunca llega a golpear la base — pero si algo se nos escapa, el `DomainError`
 * que responde el caso de uso trae el campo (`error.field`) para resaltar el
 * input correcto.
 */
export const WishlistItemForm = ({
  initialValues = EMPTY_VALUES,
  submitLabel,
  onSubmit,
  onCancel,
  onSuccess,
  resetOnSuccess = false,
}: WishlistItemFormProps) => {
  const [title, setTitle] = useState(initialValues.title)
  const [url, setUrl] = useState(initialValues.url)
  const [notes, setNotes] = useState(initialValues.notes)
  const [error, setError] = useState<DomainError | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    const result = await onSubmit({ title, url, notes })
    setIsSaving(false)

    result.match({
      ok: () => {
        if (resetOnSuccess) {
          setTitle('')
          setUrl('')
          setNotes('')
        }
        onSuccess?.()
      },
      err: setError,
    })
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4" noValidate>
      <TextField
        label="¿Qué te gustaría recibir?"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Un libro, unos audífonos, una planta…"
        maxLength={140}
        required
        {...(error?.field === 'title' ? { error: error.message } : {})}
      />

      <TextField
        label="Enlace (opcional)"
        type="url"
        inputMode="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://tutienda.com/producto"
        {...(error?.field === 'url' ? { error: error.message } : {})}
      />

      <TextAreaField
        label="Notas (opcional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Talla, color, cualquier detalle que ayude a quien te regale"
        maxLength={500}
        {...(error?.field === 'notes' ? { error: error.message } : {})}
      />

      {error && !error.field && <Alert tone="error">{error.message}</Alert>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
