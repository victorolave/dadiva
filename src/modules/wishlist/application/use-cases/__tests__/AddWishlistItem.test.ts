import { describe, expect, it } from 'vitest'
import { asMemberId } from '@core/domain/Entity'
import { AddWishlistItem } from '../AddWishlistItem'
import { FakeWishlistRepository } from './FakeWishlistRepository'

const MEMBER = asMemberId('member-1')

describe('AddWishlistItem', () => {
  it('valida antes de tocar el repositorio', async () => {
    const repository = new FakeWishlistRepository()
    const useCase = new AddWishlistItem(repository)

    const result = await useCase.execute({ memberId: MEMBER, title: '   ' })

    expect(result.isErr).toBe(true)
    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => expect(error.code).toBe('wishlist.title_required'),
    })

    const listed = await repository.listForMember(MEMBER)
    expect(listed.unwrapOr([])).toHaveLength(0)
  })

  it('agrega el ítem al final de la lista del miembro', async () => {
    const repository = new FakeWishlistRepository()
    const useCase = new AddWishlistItem(repository)

    await useCase.execute({ memberId: MEMBER, title: 'Primero' })
    const second = await useCase.execute({
      memberId: MEMBER,
      title: 'Segundo',
      url: 'https://tienda.com/segundo',
      notes: 'Cualquier color',
    })

    expect(second.isOk).toBe(true)
    second.match({
      ok: (item) => {
        expect(item.title).toBe('Segundo')
        expect(item.url).toBe('https://tienda.com/segundo')
        expect(item.position).toBe(1)
      },
      err: () => expect.unreachable('debía crearlo'),
    })

    const listed = await repository.listForMember(MEMBER)
    expect(listed.unwrapOr([])).toHaveLength(2)
  })

  it('no mezcla los ítems de dos miembros distintos', async () => {
    const repository = new FakeWishlistRepository()
    const useCase = new AddWishlistItem(repository)
    const other = asMemberId('member-2')

    await useCase.execute({ memberId: MEMBER, title: 'Mío' })
    await useCase.execute({ memberId: other, title: 'De otro' })

    const mine = (await repository.listForMember(MEMBER)).unwrapOr([])
    expect(mine).toHaveLength(1)
    expect(mine[0]?.title).toBe('Mío')
  })

  it('no pasa del tope de deseos aunque la pantalla lo permita', async () => {
    const repository = new FakeWishlistRepository()
    const useCase = new AddWishlistItem(repository)

    for (let index = 0; index < 20; index++) {
      await useCase.execute({ memberId: MEMBER, title: `Deseo ${index}` })
    }
    const extra = await useCase.execute({ memberId: MEMBER, title: 'Uno más' })

    result_code(extra)
    const listed = await repository.listForMember(MEMBER)
    expect(listed.unwrapOr([])).toHaveLength(20)
  })
})

const result_code = (result: Awaited<ReturnType<AddWishlistItem['execute']>>) =>
  result.match({
    ok: () => expect.unreachable('no debía permitirlo'),
    err: (error) => expect(error.code).toBe('wishlist.limit_reached'),
  })
