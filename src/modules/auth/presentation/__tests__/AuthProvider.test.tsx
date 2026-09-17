import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ContainerProvider } from '@app/composition/ContainerProvider'
import { AuthProvider, useAuth } from '../AuthProvider'
import { FakeAuthRepository, buildFakeUser } from '@/test/fakes/FakeAuthRepository'

/**
 * `ContainerProvider` carga `./container` con un `import()` dinámico (ver su
 * comentario), así que este test mockea ese módulo para inyectar un
 * `AuthRepository` en memoria sin tocar Supabase real ni pedir red: solo así
 * se puede comprobar, de forma determinista, que `AuthProvider` se queda en
 * 'loading' mientras el contenedor no está listo (nunca 'anonymous', que
 * haría parpadear a quien sí tiene sesión — ver el comentario del propio
 * `AuthProvider`).
 */
vi.mock('@app/composition/container', async () => {
  const actual = await vi.importActual<typeof import('@app/composition/container')>(
    '@app/composition/container',
  )
  return {
    ...actual,
    createContainer: (overrides?: Parameters<typeof actual.createContainer>[0]) =>
      actual.createContainer({ authRepository: new FakeAuthRepository(), ...overrides }),
  }
})

const StatusProbe = () => {
  const { status, user } = useAuth()
  return (
    <p>
      estado: {status} · usuario: {user?.displayName ?? 'ninguno'}
    </p>
  )
}

describe('AuthProvider + ContainerProvider (carga bajo demanda)', () => {
  it('se queda en "loading" hasta que el contenedor resuelve, nunca salta a "anonymous" antes de tiempo', async () => {
    render(
      <MemoryRouter initialEntries={['/grupos']}>
        <ContainerProvider>
          <AuthProvider>
            <StatusProbe />
          </AuthProvider>
        </ContainerProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('estado: loading · usuario: ninguno')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByText('estado: anonymous · usuario: ninguno')).toBeInTheDocument(),
    )
  })

  it('con contenedor ya listo (prop `container`), resuelve la sesión existente sin pasar por "anonymous"', async () => {
    const { createContainer } = await vi.importActual<typeof import('@app/composition/container')>(
      '@app/composition/container',
    )
    const container = createContainer({ authRepository: new FakeAuthRepository(buildFakeUser()) })

    render(
      <MemoryRouter initialEntries={['/grupos']}>
        <ContainerProvider container={container}>
          <AuthProvider>
            <StatusProbe />
          </AuthProvider>
        </ContainerProvider>
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(
        screen.getByText('estado: authenticated · usuario: Persona de prueba'),
      ).toBeInTheDocument(),
    )
  })
})
