import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ContainerProvider } from '@app/composition/ContainerProvider'
import { AuthProvider } from '@modules/auth/presentation/AuthProvider'
import { NeverResolvingAuthRepository } from '@/test/fakes/FakeAuthRepository'
import { AuthCallbackPage } from '../AuthCallbackPage'

/**
 * `ContainerProvider` carga `./container` con un `import()` dinámico (ver su
 * comentario): se mockea para inyectar `NeverResolvingAuthRepository` en vez
 * de construir Supabase real. Con eso, una vez el contenedor SÍ carga, el
 * estado de auth se queda en 'loading' indefinidamente por culpa de
 * `getCurrentUser()` (nunca resuelve) — lo que dejar aislar, en el test de
 * abajo, la ventana en la que el contenedor mismo todavía no está listo.
 */
vi.mock('@app/composition/container', async () => {
  const actual = await vi.importActual<typeof import('@app/composition/container')>(
    '@app/composition/container',
  )
  return {
    ...actual,
    createContainer: (overrides?: Parameters<typeof actual.createContainer>[0]) =>
      actual.createContainer({ authRepository: new NeverResolvingAuthRepository(), ...overrides }),
  }
})

describe('AuthCallbackPage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('no arranca la cuenta regresiva de 10s hasta que el contenedor de dependencias está listo', async () => {
    // Precalienta el módulo mockeado con tiempo real: la PRIMERA resolución
    // de un `import()` dinámico pasa por la transformación real de todo el
    // grafo de `container.ts` (io real, no solo microtareas), así que no
    // alcanza con encolar un puñado de `Promise.resolve()` — hace falta
    // tiempo de reloj real, que con fake timers nunca llega. Precalentando
    // aquí (fuera de fake timers), la resolución DENTRO del test ya sale del
    // caché del runner y sí alcanza con una par de vueltas de microtareas.
    await import('@app/composition/container')

    vi.useFakeTimers()

    render(
      <MemoryRouter initialEntries={['/entrar/confirmar']}>
        {/* Sin prop `container`: pasa por el `import()` dinámico real, así
            que hay una ventana real (aunque corta) en la que el contenedor
            es `null` y el timer NO debería estar corriendo todavía. */}
        <ContainerProvider>
          <AuthProvider>
            <AuthCallbackPage />
          </AuthProvider>
        </ContainerProvider>
      </MemoryRouter>,
    )

    // Contenedor aún no resuelto: avanzar 15s (más que el timeout de 10s) no
    // debería producir el estado de fallo, porque el timer nunca arrancó.
    await act(async () => {
      vi.advanceTimersByTime(15_000)
    })
    expect(screen.getByText('Validando tu entrada…')).toBeInTheDocument()
    expect(screen.queryByText(/No pudimos validar el enlace/)).not.toBeInTheDocument()

    // Deja resolver el `import()` dinámico real (microtareas, no timers).
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    // Contenedor listo, pero `getCurrentUser()` nunca resuelve: el status
    // sigue en 'loading', ahora sí por Supabase — este es el punto en el
    // que el timer de 10s debe arrancar recién.
    await act(async () => {
      vi.advanceTimersByTime(9_999)
    })
    expect(screen.queryByText(/No pudimos validar el enlace/)).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText(/No pudimos validar el enlace/)).toBeInTheDocument()
  })
})
