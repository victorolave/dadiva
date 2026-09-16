/**
 * Recuerda a dónde iba la persona antes de mandarla a entrar.
 *
 * El `state` del router NO sirve para esto: entrar con Google es una
 * navegación completa del navegador (ida a Google, vuelta a
 * /entrar/confirmar) y el estado en memoria se pierde por el camino. Así se
 * perdía el enlace de invitación: la persona entraba y terminaba en /grupos
 * sin rastro del código.
 *
 * Usamos sessionStorage porque sobrevive a la redirección en la misma pestaña
 * y muere al cerrarla, que es justo la vida útil de una intención de entrar.
 */
const STORAGE_KEY = 'dadiva:return-to'

/**
 * Solo aceptamos rutas internas. Un valor como `//evil.com` o `https://…`
 * convertiría este mecanismo en una redirección abierta.
 */
export const isSafeReturnPath = (path: unknown): path is string =>
  typeof path === 'string' &&
  path.startsWith('/') &&
  !path.startsWith('//') &&
  !path.startsWith('/\\') &&
  !path.startsWith('/entrar')

export const rememberReturnTo = (path: unknown): void => {
  try {
    if (isSafeReturnPath(path)) window.sessionStorage.setItem(STORAGE_KEY, path)
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Almacenamiento bloqueado (modo privado estricto): se entra igual, solo
    // que sin volver al destino original.
  }
}

/**
 * Lee el destino guardado sin borrarlo.
 *
 * Leer y borrar van separados a propósito: en StrictMode los efectos corren
 * dos veces, y un "leer y borrar" en un efecto haría que la segunda pasada
 * encontrara el almacenamiento vacío y mandara a la persona a /grupos.
 */
export const readReturnTo = (): string | null => {
  try {
    const path = window.sessionStorage.getItem(STORAGE_KEY)
    return isSafeReturnPath(path) ? path : null
  } catch {
    return null
  }
}

export const clearReturnTo = (): void => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
}
