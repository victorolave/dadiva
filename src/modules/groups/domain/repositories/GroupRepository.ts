import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId, MemberId, UserId } from '@core/domain/Entity'
import type { Group } from '../entities/Group'
import type { InviteCode } from '../value-objects/InviteCode'

export interface CreateGroupData {
  readonly name: string
  readonly description: string | null
  readonly exchangeDate: Date | null
  readonly budgetAmount: number | null
  readonly budgetCurrency: string
  readonly ownerDisplayName: string
}

/** Resumen ligero para la lista de grupos: no arrastra todos los miembros. */
export interface GroupSummary {
  readonly id: GroupId
  readonly name: string
  readonly status: Group['status']
  readonly memberCount: number
  readonly exchangeDate: Date | null
  readonly isOwner: boolean
}

export interface GroupRepository {
  create(data: CreateGroupData): Promise<Result<Group, DomainError>>
  findById(groupId: GroupId): Promise<Result<Group, DomainError>>
  listForUser(userId: UserId): Promise<Result<readonly GroupSummary[], DomainError>>
  joinByCode(code: InviteCode, displayName: string): Promise<Result<Group, DomainError>>
  /** Ejecuta el sorteo en el servidor. Nunca devuelve el mapa de asignaciones. */
  runDraw(groupId: GroupId): Promise<Result<void, DomainError>>
  leave(groupId: GroupId, memberId: MemberId): Promise<Result<void, DomainError>>
  close(groupId: GroupId): Promise<Result<void, DomainError>>
}
