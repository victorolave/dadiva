import * as axe from 'axe-core'

/**
 * `vitest-axe` (npm) sigue en pre-release desde enero de 2025, fija
 * `axe-core@^4.4.2` (la actual es 4.13.x, más de un año de reglas de
 * accesibilidad de diferencia) y nunca llegó a una 1.0 estable sobre la
 * familia de Vitest que usa este proyecto (Vitest 5). En vez de arrastrar esa
 * incertidumbre, se usa `axe-core` directamente con un helper propio.
 */

/**
 * jsdom no hace layout ni pintado real: no puede calcular estilos
 * computados de fondo/texto con la fidelidad que `color-contrast` necesita,
 * así que esa regla produce falsos "incompletos" (nunca falla, solo ensucia
 * el resultado) o falsos positivos según el nodo. El contraste de esta app
 * ya se audita aparte calculando la razón real de cada par tinta/fondo
 * contra los tokens del sistema de diseño (ver las reglas de color en
 * src/styles/theme.css), así que aquí se apaga a propósito en vez de dejar
 * que jsdom decida con datos que no tiene.
 */
const AXE_OPTIONS: axe.RunOptions = {
  rules: {
    'color-contrast': { enabled: false },
  },
}

const formatViolation = (violation: axe.Result): string => {
  const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ') || '(sin nodos)'
  return `- [${violation.id}] ${violation.help} — impacto: ${violation.impact ?? 'desconocido'}\n    Elementos: ${targets}`
}

/**
 * Corre axe-core sobre `container` y falla el test con un mensaje legible
 * (id de regla + selector de cada nodo) si encuentra violaciones reales.
 * `color-contrast` está deshabilitada explícitamente, ver comentario arriba.
 */
export const expectNoAxeViolations = async (container: Element): Promise<void> => {
  const results = await axe.run(container, AXE_OPTIONS)

  if (results.violations.length > 0) {
    const details = results.violations.map(formatViolation).join('\n')
    throw new Error(`axe-core encontró ${results.violations.length} violación(es):\n${details}`)
  }
}
