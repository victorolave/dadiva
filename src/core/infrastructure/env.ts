import { z } from 'zod'

/**
 * Configuración de entorno validada al arrancar.
 *
 * Fallar en el arranque con un mensaje claro es infinitamente mejor que fallar
 * en runtime con "Cannot read properties of undefined" cuando alguien ya está
 * intentando crear su grupo.
 */
const envSchema = z
  .object({
    VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL debe ser una URL válida'),
    // Supabase deprecia `anon` y `service_role` a finales de 2026 en favor de
    // `sb_publishable_...`. Aceptamos ambas para no romper proyectos que aún no
    // migraron, pero la publishable es la que se debe usar en proyectos nuevos.
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
    VITE_SUPABASE_ANON_KEY: z.string().min(20).optional(),
    VITE_APP_URL: z.string().url().optional(),
  })
  .refine(
    (env) =>
      Boolean(env.VITE_SUPABASE_PUBLISHABLE_KEY) || Boolean(env.VITE_SUPABASE_ANON_KEY),
    {
      message:
        'Falta la llave pública de Supabase. Define VITE_SUPABASE_PUBLISHABLE_KEY ' +
        '(Dashboard → Settings → API Keys, la que empieza con sb_publishable_).',
      path: ['VITE_SUPABASE_PUBLISHABLE_KEY'],
    },
  )
  .refine(
    (env) =>
      !(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? '').startsWith(
        'sb_secret_',
      ),
    {
      // Esto no es pedantería: todo lo que lleva prefijo VITE_ viaja dentro del
      // bundle que descarga el navegador. Una secret key ahí es una filtración
      // total, y es un error fácil de cometer copiando del dashboard.
      message:
        'Esa es una SECRET key. Nunca puede ir en el front: termina publicada en ' +
        'el bundle. Usa la publishable (sb_publishable_...).',
      path: ['VITE_SUPABASE_PUBLISHABLE_KEY'],
    },
  )

export type Env = z.infer<typeof envSchema>

/** La llave pública efectiva, prefiriendo la publishable sobre la legacy. */
export const getSupabaseKey = (): string => {
  const env = getEnv()
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY
  if (!key) throw new Error('No hay llave pública de Supabase configurada')
  return key
}

let cached: Env | null = null

export const getEnv = (): Env => {
  if (cached) return cached

  const parsed = envSchema.safeParse(import.meta.env)

  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => `  · ${issue.message}`).join('\n')
    throw new Error(
      `Falta configuración de entorno.\n${detail}\n\n` +
        'Copia .env.example a .env y completa los valores de tu proyecto de Supabase.',
    )
  }

  cached = parsed.data
  return cached
}

/** URL base de la app, usada para construir el destino del magic link. */
export const getAppUrl = (): string => getEnv().VITE_APP_URL ?? window.location.origin
