import type { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { cn } from '../utils/cn'

export interface VisibilityNoteProps {
  readonly children: ReactNode
  readonly className?: string | undefined
}

/**
 * "Línea de visibilidad" (UI kit del Design System): un ícono de ojo + una frase corta
 * que dice quién ve qué antes de que la persona actúe. Aparece en casi toda
 * pantalla que expone o esconde información entre miembros del grupo.
 *
 * El texto es responsabilidad de quien lo usa: adaptarlo a lo que la app
 * REALMENTE garantiza (verificar en el código/RLS antes de afirmar algo),
 * nunca copiar el ejemplo del UI kit sin comprobarlo.
 */
export const VisibilityNote = ({ children, className }: VisibilityNoteProps) => (
  <p className={cn('flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft', className)}>
    <Eye className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
)
