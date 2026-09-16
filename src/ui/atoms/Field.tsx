import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

interface FieldShellProps {
  readonly label: string
  readonly hint?: string | undefined
  readonly error?: string | undefined
  readonly required?: boolean | undefined
  readonly children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode
}

/**
 * Envoltorio accesible de campo de formulario.
 *
 * Centraliza el cableado de aria porque es donde más se falla: el hint y el
 * error tienen que llegar al lector de pantalla vía aria-describedby, y el
 * error debe anunciarse cuando aparece (role="alert"). Si cada formulario lo
 * resolviera a mano, la mitad quedaría mal.
 */
const FieldShell = ({ label, hint, error, required, children }: FieldShellProps) => {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      {/* Tipografía normal, no mayúsculas en mono: un label de formulario
          en versalitas comprimidas se lee peor que uno en texto corriente,
          justo donde la lectura tiene que ser rápida y sin esfuerzo. */}
      <label htmlFor={inputId} className="text-sm font-bold text-ink">
        {label}
        {required && (
          // blush-900, no blush-700: blush-700 sobre blush-100 da 3.05 de
          // contraste (no pasa AA). blush-900 da 6.11.
          <span className="ml-1 text-blush-900" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({ inputId, describedBy: describedBy || undefined })}

      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

const controlClasses = (hasError: boolean) =>
  cn(
    'h-12 w-full rounded-control border-2 bg-paper px-3.5 font-sans text-base text-ink',
    'placeholder:text-ink-faint',
    'transition-shadow duration-120',
    hasError
      ? 'border-danger bg-danger-soft shadow-[2px_2px_0_0_var(--color-danger)]'
      : 'border-ink shadow-sticker-sm focus-visible:shadow-sticker',
  )

// El textarea no lleva la altura fija de un input de una línea: reemplaza
// `h-12` por relleno vertical propio para que crezca con `rows`.
const textAreaClasses = 'h-auto py-3'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-describedby'> {
  readonly label: string
  readonly hint?: string | undefined
  readonly error?: string | undefined
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, required, className, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} {...(hint ? { hint } : {})} {...(error ? { error } : {})} required={required}>
      {({ inputId, describedBy }) => (
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          className={cn(controlClasses(Boolean(error)), className)}
          {...rest}
        />
      )}
    </FieldShell>
  )
})

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'aria-describedby'> {
  readonly label: string
  readonly hint?: string | undefined
  readonly error?: string | undefined
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, hint, error, required, className, ...rest }, ref) {
    return (
      <FieldShell label={label} {...(hint ? { hint } : {})} {...(error ? { error } : {})} required={required}>
        {({ inputId, describedBy }) => (
          <textarea
            ref={ref}
            id={inputId}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            required={required}
            rows={3}
            className={cn(controlClasses(Boolean(error)), textAreaClasses, 'resize-y', className)}
            {...rest}
          />
        )}
      </FieldShell>
    )
  },
)
