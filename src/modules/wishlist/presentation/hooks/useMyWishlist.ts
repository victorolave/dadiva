import { useCallback, useEffect, useState } from 'react'
import { useContainer } from '@app/composition/ContainerProvider'
import { err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import type { MemberId, WishlistItemId } from '@core/domain/Entity'
import type { WishlistItemInput } from '../../domain/value-objects/WishlistItemDraft'
import type { WishlistItem } from '../../domain/entities/WishlistItem'

const NO_MEMBER_ERROR = (): DomainError =>
  DomainErrors.unauthenticated('wishlist.no_member', 'Entra de nuevo para editar tu lista.')

/**
 * Mi propia lista de deseos dentro de un grupo.
 *
 * Sin actualización optimista a propósito: agregar/editar/borrar recarga
 * desde el servidor. Es más lento por un instante, pero elimina toda la clase
 * de bugs donde el estado local se desincroniza del real — y esta pantalla no
 * se toca con la frecuencia (docenas de veces por segundo) que justificaría
 * la complejidad de reconciliar ambos.
 */
export const useMyWishlist = (memberId: MemberId | null) => {
  const { wishlist } = useContainer()
  const [items, setItems] = useState<readonly WishlistItem[]>([])
  const [error, setError] = useState<DomainError | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const result = await wishlist.list.execute(memberId)
    setIsLoading(false)

    result.match({
      ok: (loaded) => {
        setItems(loaded)
        setError(null)
      },
      err: (domainError) => setError(domainError),
    })
  }, [wishlist.list, memberId])

  useEffect(() => {
    void reload()
  }, [reload])

  const add = useCallback(
    async (input: WishlistItemInput): Promise<Result<WishlistItem, DomainError>> => {
      if (!memberId) return err(NO_MEMBER_ERROR())

      const result = await wishlist.add.execute({ memberId, ...input })
      if (result.isOk) await reload()
      return result
    },
    [wishlist.add, memberId, reload],
  )

  const update = useCallback(
    async (
      itemId: WishlistItemId,
      input: WishlistItemInput,
    ): Promise<Result<WishlistItem, DomainError>> => {
      if (!memberId) return err(NO_MEMBER_ERROR())

      const result = await wishlist.update.execute({ itemId, memberId, ...input })
      if (result.isOk) await reload()
      return result
    },
    [wishlist.update, memberId, reload],
  )

  const remove = useCallback(
    async (itemId: WishlistItemId): Promise<Result<void, DomainError>> => {
      if (!memberId) return err(NO_MEMBER_ERROR())

      const result = await wishlist.remove.execute({ itemId, memberId })
      if (result.isOk) await reload()
      return result
    },
    [wishlist.remove, memberId, reload],
  )

  return { items, error, isLoading, add, update, remove }
}
