import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ContainerProvider, useOptionalContainer } from '../ContainerProvider'
import { createContainer } from '../container'
import { FakeAuthRepository } from '@/test/fakes/FakeAuthRepository'

/**
 * `ContainerProvider` carga `./container` (Supabase + los casos de uso de
 * cada módulo) con un `import()` dinámico para que ese peso no viaje en el
 * bundle inicial (ver el comentario grande del componente). Estos tests
 * cubren el contrato de tiempos que ese cambio introduce: con un contenedor
 * ya armado es síncrono (lo que necesitan los tests de UI, ver
 * `LandingPage.axe.test.tsx`/`SignInPage.test.tsx`), y sin él pasa por
 * 'cargando' antes de resolver.
 */
const Probe = () => {
  const container = useOptionalContainer()
  return <p>contenedor: {container ? 'listo' : 'cargando'}</p>
}

describe('ContainerProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('con un contenedor ya armado, lo expone de inmediato sin import() dinámico', () => {
    const container = createContainer({ authRepository: new FakeAuthRepository() })

    render(
      <MemoryRouter initialEntries={['/grupos']}>
        <ContainerProvider container={container}>
          <Probe />
        </ContainerProvider>
      </MemoryRouter>,
    )

    // Sin `await` ni `act` de por medio: si esto pasa, el contenedor estuvo
    // listo en el primer render, no después de una vuelta de microtareas.
    expect(screen.getByText('contenedor: listo')).toBeInTheDocument()
  })

  it('sin contenedor, en una ruta que no es "/" carga de inmediato (no espera a idle)', async () => {
    render(
      <MemoryRouter initialEntries={['/grupos']}>
        <ContainerProvider>
          <Probe />
        </ContainerProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('contenedor: cargando')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('contenedor: listo')).toBeInTheDocument())
  })

  it('sin contenedor, en "/" espera al primer momento ocioso antes de cargar', async () => {
    // jsdom no implementa `requestIdleCallback`: `ContainerProvider` cae al
    // respaldo de `setTimeout(callback, 200)` (ver su comentario), así que
    // se controla ese timer con fake timers en vez de esperar 200ms reales.
    vi.useFakeTimers()

    render(
      <MemoryRouter initialEntries={['/']}>
        <ContainerProvider>
          <Probe />
        </ContainerProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('contenedor: cargando')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(200)
      // El `import()` dinámico que dispara el timer resuelve por la cola de
      // microtareas real, no por los timers falsos: hay que dejarla correr.
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('contenedor: listo')).toBeInTheDocument()
  })
})
