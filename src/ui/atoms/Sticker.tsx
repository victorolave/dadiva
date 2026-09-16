import { forwardRef, type ElementType, type HTMLAttributes, type Ref } from 'react'
import { cn } from '../utils/cn'

export type StickerTone = 'paper' | 'deep' | 'blush' | 'lilac' | 'sage' | 'apricot' | 'sky'
export type StickerSize = 'card' | 'hero'
export type StickerElevation = 'none' | 'sm' | 'default'

export interface StickerProps extends HTMLAttributes<HTMLElement> {
  readonly tone?: StickerTone | undefined
  /** -300 en vez de -100. `paper` y `deep` la ignoran: no tienen escalón
   *  "fuerte" propio, son la base neutra. */
  readonly strong?: boolean | undefined
  /** `card` (bordes 24/2px, la mayoría de las tarjetas) o `hero` (bordes
   *  30/3px, para el momento protagonista de la pantalla: invitación,
   *  raspado, carta revelada). */
  readonly size?: StickerSize | undefined
  /** Sombra explícita. Por defecto cada `size` trae la suya; `none` es para
   *  tarjetas anidadas dentro de otro Sticker, donde una segunda sombra
   *  sólida se ve como ruido duplicado. */
  readonly elevation?: StickerElevation | undefined
  /** Inclinación decorativa en grados. Dale vida de collage, sin exagerar. */
  readonly tilt?: number | undefined
  readonly withTape?: boolean | undefined
  readonly as?: 'div' | 'article' | 'section' | 'li' | 'header' | undefined
}

const TONES: Record<StickerTone, { readonly base: string; readonly strong: string }> = {
  paper: { base: 'bg-paper', strong: 'bg-paper' },
  deep: { base: 'bg-paper-deep', strong: 'bg-paper-deep' },
  blush: { base: 'bg-blush-100', strong: 'bg-blush-300' },
  lilac: { base: 'bg-lilac-100', strong: 'bg-lilac-300' },
  sage: { base: 'bg-sage-100', strong: 'bg-sage-300' },
  apricot: { base: 'bg-apricot-100', strong: 'bg-apricot-300' },
  sky: { base: 'bg-sky-100', strong: 'bg-sky-300' },
}

const SIZES: Record<StickerSize, string> = {
  card: 'rounded-card border-2',
  // Tailwind no trae `border-3` en su escala por defecto (0/2/4/8): valor
  // arbitrario explícito para los 3px que pide el tamaño hero del DS.
  hero: 'rounded-hero border-[3px]',
}

// Sombra por defecto de cada tamaño, y su versión "un paso más chica" para
// `elevation="sm"`. `hero` es el momento protagonista, así que su sombra
// base ya es la grande (6px); su "sm" es la sombra base de una card (4px).
const ELEVATIONS: Record<StickerSize, Record<Exclude<StickerElevation, 'none'>, string>> = {
  card: { default: 'shadow-sticker', sm: 'shadow-sticker-sm' },
  hero: { default: 'shadow-sticker-lg', sm: 'shadow-sticker' },
}

/**
 * Contenedor base de la app: una tarjeta de papel pegada sobre la hoja.
 * Es el bloque visual del que cuelga casi todo lo demás.
 */
export const Sticker = forwardRef<HTMLElement, StickerProps>(function Sticker(
  {
    tone = 'paper',
    strong = false,
    size = 'card',
    elevation = 'default',
    tilt = 0,
    withTape = false,
    as = 'div',
    className,
    style,
    ...rest
  },
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
        'relative border-ink',
        SIZES[size],
        elevation === 'none' ? 'shadow-none' : ELEVATIONS[size][elevation],
        withTape && 'tape',
        strong ? TONES[tone].strong : TONES[tone].base,
        className,
      )}
      style={tilt !== 0 ? { rotate: `${tilt}deg`, ...style } : style}
      {...rest}
    />
  )
})
