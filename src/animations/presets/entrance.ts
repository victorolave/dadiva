import { gsap, DURATION, EASE, prefersReducedMotion } from '../gsapSetup'

export interface EntranceOptions {
  readonly delay?: number
  readonly stagger?: number
  readonly distance?: number
  readonly from?: 'bottom' | 'top' | 'left' | 'right'
}

const axisFor = (from: NonNullable<EntranceOptions['from']>, distance: number) => {
  switch (from) {
    case 'top':
      return { y: -distance }
    case 'left':
      return { x: -distance }
    case 'right':
      return { x: distance }
    case 'bottom':
    default:
      return { y: distance }
  }
}

/**
 * Entrada escalonada. Es el gesto base de toda la app: los elementos no
 * aparecen de golpe, se acomodan en la hoja uno detrás de otro.
 */
export const animateEntrance = (
  targets: gsap.TweenTarget,
  options: EntranceOptions = {},
): gsap.core.Tween => {
  const { delay = 0, stagger = 0.08, distance = 24, from = 'bottom' } = options

  if (prefersReducedMotion()) {
    return gsap.fromTo(
      targets,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: DURATION.instant, delay, stagger: 0 },
    )
  }

  return gsap.fromTo(
    targets,
    { autoAlpha: 0, ...axisFor(from, distance) },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: DURATION.base,
      ease: EASE.paper,
      delay,
      stagger,
      clearProps: 'transform',
    },
  )
}

/**
 * Entrada al hacer scroll. Se dispara una sola vez por elemento; repetirla al
 * subir y bajar es mareante y hace que el contenido se sienta inestable.
 */
export const animateOnScroll = (
  targets: gsap.TweenTarget,
  trigger: Element,
  options: EntranceOptions = {},
): gsap.core.Tween => {
  const { stagger = 0.1, distance = 32 } = options

  if (prefersReducedMotion()) {
    return gsap.set(targets, { autoAlpha: 1 })
  }

  return gsap.fromTo(
    targets,
    { autoAlpha: 0, y: distance },
    {
      autoAlpha: 1,
      y: 0,
      duration: DURATION.base,
      ease: EASE.paper,
      stagger,
      clearProps: 'transform',
      scrollTrigger: {
        trigger,
        start: 'top 82%',
        once: true,
      },
    },
  )
}

/** Micro-feedback: el sello que se presiona al hacer clic. */
export const pressFeedback = (target: Element): gsap.core.Timeline | null => {
  if (prefersReducedMotion()) return null

  return gsap
    .timeline()
    .to(target, { scale: 0.96, duration: 0.09, ease: 'power2.in' })
    .to(target, { scale: 1, duration: 0.3, ease: EASE.settle })
}
