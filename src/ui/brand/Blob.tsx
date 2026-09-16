import type { SVGAttributes } from 'react'

export type BlobShape = 'a' | 'b' | 'c'
export type BlobTone = 'blush' | 'lilac' | 'sage' | 'apricot' | 'sky'
export type BlobShade = 300 | 500

export interface BlobProps extends Omit<SVGAttributes<SVGSVGElement>, 'viewBox' | 'fill'> {
  readonly shape: BlobShape
  readonly tone: BlobTone
  /** -300 sobre papel o sobre una tarjeta -100; -500 sobre una tarjeta -300. */
  readonly shade?: BlobShade | undefined
}

const PATHS: Record<BlobShape, string> = {
  a: 'M152.4 38.6c22.3 19.8 36.9 50.8 33.1 79.4-3.8 28.6-26 54.8-53.7 66.2-27.7 11.4-60.9 8-86.3-7.9C20.1 160.4 2.5 131.4 5.1 103.3 7.7 75.2 30.5 48 57.4 30.6 84.3 13.2 130.1 18.8 152.4 38.6Z',
  b: 'M170 20c26 30 32 82 8 118s-78 58-122 50S-6 142 4 100 40 30 84 12s60-22 86 8Z',
  c: 'M146 26c30 16 50 50 46 84s-32 70-68 78-78-8-100-38S2 80 22 52 64 12 96 10s20 0 50 16Z',
}

// Tailwind escanea el código fuente en busca de clases COMPLETAS: una clase
// armada con interpolación (`text-${tone}-${shade}`) nunca se generaría
// porque el compilador no ejecuta el código, solo lo lee como texto. Por
// eso el color se resuelve contra esta tabla de literales, no concatenando.
const TONE_CLASSES: Record<BlobTone, Record<BlobShade, string>> = {
  blush: { 300: 'text-blush-300', 500: 'text-blush-500' },
  lilac: { 300: 'text-lilac-300', 500: 'text-lilac-500' },
  sage: { 300: 'text-sage-300', 500: 'text-sage-500' },
  apricot: { 300: 'text-apricot-300', 500: 'text-apricot-500' },
  sky: { 300: 'text-sky-300', 500: 'text-sky-500' },
}

/**
 * Mancha orgánica plana, sin gradiente ni blur, tomada del tablero de
 * marca. Es puro ornamento: `aria-hidden` + `focusable="false"` para que
 * nunca capture foco ni se anuncie, y `pointer-events-none` para que nunca
 * robe un clic pensado para el contenido de encima.
 *
 * El color se resuelve con `currentColor` + una clase de texto, no con un
 * `fill` fijo, para poder reusar el mismo SVG con cualquier tono/escalón
 * del sistema sin duplicar el path.
 */
export const Blob = ({ shape, tone, shade = 300, className, ...rest }: BlobProps) => (
  <svg
    viewBox="0 0 200 200"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={['pointer-events-none', TONE_CLASSES[tone][shade], className].filter(Boolean).join(' ')}
    {...rest}
  >
    <path d={PATHS[shape]} />
  </svg>
)
