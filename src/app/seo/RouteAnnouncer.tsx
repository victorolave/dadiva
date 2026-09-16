import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { VisuallyHidden } from '@ui/atoms'
import { subscribeToPageTitle } from './pageAnnouncer'

export interface RouteAnnouncerProps {
  readonly mainRef: RefObject<HTMLElement | null>
}

/**
 * Foco y anuncio de navegación entre rutas (WCAG 2.4.3 y 4.1.3).
 *
 * Antes de esto, cambiar de ruta dejaba el foco en `<body>` sin ningún aviso:
 * quien navega con teclado tenía que recorrer la cabecera entera de nuevo, y
 * quien usa lector de pantalla no se enteraba de que la página cambió.
 *
 * El truco de comparar contra el pathname anterior (en vez de un simple flag
 * "es el primer render") es lo que sobrevive a StrictMode: en desarrollo
 * React invoca el efecto de montaje dos veces. Con un flag booleano la
 * segunda invocación lo vería ya en `false` y dispararía un foco/anuncio
 * fantasma para la MISMA ruta. Comparando pathname contra pathname, esa
 * segunda pasada ve que no cambió nada y no hace nada.
 */
export const RouteAnnouncer = ({ mainRef }: RouteAnnouncerProps) => {
  const location = useLocation()
  const [announcement, setAnnouncement] = useState('')
  const previousPathnameRef = useRef<string | null>(null)
  const hasNavigatedRef = useRef(false)

  // `useLayoutEffect`, no `useEffect`: los efectos pasivos corren en orden de
  // árbol, así que si este componente quedara DESPUÉS del `<main>`, una
  // página ya cargada publicaría su título antes de que se marque la
  // navegación y el primer cambio de ruta no se anunciaría. Todos los efectos
  // de layout de un commit corren antes que cualquier efecto pasivo, así que
  // esto no depende de dónde se monte el anunciador.
  useLayoutEffect(() => {
    const previousPathname = previousPathnameRef.current
    previousPathnameRef.current = location.pathname

    // Sin cambio real: primer montaje, o segunda pasada de StrictMode. Un
    // cambio de solo query/hash ni siquiera dispara este efecto, porque no
    // está en las dependencias.
    if (previousPathname === null || previousPathname === location.pathname) return

    hasNavigatedRef.current = true
    window.scrollTo(0, 0)
    mainRef.current?.focus()
  }, [location.pathname, mainRef])

  useEffect(
    () =>
      subscribeToPageTitle((title) => {
        // Antes de la primera navegación real, el título que publica la
        // página inicial es ruido: nadie navegó, no hay nada que anunciar.
        if (hasNavigatedRef.current) setAnnouncement(title)
      }),
    [],
  )

  return (
    <VisuallyHidden role="status" aria-live="polite">
      {announcement}
    </VisuallyHidden>
  )
}
