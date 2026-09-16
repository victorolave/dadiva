import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from '../LandingPage'

/**
 * `LandingPage` no depende de sesión ni del contenedor de dependencias (a
 * propósito, ver el comentario de bundle inicial en `src/app/App.tsx`), así
 * que solo necesita el `MemoryRouter` que piden sus `LinkButton`/`Link`
 * internos, sin `AuthProvider` ni `ContainerProvider`.
 */
const renderLanding = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )

/**
 * `getByRole`/`getAllByRole` excluyen por defecto lo que no esté "visible"
 * en el árbol de accesibilidad. El hero y los pasos entran con GSAP
 * (`useEntranceAnimation`/`useScrollReveal`), que arranca en
 * `visibility:hidden` y anima hacia visible con el ticker real del
 * navegador — en jsdom eso no corre de forma síncrona ni determinista con
 * los temporizadores falsos. El contenido SÍ está en el DOM (es lo que
 * importa para SEO y para quien usa lector de pantalla, que no depende del
 * ticker de rAF), así que las consultas de rol usan `hidden: true` para no
 * acoplar el test a la animación.
 */
const ROLE_OPTS = { hidden: true } as const

describe('LandingPage', () => {
  it('tiene un único h1 con la promesa principal', () => {
    renderLanding()

    const headings = screen.getAllByRole('heading', { level: 1, ...ROLE_OPTS })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(/Recibe una promesa/)
  })

  it('enlaza los dos CTA del hero a /entrar y /unirse', () => {
    renderLanding()

    // Igual que en el test de abajo: el nombre accesible del CTA del hero no
    // se puede filtrar por `name` mientras el elemento sigue oculto para la
    // animación de entrada, así que se toma el primero en orden de DOM (el
    // hero va antes que el CTA final).
    const allLinks = screen.getAllByRole('link', ROLE_OPTS)
    const first = (text: string) => allLinks.find((link) => link.textContent === text)

    expect(first('Crear mi grupo')).toHaveAttribute('href', '/entrar')
    expect(first('Tengo un código')).toHaveAttribute('href', '/unirse')
  })

  it('repite los mismos dos destinos en el CTA final', () => {
    renderLanding()

    // El hero entra con `useEntranceAnimation` (GSAP): arranca en
    // `visibility:hidden` hasta que el ticker anima hacia visible. El
    // cómputo de NOMBRE accesible (a diferencia de solo listar el rol)
    // ignora el texto de un nodo oculto por visibilidad aunque se pida
    // `hidden: true`, así que un filtro por `name` solo encontraría el CTA
    // final (siempre visible). Por eso se listan todos los enlaces y se
    // filtra por su texto real, que si vive en el DOM sin importar la
    // animación.
    const allLinks = screen.getAllByRole('link', ROLE_OPTS)
    const byText = (text: string) => allLinks.filter((link) => link.textContent === text)

    const crearLinks = byText('Crear mi grupo')
    const unirseLinks = byText('Tengo un código')

    expect(crearLinks).toHaveLength(2)
    expect(unirseLinks).toHaveLength(2)
    for (const link of crearLinks) expect(link).toHaveAttribute('href', '/entrar')
    for (const link of unirseLinks) expect(link).toHaveAttribute('href', '/unirse')
  })

  it('muestra los 3 pasos de "Cómo funciona"', () => {
    renderLanding()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Cómo funciona.', ...ROLE_OPTS }),
    ).toBeInTheDocument()
    expect(screen.getByText('Arma tu grupo.')).toBeInTheDocument()
    expect(screen.getByText('Sortea en secreto.')).toBeInTheDocument()
    expect(screen.getByText('Saca tu promesa.')).toBeInTheDocument()
  })

  it('incluye la vitrina de funciones, casos de uso y privacidad', () => {
    renderLanding()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Lo que hace especial a Dádiva.', ...ROLE_OPTS }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Cualquier grupo que se regala algo.',
        ...ROLE_OPTS,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Un sorteo de verdad secreto.', ...ROLE_OPTS }),
    ).toBeInTheDocument()
  })

  it('renderiza las preguntas frecuentes como divulgación accesible', () => {
    renderLanding()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Preguntas frecuentes.', ...ROLE_OPTS }),
    ).toBeInTheDocument()
    expect(screen.getByText('¿Cuánto cuesta usar Dádiva?')).toBeInTheDocument()
    expect(screen.getByText('¿Se puede repetir el sorteo si alguien se equivoca?')).toBeInTheDocument()
  })

  it('muestra el versículo de cierre', () => {
    renderLanding()

    expect(screen.getByText('2 Corintios 9:7')).toBeInTheDocument()
  })
})
