import { Entity, type PromiseCardId } from '@core/domain/Entity'
import { getPromiseTheme, type PromiseTheme, type PromiseThemeKey } from '../value-objects/PromiseTheme'

interface PromiseCardProps {
  readonly id: PromiseCardId
  readonly reference: string
  readonly text: string
  readonly version: string
  readonly themeKey: PromiseThemeKey
  readonly drawnAt: Date | null
}

/**
 * La promesa que le tocó a una persona.
 *
 * Una vez sacada NO cambia nunca. Esa permanencia es el producto: la persona
 * vuelve a entrar semanas después y encuentra su misma tarjeta esperándola.
 */
export class PromiseCard extends Entity<PromiseCardId> {
  readonly reference: string
  readonly text: string
  readonly version: string
  readonly themeKey: PromiseThemeKey
  readonly drawnAt: Date | null

  private constructor(props: PromiseCardProps) {
    super(props.id)
    this.reference = props.reference
    this.text = props.text
    this.version = props.version
    this.themeKey = props.themeKey
    this.drawnAt = props.drawnAt
  }

  static create(props: PromiseCardProps): PromiseCard {
    return new PromiseCard(props)
  }

  get theme(): PromiseTheme {
    return getPromiseTheme(this.themeKey)
  }

  /** Cita completa para compartir o copiar. */
  get citation(): string {
    return `"${this.text}" — ${this.reference} (${this.version})`
  }

  /**
   * Partes del texto separando las palabras a resaltar.
   * La vista solo recorre el resultado; no sabe nada de la lógica de resaltado.
   */
  segments(highlight: readonly string[]): readonly { text: string; emphasized: boolean }[] {
    if (highlight.length === 0) return [{ text: this.text, emphasized: false }]

    // Escapamos los metacaracteres: un versículo puede contener paréntesis o
    // puntos y sin escapar romperían la expresión regular.
    const escaped = highlight.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')

    return this.text
      .split(pattern)
      .filter((part) => part.length > 0)
      .map((part) => ({
        text: part,
        emphasized: highlight.some((word) => word.toLowerCase() === part.toLowerCase()),
      }))
  }
}
