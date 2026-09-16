import type { UseCase } from '@core/application/UseCase'
import { ok, err, type Result } from '@core/domain/Result'
import { DomainErrors, type DomainError } from '@core/domain/DomainError'
import type { Group } from '../../domain/entities/Group'
import type { GroupRepository } from '../../domain/repositories/GroupRepository'

export interface CreateGroupInput {
  readonly name: string
  readonly description?: string
  readonly exchangeDate?: string
  readonly budgetAmount?: string
  readonly budgetCurrency?: string
  readonly ownerDisplayName: string
}

/** Valida la intención antes de tocar la base. Los mensajes son de producto. */
export class CreateGroup implements UseCase<CreateGroupInput, Group> {
  private static readonly NAME_MIN = 3
  private static readonly NAME_MAX = 60
  private static readonly DESCRIPTION_MAX = 280

  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(input: CreateGroupInput): Promise<Result<Group, DomainError>> {
    const name = input.name.trim().replace(/\s+/g, ' ')

    if (name.length < CreateGroup.NAME_MIN) {
      return err(
        DomainErrors.validation('group.name_too_short', 'Ponle un nombre de al menos 3 letras.', {
          field: 'name',
        }),
      )
    }

    if (name.length > CreateGroup.NAME_MAX) {
      return err(
        DomainErrors.validation('group.name_too_long', 'Usa un nombre de 60 letras o menos.', {
          field: 'name',
        }),
      )
    }

    const description = input.description?.trim() ?? ''
    if (description.length > CreateGroup.DESCRIPTION_MAX) {
      return err(
        DomainErrors.validation(
          'group.description_too_long',
          'La descripción no puede pasar de 280 caracteres.',
          { field: 'description' },
        ),
      )
    }

    const exchangeDateResult = this.parseExchangeDate(input.exchangeDate)
    if (exchangeDateResult.isErr) return err(exchangeDateResult.error)

    const budgetResult = this.parseBudget(input.budgetAmount)
    if (budgetResult.isErr) return err(budgetResult.error)

    const ownerDisplayName = input.ownerDisplayName.trim()
    if (ownerDisplayName.length < 2) {
      return err(
        DomainErrors.validation(
          'group.owner_name_required',
          'Necesitamos tu nombre para mostrarlo en el grupo.',
          { field: 'ownerDisplayName' },
        ),
      )
    }

    return this.groupRepository.create({
      name,
      description: description.length > 0 ? description : null,
      exchangeDate: exchangeDateResult.value,
      budgetAmount: budgetResult.value,
      budgetCurrency: input.budgetCurrency?.trim() || 'COP',
      ownerDisplayName,
    })
  }

  private parseExchangeDate(raw: string | undefined): Result<Date | null, DomainError> {
    if (!raw || raw.trim().length === 0) return ok(null)

    const date = new Date(`${raw}T12:00:00`)
    if (Number.isNaN(date.getTime())) {
      return err(
        DomainErrors.validation('group.bad_date', 'Esa fecha no es válida.', {
          field: 'exchangeDate',
        }),
      )
    }

    // Comparamos contra el inicio de hoy: elegir "hoy" debe ser válido.
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) {
      return err(
        DomainErrors.validation(
          'group.past_date',
          'La fecha del intercambio no puede ser en el pasado.',
          { field: 'exchangeDate' },
        ),
      )
    }

    return ok(date)
  }

  private parseBudget(raw: string | undefined): Result<number | null, DomainError> {
    if (!raw || raw.trim().length === 0) return ok(null)

    // Aceptamos "50.000", "50000" y "$50.000": la gente escribe el presupuesto
    // como lo diría, no como lo quiere la base de datos.
    const digits = raw.replace(/[^\d]/g, '')
    const amount = Number.parseInt(digits, 10)

    if (Number.isNaN(amount) || amount <= 0) {
      return err(
        DomainErrors.validation('group.bad_budget', 'Escribe un monto mayor a cero.', {
          field: 'budgetAmount',
        }),
      )
    }

    return ok(amount)
  }
}
