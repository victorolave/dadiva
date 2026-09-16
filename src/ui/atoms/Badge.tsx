import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type BadgeTone = 'neutral' | 'blush' | 'lilac' | 'sage' | 'apricot' | 'sky'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone | undefined
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
}

export const Badge = ({ tone = 'neutral', className, ...rest }: BadgeProps) => (
  <span
    className={cn(
      'label-mono inline-flex items-center gap-1 rounded-pill border px-2.5 py-1',
      TONES[tone],
      className,
    )}
    {...rest}
  />
)
