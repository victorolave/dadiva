import type { Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId, MemberId } from '@core/domain/Entity'

/** A quién le regalo yo. La lista de deseos viaja junto porque es su razón de ser. */
export interface MyAssignment {
  readonly receiverMemberId: MemberId
  readonly receiverName: string
  readonly receiverAvatarEmoji: string
  readonly revealedAt: Date | null
  readonly wishlist: readonly {
    readonly title: string
    readonly url: string | null
    readonly notes: string | null
  }[]
}

/**
 * Puerto de asignaciones, separado de GroupRepository a propósito.
 *
 * Interface Segregation: la pantalla que lista grupos no tiene por qué poder
 * tocar asignaciones. Cuanto más angosta la interfaz, menos superficie hay por
 * donde se filtre el secreto.
 */
export interface AssignmentRepository {
  /** Solo puede devolver la asignación de quien llama. Las RLS lo garantizan. */
  findMine(groupId: GroupId): Promise<Result<MyAssignment | null, DomainError>>
  markAsRevealed(groupId: GroupId): Promise<Result<void, DomainError>>
}
