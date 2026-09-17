import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Variables de Supabase ficticias: `createContainer` construye los
// repositorios que un test no reemplaza, y eso valida el entorno con zod.
// Sin esto la suite dependía del `.env` local (ignorado por git) y fallaba en
// un clon limpio o en CI; además los tests nunca deben apuntar al proyecto
// real. Nada llega a la red: ningún test ejecuta consultas contra este host.
vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321')
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key_solo_para_tests')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)

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
