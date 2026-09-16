import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type BadgeTone = 'neutral' | 'blush' | 'lilac' | 'sage' | 'apricot' | 'sky' | 'ink'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone | undefined
  /** Punto de color antes del texto (`bg-current`, hereda el color del
   *  texto del propio tono). Útil para estado de grupo: "draft" / "drawn" /
   *  "closed" se distinguen por color incluso sin leer la palabra. */
  readonly dot?: boolean | undefined
}

/**
 * Los tonos usan el escalón 700/900 del color sobre el 100 para garantizar
 * contraste AA. El pastel puro sobre pastel puro es bonito e ilegible.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-paper-deep text-ink border-ink',
  blush: 'bg-blush-100 text-blush-900 border-blush-700',
  lilac: 'bg-lilac-100 text-lilac-900 border-lilac-700',
  sage: 'bg-sage-100 text-sage-900 border-sage-700',
  apricot: 'bg-apricot-100 text-apricot-900 border-apricot-700',
  sky: 'bg-sky-100 text-sky-900 border-sky-700',
  ink: 'bg-ink text-paper border-ink',
}

export const Badge = ({ tone = 'neutral', dot = false, className, children, ...rest }: BadgeProps) => (
  <span
    className={cn(
      // Ya no usa `.label-mono` (DM Mono): a este tamaño Nunito Sans en
      // mayúsculas se lee mejor y deja el mono solo para código/datos.
      'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.08em]',
      TONES[tone],
      className,
    )}
    {...rest}
  >
    {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
    {children}
  </span>
)
