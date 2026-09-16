import type { SVGAttributes } from 'react'

export type DoodleKind = 'heart' | 'sparks' | 'sprout'

export interface DoodleProps extends Omit<SVGAttributes<SVGSVGElement>, 'viewBox' | 'fill' | 'stroke'> {
  readonly kind: DoodleKind
}

const PATHS: Record<DoodleKind, string> = {
  heart: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z',
  sparks: 'M4 10l3-6 M10 12l6-7 M11 18l7-3',
  sprout: 'M12 22V10 M12 14c-5 0-8-3-8-7 5 0 8 3 8 7Z M12 11c0-4 3-7 8-7 0 4-3 7-8 7Z',
}

/**
 * Garabato de trazo, no de relleno: es un gesto a mano alzada sobre el
 * papel, no un ícono de librería. Igual que `Blob`, es puro ornamento
 * (`aria-hidden`) y nunca lleva color propio: hereda `currentColor` de la
 * clase de texto que le pase quien lo usa (tono -500).
 *
 * Máximo 2 por pantalla, y solo en landing, entrar, estado vacío y tarjeta
 * de invitación — es criterio de diseño, no lo impone el componente.
 */
export const Doodle = ({ kind, className, ...rest }: DoodleProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={['pointer-events-none', className].filter(Boolean).join(' ')}
    {...rest}
  >
    <path d={PATHS[kind]} />
  </svg>
)
