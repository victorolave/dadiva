import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Une clases resolviendo conflictos de Tailwind.
 * Sin twMerge, `cn('p-2', 'p-4')` deja ambas y gana la que esté después en el
 * CSS generado, no la que pasaste después. Con twMerge gana la última, que es
 * lo que cualquiera espera al sobreescribir estilos desde una prop.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))
