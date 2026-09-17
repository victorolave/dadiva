import { act } from 'react'
import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@app/layouts/AppShell'
import { ContainerProvider } from '@app/composition/ContainerProvider'
import { createContainer } from '@app/composition/container'
import { AuthProvider } from '@modules/auth/presentation/AuthProvider'
import { FakeAuthRepository } from '@/test/fakes/FakeAuthRepository'
import { expectNoAxeViolations } from '@/test/axe'
import { LandingPage } from '../LandingPage'

/**
 * A diferencia de `LandingPage.test.tsx` (que monta la página sola, ver su
 * comentario), este test la monta dentro del `AppShell` real: header, salto
 * al contenido y footer también entran en el escaneo de axe, que es donde
 * viven el landmark `banner`, la navegación legal y el enlace de salto.
 *
 * `ContainerProvider` carga su contenedor real con un `import()` dinámico
 * (ver su comentario): un test no tiene por qué esperar esa vuelta extra
 * cuando lo único que le importa es inyectar un doble de autenticación, así
 * que aquí se arma el contenedor con `createContainer` y se pasa ya listo
 * por la prop `container`, que salta el `import()` por completo.
 */
const renderLandingInsideAppShell = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <ContainerProvider container={createContainer({ authRepository: new FakeAuthRepository() })}>
        <AuthProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<LandingPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ContainerProvider>
    </MemoryRouter>,
  )

describe('LandingPage (axe, dentro de AppShell)', () => {
  it('no tiene violaciones de accesibilidad', async () => {
    let renderResult!: ReturnType<typeof renderLandingInsideAppShell>

    await act(async () => {
      renderResult = renderLandingInsideAppShell()
      // `AuthProvider` arranca en 'loading' y resuelve a 'anonymous' en la
      // siguiente vuelta de microtareas (ver `FakeAuthRepository`). AppShell
      // no distingue esos dos estados en su render (el bloque de navegación
      // solo depende de `user`, null en ambos), pero se espera igual para no
      // dejar una actualización de estado pendiente fuera de `act`.
      await Promise.resolve()
      await Promise.resolve()
    })

    await expectNoAxeViolations(renderResult.container)
  })
})
