import { Entity, type MemberId, type WishlistItemId } from '@core/domain/Entity'

interface WishlistItemProps {
  readonly id: WishlistItemId
  readonly memberId: MemberId
  readonly title: string
  readonly url: string | null
  readonly notes: string | null
  readonly position: number
  readonly createdAt: Date
}

/**
 * Un deseo dentro de la lista de una persona.
 *
 * Ya validado por construcción: la validación de entrada vive en
 * `WishlistItemDraft` (domain/value-objects), que es lo que consume el caso de
 * uso ANTES de llegar aquí. Igual que `Member` y `Group`, esta clase asume
 * datos correctos y se limita a modelar el objeto persistido.
 */
export class WishlistItem extends Entity<WishlistItemId> {
  /** Tope de ítems por persona: una lista de deseos no es un catálogo. */
  static readonly MAX_ITEMS = 20

  readonly memberId: MemberId
  readonly title: string
  readonly url: string | null
  readonly notes: string | null
  readonly position: number
  readonly createdAt: Date

  private constructor(props: WishlistItemProps) {
    super(props.id)
    this.memberId = props.memberId
    this.title = props.title
    this.url = props.url
    this.notes = props.notes
    this.position = props.position
    this.createdAt = props.createdAt
  }

  static create(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props)
  }
}
