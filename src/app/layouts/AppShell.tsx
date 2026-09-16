import { Link, NavLink, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Avatar, Button } from '@ui/atoms'
import { BRAND_TAGLINE, BrandLogo, Isotipo } from '@ui/brand'
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
    // `overflow-x-clip`, no `overflow-hidden`: con `hidden` el contenedor
    // deja de ser el "viewport de scroll" del documento y el header
    // `sticky` de abajo se rompe. `clip` recorta sin tocar el scroll.
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <a
        href="#contenido"
        className={cn(
          'sr-only rounded-control border-2 border-ink bg-blush-300 px-4 py-2 font-bold',
          'focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50',
        )}
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex w-full max-w-wide items-center justify-between gap-3 px-page py-2.5">
          {/* `aria-label` fija el nombre accesible del enlace: sin sesión el
              wordmark ya dice "Dádiva", pero con sesión en móvil solo se ve
              el isotipo y necesita su propio anuncio. */}
          <Link to={user ? '/grupos' : '/'} aria-label="Dádiva, inicio" className="shrink-0">
            {user ? (
              <>
                {/* < 640px: el horizontal a 180px + nav no cabe con holgura
                    en 360px, y bajarlo de 180px rompe el mínimo de marca. */}
                <Isotipo size={36} className="sm:hidden" />
                <BrandLogo variant="horizontal" className="hidden sm:block" />
              </>
            ) : (
              <BrandLogo variant="horizontal" />
            )}
          </Link>

          {user && (
            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
              <NavLink
                to="/grupos"
                className={({ isActive }) =>
                  cn(
                    'rounded-pill border-2 px-3.5 py-1.5 text-sm font-bold transition-colors duration-120',
                    isActive
                      ? 'border-ink bg-lilac-300 text-ink'
                      : 'border-transparent text-ink-soft hover:bg-paper-deep',
                  )
                }
              >
                Mis grupos
              </NavLink>

              <Link to="/perfil" aria-label="Tu perfil" className="rounded-full">
                <Avatar emoji={user.avatarEmoji} size="sm" tint="blush" />
              </Link>

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

      <main id="contenido" className="mx-auto w-full max-w-wide flex-1 px-page py-10 sm:py-16">
        <Outlet />
      </main>

      <footer className="border-t-2 border-ink bg-paper-deep">
        <div className="mx-auto grid w-full max-w-wide gap-6 px-page py-10 sm:grid-cols-[auto_1fr] sm:items-center">
          <div>
            <BrandLogo variant="horizontal" />
            {/* Tagline pendiente de aprobación de marca: src/ui/brand/tagline.ts. */}
            <p className="mt-2 text-sm font-bold">{BRAND_TAGLINE}</p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end sm:text-right">
            <div>
              <p className="font-display text-h3 text-ink">
                «Toda buena dádiva y todo don perfecto desciende de lo alto.»
              </p>
              <p className="eyebrow mt-1">Santiago 1:17</p>
            </div>

            <nav aria-label="Legal" className="flex gap-4">
              <Link to="/privacidad" className="link text-sm font-bold">
                Privacidad
              </Link>
              <Link to="/terminos" className="link text-sm font-bold">
                Términos
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
