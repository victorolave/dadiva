import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Valores por defecto del proyecto. Definirlos una vez evita que cada
 * componente invente su propia duración y la app se sienta descoordinada.
 */
gsap.defaults({
  ease: 'power3.out',
  duration: 0.6,
})

export const DURATION = {
  instant: 0.18,
  fast: 0.32,
  base: 0.6,
  slow: 0.9,
  deliberate: 1.4,
} as const

export const EASE = {
  /** Entrada suave, muy natural. El caballo de batalla. */
  paper: 'power3.out',
  /** Para elementos que "caen" en su lugar. */
  settle: 'back.out(1.4)',
  /** Movimiento de carta que se desliza. */
  glide: 'expo.out',
  /** Elástico contenido, para celebraciones. */
  joy: 'elastic.out(1, 0.6)',
} as const

/**
 * Única fuente de verdad sobre si animamos o no.
 *
 * `prefers-reduced-motion` no es una sugerencia estética: hay personas con
 * trastornos vestibulares a las que el movimiento les provoca náuseas y mareo.
 * Cuando está activo NO eliminamos el feedback, lo convertimos en cambios de
 * opacidad instantáneos: la interfaz sigue comunicando, sin desplazamiento.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export { gsap, ScrollTrigger, useGSAP }
