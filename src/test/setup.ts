import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom no implementa matchMedia y la capa de animación la consulta
// para respetar prefers-reduced-motion.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// jsdom tampoco implementa scrollTo (lo llama RouteAnnouncer al cambiar de
// ruta): sin este mock, cada test de navegación imprime un error de consola
// que no aporta nada.
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})
