/**
 * Result — manejo explícito de errores sin excepciones.
 *
 * Las excepciones son un canal de control invisible: no aparecen en la firma
 * de la función, así que el compilador no puede obligarte a manejarlas. Al
 * devolver un Result, el error forma parte del tipo y TypeScript te fuerza a
 * discriminarlo antes de tocar el valor.
 *
 * Regla del proyecto: ninguna capa lanza excepciones hacia arriba. La
 * infraestructura atrapa lo que lance el SDK y lo traduce a Result.
 *
 * PROPAGAR ERRORES: `Err<T, E>` lleva el tipo de éxito, así que devolver tal
 * cual el Err de otra operación NO compila cuando los tipos de éxito difieren:
 *
 *     if (emailResult.isErr) return emailResult        // ✗ no compila
 *     if (emailResult.isErr) return err(emailResult.error)  // ✓
 *
 * No es una molestia del tipado, es la propagación hecha visible: en la segunda
 * forma se lee que el error viaja de un contexto a otro.
 */

export type Result<T, E> = Ok<T, E> | Err<T, E>

interface ResultShape<T, E> {
  readonly isOk: boolean
  readonly isErr: boolean
  /** Transforma el valor de éxito. No toca el error. */
  map<U>(fn: (value: T) => U): Result<U, E>
  /** Transforma el error. No toca el valor. */
  mapErr<F>(fn: (error: E) => F): Result<T, F>
  /** Encadena otra operación que también puede fallar. */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>
  /** Devuelve el valor o un sustituto si es error. */
  unwrapOr(fallback: T): T
  /** Colapsa ambas ramas a un único tipo. Útil en la capa de UI. */
  match<U>(handlers: { readonly ok: (value: T) => U; readonly err: (error: E) => U }): U
}

class Ok<T, E> implements ResultShape<T, E> {
  readonly isOk = true as const
  readonly isErr = false as const

  constructor(readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value))
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return new Ok(this.value)
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value)
  }

  unwrapOr(_fallback: T): T {
    return this.value
  }

  match<U>(handlers: { readonly ok: (value: T) => U; readonly err: (error: E) => U }): U {
    return handlers.ok(this.value)
  }
}

class Err<T, E> implements ResultShape<T, E> {
  readonly isOk = false as const
  readonly isErr = true as const

  constructor(readonly error: E) {}

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err(this.error)
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err(fn(this.error))
  }

  andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Err(this.error)
  }

  unwrapOr(fallback: T): T {
    return fallback
  }

  match<U>(handlers: { readonly ok: (value: T) => U; readonly err: (error: E) => U }): U {
    return handlers.err(this.error)
  }
}

export const ok = <T, E = never>(value: T): Result<T, E> => new Ok(value)
export const err = <E, T = never>(error: E): Result<T, E> => new Err(error)

/** Estrecha el tipo a la rama de éxito. */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T, E> => result.isOk

/** Estrecha el tipo a la rama de error. */
export const isErr = <T, E>(result: Result<T, E>): result is Err<T, E> => result.isErr

/**
 * Agrupa varios Result en uno solo. Falla con el primer error encontrado.
 * Útil para validar un formulario completo antes de construir la entidad.
 */
export const combine = <T, E>(results: readonly Result<T, E>[]): Result<readonly T[], E> => {
  const values: T[] = []
  for (const result of results) {
    if (result.isErr) return err(result.error)
    values.push(result.value)
  }
  return ok(values)
}
