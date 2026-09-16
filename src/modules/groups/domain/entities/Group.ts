import { Entity, type GroupId, type UserId } from '@core/domain/Entity'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import { GroupStatus } from '../value-objects/GroupStatus'
import { InviteCode } from '../value-objects/InviteCode'
import type { Member } from './Member'

export interface Budget {
  readonly amount: number
  readonly currency: string
}

interface GroupProps {
  readonly id: GroupId
  readonly name: string
  readonly description: string | null
  readonly ownerId: UserId
  readonly exchangeDate: Date | null
  readonly budget: Budget | null
  readonly inviteCode: InviteCode
  readonly status: GroupStatus
  readonly members: readonly Member[]
  readonly exclusionCount: number
  readonly createdAt: Date
}

/**
 * Raíz de agregado del grupo.
 *
 * Aquí viven las reglas de negocio del amigo secreto, EN EL DOMINIO y no
 * desperdigadas en componentes ni en handlers. El servidor las vuelve a
 * verificar en `draw_group()`: el cliente valida para dar buena respuesta al
 * usuario, el servidor valida porque es lo único en lo que se puede confiar.
 */
export class Group extends Entity<GroupId> {
  /**
   * Con dos personas el "sorteo" es determinista: cada una le regala a la
   * otra, no hay secreto que guardar. Tres es el mínimo donde el juego existe.
   */
  static readonly MIN_MEMBERS_TO_DRAW = 3
  static readonly MAX_MEMBERS = 60

  readonly name: string
  readonly description: string | null
  readonly ownerId: UserId
  readonly exchangeDate: Date | null
  readonly budget: Budget | null
  readonly inviteCode: InviteCode
  readonly status: GroupStatus
  readonly members: readonly Member[]
  readonly exclusionCount: number
  readonly createdAt: Date

  private constructor(props: GroupProps) {
    super(props.id)
    this.name = props.name
    this.description = props.description
    this.ownerId = props.ownerId
    this.exchangeDate = props.exchangeDate
    this.budget = props.budget
    this.inviteCode = props.inviteCode
    this.status = props.status
    this.members = props.members
    this.exclusionCount = props.exclusionCount
    this.createdAt = props.createdAt
  }

  static create(props: GroupProps): Group {
    return new Group(props)
  }

  get memberCount(): number {
    return this.members.length
  }

  get isOpen(): boolean {
    return this.status === GroupStatus.Draft
  }

  get isDrawn(): boolean {
    return this.status === GroupStatus.Drawn
  }

  isOwnedBy(userId: UserId): boolean {
    return this.ownerId === userId
  }

  memberForUser(userId: UserId): Member | undefined {
    return this.members.find((member) => member.userId === userId)
  }

  /** Cuántas personas más hacen falta para poder sortear. */
  get membersMissingToDraw(): number {
    return Math.max(Group.MIN_MEMBERS_TO_DRAW - this.memberCount, 0)
  }

  /**
   * ¿Puede sortearse ya? Devuelve el motivo exacto cuando no, para que la UI
   * explique qué falta en vez de mostrar un botón gris sin explicación.
   */
  canDraw(requestedBy: UserId): Result<void, DomainError> {
    if (!this.isOwnedBy(requestedBy)) {
      return err(
        DomainErrors.forbidden(
          'group.not_owner',
          'Solo quien creó el grupo puede hacer el sorteo.',
        ),
      )
    }

    if (this.status !== GroupStatus.Draft) {
      return err(
        DomainErrors.ruleViolation(
          'group.already_drawn',
          'Este grupo ya fue sorteado. Un sorteo no se puede repetir.',
        ),
      )
    }

    if (this.memberCount < Group.MIN_MEMBERS_TO_DRAW) {
      const missing = this.membersMissingToDraw
      return err(
        DomainErrors.ruleViolation(
          'group.too_few_members',
          `Falta${missing === 1 ? '' : 'n'} ${missing} persona${
            missing === 1 ? '' : 's'
          } para poder sortear. Con menos de ${Group.MIN_MEMBERS_TO_DRAW} no hay secreto que guardar.`,
        ),
      )
    }

    if (this.hasImpossibleExclusions) {
      return err(
        DomainErrors.ruleViolation(
          'group.exclusions_impossible',
          'Con 3 personas y una restricción el sorteo es imposible: alguien tendría que ' +
            'regalarse a sí mismo. Quita la restricción o invita a una persona más.',
        ),
      )
    }

    return ok(undefined)
  }

  /**
   * Con exactamente 3 personas, CUALQUIER exclusión vuelve el sorteo imposible.
   *
   * Solo existen dos permutaciones sin punto fijo de 3 elementos (los dos
   * ciclos: A→B→C→A y A→C→B→A) y toda exclusión aparece en ambas. No es una
   * limitación del algoritmo, es aritmética. Lo detectamos aquí para poder
   * explicarlo ANTES de que el organizador presione el botón y reciba un error.
   */
  get hasImpossibleExclusions(): boolean {
    return this.memberCount === Group.MIN_MEMBERS_TO_DRAW && this.exclusionCount > 0
  }

  canAcceptNewMembers(): Result<void, DomainError> {
    if (this.status !== GroupStatus.Draft) {
      return err(
        DomainErrors.ruleViolation(
          'group.closed_for_joining',
          'Este grupo ya fue sorteado y no admite más personas.',
        ),
      )
    }

    if (this.memberCount >= Group.MAX_MEMBERS) {
      return err(
        DomainErrors.ruleViolation(
          'group.full',
          `Un grupo admite hasta ${Group.MAX_MEMBERS} personas.`,
        ),
      )
    }

    return ok(undefined)
  }

  /** Días que faltan para el intercambio. Null si no hay fecha definida. */
  daysUntilExchange(now: Date = new Date()): number | null {
    if (!this.exchangeDate) return null

    const startOfDay = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

    const millisecondsPerDay = 86_400_000
    return Math.round((startOfDay(this.exchangeDate) - startOfDay(now)) / millisecondsPerDay)
  }
}
