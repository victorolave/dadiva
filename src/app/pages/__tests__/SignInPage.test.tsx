import { act } from 'react'
import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ContainerProvider } from '@app/composition/ContainerProvider'
import { createContainer } from '@app/composition/container'
import { AuthProvider } from '@modules/auth/presentation/AuthProvider'
import { FakeAuthRepository } from '@/test/fakes/FakeAuthRepository'
import { expectNoAxeViolations } from '@/test/axe'
import { SignInPage } from '../SignInPage'

/**
 * `SignInPage` llama `useAuth()` directamente (para redirigir si ya hay
 * sesión), así que necesita `AuthProvider` de verdad aunque no se monte
 * dentro de `AppShell` — igual que la ve `ProtectedRoute` en producción,
 * como contenido de la ruta, no como el shell entero. El contenedor se pasa
 * ya armado (ver el comentario en `LandingPage.axe.test.tsx`) para no
 * depender del `import()` dinámico de `ContainerProvider`.
 */
const renderSignIn = () =>
  render(
    <MemoryRouter initialEntries={['/entrar']}>
      <ContainerProvider container={createContainer({ authRepository: new FakeAuthRepository() })}>
        <AuthProvider>
          <SignInPage />
        </AuthProvider>
      </ContainerProvider>
    </MemoryRouter>,
  )

describe('SignInPage', () => {
  it('no tiene violaciones de accesibilidad', async () => {
    let renderResult!: ReturnType<typeof renderSignIn>

    await act(async () => {
      renderResult = renderSignIn()
      // Deja resolver `getCurrentUser()` (anónimo) antes de escanear, igual
      // que en el axe test de LandingPage.
      await Promise.resolve()
      await Promise.resolve()
    })

    await expectNoAxeViolations(renderResult.container)
  })
})
