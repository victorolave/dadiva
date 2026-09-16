import type { ComponentPropsWithoutRef } from 'react'

export type VisuallyHiddenProps = ComponentPropsWithoutRef<'span'>

/**
 * Texto solo para lectores de pantalla.
 * Nunca uses `display:none` ni `visibility:hidden` para esto: ambos lo sacan
 * del árbol de accesibilidad y el lector tampoco lo lee.
 *
 * Reenvía el resto de props (p. ej. `role`, `aria-live`) porque también sirve
 * de contenedor para regiones vivas, no solo para texto suelto.
 */
export const VisuallyHidden = ({ children, ...rest }: VisuallyHiddenProps) => (
  <span
    className="absolute size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]"
    {...rest}
  >
    {children}
  </span>
)
