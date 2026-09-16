import type { ReactNode } from 'react'
import { Sticker } from '@ui/atoms'

export interface LegalLayoutProps {
  readonly title: string
  readonly updatedAt: string
  readonly children: ReactNode
}

/**
 * Estructura compartida de las páginas legales.
 *
 * El texto legal se lee mal en columnas anchas, así que va a ancho de lectura
 * cómodo (~65 caracteres) y con jerarquía clara. Que sea obligatorio no es
 * excusa para que sea ilegible.
 */
export const LegalLayout = ({ title, updatedAt, children }: LegalLayoutProps) => (
  <article className="mx-auto flex max-w-2xl flex-col gap-6">
    <header>
      <h1 className="text-display-lg">{title}</h1>
      <p className="label-mono mt-2 text-ink-faint">Última actualización · {updatedAt}</p>
    </header>

    <Sticker className="flex flex-col gap-6 p-6 sm:p-8 [&_h2]:text-display-sm [&_li]:leading-relaxed [&_p]:leading-relaxed [&_p]:text-ink-soft [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-soft">
      {children}
    </Sticker>
  </article>
)
