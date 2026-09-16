import { z } from 'zod'

/**
 * Configuración de entorno validada al arrancar.
 *
 * Fallar en el arranque con un mensaje claro es infinitamente mejor que fallar
 * en runtime con "Cannot read properties of undefined" cuando alguien ya está
 * intentando crear su grupo.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL debe ser una URL válida'),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, 'VITE_SUPABASE_ANON_KEY parece incompleta'),
  VITE_APP_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

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
