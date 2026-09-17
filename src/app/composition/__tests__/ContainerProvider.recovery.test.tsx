import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'

/**
 * Cubre los dos BLOCKER encontrados en revisión sobre la carga bajo demanda
 * del contenedor de dependencias (ver el comentario grande en
 * `ContainerProvider.tsx`):
 *
 * 1. Navegar a otra ruta MIENTRAS el `import()` dinámico sigue en vuelo no
 *    debe perder su resolución (antes se perdía: el contenedor se quedaba
 *    `null` para siempre y `AuthProvider` en 'loading' eterno).
 * 2. Un `import()` que rechaza (sin conexión, o un chunk con hash viejo
 *    tras un deploy nuevo) debe mostrar un aviso accesible con un botón
 *    "Reintentar" que recarga la página, no quedarse en silencio.
 *
 * Cada test aquí mockea `../container` con una promesa controlable a mano
 * (en vez del `createContainer` real) para decidir con precisión CUÁNDO
 * resuelve o rechaza — algo que no se puede lograr con el `import()` real,
 * que resuelve casi al instante una vez el módulo ya está en caché de Vite.
 * `vi.resetModules()` + `import()` dinámico de `ContainerProvider` (en vez
 * del `import` estático de arriba del archivo, como en los otros tests de
 * este directorio) es necesario para que cada test reciba una copia fresca
 * del módulo bajo el mock que le corresponde.
 */

const Page = ({ label }: { readonly label: string }) => <p>{label}</p>

describe('ContainerProvider — recuperación ante fallas del import() dinámico', () => {
  it('si la ruta cambia mientras el import() sigue en vuelo, el contenedor igual llega (no se pierde)', async () => {
    vi.resetModules()

    let resolveContainerModule!: (mod: { createContainer: () => object }) => void
    vi.doMock('../container', () => {
      return new Promise((resolve) => {
        resolveContainerModule = resolve
      })
    })

    const { ContainerProvider, useOptionalContainer } = await import('../ContainerProvider')

    const Probe = () => {
      const container = useOptionalContainer()
      return <p>contenedor: {container ? 'listo' : 'cargando'}</p>
    }

    const user = userEvent.setup()

    // `Probe` vive FUERA de `<Routes>`, como `AuthProvider` en la app real:
    // no se desmonta al navegar entre rutas hijas, así que sigue siendo el
    // mismo observador del contenedor antes y después del cambio de ruta.
    render(
      <MemoryRouter initialEntries={['/grupos']}>
        <ContainerProvider>
          <Probe />
          <Routes>
            <Route path="/grupos" element={<Link to="/perfil">Ir a perfil</Link>} />
            <Route path="/perfil" element={<Page label="Página de perfil" />} />
          </Routes>
        </ContainerProvider>
      </MemoryRouter>,
    )

    // "/grupos" no es "/": el `import()` se dispara de inmediato al montar,
    // y queda en vuelo porque el mock todavía no resolvió.
    expect(screen.getByText('contenedor: cargando')).toBeInTheDocument()

    // Navega ANTES de que el import() resuelva — esto es lo que antes
    // descartaba la resolución para siempre (ver el comentario del bug en
    // `ContainerProvider.tsx`: la limpieza del efecto anterior ponía
    // `active = false` en cada cambio de ruta, no solo al desmontar).
    await user.click(screen.getByRole('link', { name: 'Ir a perfil' }))
    expect(screen.getByText('Página de perfil')).toBeInTheDocument()
    expect(screen.getByText('contenedor: cargando')).toBeInTheDocument()

    // Ahora sí resuelve el import() en vuelo, con la ruta ya cambiada.
    resolveContainerModule({ createContainer: () => ({ marker: 'contenedor-de-prueba' }) })

    // Con el bug, esto nunca pasa de 'cargando': la resolución se pierde.
    await waitFor(() => expect(screen.getByText('contenedor: listo')).toBeInTheDocument())
  })

  it('un import() rechazado muestra un aviso accesible con "Reintentar", que recarga la página', async () => {
    vi.resetModules()

    vi.doMock('../container', () => Promise.reject(new Error('fallo de red simulado')))

    const { ContainerProvider } = await import('../ContainerProvider')

    const reloadSpy = vi.fn()
    // jsdom no deja reasignar `window.location.reload` directamente (no es
    // configurable en el objeto real): hay que redefinir toda la propiedad.
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      writable: true,
      configurable: true,
    })

    render(
      <MemoryRouter initialEntries={['/grupos']}>
        <ContainerProvider>
          <p>contenido protegido</p>
        </ContainerProvider>
      </MemoryRouter>,
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No pudimos cargar la aplicación')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })
})
