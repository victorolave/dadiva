import type { ReactNode } from 'react'
import { getEnv } from '@core/infrastructure/env'

/**
 * Pantalla de bienvenida para quien clona el repositorio sin configurar.
 *
 * Sin esto, `getEnv()` lanza durante el render y el resultado es una pantalla
 * en blanco con un error en la consola. Quien acaba de clonar el proyecto no
 * tiene por qué abrir las herramientas de desarrollo para enterarse de que le
 * falta un archivo: se lo decimos en pantalla y con los pasos exactos.
 */
export const SetupGuard = ({ children }: { readonly children: ReactNode }) => {
  try {
    getEnv()
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)

    return (
      <div className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-5 px-5 py-12">
        <div>
          <p className="label-mono text-ink-faint">Dádiva · configuración</p>
          <h1 className="mt-1 text-display-md">Falta conectar Supabase</h1>
        </div>

        <p className="text-ink-soft">
          La app necesita las credenciales de tu proyecto de Supabase para arrancar.
        </p>

        <ol className="flex flex-col gap-3">
          {[
            'Copia el archivo de ejemplo:',
            'Completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Están en Dashboard → Settings → API Keys; copia la llave que empieza con sb_publishable_.',
            'Reinicia el servidor de desarrollo.',
          ].map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-sticker border-2 border-ink bg-paper p-4"
            >
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-blush-300 text-sm font-semibold"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm">{step}</p>
                {index === 0 && (
                  <code className="mt-1.5 block overflow-x-auto rounded bg-paper-deep px-2 py-1 font-mono text-xs">
                    cp .env.example .env
                  </code>
                )}
              </div>
            </li>
          ))}
        </ol>

        <details className="rounded-sticker border-2 border-ink/20 bg-paper-deep p-4">
          <summary className="cursor-pointer text-sm font-medium">Ver el detalle técnico</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-ink-soft">
            {detail}
          </pre>
        </details>
      </div>
    )
  }

  return <>{children}</>
}
