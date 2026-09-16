/**
 * Segmentos dinámicos que nunca deben salir hacia la analítica.
 *
 * El código de invitación funciona como una llave: con él cualquiera con
 * sesión entra al grupo. El id del grupo no es secreto, pero agrupar las
 * visitas por plantilla (`/grupos/[id]`) es lo que hace legible el panel.
 * `/grupos/nuevo` es una ruta fija y se deja tal cual.
 */
const DYNAMIC_SEGMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/unirse\/[^/]+/, '/unirse/[codigo]'],
  [/^\/grupos\/(?!nuevo(?:\/|$))[^/]+/, '/grupos/[id]'],
]

/**
 * Limpia una URL antes de enviarla a Vercel Analytics o Speed Insights.
 *
 * Además de los segmentos dinámicos, descarta el hash y toda la query salvo
 * los `utm_*`: el retorno de Supabase trae `?code=` (o tokens en el hash) en
 * `/entrar/confirmar`, y eso jamás debe quedar en un panel de terceros.
 */
export const redactUrl = (rawUrl: string): string => {
  const url = new URL(rawUrl)

  url.pathname = DYNAMIC_SEGMENTS.reduce(
    (path, [pattern, replacement]) => path.replace(pattern, replacement),
    url.pathname,
  )

  for (const key of [...url.searchParams.keys()]) {
    if (!key.startsWith('utm_')) url.searchParams.delete(key)
  }
  url.hash = ''

  return url.toString()
}
