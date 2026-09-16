import type { PostgrestError } from '@supabase/supabase-js'
import { DomainErrors, unexpectedError, type DomainError } from '@core/domain/DomainError'

/**
 * Traduce errores de Postgres/PostgREST al idioma del dominio.
 *
 * Sin esta capa, un `23505` se filtraría hasta la UI y el usuario leería
 * "duplicate key value violates unique constraint". Aquí es donde un detalle de
 * infraestructura se convierte en una frase que una persona entiende.
 */

const PG_CODE = {
  uniqueViolation: '23505',
  foreignKeyViolation: '23503',
  checkViolation: '23514',
  insufficientPrivilege: '42501',
  raiseException: 'P0001',
  noRowsReturned: 'PGRST116',
} as const

export const mapPostgrestError = (error: PostgrestError | null, context: string): DomainError => {
  if (!error) return unexpectedError(new Error(`${context}: error nulo inesperado`))

  switch (error.code) {
    case PG_CODE.uniqueViolation:
      return DomainErrors.conflict(
        `${context}.duplicate`,
        'Ese registro ya existe.',
        { cause: error },
      )

    case PG_CODE.foreignKeyViolation:
      return DomainErrors.validation(
        `${context}.invalid_reference`,
        'Algún dato relacionado ya no existe.',
        { cause: error },
      )

    case PG_CODE.checkViolation:
      return DomainErrors.ruleViolation(
        `${context}.check`,
        'Esa operación rompe una regla del grupo.',
        { cause: error },
      )

    case PG_CODE.insufficientPrivilege:
      return DomainErrors.forbidden(
        `${context}.forbidden`,
        'No tienes permiso para hacer esto.',
        { cause: error },
      )

    case PG_CODE.noRowsReturned:
      return DomainErrors.notFound(`${context}.not_found`, 'No encontramos lo que buscabas.', {
        cause: error,
      })

    // Las funciones del servidor lanzan RAISE EXCEPTION con mensajes ya
    // redactados en español, así que los dejamos pasar tal cual.
    case PG_CODE.raiseException:
      return DomainErrors.ruleViolation(`${context}.rule`, error.message, { cause: error })

    default:
      return unexpectedError(error)
  }
}
