import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { RouteAnnouncer } from '../RouteAnnouncer'
import { usePageMeta } from '../usePageMeta'

const PageA = () => {
  usePageMeta({ title: 'Página A · Dádiva' })
  return (
    <div>
      <p>Contenido de A</p>
      <Link to="/b">Ir a B</Link>
    </div>
  )
}

const PageB = () => {
  usePageMeta({ title: 'Página B · Dádiva' })
  return <p>Contenido de B</p>
}

/**
 * Réplica mínima de lo que hace `AppShell`: un `<main>` enfocable con el
 * `ref` que usa `RouteAnnouncer`, sin cabecera ni proveedores de sesión (que
 * no le hacen falta al mecanismo de foco/anuncio para funcionar).
 */
const Harness = ({ announcerAfterMain = false }: { announcerAfterMain?: boolean }) => {
  const mainRef = useRef<HTMLElement>(null)
  const announcer = <RouteAnnouncer mainRef={mainRef} />

  return (
    <MemoryRouter initialEntries={['/a']}>
      {!announcerAfterMain && announcer}
      <main id="contenido" ref={mainRef} tabIndex={-1}>
        <Routes>
          <Route path="/a" element={<PageA />} />
          <Route path="/b" element={<PageB />} />
        </Routes>
      </main>
      {announcerAfterMain && announcer}
    </MemoryRouter>
  )
}

describe('RouteAnnouncer', () => {
  it('no mueve el foco ni anuncia nada en el render inicial', () => {
    render(<Harness />)

    expect(document.activeElement).not.toBe(screen.getByRole('main'))
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('mueve el foco a main y anuncia el título de la nueva página al navegar', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('link', { name: 'Ir a B' }))

    expect(document.activeElement).toBe(screen.getByRole('main'))
    expect(screen.getByRole('status')).toHaveTextContent('Página B · Dádiva')
  })

  it('anuncia la primera navegación aunque el anunciador se monte después de main', async () => {
    const user = userEvent.setup()
    render(<Harness announcerAfterMain />)

    await user.click(screen.getByRole('link', { name: 'Ir a B' }))

    expect(screen.getByRole('status')).toHaveTextContent('Página B · Dádiva')
  })
})
