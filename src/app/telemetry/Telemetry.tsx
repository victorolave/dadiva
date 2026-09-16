import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { redactUrl } from './redactUrl'

/**
 * Vercel Web Analytics (visitas) y Speed Insights (Web Vitals).
 *
 * Ambos siguen solos la navegación del History API, así que no hace falta
 * engancharlos al router. Lo que sí hace falta es pasar cada evento por
 * `redactUrl`: sin eso, cada código de invitación compartido terminaría
 * listado en el panel de Vercel.
 *
 * Los datos solo llegan al panel desde un deploy en Vercel, no desde `pnpm dev`.
 */
export const Telemetry = () => (
  <>
    <Analytics beforeSend={redactEvent} />
    <SpeedInsights beforeSend={redactEvent} />
  </>
)

/**
 * Si la URL no se puede interpretar, el evento se descarta: es preferible
 * perder una visita que enviarla sin limpiar.
 */
function redactEvent<T extends { url: string }>(event: T): T | null {
  try {
    return { ...event, url: redactUrl(event.url) }
  } catch {
    return null
  }
}
