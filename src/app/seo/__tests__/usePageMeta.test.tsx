import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { usePageMeta, type PageMetaOptions } from '../usePageMeta'
import { SITE_ORIGIN } from '../siteConfig'

/** Componente mínimo: solo invoca el hook con las props que le pasa el test. */
const MetaProbe = (props: PageMetaOptions) => {
  usePageMeta(props)
  return null
}

const getDescription = (): string | null =>
  document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null

const getCanonicalHref = (): string | null =>
  document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null

/**
 * `index.html` siempre trae una `<meta name="description">`, así que cada
 * test la recrea a mano en vez de asumir que el hook la crea de cero.
 */
beforeEach(() => {
  document.title = ''
  document.querySelector('meta[name="description"]')?.remove()
  document.querySelector('link[rel="canonical"]')?.remove()

  const description = document.createElement('meta')
  description.setAttribute('name', 'description')
  description.setAttribute('content', 'descripción original de index.html')
  document.head.appendChild(description)
})

describe('usePageMeta', () => {
  it('pone el título de la página en document.title', () => {
    render(<MetaProbe title="Mis grupos · Dádiva" />)

    expect(document.title).toBe('Mis grupos · Dádiva')
  })

  it('actualiza la meta description existente cuando la página trae una', () => {
    render(
      <MetaProbe
        title="Entrar · Dádiva"
        description="Entra a Dádiva con tu cuenta de Google."
      />,
    )

    expect(getDescription()).toBe('Entra a Dádiva con tu cuenta de Google.')
  })

  it('no toca la meta description cuando la página no pasa una', () => {
    render(<MetaProbe title="Mis grupos · Dádiva" />)

    expect(getDescription()).toBe('descripción original de index.html')
  })

  it('agrega el canonical con la URL absoluta del origen configurado', () => {
    render(<MetaProbe title="Política de privacidad · Dádiva" canonicalPath="/privacidad" />)

    expect(getCanonicalHref()).toBe(`${SITE_ORIGIN}/privacidad`)
  })

  it('quita el canonical al pasar a una página que no trae uno', () => {
    const { rerender } = render(
      <MetaProbe title="Política de privacidad · Dádiva" canonicalPath="/privacidad" />,
    )
    expect(getCanonicalHref()).not.toBeNull()

    // Simula la navegación a una ruta privada: mismo componente, sin
    // `canonicalPath`. Una ruta privada nunca debería heredar el canonical
    // de la página pública visitada antes.
    rerender(<MetaProbe title="Mis grupos · Dádiva" />)

    expect(getCanonicalHref()).toBeNull()
  })
})
