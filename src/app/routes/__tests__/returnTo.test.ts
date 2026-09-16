import { beforeEach, describe, expect, it } from 'vitest'
import { clearReturnTo, isSafeReturnPath, readReturnTo, rememberReturnTo } from '../returnTo'

describe('returnTo', () => {
  beforeEach(() => window.sessionStorage.clear())

  it('devuelve la ruta de invitación después de la redirección', () => {
    rememberReturnTo('/unirse/ABCD2345')
    expect(readReturnTo()).toBe('/unirse/ABCD2345')
  })

  it('leer es idempotente y limpiar lo borra', () => {
    rememberReturnTo('/unirse/ABCD2345')
    readReturnTo()
    expect(readReturnTo()).toBe('/unirse/ABCD2345')
    clearReturnTo()
    expect(readReturnTo()).toBeNull()
  })

  it('un destino inválido borra el anterior', () => {
    rememberReturnTo('/unirse/ABCD2345')
    rememberReturnTo(undefined)
    expect(readReturnTo()).toBeNull()
  })

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'grupos', '/entrar', '/entrar/confirmar', 42])(
    'rechaza %s',
    (path) => {
      expect(isSafeReturnPath(path)).toBe(false)
    },
  )
})
