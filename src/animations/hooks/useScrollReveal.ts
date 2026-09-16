import { useRef } from 'react'
import { useGSAP } from '../gsapSetup'
import { animateOnScroll, type EntranceOptions } from '../presets/entrance'

/**
 * Revela por scroll los hijos marcados con `data-reveal`.
 * Cada grupo se dispara una sola vez cuando entra al viewport.
 */
export const useScrollReveal = <T extends HTMLElement = HTMLElement>(
  options: EntranceOptions = {},
) => {
  const container = useRef<T>(null)

  useGSAP(
    () => {
      const root = container.current
      if (!root) return

      const groups = root.querySelectorAll('[data-reveal-group]')
      const scopes: Element[] = groups.length > 0 ? Array.from(groups) : [root]

      scopes.forEach((scope) => {
        const targets = scope.querySelectorAll('[data-reveal]')
        if (targets.length === 0) return
        animateOnScroll(targets, scope, options)
      })
    },
    { scope: container },
  )

  return container
}
