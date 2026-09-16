import { describe, expect, it } from 'vitest'
import { redactUrl } from '../redactUrl'

const ORIGIN = 'https://dadiva-gray.vercel.app'

describe('redactUrl', () => {
  it('oculta el código de invitación', () => {
    expect(redactUrl(`${ORIGIN}/unirse/ABCD2345`)).toBe(`${ORIGIN}/unirse/[codigo]`)
  })

  it('agrupa el detalle de grupo por plantilla', () => {
    expect(redactUrl(`${ORIGIN}/grupos/3f1c9a2e-7b4d-4e0a-9c1f-2d6b8e5a4c3b`)).toBe(
      `${ORIGIN}/grupos/[id]`,
    )
  })

  it('deja intactas las rutas fijas', () => {
    expect(redactUrl(`${ORIGIN}/grupos/nuevo`)).toBe(`${ORIGIN}/grupos/nuevo`)
    expect(redactUrl(`${ORIGIN}/grupos`)).toBe(`${ORIGIN}/grupos`)
    expect(redactUrl(`${ORIGIN}/unirse`)).toBe(`${ORIGIN}/unirse`)
    expect(redactUrl(`${ORIGIN}/`)).toBe(`${ORIGIN}/`)
  })

  it('descarta el código de autenticación y el hash', () => {
    expect(redactUrl(`${ORIGIN}/entrar/confirmar?code=secreto#access_token=otro`)).toBe(
      `${ORIGIN}/entrar/confirmar`,
    )
  })

  it('conserva solo los parámetros utm', () => {
    expect(redactUrl(`${ORIGIN}/?utm_source=whatsapp&ref=abc&utm_campaign=navidad`)).toBe(
      `${ORIGIN}/?utm_source=whatsapp&utm_campaign=navidad`,
    )
  })
})
