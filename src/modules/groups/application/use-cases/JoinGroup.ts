import type { UseCase } from '@core/application/UseCase'
import { err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import { InviteCode } from '../../domain/value-objects/InviteCode'
import type { Group } from '../../domain/entities/Group'
import type { GroupRepository } from '../../domain/repositories/GroupRepository'

export interface JoinGroupInput {
  readonly inviteCode: string
  readonly displayName: string
}

/**
 * Unirse por código.
 *
 * Es idempotente en el servidor: si ya eres miembro devuelve el grupo en vez de
 * fallar. Alguien que abre el enlace de invitación dos veces no debería ver un
 * error — solo quería entrar, y ya está adentro.
 */
export class JoinGroup implements UseCase<JoinGroupInput, Group> {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(input: JoinGroupInput): Promise<Result<Group, DomainError>> {
    const codeResult = InviteCode.create(input.inviteCode)
    if (codeResult.isErr) return err(codeResult.error)

    const displayName = input.displayName.trim().replace(/\s+/g, ' ')
    if (displayName.length < 2) {
      return err(
        DomainErrors.validation(
          'join.name_required',
          'Escribe tu nombre para que los demás sepan quién eres.',
          { field: 'displayName' },
        ),
      )
    }

    return this.groupRepository.joinByCode(codeResult.value, displayName)
  }
}
