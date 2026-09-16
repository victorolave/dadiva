import { describe, expect, it } from 'vitest'
import { asMemberId } from '@core/domain/Entity'
import type { WishlistItem } from '../../../domain/entities/WishlistItem'
import { AddWishlistItem } from '../AddWishlistItem'
import { DeleteWishlistItem } from '../DeleteWishlistItem'
import { FakeWishlistRepository } from './FakeWishlistRepository'

const MEMBER = asMemberId('member-1')
const OTHER = asMemberId('member-2')

const seedItem = async (repository: FakeWishlistRepository, title: string): Promise<WishlistItem> => {
  const added = await new AddWishlistItem(repository).execute({ memberId: MEMBER, title })
  if (added.isErr) throw new Error('setup falló: no se pudo agregar el ítem semilla')
  return added.value
}

describe('DeleteWishlistItem', () => {
  it('elimina el ítem propio', async () => {
    const repository = new FakeWishlistRepository()
    const item = await seedItem(repository, 'Para borrar')

    const result = await new DeleteWishlistItem(repository).execute({
      itemId: item.id,
      memberId: MEMBER,
    })

    expect(result.isOk).toBe(true)
    expect((await repository.listForMember(MEMBER)).unwrapOr([])).toHaveLength(0)
  })

  it('no permite eliminar el ítem de otro miembro', async () => {
    const repository = new FakeWishlistRepository()
    const item = await seedItem(repository, 'Ajeno')

    const result = await new DeleteWishlistItem(repository).execute({
      itemId: item.id,
      memberId: OTHER,
    })

    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => expect(error.code).toBe('wishlist.not_found'),
    })
    expect((await repository.listForMember(MEMBER)).unwrapOr([])).toHaveLength(1)
  })
})
