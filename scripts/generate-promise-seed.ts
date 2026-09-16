/**
 * Genera la migración de semilla del catálogo de promesas desde TypeScript.
 *
 * El catálogo canónico vive en `promiseCatalog.ts` porque ahí está tipado,
 * probado y validado (unicidad de ids, longitudes, contraste de temas). Tener
 * además una lista de INSERTs escrita a mano sería una segunda fuente de
 * verdad que se desincroniza en cuanto alguien toque una y olvide la otra.
 *
 * Uso: npx tsx scripts/generate-promise-seed.ts
 */
import { writeFileSync } from 'node:fs'
import { PROMISE_CATALOG } from '../src/modules/promises/infrastructure/data/promiseCatalog'
import { PROMISE_THEMES } from '../src/modules/promises/domain/value-objects/PromiseTheme'

/** Escapa comillas simples para literales de Postgres. */
const sqlString = (value: string): string => `'${value.replace(/'/g, "''")}'`

const OUTPUT = 'supabase/migrations/0006_seed_promise_catalog.sql'

// Falla ruidosamente si algún tema no existe: mejor romper la generación que
// desplegar tarjetas que caen al tema por defecto sin que nadie lo note.
const invalid = PROMISE_CATALOG.filter((seed) => !(seed.themeKey in PROMISE_THEMES))
if (invalid.length > 0) {
  throw new Error(
    `Temas inexistentes en PROMISE_THEMES: ${invalid.map((s) => `${s.id}→${s.themeKey}`).join(', ')}`,
  )
}

const rows = PROMISE_CATALOG.map(
  (seed) =>
    `  (${sqlString(seed.reference)}, ${sqlString(seed.text)}, ${sqlString(seed.version)}, ${sqlString(seed.themeKey)})`,
).join(',\n')

const sql = `-- =============================================================================
-- Dádiva — 0006: catálogo completo de tarjetas de promesa
--
-- ARCHIVO GENERADO. No editar a mano.
-- Fuente: src/modules/promises/infrastructure/data/promiseCatalog.ts
-- Regenerar con: npx tsx scripts/generate-promise-seed.ts
--
-- ${PROMISE_CATALOG.length} versículos · ${Object.keys(PROMISE_THEMES).length} variantes visuales
--
-- El ON CONFLICT hace UPDATE y no DO NOTHING a propósito: la migración 0004
-- sembró 3 filas de ejemplo con theme_key inválidos ('gift', 'hope',
-- 'friendship') que no existen entre las variantes visuales. Al actualizar en
-- vez de ignorar, esas filas quedan corregidas en lugar de renderizarse todas
-- con el tema por defecto.
-- =============================================================================

insert into public.promise_cards (reference, text, version, theme_key)
values
${rows}
on conflict (reference, version) do update
  set text      = excluded.text,
      theme_key = excluded.theme_key;
`

writeFileSync(OUTPUT, sql, 'utf8')
console.log(`✓ ${OUTPUT} — ${PROMISE_CATALOG.length} versículos`)
