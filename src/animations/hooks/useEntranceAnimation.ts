import { useRef } from 'react'
import { useGSAP } from '../gsapSetup'
import { animateEntrance, type EntranceOptions } from '../presets/entrance'

/**
 * Anima los hijos marcados con `data-animate` dentro del contenedor.
 *
 * El componente solo declara QUÉ se anima (con un atributo en el JSX); el CÓMO
 * vive en la capa de animación. Así un cambio de coreografía no obliga a tocar
 * ni un componente de presentación.
 *
 * `useGSAP` revierte todos los tweens creados en su scope al desmontar, que es
 * la razón por la que existe en vez de un useEffect a mano.
 */
export const useEntranceAnimation = <T extends HTMLElement = HTMLDivElement>(
  options: EntranceOptions = {},
  dependencies: readonly unknown[] = [],
) => {
  const container = useRef<T>(null)

  useGSAP(
    () => {
      const targets = container.current?.querySelectorAll('[data-animate]')
      if (!targets || targets.length === 0) return
      animateEntrance(targets, options)
    },
    { scope: container, dependencies: [...dependencies] },
  )

  return container
}
