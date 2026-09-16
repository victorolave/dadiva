import type { ImgHTMLAttributes } from 'react'
import horizontal180 from '../../assets/brand/logo-horizontal-180.webp'
import horizontal360 from '../../assets/brand/logo-horizontal-360.webp'
import principal160 from '../../assets/brand/logo-principal-160.webp'
import principal320 from '../../assets/brand/logo-principal-320.webp'

export type BrandLogoVariant = 'horizontal' | 'principal'

export interface BrandLogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt' | 'width' | 'height'> {
  readonly variant: BrandLogoVariant
}

const VARIANTS: Record<BrandLogoVariant, { readonly src1x: string; readonly src2x: string; readonly width: number; readonly height: number }> = {
  // 180×51: el mínimo del DS para el wordmark horizontal.
  horizontal: { src1x: horizontal180, src2x: horizontal360, width: 180, height: 51 },
  // 160×170: el mínimo del DS para el isotipo con el nombre debajo (SetupGuard).
  principal: { src1x: principal160, src2x: principal320, width: 160, height: 170 },
}

/**
 * El wordmark «Dádiva» solo existe como imagen derivada de los maestros de
 * marca (`design/brand/*.png`). Nunca se reconstruye con tipografía: es una
 * regla de marca, no una preferencia de estilo.
 *
 * `width`/`height` explícitos evitan un salto de layout (CLS) mientras
 * carga la imagen. El `srcSet` 1x/2x sirve nitidez en pantallas retina sin
 * duplicar el peso en pantallas normales.
 */
export const BrandLogo = ({ variant, className, ...rest }: BrandLogoProps) => {
  const { src1x, src2x, width, height } = VARIANTS[variant]

  return (
    <img
      src={src1x}
      srcSet={`${src1x} 1x, ${src2x} 2x`}
      width={width}
      height={height}
      alt="Dádiva"
      decoding="async"
      className={className}
      {...rest}
    />
  )
}
