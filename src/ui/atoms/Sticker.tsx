import { forwardRef, type ElementType, type HTMLAttributes, type Ref } from 'react'
import { cn } from '../utils/cn'

export type StickerTone = 'paper' | 'blush' | 'lilac' | 'sage' | 'apricot' | 'sky'

export interface StickerProps extends HTMLAttributes<HTMLElement> {
  readonly tone?: StickerTone | undefined
  /** Inclinación decorativa en grados. Dale vida de collage, sin exagerar. */
  readonly tilt?: number | undefined
  readonly withTape?: boolean | undefined
  readonly as?: 'div' | 'article' | 'section' | 'li' | undefined
}

const TONES: Record<StickerTone, string> = {
  paper: 'bg-paper',
  blush: 'bg-blush-100',
  lilac: 'bg-lilac-100',
  sage: 'bg-sage-100',
  apricot: 'bg-apricot-100',
  sky: 'bg-sky-100',
}

/**
 * Contenedor base de la app: una tarjeta de papel pegada sobre la hoja.
 * Es el bloque visual del que cuelga casi todo lo demás.
 */
export const Sticker = forwardRef<HTMLElement, StickerProps>(function Sticker(
  { tone = 'paper', tilt = 0, withTape = false, as = 'div', className, style, ...rest },
  ref,
) {
  // React no puede verificar que los handlers de HTMLElement encajen en cada
  // variante concreta (div, li, section...). El ensanchamiento a ElementType
  // es seguro porque todas comparten la misma superficie de atributos.
  const Tag = as as ElementType

  return (
    <Tag
      // `as` cambia el elemento renderizado, así que el ref se tipa contra el
      // ancestro común HTMLElement y se reenvía sin estrechar por variante.
      ref={ref as Ref<HTMLDivElement & HTMLLIElement>}
      className={cn(
        'relative rounded-card border-2 border-ink shadow-sticker-lg',
        withTape && 'tape',
        TONES[tone],
        className,
      )}
      style={tilt !== 0 ? { rotate: `${tilt}deg`, ...style } : style}
      {...rest}
    />
  )
})
