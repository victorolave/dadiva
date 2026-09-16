import type { MemberId } from '@core/domain/Entity'
import { Alert, Skeleton, Sticker, VisibilityNote } from '@ui/atoms'
import { WishlistItem } from '../../domain/entities/WishlistItem'
import { useMyWishlist } from '../hooks/useMyWishlist'
import { WishlistItemForm } from './WishlistItemForm'
import { WishlistItemRow } from './WishlistItemRow'

export interface WishlistSectionProps {
  readonly memberId: MemberId | null
  /** El grupo sigue abierto a cambios ('draft' o 'drawn'). En 'closed' la
   *  lista queda de solo lectura: el intercambio ya terminó. */
  readonly canEdit: boolean
  /**
   * Se dispara tras agregar o eliminar un ítem (no tras editar: el conteo no
   * cambia). `MemberList` pinta la insignia "Tiene lista" a partir de
   * `Member.hasWishlist`, que se calculó UNA vez al cargar el detalle del
   * grupo (`SupabaseGroupRepository.loadMemberFlags`). Esta sección vive de su
   * propia consulta — sin este callback, agregar tu primer deseo o borrar el
   * último dejaría esa insignia desactualizada hasta la próxima visita.
   */
  readonly onItemsChanged?: (() => void) | undefined
}

/**
 * "Mi lista de deseos" dentro del grupo.
 *
 * Vive en la página del grupo (no en el perfil) porque el deseo es POR grupo:
 * lo que alguien pide en el amigo secreto de la oficina no tiene por qué ser
 * lo mismo que pide en el de la familia. `wishlist_items.member_id` referencia
 * `group_members`, así que técnicamente ya está scoped por grupo — esta
 * sección solo lo hace visible donde tiene sentido usarlo.
 */
export const WishlistSection = ({ memberId, canEdit, onItemsChanged }: WishlistSectionProps) => {
  const { items, error, isLoading, add, update, remove } = useMyWishlist(memberId)

  if (!memberId) return null

  const atCapacity = items.length >= WishlistItem.MAX_ITEMS

  const handleAdd: typeof add = async (values) => {
    const result = await add(values)
    if (result.isOk) onItemsChanged?.()
    return result
  }

  const handleDelete: typeof remove = async (itemId) => {
    const result = await remove(itemId)
    if (result.isOk) onItemsChanged?.()
    return result
  }

  return (
    <section aria-labelledby="mi-lista" className="flex flex-col gap-4">
      <div>
        <p className="eyebrow">Mi lista</p>
        <h2 id="mi-lista" className="mt-2 text-h2">
          Lo que te gustaría recibir.
        </h2>
      </div>

      <VisibilityNote>
        Todo el grupo puede ver tu lista; solo tú puedes editarla. A quien te toque regalarte,
        también la verá cuando revele su asignación.
      </VisibilityNote>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : error ? (
        <Alert tone="error">{error.message}</Alert>
      ) : (
        <Sticker className="p-5">
          {items.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Todavía no has agregado ninguna idea. Escribe lo que te gustaría recibir: ayuda
              mucho a quien te toque regalarte, y nadie va a saber que fuiste tú quien la pidió
              hasta el intercambio.
            </p>
          ) : (
            <ul className="divide-y divide-paper-shade">
              {items.map((item) => (
                <WishlistItemRow
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  onUpdate={update}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}

          {canEdit && (
            <div className={items.length > 0 ? 'mt-5 border-t-2 border-paper-shade pt-5' : undefined}>
              {atCapacity ? (
                <p className="text-sm text-ink-soft">
                  Llegaste al máximo de {WishlistItem.MAX_ITEMS} ideas. Elimina alguna para agregar
                  otra.
                </p>
              ) : (
                <WishlistItemForm
                  submitLabel="Agregar a mi lista"
                  onSubmit={handleAdd}
                  resetOnSuccess
                />
              )}
            </div>
          )}
        </Sticker>
      )}
    </section>
  )
}
