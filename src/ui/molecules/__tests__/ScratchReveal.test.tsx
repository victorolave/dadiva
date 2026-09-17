import { afterEach, describe, expect, it } from 'vitest'
import { resolveSansFontFamily } from '../ScratchReveal'

/**
 * Solo se prueba `resolveSansFontFamily`, no el pintado del canvas: montar
 * `ScratchReveal` de verdad para comprobar QUÉ familia terminó en
 * `ctx.font` obligaría a mockear `HTMLCanvasElement.getContext` con un
 * `CanvasRenderingContext2D` falso completo (arcos, curvas, `fillText`,
 * `drawImage`...) solo para leer una propiedad — carísimo para lo que
 * aporta. `resolveSansFontFamily` es la parte que de verdad puede
 * desincronizarse con un cambio de fuente (ver su comentario en
 * `ScratchReveal.tsx`), y se puede probar sola.
 */
describe('resolveSansFontFamily', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--font-sans')
  })

  it('devuelve la familia de reserva cuando el token --font-sans no está definido', () => {
    // Los tests corren con `css: false` (ver vite.config.ts): theme.css
    // nunca se procesa, así que el token no existe de verdad — igual que le
    // pasaría a esta función si se llamara antes de que las hojas de estilo
    // carguen.
    expect(resolveSansFontFamily()).toBe(
      "'Nunito Sans Variable', ui-sans-serif, system-ui, -apple-system, sans-serif",
    )
  })

  it('lee el valor real del token --font-sans cuando está definido', () => {
    document.documentElement.style.setProperty('--font-sans', "'Prueba Sans', sans-serif")

    expect(resolveSansFontFamily()).toBe("'Prueba Sans', sans-serif")
  })
})
