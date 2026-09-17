import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Alert, Button } from '@ui/atoms'
import type { Container } from './container'

const ContainerContext = createContext<Container | null>(null)

export interface ContainerProviderProps {
  readonly children: ReactNode
  /**
   * Contenedor ya construido. Con esto, `ContainerProvider` nunca dispara el
   * `import()` dinámico de abajo: sirve para tests, que arman su propio
   * contenedor con `createContainer(overrides)` (dobles en memoria, sin
   * Supabase) de forma síncrona y no necesitan esperar nada.
   */
  readonly container?: Container
}

/**
 * Programa `callback` para después del primer pintado, sin bloquear la
 * portada. jsdom y Safari no tienen `requestIdleCallback`, de ahí el
 * respaldo con un `setTimeout` corto: alcanza para "después de pintar", que
 * es lo único que importa aquí.
 */
const scheduleIdle = (callback: () => void): number =>
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(callback)
    : window.setTimeout(callback, 200)

const cancelIdle = (handle: number): void => {
  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle)
  } else {
    window.clearTimeout(handle)
  }
}

/**
 * Aviso de que el contenedor no cargó. Fijo en la parte de abajo de la
 * pantalla (no un modal ni nada que tape el contenido) para no estorbar en
 * la portada, pero visible en CUALQUIER ruta — incluidas las protegidas,
 * donde sin esto la persona se queda mirando el esqueleto de
 * `ProtectedRoute` para siempre sin ninguna pista de qué pasó.
 *
 * "Reintentar" recarga la página entera (`window.location.reload()`), no
 * solo el `import()`: es lo único que arregla el caso más común de este
 * error, un hash de chunk viejo porque la pestaña llevaba abierta desde
 * antes de un deploy nuevo en Vercel. Un reintento en memoria seguiría
 * pidiendo el mismo hash viejo, que ya no existe en el servidor.
 */
const ContainerLoadErrorBanner = () => (
  // `pointer-events-none` en la franja de ancho completo: sin esto, los
  // márgenes transparentes a los lados del aviso tapan los enlaces del footer.
  <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
    <Alert
      tone="error"
      title="No pudimos cargar la aplicación"
      className="pointer-events-auto max-w-md shadow-sticker"
    >
      Revisa tu conexión e inténtalo de nuevo.
      <div className="mt-3">
        <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    </Alert>
  </div>
)

/**
 * Contenedor de dependencias, cargado bajo demanda.
 *
 * `./container` importa (de forma estática) el cliente de Supabase y el
 * repositorio + casos de uso de cada módulo: TODO ese peso viajaba en el
 * bundle inicial porque este archivo lo importaba también de forma estática,
 * y este archivo envuelve la app entera desde `App.tsx` — incluida la
 * portada, que según su propio comentario debe pesar poco para quien llega
 * por un enlace de invitación con datos móviles (ver `App.tsx`).
 *
 * La solución es un `import()` dinámico: Vite lo separa en un chunk aparte
 * que NUNCA se referencia desde el grafo estático del entrypoint, así que
 * `dist/index.html` deja de traer `vendor-supabase` en un
 * `modulepreload` para toda visita a "/".
 *
 * Cuándo se dispara ese `import()`:
 * - En "/" (portada): se espera al primer `requestIdleCallback` tras el
 *   montaje, para no competir con el pintado inicial. Igual se dispara sin
 *   que la persona haga nada, así que quien vuelve con sesión ve el header
 *   correcto (nombre, avatar, "Mis grupos") sin tener que interactuar.
 * - En cualquier otra ruta: de inmediato. Perfil, grupos y el flujo de
 *   invitación (`ProtectedRoute`) necesitan saber el estado de sesión ya
 *   mismo, no cuando el navegador esté ocioso.
 * - Si la persona navega fuera de "/" ANTES de que el idle callback
 *   dispare (con `Link`, sin recargar), este efecto se reevalúa por el
 *   cambio de `location.pathname`, cancela el idle callback pendiente y
 *   carga de inmediato. Por eso necesita estar dentro de `<BrowserRouter>`
 *   (ver el orden de proveedores en `App.tsx`).
 *
 * `load` es ESTABLE (no depende de nada que cambie entre renders: los
 * setters de estado y la ref son estables por contrato de React), a
 * propósito. Antes había una bandera `active` cerrada sobre cada corrida del
 * efecto que se ponía en `false` en la limpieza — pero la limpieza corre en
 * CADA cambio de ruta, no solo al desmontar, así que navegar a otra ruta
 * mientras el `import()` seguía en vuelo descartaba su resolución para
 * siempre: `setContainer` nunca llegaba a llamarse, el contenedor se quedaba
 * `null` y `AuthProvider` en 'loading' eternamente. Con `load` estable, la
 * promesa SIEMPRE actualiza el estado sin importar qué pasó con la ruta
 * mientras tanto (y React 18+ ya ignora un `setState` si el componente se
 * desmontó de verdad, así que no hace falta ninguna bandera para ese caso).
 */
export const ContainerProvider = ({ children, container: readyContainer }: ContainerProviderProps) => {
  const [container, setContainer] = useState<Container | null>(readyContainer ?? null)
  const [loadError, setLoadError] = useState(false)
  const location = useLocation()
  const startedRef = useRef(Boolean(readyContainer))

  const load = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setLoadError(false)

    import('./container')
      .then(({ createContainer }) => {
        setContainer(createContainer())
      })
      .catch(() => {
        // Sin conexión, o un chunk con hash viejo porque la pestaña llevaba
        // abierta desde antes de un deploy nuevo: se resetea `startedRef`
        // para que una próxima navegación (o el botón "Reintentar" de
        // abajo, vía recarga completa) pueda volver a intentarlo. No hay
        // reintento automático en bucle: sin un cambio de ruta o una acción
        // de la persona, esto no se vuelve a disparar solo.
        startedRef.current = false
        setLoadError(true)
      })
  }, [])

  useEffect(() => {
    if (startedRef.current) return

    if (location.pathname !== '/') {
      load()
      return
    }

    const idleHandle = scheduleIdle(load)
    return () => cancelIdle(idleHandle)
  }, [location.pathname, load])

  return (
    <ContainerContext.Provider value={container}>
      {children}
      {loadError && <ContainerLoadErrorBanner />}
    </ContainerContext.Provider>
  )
}

/**
 * Contenedor ya cargado. Lanza si se usa antes de tiempo: todo lo que la
 * llama vive detrás de `ProtectedRoute` (que no renderiza sus hijos mientras
 * `AuthProvider` siga en 'loading', y no puede salir de 'loading' sin
 * contenedor) o no depende de datos de sesión, así que llegar aquí con
 * `null` sería un error de programación, no una carrera esperable.
 */
export const useContainer = (): Container => {
  const container = useContext(ContainerContext)

  if (!container) {
    throw new Error('useContainer debe usarse dentro de <ContainerProvider> ya cargado.')
  }

  return container
}

/**
 * Variante que tolera que el contenedor todavía no cargó. Solo la necesita
 * `AuthProvider`, que vive por ENCIMA de `ProtectedRoute` y debe poder
 * renderizar (en estado 'loading') mientras el `import()` de arriba resuelve.
 */
export const useOptionalContainer = (): Container | null => useContext(ContainerContext)
