import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '../env'
import type { Database } from './database.types'

export type DadivaClient = SupabaseClient<Database>

let client: DadivaClient | null = null

/**
 * Cliente único de Supabase.
 *
 * Es el ÚNICO punto del código que conoce a Supabase. Los repositorios lo
 * reciben por inyección; ningún componente de React lo importa directamente.
 * Si mañana migramos a otro backend, se reescribe la carpeta infrastructure de
 * cada módulo y el dominio no se entera.
 */
export const getSupabaseClient = (): DadivaClient => {
  if (client) return client

  const env = getEnv()
  client = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  return client
}
