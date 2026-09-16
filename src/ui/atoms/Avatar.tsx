import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'
export type AvatarTint = 'paper' | 'blush' | 'lilac' | 'apricot'

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Emoji (o ícono) que va dentro del círculo. */
  readonly emoji: ReactNode
  /** Nombre accesible. Omítelo cuando el avatar es decorativo (el nombre ya
   *  se muestra al lado como texto): entonces se oculta a lectores de pantalla. */
  readonly label?: string | undefined
  readonly size?: AvatarSize | undefined
  /** Color de fondo (-300). `paper` es el neutro de siempre; los demás
   *  distinguen "soy yo" o dan contexto (p. ej. blush en el propio perfil). */
  readonly tint?: AvatarTint | undefined
}

const SIZES: Record<AvatarSize, string> = {
  sm: 'size-8 text-base',
  md: 'size-10 text-lg',
  lg: 'size-14 text-2xl',
  // 72px: la vista previa en vivo del perfil (ProfilePage) necesita un
  // tamaño más protagonista que el resto de usos, siempre en lista o nav.
  xl: 'size-18 text-4xl',
}

const TINTS: Record<AvatarTint, string> = {
  paper: 'bg-paper',
  blush: 'bg-blush-300',
  lilac: 'bg-lilac-300',
  apricot: 'bg-apricot-300',
}

/**
 * Círculo con borde de tinta que envuelve un emoji.
 *
 * Se repetía a mano —mismas clases, mismo borde— en la barra de navegación y
 * en la lista de miembros. Centralizarlo evita que diverjan sin querer la
 * próxima vez que alguien lo toque en un solo lugar.
 */
export const Avatar = ({ emoji, label, size = 'md', tint = 'paper', className, ...rest }: AvatarProps) => (
  <span
    // Un aria-label sobre un <span> sin rol no se anuncia: el rol img es lo
    // que le da nombre accesible. Sin label, el emoji sería ruido leído en voz.
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    className={cn(
      'grid shrink-0 place-items-center rounded-full border-2 border-ink',
      SIZES[size],
      TINTS[tint],
      className,
    )}
    {...rest}
  >
    {emoji}
  </span>
)
