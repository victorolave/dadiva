/**
 * Errores de dominio.
 *
 * El dominio no sabe qué es un código HTTP ni un error de Postgres. Habla su
 * propio idioma. La infraestructura traduce; la UI presenta. Cada error trae
 * un mensaje ya redactado en español porque ese texto ES parte del contrato de
 * producto, no un detalle de la vista.
 */

export const DomainErrorKind = {
  Validation: 'VALIDATION',
  NotFound: 'NOT_FOUND',
  Forbidden: 'FORBIDDEN',
  Conflict: 'CONFLICT',
  RuleViolation: 'RULE_VIOLATION',
  Infrastructure: 'INFRASTRUCTURE',
  Unauthenticated: 'UNAUTHENTICATED',
} as const

export type DomainErrorKind = (typeof DomainErrorKind)[keyof typeof DomainErrorKind]

export interface DomainError {
  readonly kind: DomainErrorKind
  /** Identificador estable para tests y telemetría. Nunca se muestra al usuario. */
  readonly code: string
  /** Mensaje listo para mostrar, en español. */
  readonly message: string
  /** Campo del formulario al que apunta el error, si aplica. */
  readonly field?: string
  /** Causa original. Solo para depuración; jamás se renderiza. */
  readonly cause?: unknown
}

const make =
  (kind: DomainErrorKind) =>
  (code: string, message: string, extra?: { field?: string; cause?: unknown }): DomainError => ({
    kind,
    code,
    message,
    ...(extra?.field !== undefined ? { field: extra.field } : {}),
    ...(extra?.cause !== undefined ? { cause: extra.cause } : {}),
  })

export const DomainErrors = {
  validation: make(DomainErrorKind.Validation),
  notFound: make(DomainErrorKind.NotFound),
  forbidden: make(DomainErrorKind.Forbidden),
  conflict: make(DomainErrorKind.Conflict),
  ruleViolation: make(DomainErrorKind.RuleViolation),
  infrastructure: make(DomainErrorKind.Infrastructure),
  unauthenticated: make(DomainErrorKind.Unauthenticated),
} as const

/** Error genérico para lo que no supimos clasificar. */
export const unexpectedError = (cause: unknown): DomainError =>
  DomainErrors.infrastructure(
    'unexpected',
    'Algo salió mal de nuestro lado. Vuelve a intentarlo en un momento.',
    { cause },
  )
