import type { ReactNode } from 'react'

/**
 * Texto solo para lectores de pantalla.
 * Nunca uses `display:none` ni `visibility:hidden` para esto: ambos lo sacan
 * del árbol de accesibilidad y el lector tampoco lo lee.
 */
export const VisuallyHidden = ({ children }: { readonly children: ReactNode }) => (
  <span className="absolute size-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
    {children}
  </span>
)
