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
      <label htmlFor={inputId} className="label-mono text-ink-soft">
        {label}
        {required && (
          <span className="ml-1 text-blush-700" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({ inputId, describedBy: describedBy || undefined })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

const controlClasses = (hasError: boolean) =>
  cn(
    'w-full rounded-sticker border-2 bg-paper px-3.5 py-2.5 font-sans text-base text-ink',
    'placeholder:text-ink-faint',
    'transition-shadow duration-150',
    hasError
      ? 'border-danger shadow-[3px_3px_0_0_var(--color-danger)]'
      : 'border-ink shadow-sticker focus:shadow-sticker-lg',
  )

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
            className={cn(controlClasses(Boolean(error)), 'resize-y', className)}
            {...rest}
          />
        )}
      </FieldShell>
    )
  },
)
