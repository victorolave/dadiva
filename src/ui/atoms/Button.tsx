import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'
import { cn } from '../utils/cn'

export type { ButtonSize, ButtonVariant }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant | undefined
  readonly size?: ButtonSize | undefined
  readonly isLoading?: boolean | undefined
  readonly iconStart?: ReactNode | undefined
  readonly iconEnd?: ReactNode | undefined
  readonly fullWidth?: boolean | undefined
}

/**
 * Botón con estética de calcomanía: borde de tinta y sombra sólida que se
 * "hunde" al presionar.
 *
 * Detalle de accesibilidad: durante la carga no usamos `disabled`, sino
 * `aria-disabled` + bloqueo del clic. Un botón `disabled` pierde el foco del
 * teclado, así que quien navega con tab queda desorientado justo cuando la
 * interfaz está ocupada. Con aria-disabled el foco se queda donde estaba.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    iconStart,
    iconEnd,
    fullWidth = false,
    className,
    children,
    onClick,
    type = 'button',
    ...rest
  },
  ref,
) {
  const blocked = isLoading || rest['aria-disabled'] === true

  return (
    <button
      ref={ref}
      type={type}
      aria-disabled={blocked || undefined}
      aria-busy={isLoading || undefined}
      onClick={(event) => {
        if (blocked) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...rest}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        iconStart
      )}
      <span className={cn(isLoading && 'opacity-80')}>{children}</span>
      {!isLoading && iconEnd}
    </button>
  )
})
