import { gsap, prefersReducedMotion } from '../gsapSetup'

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
