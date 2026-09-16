import { describe, expect, it } from 'vitest'
import { asMemberId } from '@core/domain/Entity'
import type { WishlistItem } from '../../../domain/entities/WishlistItem'
import { AddWishlistItem } from '../AddWishlistItem'
import { UpdateWishlistItem } from '../UpdateWishlistItem'
import { FakeWishlistRepository } from './FakeWishlistRepository'

const MEMBER = asMemberId('member-1')
const OTHER = asMemberId('member-2')

const seedItem = async (repository: FakeWishlistRepository): Promise<WishlistItem> => {
  const added = await new AddWishlistItem(repository).execute({ memberId: MEMBER, title: 'Original' })
  if (added.isErr) throw new Error('setup falló: no se pudo agregar el ítem semilla')
  return added.value
}

describe('UpdateWishlistItem', () => {
  it('actualiza título, enlace y notas', async () => {
    const repository = new FakeWishlistRepository()
    const item = await seedItem(repository)

    const useCase = new UpdateWishlistItem(repository)
    const result = await useCase.execute({
      itemId: item.id,
      memberId: MEMBER,
      title: 'Actualizado',
      url: 'https://tienda.com/nuevo',
      notes: 'Notas nuevas',
    })

    result.match({
      ok: (updated) => {
        expect(updated.title).toBe('Actualizado')
        expect(updated.url).toBe('https://tienda.com/nuevo')
        expect(updated.notes).toBe('Notas nuevas')
      },
      err: () => expect.unreachable('debía actualizarlo'),
    })
  })

  it('rechaza datos inválidos sin llamar al repositorio', async () => {
    const repository = new FakeWishlistRepository()
    const item = await seedItem(repository)

    const useCase = new UpdateWishlistItem(repository)
    const result = await useCase.execute({
      itemId: item.id,
      memberId: MEMBER,
      title: 'Algo',
      url: 'ftp://no-vale.com',
    })

    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => expect(error.code).toBe('wishlist.bad_url'),
    })
  })

  it('no permite actualizar el ítem de otro miembro', async () => {
    const repository = new FakeWishlistRepository()
    const item = await seedItem(repository)

    const useCase = new UpdateWishlistItem(repository)
    const result = await useCase.execute({ itemId: item.id, memberId: OTHER, title: 'Robado' })

    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => expect(error.code).toBe('wishlist.not_found'),
    })
  })
})
