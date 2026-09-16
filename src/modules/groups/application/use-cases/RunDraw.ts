import type { UseCase } from '@core/application/UseCase'
import { ok, err, type Result } from '@core/domain/Result'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId, UserId } from '@core/domain/Entity'
import type { GroupRepository } from '../../domain/repositories/GroupRepository'

export interface RunDrawInput {
  readonly groupId: GroupId
  readonly requestedBy: UserId
}

/**
 * Ejecuta el sorteo.
 *
 * El caso de uso valida en el cliente PARA DAR BUENA RESPUESTA (mensajes
 * precisos, sin viaje al servidor). La autoridad real está en la función
 * `draw_group()` de Postgres, que vuelve a verificar todo con SECURITY DEFINER.
 *
 * Cualquiera puede abrir las herramientas de desarrollo y llamar al repositorio
 * directo saltándose esta clase. Por eso la validación del cliente es
 * conveniencia y la del servidor es seguridad. Nunca al revés.
 */
export class RunDraw implements UseCase<RunDrawInput, void> {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(input: RunDrawInput): Promise<Result<void, DomainError>> {
    const groupResult = await this.groupRepository.findById(input.groupId)
    if (groupResult.isErr) return err(groupResult.error)

    const guard = groupResult.value.canDraw(input.requestedBy)
    if (guard.isErr) return err(guard.error)

    const drawResult = await this.groupRepository.runDraw(input.groupId)
    if (drawResult.isErr) return err(drawResult.error)

    return ok(undefined)
  }
}
