import { Link, type LinkProps } from 'react-router-dom'
import type { ReactNode } from 'react'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'

export interface LinkButtonProps extends LinkProps {
  readonly variant?: ButtonVariant | undefined
  readonly size?: ButtonSize | undefined
  readonly fullWidth?: boolean | undefined
  readonly iconStart?: ReactNode | undefined
  readonly iconEnd?: ReactNode | undefined
}

/**
 * Se ve como un botón, pero es un enlace de verdad.
 *
 * Eso significa que funciona el clic con rueda del ratón, el "abrir en pestaña
 * nueva" y el menú contextual — cosas que un `<button>` con onClick={navigate}
 * rompe silenciosamente.
 */
export const LinkButton = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconStart,
  iconEnd,
  className,
  children,
  ...rest
}: LinkButtonProps) => (
  <Link className={buttonStyles({ variant, size, fullWidth, className })} {...rest}>
    {iconStart}
    <span>{children}</span>
    {iconEnd}
  </Link>
)
