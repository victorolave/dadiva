import type { ReactNode } from 'react'
import { Alert, Sticker } from '../atoms'
import { Blob, Isotipo } from '../brand'
import { cn } from '../utils/cn'

export type StateBlockTone = 'empty' | 'error'

export interface StateBlockProps {
  readonly title: string
  readonly children: ReactNode
  readonly action?: ReactNode | undefined
  readonly tone: StateBlockTone
  readonly className?: string | undefined
  /** Etiqueta corta opcional arriba del título (p. ej. «EMPIEZA AQUÍ»). */
  readonly eyebrow?: string | undefined
  /** Engancha la animación de entrada (`useEntranceAnimation`) sin que el
   *  componente tenga que saber nada de GSAP: solo reenvía el atributo. */
  readonly 'data-animate'?: boolean | undefined
}

/**
 * Bloque a pantalla completa para "aquí no hay nada" o "esto salió mal".
 *
 * Antes cada pantalla armaba el suyo a mano: un Sticker con cinta y un
 * título en font-script para lo vacío, un Alert suelto para lo que falla al
 * cargar. Cuando el mismo patrón se repite en dos sitios es fácil que un
 * ajuste de tono se quede a medias en uno solo — con un componente único
 * solo hay un lugar que tocar.
 */
export const StateBlock = ({
  title,
  children,
  action,
  tone,
  className,
  eyebrow,
  ...rest
}: StateBlockProps) => {
  if (tone === 'empty') {
    return (
      <Sticker
        tone="paper"
        className={cn('relative isolate overflow-hidden p-10 text-center', className)}
        {...rest}
      >
        <div className="relative isolate mx-auto grid size-[180px] place-items-center">
          <Blob shape="a" tone="blush" className="absolute inset-0 -z-10" />
          <Isotipo size={88} />
        </div>

        {eyebrow && <p className="eyebrow mt-4">{eyebrow}</p>}
        <h2 className={cn('text-h3', eyebrow ? 'mt-2' : 'mt-4')}>{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-ink-soft">{children}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </Sticker>
    )
  }

  return (
    <Alert tone="error" title={title} className={className}>
      <div>{children}</div>
      {action && <div className="mt-3">{action}</div>}
    </Alert>
  )
}
