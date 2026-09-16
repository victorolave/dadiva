import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../utils/cn'

export type AlertTone = 'info' | 'success' | 'error'

export interface AlertProps {
  readonly tone?: AlertTone | undefined
  readonly title?: string | undefined
  readonly children: ReactNode
  readonly className?: string | undefined
}

const CONFIG = {
  info: { icon: Info, styles: 'bg-sky-100 border-sky-700 text-sky-900' },
  success: { icon: CheckCircle2, styles: 'bg-success-soft border-success text-success' },
  error: { icon: AlertTriangle, styles: 'bg-danger-soft border-danger text-danger' },
} as const

/**
 * `role="alert"` para errores porque interrumpen y deben anunciarse ya.
 * `role="status"` para el resto: se anuncia sin cortar lo que el lector esté
 * diciendo. Usar alert para todo es gritarle al usuario.
 */
export const Alert = ({ tone = 'info', title, children, className }: AlertProps) => {
  const { icon: Icon, styles } = CONFIG[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-control border-2 px-4 py-3', styles, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5')}>{children}</div>
      </div>
    </div>
  )
}
