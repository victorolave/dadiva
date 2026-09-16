import { gsap, DURATION, EASE, prefersReducedMotion } from '../gsapSetup'

/**
 * Coreografía de la baraja de promesas.
 *
 * El ritual importa tanto como el resultado: la persona ve un mazo cerrado,
 * las cartas se abren en abanico, elige una con la mano y esa carta vuela al
 * centro y se voltea. Ese gesto es lo que convierte un INSERT en base de datos
 * en un momento que se siente como recibir algo.
 *
 * Todas las funciones devuelven una Promise que resuelve cuando la animación
 * termina, para que el componente pueda encadenar estados sin setTimeout.
 */

export interface DeckGeometry {
  /** Ángulo total que abarca el abanico, en grados. */
  readonly spreadAngle: number
  /** Radio del arco en píxeles. Menor en móvil. */
  readonly radius: number
}

/**
 * El abanico tiene que caber en la pantalla. En móvil un arco de 300px se sale
 * del viewport y las cartas quedan inalcanzables con el pulgar.
 */
export const geometryForWidth = (width: number): DeckGeometry => {
  if (width < 480) return { spreadAngle: 44, radius: 150 }
  if (width < 900) return { spreadAngle: 56, radius: 230 }
  return { spreadAngle: 64, radius: 310 }
}

/** Posición en reposo de cada carta dentro del mazo cerrado. */
export const stackTransform = (index: number) => ({
  x: index * 0.6,
  y: index * -1.6,
  rotate: (index % 2 === 0 ? 1 : -1) * (index * 0.35),
  scale: 1,
})

/** Posición de cada carta cuando el mazo está abierto en abanico. */
export const fanTransform = (index: number, total: number, geometry: DeckGeometry) => {
  // Con una sola carta el ángulo es 0; evitamos dividir por cero.
  const step = total > 1 ? geometry.spreadAngle / (total - 1) : 0
  const angle = total > 1 ? -geometry.spreadAngle / 2 + step * index : 0
  const radians = (angle * Math.PI) / 180

  return {
    x: Math.sin(radians) * geometry.radius,
    y: (1 - Math.cos(radians)) * geometry.radius * 0.72,
    rotate: angle,
    scale: 1,
  }
}

/** El mazo cerrado respira: una pulsación lenta que invita a tocarlo. */
export const idleDeckPulse = (target: Element): gsap.core.Tween | null => {
  if (prefersReducedMotion()) return null

  return gsap.to(target, {
    y: -6,
    duration: 1.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  })
}

/** Abre el mazo en abanico. */
export const spreadDeck = (
  cards: readonly Element[],
  geometry: DeckGeometry,
): Promise<void> => {
  const total = cards.length

  if (prefersReducedMotion()) {
    cards.forEach((card, index) => {
      gsap.set(card, { ...fanTransform(index, total, geometry), autoAlpha: 1 })
    })
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const timeline = gsap.timeline({ onComplete: () => resolve() })

    timeline.to(cards, {
      // Cada carta viaja a su propio destino del arco.
      x: (index: number) => fanTransform(index, total, geometry).x,
      y: (index: number) => fanTransform(index, total, geometry).y,
      rotate: (index: number) => fanTransform(index, total, geometry).rotate,
      autoAlpha: 1,
      duration: DURATION.slow,
      ease: EASE.glide,
      stagger: { each: 0.045, from: 'center' },
    })
  })
}

/** Levanta ligeramente una carta cuando recibe foco o el puntero encima. */
export const liftCard = (card: Element, lifted: boolean): void => {
  if (prefersReducedMotion()) return

  gsap.to(card, {
    yPercent: lifted ? -9 : 0,
    scale: lifted ? 1.05 : 1,
    duration: DURATION.fast,
    ease: EASE.paper,
    overwrite: 'auto',
  })
}

/**
 * La carta elegida vuela al centro y se voltea; el resto se retira.
 * El volteo usa rotationY sobre un contenedor con perspectiva, y cambiamos de
 * cara exactamente en el cruce de los 90° para que nunca se vea el reverso al
 * revés ni la cara espejada.
 */
export const revealChosenCard = (
  chosen: Element,
  others: readonly Element[],
  onFlipHalfway: () => void,
): Promise<void> => {
  if (prefersReducedMotion()) {
    gsap.set(others, { autoAlpha: 0 })
    onFlipHalfway()
    gsap.set(chosen, { x: 0, y: 0, rotate: 0, rotationY: 0, scale: 1, autoAlpha: 1 })
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const timeline = gsap.timeline({ onComplete: () => resolve() })

    timeline
      .to(others, {
        autoAlpha: 0,
        scale: 0.86,
        y: 28,
        duration: DURATION.fast,
        ease: 'power2.in',
        stagger: { each: 0.02, from: 'edges' },
      })
      .to(
        chosen,
        {
          x: 0,
          y: 0,
          rotate: 0,
          yPercent: 0,
          scale: 1,
          zIndex: 50,
          duration: DURATION.base,
          ease: EASE.glide,
        },
        '<0.1',
      )
      .to(chosen, {
        rotationY: 90,
        duration: DURATION.fast,
        ease: 'power2.in',
        onComplete: onFlipHalfway,
      })
      .fromTo(
        chosen,
        { rotationY: -90 },
        { rotationY: 0, duration: DURATION.base, ease: EASE.settle },
      )
      .to(chosen, { scale: 1.04, duration: 0.2, ease: EASE.joy }, '-=0.15')
      .to(chosen, { scale: 1, duration: 0.35, ease: EASE.paper })
  })
}

/**
 * Reaparición de una promesa ya guardada. No hay ritual de elección porque no
 * hay elección que hacer: la carta simplemente se presenta.
 */
export const presentSavedCard = (card: Element): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    return gsap.set(card, { autoAlpha: 1, scale: 1, rotationY: 0 })
  }

  return gsap.fromTo(
    card,
    { autoAlpha: 0, scale: 0.9, rotationY: -14, y: 18 },
    {
      autoAlpha: 1,
      scale: 1,
      rotationY: 0,
      y: 0,
      duration: DURATION.slow,
      ease: EASE.settle,
    },
  )
}
