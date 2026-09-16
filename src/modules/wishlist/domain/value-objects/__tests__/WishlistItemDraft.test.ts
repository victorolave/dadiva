import { describe, expect, it } from 'vitest'
import { WishlistItemDraft } from '../WishlistItemDraft'

describe('WishlistItemDraft · título', () => {
  it('acepta un título válido y lo recorta', () => {
    const result = WishlistItemDraft.create({ title: '  Audífonos inalámbricos  ' })

    expect(result.isOk).toBe(true)
    result.match({
      ok: (draft) => expect(draft.title).toBe('Audífonos inalámbricos'),
      err: () => expect.unreachable('debía aceptarlo'),
    })
  })

  it('colapsa espacios repetidos', () => {
    const result = WishlistItemDraft.create({ title: 'Un   libro    bonito' })
    result.match({
      ok: (draft) => expect(draft.title).toBe('Un libro bonito'),
      err: () => expect.unreachable('debía aceptarlo'),
    })
  })

  it('rechaza el título vacío', () => {
    const result = WishlistItemDraft.create({ title: '   ' })

    expect(result.isErr).toBe(true)
    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => {
        expect(error.code).toBe('wishlist.title_required')
        expect(error.field).toBe('title')
      },
    })
  })

  it('rechaza un título de más de 140 caracteres', () => {
    const result = WishlistItemDraft.create({ title: 'a'.repeat(141) })

    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => expect(error.code).toBe('wishlist.title_too_long'),
    })
  })

  it('acepta exactamente el límite de 140 caracteres', () => {
    const result = WishlistItemDraft.create({ title: 'a'.repeat(140) })
    expect(result.isOk).toBe(true)
  })
})

describe('WishlistItemDraft · caracteres', () => {
  it('cuenta un emoji como un solo carácter, igual que Postgres', () => {
    const result = WishlistItemDraft.create({ title: '🎁'.repeat(140), notes: '✨🎄'.repeat(250) })
    expect(result.isOk).toBe(true)
  })
})

describe('WishlistItemDraft · enlace', () => {
  it('permite omitir el enlace', () => {
    const result = WishlistItemDraft.create({ title: 'Algo' })
    result.match({
      ok: (draft) => expect(draft.url).toBeNull(),
      err: () => expect.unreachable('debía aceptarlo'),
    })
  })

  it('acepta http y https', () => {
    expect(
      WishlistItemDraft.create({ title: 'Algo', url: 'http://tienda.com/producto' }).isOk,
    ).toBe(true)
    expect(
      WishlistItemDraft.create({ title: 'Algo', url: 'https://tienda.com/producto' }).isOk,
    ).toBe(true)
  })

  it('acepta https en mayúsculas (case-insensitive, como el CHECK de la base)', () => {
    expect(WishlistItemDraft.create({ title: 'Algo', url: 'HTTPS://tienda.com' }).isOk).toBe(true)
  })

  it('rechaza un enlace sin protocolo', () => {
    const result = WishlistItemDraft.create({ title: 'Algo', url: 'tienda.com/producto' })

    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => {
        expect(error.code).toBe('wishlist.bad_url')
        expect(error.field).toBe('url')
      },
    })
  })

  it('trata la cadena vacía como "sin enlace", no como error', () => {
    expect(WishlistItemDraft.create({ title: 'Algo', url: '   ' }).isOk).toBe(true)
  })
})

describe('WishlistItemDraft · notas', () => {
  it('permite omitir las notas', () => {
    const result = WishlistItemDraft.create({ title: 'Algo' })
    result.match({
      ok: (draft) => expect(draft.notes).toBeNull(),
      err: () => expect.unreachable('debía aceptarlo'),
    })
  })

  it('rechaza notas de más de 500 caracteres', () => {
    const result = WishlistItemDraft.create({ title: 'Algo', notes: 'a'.repeat(501) })

    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => expect(error.code).toBe('wishlist.notes_too_long'),
    })
  })

  it('acepta exactamente el límite de 500 caracteres', () => {
    expect(WishlistItemDraft.create({ title: 'Algo', notes: 'a'.repeat(500) }).isOk).toBe(true)
  })
})
