/**
 * Puente minúsculo entre el título que publica cada página y el anunciador
 * de navegación de `AppShell`.
 *
 * No es un contexto de React a propósito: las rutas privadas se cargan
 * perezosamente (`lazy` en `App.tsx`) y publican su título en un efecto
 * propio, después de montar. Envolver TODO el árbol de rutas en un
 * `Provider` -incluida `LandingPage`, que no debe importar nada extra por el
 * comentario de bundle inicial en `App.tsx`- solo para pasar un string sería
 * pagar un costo de árbol por algo que un `Set` de suscriptores resuelve sin
 * dependencias.
 */
type Listener = (title: string) => void

const listeners = new Set<Listener>()

export const publishPageTitle = (title: string): void => {
  for (const listener of listeners) listener(title)
}

export const subscribeToPageTitle = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
