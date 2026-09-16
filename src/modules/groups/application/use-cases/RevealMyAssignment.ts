import type { UseCase } from '@core/application/UseCase'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import type { GroupId } from '@core/domain/Entity'
import type {
  AssignmentRepository,
  MyAssignment,
} from '../../domain/repositories/AssignmentRepository'

export interface RevealMyAssignmentInput {
  readonly groupId: GroupId
  /** Si es la primera vez, marcamos el momento de la revelación. */
  readonly markRevealed: boolean
}

/**
 * Descubre a quién le regalo.
 *
 * `revealedAt` no es analítica: le permite al organizador ver cuántas personas
 * ya abrieron su sobre SIN ver jamás qué había dentro de cada uno.
 */
export class RevealMyAssignment implements UseCase<RevealMyAssignmentInput, MyAssignment> {
  constructor(private readonly assignmentRepository: AssignmentRepository) {}

  async execute(input: RevealMyAssignmentInput): Promise<Result<MyAssignment, DomainError>> {
    const result = await this.assignmentRepository.findMine(input.groupId)
    if (result.isErr) return err(result.error)

    if (!result.value) {
      return err(
        DomainErrors.notFound(
          'assignment.not_ready',
          'Todavía no se ha hecho el sorteo en este grupo.',
        ),
      )
    }

    // Marcar la revelación no debe poder romper la revelación misma: si falla
    // el update, la persona igual ve a su amigo secreto.
    if (input.markRevealed && result.value.revealedAt === null) {
      await this.assignmentRepository.markAsRevealed(input.groupId)
    }

    return ok(result.value)
  }
}
