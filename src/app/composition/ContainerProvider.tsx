import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { createContainer, type Container, type ContainerOverrides } from './container'

const ContainerContext = createContext<Container | null>(null)

export interface ContainerProviderProps {
  readonly children: ReactNode
  /** Permite inyectar dobles de prueba desde los tests. */
  readonly overrides?: ContainerOverrides
}

export const ContainerProvider = ({ children, overrides }: ContainerProviderProps) => {
  const container = useMemo(() => createContainer(overrides), [overrides])

  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>
}

export const useContainer = (): Container => {
  const container = useContext(ContainerContext)

  if (!container) {
    throw new Error('useContainer debe usarse dentro de <ContainerProvider>.')
  }

  return container
}
