import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Sticker, VisibilityNote } from '@ui/atoms'
import { Blob } from '@ui/brand'

/**
 * Explica en lenguaje llano por qué el sorteo es secreto de verdad.
 *
 * El respaldo real está en `supabase/migrations/0002_functions.sql`
 * (`draw_group()` nunca devuelve el mapa completo, solo un conteo) y en
 * `0003_rls_policies.sql` (nadie tiene permiso de `SELECT` sobre la
 * asignación de otra persona). `PrivacyPage` es la política completa; esta
 * sección es el resumen que alguien lee antes de decidir si confía en la app.
 */
export const PrivacySection = () => (
  <section aria-labelledby="privacidad-sorteo" className="relative isolate">
    <Blob
      shape="c"
      tone="sky"
      className="absolute top-0 right-0 -z-10 w-48 -translate-y-1/4 translate-x-1/4"
    />

    <Sticker tone="deep" className="mx-auto flex max-w-reading flex-col gap-4 p-8 sm:p-10">
      <div className="text-center">
        <p className="eyebrow flex items-center justify-center gap-1.5">
          <Lock className="size-3.5" aria-hidden="true" />
          Privacidad
        </p>
        <h2 id="privacidad-sorteo" className="mt-2 text-h2">
          Un sorteo de verdad secreto.
        </h2>
      </div>

      <p className="text-base leading-relaxed text-ink-soft">
        No es que la interfaz esconda el resultado: es que nadie tiene permiso para leerlo. La
        base de datos aplica reglas de seguridad por fila que solo dejan ver una asignación a la
        persona que la sacó, ni siquiera a quien organiza el grupo.
      </p>

      <p className="text-base leading-relaxed text-ink-soft">
        El sorteo mismo corre en el servidor, no en tu navegador: nadie puede abrir las
        herramientas de desarrollo y ver la lista completa antes de que te toque.
      </p>

      <VisibilityNote>
        Solo tú puedes ver a quién te tocó regalar. Ni los demás participantes ni quien organiza
        pueden consultarlo.
      </VisibilityNote>

      <Link to="/privacidad" className="link self-center text-sm font-bold">
        Lee la política de privacidad completa
      </Link>
    </Sticker>
  </section>
)
