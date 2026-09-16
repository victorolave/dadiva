import { useState } from 'react'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { WishlistItemId } from '@core/domain/Entity'
import { Alert, Button } from '@ui/atoms'
import type { WishlistItem } from '../../domain/entities/WishlistItem'
import { WishlistItemForm } from './WishlistItemForm'

export interface WishlistItemRowProps {
  readonly item: WishlistItem
  readonly canEdit: boolean
  readonly onUpdate: (
    itemId: WishlistItemId,
    values: { title: string; url: string; notes: string },
  ) => Promise<Result<WishlistItem, DomainError>>
  readonly onDelete: (itemId: WishlistItemId) => Promise<Result<void, DomainError>>
}

type RowMode = 'view' | 'editing' | 'confirming-delete'

/**
 * Un deseo de la lista, con sus controles propios.
 *
 * El borrado NO usa `window.confirm`: ese diálogo del navegador bloquea el
 * hilo, no se puede maquetar y en móvil se ve distinto en cada sistema. En su
 * lugar, "Eliminar" cambia la fila a un estado de confirmación en línea —
 * sigue siendo una pausa antes de un cambio irreversible, pero dentro de la
 * misma interfaz.
 */
export const WishlistItemRow = ({ item, canEdit, onUpdate, onDelete }: WishlistItemRowProps) => {
  const [mode, setMode] = useState<RowMode>('view')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<DomainError | null>(null)

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    const result = await onDelete(item.id)
    setIsDeleting(false)

    result.match({
      ok: () => setMode('view'),
      err: (error) => setDeleteError(error),
    })
  }

  if (mode === 'editing') {
    return (
      <li className="list-none py-4">
        <WishlistItemForm
          submitLabel="Guardar cambios"
          initialValues={{ title: item.title, url: item.url ?? '', notes: item.notes ?? '' }}
          onSubmit={(values) => onUpdate(item.id, values)}
          onSuccess={() => setMode('view')}
          onCancel={() => setMode('view')}
        />
      </li>
    )
  }

  return (
    <li className="list-none py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.title}</p>
          {item.notes && <p className="mt-0.5 text-sm text-ink-soft">{item.notes}</p>}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link mt-1 inline-flex items-center gap-1 text-sm"
            >
              Ver enlace
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          )}
        </div>

        {canEdit && mode === 'view' && (
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Editar «${item.title}»`}
              onClick={() => setMode('editing')}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Eliminar «${item.title}»`}
              onClick={() => setMode('confirming-delete')}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {mode === 'confirming-delete' && (
        <div className="mt-3 flex flex-col gap-2 rounded-control border-2 border-danger bg-danger-soft p-3">
          <p className="text-sm font-medium text-danger">¿Eliminar «{item.title}» de tu lista?</p>
          {deleteError && <Alert tone="error">{deleteError.message}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              Sí, eliminar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setMode('view')
                setDeleteError(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
