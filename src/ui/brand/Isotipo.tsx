import type { ImgHTMLAttributes } from 'react'
import isotipo96 from '../../assets/brand/isotipo-96.webp'
import isotipo192 from '../../assets/brand/isotipo-192.webp'
import isotipo320 from '../../assets/brand/isotipo-320.webp'
import isotipoMono64 from '../../assets/brand/isotipo-monocromo-64.webp'
import isotipoMono128 from '../../assets/brand/isotipo-monocromo-128.webp'

/**
 * Tamaños permitidos por el tipo (no por convención): 32 es el mínimo de
 * marca del isotipo según el manual. TypeScript evita que alguien
 * pase un tamaño menor sin darse cuenta.
 */
export type IsotipoSize = 32 | 36 | 40 | 48 | 56 | 88 | 96

export interface IsotipoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes' | 'alt' | 'width' | 'height'> {
  readonly size: IsotipoSize
  /** Variante monocromo: interior transparente, toma el color de fondo.
   *  Se usa sobre el color de tema de una carta (pie de la carta revelada,
   *  cubierta del raspado). */
  readonly mono?: boolean | undefined
  /** Nombre accesible. Sin `label` la imagen es decorativa (`alt=""`): el
   *  isotipo casi siempre acompaña un wordmark o un título que ya dice
   *  "Dádiva", así que anunciarlo dos veces sería ruido. */
  readonly label?: string | undefined
}

const SRC_SET = `${isotipo96} 96w, ${isotipo192} 192w, ${isotipo320} 320w`
const SRC_SET_MONO = `${isotipoMono64} 64w, ${isotipoMono128} 128w`

/**
 * El isotipo (la caja con la cinta) es el protagonista repetible de la
 * marca: a diferencia del wordmark, puede aparecer varias veces en la misma
 * pantalla. `srcSet` + `sizes` deja que el navegador elija el derivado más
 * chico que cubra el tamaño real renderizado.
 */
export const Isotipo = ({ size, mono = false, label, className, ...rest }: IsotipoProps) => (
  <img
    src={mono ? isotipoMono64 : isotipo96}
    srcSet={mono ? SRC_SET_MONO : SRC_SET}
    sizes={`${size}px`}
    width={size}
    height={size}
    alt={label ?? ''}
    {...(!label ? { 'aria-hidden': true } : {})}
    decoding="async"
    className={className}
    {...rest}
  />
)
