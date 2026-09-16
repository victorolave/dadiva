import { Link, NavLink, Outlet } from 'react-router-dom'
import { Gift, LogOut } from 'lucide-react'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Button } from '@ui/atoms'
import { cn } from '@ui/utils/cn'

/**
 * Esqueleto de la app.
 *
 * El enlace de salto al contenido es lo primero del DOM: quien navega con
 * teclado no debería tener que atravesar la cabecera entera en cada página
 * para llegar a lo que vino a hacer.
 */
export const AppShell = () => {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#contenido"
        className={cn(
          'sr-only rounded-sticker border-2 border-ink bg-blush-300 px-4 py-2 font-medium',
          'focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50',
        )}
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/92 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to={user ? '/grupos' : '/'}
            className="flex items-center gap-2 font-display text-2xl leading-none"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full border-2 border-ink bg-blush-500"
            >
              <Gift className="size-4" />
            </span>
            Dádiva
          </Link>

          {user && (
            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
              <NavLink
                to="/grupos"
                className={({ isActive }) =>
                  cn(
                    'label-mono rounded-pill px-3 py-2 transition-colors',
                    isActive ? 'bg-lilac-300 text-ink' : 'text-ink-soft hover:bg-paper-deep',
                  )
                }
              >
                Mis grupos
              </NavLink>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                iconStart={<LogOut className="size-4" aria-hidden="true" />}
              >
                <span className="hidden sm:inline">Salir</span>
                <span className="sr-only sm:hidden">Cerrar sesión</span>
              </Button>
            </nav>
          )}
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t-2 border-ink bg-paper-deep">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-center">
          <p className="font-script text-xl text-ink-soft">
            «Toda buena dádiva y todo don perfecto desciende de lo alto»
          </p>
          <p className="label-mono text-ink-faint">Santiago 1:17</p>

          <nav aria-label="Legal" className="mt-3 flex justify-center gap-4">
            <Link to="/privacidad" className="label-mono text-ink-faint underline">
              Privacidad
            </Link>
            <Link to="/terminos" className="label-mono text-ink-faint underline">
              Términos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
