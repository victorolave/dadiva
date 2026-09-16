import { useEffect } from 'react'
import { SITE_ORIGIN } from './siteConfig'
import { publishPageTitle } from './pageAnnouncer'

export interface PageMetaOptions {
  readonly title: string
  readonly description?: string
  readonly canonicalPath?: string
}

const CANONICAL_LINK_ID = 'dadiva-canonical'

/**
 * Título, descripción y canonical por ruta (WCAG 2.4.2 + SEO).
 *
 * `index.html` ya trae un `<title>` y una `<meta name="description">`
 * estáticos para los scrapers que no ejecutan JS (WhatsApp, ver el
 * comentario de Open Graph en `index.html`), así que esto MUTA esos nodos
 * existentes en vez de renderizar unos nuevos: `document.title` siempre
 * devuelve el primer `<title>` del documento, y el hoisting de cabecera de
 * React 19 no deduplica contra etiquetas que él no escribió, así que un
 * segundo `<title>` por página perdería siempre contra el de `index.html`.
 *
 * La descripción solo se toca cuando la página trae una explícita: no hay
 * "restaurar la de antes" al salir de una página, cada página que le importa
 * el SEO pone la suya (ver la tabla de rutas en la tarea).
 *
 * El canonical sí se retira cuando la página no pasa `canonicalPath`, para
 * que una ruta privada (p. ej. `/grupos/:id`) nunca herede el canonical de
 * la página pública que se visitó antes en la misma sesión.
 */
export const usePageMeta = ({ title, description, canonicalPath }: PageMetaOptions): void => {
  useEffect(() => {
    document.title = title
    publishPageTitle(title)

    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    }

    const existingLink = document.getElementById(CANONICAL_LINK_ID)

    if (!canonicalPath) {
      existingLink?.remove()
      return
    }

    const link =
      existingLink instanceof HTMLLinkElement
        ? existingLink
        : Object.assign(document.createElement('link'), {
            id: CANONICAL_LINK_ID,
            rel: 'canonical',
          })

    link.href = `${SITE_ORIGIN}${canonicalPath}`
    if (!existingLink) document.head.appendChild(link)
  }, [title, description, canonicalPath])
}
