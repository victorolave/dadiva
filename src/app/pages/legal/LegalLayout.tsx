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
 * cómodo (~65 caracteres) y con jerarquía clara. Sin blobs ni garabatos: son
 * ornamento y aquí la prioridad es la lectura larga.
 */
export const LegalLayout = ({ title, updatedAt, children }: LegalLayoutProps) => (
  <article className="mx-auto flex max-w-reading flex-col gap-6">
    <header>
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-h1">{title}</h1>
      <p className="mt-2 text-sm text-ink-soft">Última actualización · {updatedAt}</p>
    </header>

    <Sticker className="flex flex-col gap-6 p-6 sm:p-8 [&_h2]:text-h3 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_p]:text-ink-soft [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-soft">
      {children}
    </Sticker>
  </article>
)
