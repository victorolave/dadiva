import { gsap, DURATION, EASE, prefersReducedMotion } from '../gsapSetup'

/**
 * Revelación del amigo secreto.
 *
 * Es el clímax del producto. El sobre se abre, el papel sale, y ahí está el
 * nombre. Deliberadamente lento: si dura 200ms la persona se pierde el momento.
 */
export const revealAssignment = (
  envelope: Element,
  flap: Element,
  slip: Element,
  name: Element,
): Promise<void> => {
  if (prefersReducedMotion()) {
    gsap.set([slip, name], { autoAlpha: 1, y: 0, scale: 1 })
    gsap.set(flap, { autoAlpha: 0 })
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const timeline = gsap.timeline({ onComplete: () => resolve() })

    timeline
      .to(envelope, { rotate: -2, duration: 0.12, ease: 'power1.inOut', yoyo: true, repeat: 3 })
      .to(flap, {
        rotateX: -172,
        duration: DURATION.base,
        ease: EASE.glide,
        transformOrigin: 'top center',
      })
      .to(flap, { autoAlpha: 0, duration: 0.2 }, '-=0.15')
      // El recorrido va en porcentaje de la propia altura del papel: así el
      // gesto se mantiene proporcionado aunque el nombre ocupe una o dos líneas.
      .fromTo(
        slip,
        { yPercent: 8, autoAlpha: 0, scale: 0.94 },
        { yPercent: -92, autoAlpha: 1, scale: 1, duration: DURATION.deliberate, ease: EASE.settle },
      )
      .fromTo(
        name,
        { autoAlpha: 0, y: 12, letterSpacing: '0.25em' },
        { autoAlpha: 1, y: 0, letterSpacing: '-0.02em', duration: DURATION.slow, ease: EASE.paper },
        '-=0.5',
      )
  })
}

/**
 * Lluvia de confeti en papel. Sin librerías: nodos simples que caen y se
 * limpian solos. Se salta por completo con movimiento reducido.
 */
export const paperConfetti = (container: HTMLElement, count = 40): void => {
  if (prefersReducedMotion()) return

  const colors = ['#efa8c8', '#a8a4e6', '#c3d6a0', '#f4b183', '#a9d2e5']
  const pieces: HTMLElement[] = []

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('i')
    piece.setAttribute('aria-hidden', 'true')
    piece.style.cssText = `position:absolute;top:-12px;left:${Math.random() * 100}%;width:${
      6 + Math.random() * 6
    }px;height:${8 + Math.random() * 10}px;background:${
      colors[i % colors.length]
    };border:1px solid #1b1917;pointer-events:none;will-change:transform;`
    container.appendChild(piece)
    pieces.push(piece)
  }

  gsap.to(pieces, {
    y: () => container.offsetHeight + 40,
    rotate: () => gsap.utils.random(-360, 360),
    x: () => gsap.utils.random(-70, 70),
    duration: () => gsap.utils.random(1.6, 3),
    ease: 'none',
    stagger: { each: 0.025, from: 'random' },
    onComplete: () => {
      pieces.forEach((piece) => piece.remove())
    },
  })
}
