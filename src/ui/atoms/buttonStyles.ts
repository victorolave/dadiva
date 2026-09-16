import { cn } from '../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blush-500 text-ink border-ink hover:bg-blush-300',
  secondary: 'bg-paper text-ink border-ink hover:bg-lilac-100',
  ghost: 'bg-transparent text-ink border-transparent shadow-none hover:bg-paper-deep',
  danger: 'bg-danger-soft text-danger border-danger hover:bg-danger hover:text-paper',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] gap-2',
  lg: 'h-14 px-7 text-lg gap-2.5',
}

/**
 * Estilos compartidos entre `<button>` y `<a>`.
 *
 * Existen separados porque un botón y un enlace se ven igual pero NO son lo
 * mismo: el enlace navega y el botón ejecuta. Meter un `<Link>` dentro de un
 * `<button>` produce contenido interactivo anidado, que es HTML inválido y
 * confunde a los lectores de pantalla. Cada uno usa su etiqueta correcta y
 * comparte solo la apariencia.
 */
export const buttonStyles = (options: {
  readonly variant?: ButtonVariant | undefined
  readonly size?: ButtonSize | undefined
  readonly fullWidth?: boolean | undefined
  readonly className?: string | undefined
}): string =>
  cn(
    'relative inline-flex items-center justify-center rounded-sticker border-2 font-sans font-medium no-underline',
    'shadow-sticker transition-[transform,box-shadow,background-color] duration-150 ease-out',
    'hover:-translate-x-px hover:-translate-y-px hover:shadow-sticker-lg',
    'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
    'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    'aria-disabled:translate-x-0 aria-disabled:translate-y-0 aria-disabled:shadow-sticker',
    'motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0',
    VARIANTS[options.variant ?? 'primary'],
    SIZES[options.size ?? 'md'],
    options.fullWidth && 'w-full',
    options.className,
  )
