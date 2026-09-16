import type { UseCase } from '@core/application/UseCase'
import { err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import type { MemberId } from '@core/domain/Entity'
import { WishlistItemDraft, type WishlistItemInput } from '../../domain/value-objects/WishlistItemDraft'
import { WishlistItem } from '../../domain/entities/WishlistItem'
import type { WishlistRepository } from '../../domain/repositories/WishlistRepository'

export interface AddWishlistItemInput extends WishlistItemInput {
  /** Miembro propio del grupo, resuelto desde el grupo ya cargado. */
  readonly memberId: MemberId
}

/**
 * Agrega un deseo al final de la lista.
 *
 * Valida con las mismas reglas que la base ANTES de llamarla (ver
 * `WishlistItemDraft`), así que un título vacío o un enlace sin protocolo
 * nunca llegan a generar un error crudo de Postgres en pantalla.
 */
export class AddWishlistItem implements UseCase<AddWishlistItemInput, WishlistItem> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(input: AddWishlistItemInput): Promise<Result<WishlistItem, DomainError>> {
    const draftResult = WishlistItemDraft.create(input)
    if (draftResult.isErr) return err(draftResult.error)

    // El tope también vive aquí y no solo en la pantalla: con dos pestañas
    // abiertas, la UI de cada una cree que todavía hay espacio.
    const current = await this.wishlistRepository.listForMember(input.memberId)
    if (current.isErr) return err(current.error)
    if (current.value.length >= WishlistItem.MAX_ITEMS) {
      return err(
        DomainErrors.validation(
          'wishlist.limit_reached',
          `Tu lista ya tiene ${WishlistItem.MAX_ITEMS} deseos. Quita uno para agregar otro.`,
        ),
      )
    }

    const draft = draftResult.value
    return this.wishlistRepository.add(input.memberId, {
      title: draft.title,
      url: draft.url,
      notes: draft.notes,
    })
  }
}
