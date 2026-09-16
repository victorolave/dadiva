import { cn } from '../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blush-300 text-ink border-ink hover:bg-blush-500 active:bg-blush-500',
  secondary: 'bg-paper text-ink border-ink hover:bg-paper-deep active:bg-paper-deep',
  ghost: 'bg-transparent text-ink border-transparent !shadow-none hover:bg-paper-deep active:translate-0',
  danger: 'bg-danger-soft text-danger border-danger hover:bg-danger-soft-hover',
}

// El hundido se hace con `active:translate-*`, no con `active:shadow-none`
// solo: cada tamaño se hunde exactamente lo que mide SU sombra (2px o 4px)
// para que el botón termine donde estaba su sombra y no "salte".
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 shadow-sticker-sm active:translate-x-0.5 active:translate-y-0.5',
  md: 'h-11 px-5 text-base gap-2 shadow-sticker active:translate-x-1 active:translate-y-1',
  lg: 'h-14 px-7 text-lg gap-2.5 shadow-sticker active:translate-x-1 active:translate-y-1',
}

/**
 * Estilos compartidos entre `<button>` y `<a>`.
 *
 * Existen separados porque un botón y un enlace se ven igual pero NO son lo
 * mismo: el enlace navega y el botón ejecuta. Meter un `<Link>` dentro de un
 * `<button>` produce contenido interactivo anidado, que es HTML inválido y
 * confunde a los lectores de pantalla. Cada uno usa su etiqueta correcta y
 * comparte solo la apariencia.
 *
 * GOTCHA de Tailwind v4 + GSAP: `translate-*` escribe la propiedad CSS
 * `translate` (no `transform`), así que la lista de `transition-[...]` debe
 * incluir `translate` explícito o el hundido del `active:` no anima. Por la
 * misma razón, nunca pongas `data-animate` directo en un `Button`/`LinkButton`
 * (usa un wrapper): GSAP escribe `transform` inline y las dos propiedades se
 * compondrían en vez de pisarse, produciendo un doble desplazamiento.
 */
export const buttonStyles = (options: {
  readonly variant?: ButtonVariant | undefined
  readonly size?: ButtonSize | undefined
  readonly fullWidth?: boolean | undefined
  readonly className?: string | undefined
}): string =>
  cn(
    'relative inline-flex select-none items-center justify-center rounded-control border-2 font-sans font-bold no-underline',
    'transition-[translate,box-shadow,background-color] duration-120 ease-standard',
    // Hundido: el botón baja exactamente lo que medía su sombra y "se pega"
    // al papel. Sin "levantar" en hover — el DS solo oscurece el relleno.
    'active:shadow-none motion-reduce:transition-none',
    // Deshabilitado de verdad (no en carga): opacidad + sin sombra + borde
    // apagado, y el `active:` no debe hundirlo (ya no hay nada que pulsar).
    'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:border-ink-faint disabled:active:translate-0',
    'aria-disabled:not-aria-busy:cursor-not-allowed aria-disabled:not-aria-busy:opacity-45 aria-disabled:not-aria-busy:shadow-none aria-disabled:not-aria-busy:border-ink-faint',
    // Cargando (aria-busy): se ve normal, con su sombra completa, y no se
    // hunde al pulsar — pulsar durante la carga no debe verse "activo".
    'aria-busy:cursor-progress aria-busy:active:translate-0 aria-busy:active:shadow-sticker',
    VARIANTS[options.variant ?? 'primary'],
    SIZES[options.size ?? 'md'],
    options.fullWidth && 'w-full',
    options.className,
  )
