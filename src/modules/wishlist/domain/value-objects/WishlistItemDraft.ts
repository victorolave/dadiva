import { ValueObject } from '@core/domain/Entity'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'

interface WishlistItemDraftProps {
  readonly title: string
  readonly url: string | null
  readonly notes: string | null
}

export interface WishlistItemInput {
  readonly title: string
  readonly url?: string | null | undefined
  readonly notes?: string | null | undefined
}

/**
 * Datos ya validados de un ítem de lista de deseos, antes de tocar la base.
 *
 * Espeja las restricciones CHECK de `wishlist_items`
 * (supabase/migrations/0001_initial_schema.sql ~L174: título 1–140, url nula o
 * `^https?://`, notas ≤500) para que la persona reciba el error en español
 * ANTES de que Postgres lo rechace. Si mañana la base cambia esas reglas, este
 * archivo es el único que hay que tocar en el cliente.
 */
/**
 * Largo en caracteres (code points), igual que `length()` de Postgres. El
 * `.length` de JS cuenta unidades UTF-16 y un emoji valdría 2.
 */
const charLength = (value: string): number => Array.from(value).length

export class WishlistItemDraft extends ValueObject<WishlistItemDraftProps> {
  static readonly TITLE_MIN = 1
  static readonly TITLE_MAX = 140
  static readonly NOTES_MAX = 500
  static readonly URL_PATTERN = /^https?:\/\//i

  private constructor(props: WishlistItemDraftProps) {
    super(props)
  }

  static create(input: WishlistItemInput): Result<WishlistItemDraft, DomainError> {
    const title = input.title.trim().replace(/\s+/g, ' ')

    if (charLength(title) < WishlistItemDraft.TITLE_MIN) {
      return err(
        DomainErrors.validation('wishlist.title_required', 'Escribe qué te gustaría recibir.', {
          field: 'title',
        }),
      )
    }

    if (charLength(title) > WishlistItemDraft.TITLE_MAX) {
      return err(
        DomainErrors.validation(
          'wishlist.title_too_long',
          `Usa un título de ${WishlistItemDraft.TITLE_MAX} caracteres o menos.`,
          { field: 'title' },
        ),
      )
    }

    const rawUrl = input.url?.trim() ?? ''
    if (rawUrl.length > 0 && !WishlistItemDraft.URL_PATTERN.test(rawUrl)) {
      return err(
        DomainErrors.validation(
          'wishlist.bad_url',
          'El enlace debe empezar con http:// o https://.',
          { field: 'url' },
        ),
      )
    }

    const notes = input.notes?.trim() ?? ''
    if (charLength(notes) > WishlistItemDraft.NOTES_MAX) {
      return err(
        DomainErrors.validation(
          'wishlist.notes_too_long',
          `Las notas no pueden pasar de ${WishlistItemDraft.NOTES_MAX} caracteres.`,
          { field: 'notes' },
        ),
      )
    }

    return ok(
      new WishlistItemDraft({
        title,
        url: rawUrl.length > 0 ? rawUrl : null,
        notes: notes.length > 0 ? notes : null,
      }),
    )
  }

  get title(): string {
    return this.props.title
  }

  get url(): string | null {
    return this.props.url
  }

  get notes(): string | null {
    return this.props.notes
  }
}
