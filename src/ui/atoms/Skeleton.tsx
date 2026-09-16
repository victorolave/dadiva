import { cn } from '../utils/cn'

export interface SkeletonProps {
  readonly className?: string
}

/**
 * Placeholder de carga. `aria-hidden` porque un esqueleto no tiene nada que
 * decirle a un lector de pantalla; el estado de carga se comunica con
 * aria-busy en la región que lo contiene.
 */
export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={cn(
      'animate-pulse rounded-control border-2 border-ink/15 bg-paper-shade motion-reduce:animate-none',
      className,
    )}
  />
)
