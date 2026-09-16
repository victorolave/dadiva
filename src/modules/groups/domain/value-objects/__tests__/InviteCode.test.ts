import { describe, expect, it } from 'vitest'
import { InviteCode } from '../InviteCode'

describe('InviteCode', () => {
  it('acepta un código canónico', () => {
    const result = InviteCode.create('ABCD2345')
    expect(result.isOk).toBe(true)
    expect(result.unwrapOr(InviteCode.fromPersistence('')).value).toBe('ABCD2345')
  })

  it('normaliza minúsculas, espacios y guiones', () => {
    const result = InviteCode.create('  abcd-2345 ')
    expect(result.isOk).toBe(true)
    expect(result.unwrapOr(InviteCode.fromPersistence('')).value).toBe('ABCD2345')
  })

  it('resuelve confusiones visuales hacia caracteres que SÍ existen en el alfabeto', () => {
    // O y 0 no están en el alfabeto; deben caer en Q, que sí está.
    const result = InviteCode.create('ABCD234O')
    expect(result.isOk).toBe(true)

    const code = result.unwrapOr(InviteCode.fromPersistence(''))
    expect(code.value).toBe('ABCD234Q')
    // La invariante que importa: todo carácter pertenece al alfabeto.
    expect([...code.value].every((char) => InviteCode.ALPHABET.includes(char))).toBe(true)
  })

  it('mapea I, L y 1 a J', () => {
    const result = InviteCode.create('ABCD23IL')
    expect(result.unwrapOr(InviteCode.fromPersistence('')).value).toBe('ABCD23JJ')
  })

  it('rechaza longitud incorrecta indicando cuántos caracteres llegaron', () => {
    const result = InviteCode.create('ABC')
    expect(result.isErr).toBe(true)
    result.match({
      ok: () => expect.unreachable('debía fallar'),
      err: (error) => {
        expect(error.code).toBe('invite.bad_length')
        expect(error.message).toContain('3')
      },
    })
  })

  it('rechaza el código vacío', () => {
    const result = InviteCode.create('   ')
    expect(result.isErr).toBe(true)
  })

  it('formatea en dos bloques de cuatro', () => {
    expect(InviteCode.fromPersistence('ABCD2345').formatted).toBe('ABCD-2345')
  })

  it('nunca produce un código con caracteres fuera del alfabeto', () => {
    const result = InviteCode.create('OOIILL00')
    expect(result.isOk).toBe(true)
    const code = result.unwrapOr(InviteCode.fromPersistence(''))
    expect([...code.value].every((char) => InviteCode.ALPHABET.includes(char))).toBe(true)
  })
})
