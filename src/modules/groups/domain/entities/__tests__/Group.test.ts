import { describe, expect, it } from 'vitest'
import { asGroupId, asMemberId, asUserId } from '@core/domain/Entity'
import { Group } from '../Group'
import { Member, MemberRole } from '../Member'
import { GroupStatus } from '../../value-objects/GroupStatus'
import { InviteCode } from '../../value-objects/InviteCode'

const OWNER = asUserId('owner-1')
const OUTSIDER = asUserId('outsider-9')

const buildMember = (index: number, role: MemberRole = MemberRole.Member) =>
  Member.create({
    id: asMemberId(`member-${index}`),
    userId: index === 0 ? OWNER : asUserId(`user-${index}`),
    displayName: `Persona ${index}`,
    avatarEmoji: '🎁',
    role,
    joinedAt: new Date('2026-01-01'),
    hasWishlist: false,
    hasDrawnPromise: false,
  })

const buildGroup = (
  memberCount: number,
  status: GroupStatus = GroupStatus.Draft,
  exclusionCount = 0,
) =>
  Group.create({
    id: asGroupId('group-1'),
    name: 'Amigo secreto de la célula',
    description: null,
    ownerId: OWNER,
    exchangeDate: null,
    budget: null,
    inviteCode: InviteCode.fromPersistence('ABCD2345'),
    status,
    members: Array.from({ length: memberCount }, (_, index) =>
      buildMember(index, index === 0 ? MemberRole.Owner : MemberRole.Member),
    ),
    exclusionCount,
    createdAt: new Date('2026-01-01'),
  })

describe('Group · reglas del sorteo', () => {
  it('permite sortear al dueño con el mínimo de personas', () => {
    expect(buildGroup(3).canDraw(OWNER).isOk).toBe(true)
  })

  it('impide sortear a quien no es el dueño', () => {
    const result = buildGroup(5).canDraw(OUTSIDER)

    expect(result.isErr).toBe(true)
    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => expect(error.code).toBe('group.not_owner'),
    })
  })

  it('impide sortear con menos de tres personas y dice cuántas faltan', () => {
    const result = buildGroup(2).canDraw(OWNER)

    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => {
        expect(error.code).toBe('group.too_few_members')
        // Singular correcto: "Falta 1 persona", no "Faltan 1 personas".
        expect(error.message).toContain('Falta 1 persona ')
      },
    })
  })

  it('usa plural cuando faltan varias personas', () => {
    buildGroup(1)
      .canDraw(OWNER)
      .match({
        ok: () => expect.unreachable('no debía permitirlo'),
        err: (error) => expect(error.message).toContain('Faltan 2 personas'),
      })
  })

  it('no permite repetir un sorteo ya hecho', () => {
    buildGroup(5, GroupStatus.Drawn)
      .canDraw(OWNER)
      .match({
        ok: () => expect.unreachable('no debía permitirlo'),
        err: (error) => expect(error.code).toBe('group.already_drawn'),
      })
  })
})

describe('Group · admisión de miembros', () => {
  it('acepta gente mientras está abierto', () => {
    expect(buildGroup(4).canAcceptNewMembers().isOk).toBe(true)
  })

  it('rechaza gente nueva después del sorteo', () => {
    buildGroup(4, GroupStatus.Drawn)
      .canAcceptNewMembers()
      .match({
        ok: () => expect.unreachable('no debía permitirlo'),
        err: (error) => expect(error.code).toBe('group.closed_for_joining'),
      })
  })

  it('rechaza gente nueva al llegar al tope', () => {
    buildGroup(Group.MAX_MEMBERS)
      .canAcceptNewMembers()
      .match({
        ok: () => expect.unreachable('no debía permitirlo'),
        err: (error) => expect(error.code).toBe('group.full'),
      })
  })
})

describe('Group · cuenta regresiva', () => {
  it('devuelve null sin fecha definida', () => {
    expect(buildGroup(3).daysUntilExchange()).toBeNull()
  })

  it('cuenta días completos ignorando la hora del día', () => {
    const group = Group.create({
      id: asGroupId('group-2'),
      name: 'Navidad',
      description: null,
      ownerId: OWNER,
      exchangeDate: new Date('2026-12-24T12:00:00'),
      budget: null,
      inviteCode: InviteCode.fromPersistence('ABCD2345'),
      status: GroupStatus.Draft,
      members: [],
      exclusionCount: 0,
      createdAt: new Date('2026-01-01'),
    })

    // 23 a las 23:59 y 24 a las 00:01 deben dar 1 y 0 respectivamente:
    // lo que importa es el día del calendario, no las horas transcurridas.
    expect(group.daysUntilExchange(new Date('2026-12-23T23:59:00'))).toBe(1)
    expect(group.daysUntilExchange(new Date('2026-12-24T00:01:00'))).toBe(0)
  })
})

describe('Group · exclusiones imposibles', () => {
  it('bloquea el sorteo de 3 personas con una exclusión', () => {
    // Solo existen 2 derangements de 3 elementos y toda exclusión aparece en
    // ambos. No hay sorteo posible: es aritmética, no un límite del algoritmo.
    const result = buildGroup(3, GroupStatus.Draft, 1).canDraw(OWNER)

    expect(result.isErr).toBe(true)
    result.match({
      ok: () => expect.unreachable('no debía permitirlo'),
      err: (error) => {
        expect(error.code).toBe('group.exclusions_impossible')
        expect(error.message).toContain('invita a una persona más')
      },
    })
  })

  it('permite 3 personas SIN exclusiones', () => {
    expect(buildGroup(3, GroupStatus.Draft, 0).canDraw(OWNER).isOk).toBe(true)
  })

  it('permite 4 personas CON exclusiones', () => {
    expect(buildGroup(4, GroupStatus.Draft, 1).canDraw(OWNER).isOk).toBe(true)
  })
})
