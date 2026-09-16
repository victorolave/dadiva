import { useRef } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Heart, LogOut } from 'lucide-react'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { Avatar, Button } from '@ui/atoms'
import { BRAND_TAGLINE, BrandLogo, Isotipo } from '@ui/brand'
import { cn } from '@ui/utils/cn'
import { RouteAnnouncer } from '../seo/RouteAnnouncer'

/**
 * Esqueleto de la app.
 *
 * El enlace de salto al contenido es lo primero del DOM: quien navega con
 * teclado no debería tener que atravesar la cabecera entera en cada página
 * para llegar a lo que vino a hacer.
 */
export const AppShell = () => {
  const { user, signOut } = useAuth()
  const mainRef = useRef<HTMLElement>(null)

  return (
    // `overflow-x-clip`, no `overflow-hidden`: con `hidden` el contenedor
    // deja de ser el "viewport de scroll" del documento y el header
    // `sticky` de abajo se rompe. `clip` recorta sin tocar el scroll.
    <div className="flex min-h-svh flex-col overflow-x-clip">
      <RouteAnnouncer mainRef={mainRef} />

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

      {/* `tabIndex={-1}`: no entra al orden de tabulación con Tab, solo
          recibe foco por programa al navegar (ver RouteAnnouncer).
          `focus:outline-none` apaga SOLO aquí el contorno de la regla global
          de `:focus-visible` (theme.css) — main no es un control real, así
          que su borde de foco no aporta nada y sí llama la atención de más. */}
      <main
        id="contenido"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-wide flex-1 px-page py-10 focus:outline-none sm:py-16"
      >
        <Outlet />
      </main>

      <footer className="border-t-2 border-ink bg-paper-deep">
        <div className="mx-auto w-full max-w-wide px-page">
          <div className="grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-12">
            <div className="flex flex-col gap-3">
              <BrandLogo variant="horizontal" />
              {/* Tagline pendiente de aprobación de marca: src/ui/brand/tagline.ts. */}
              <p className="max-w-xs text-sm font-bold">{BRAND_TAGLINE}</p>
            </div>

            <blockquote className="max-w-md sm:text-right">
              <p className="font-display text-h3 text-ink">
                «Toda buena dádiva y todo don perfecto desciende de lo alto.»
              </p>
              <cite className="eyebrow mt-2 block not-italic">Santiago 1:17</cite>
            </blockquote>
          </div>

          <div className="flex flex-col gap-4 border-t-2 border-dashed border-ink py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex flex-wrap items-center gap-1.5 text-ink-soft">
              Hecho con
              <Heart className="size-4 fill-blush-500 text-ink" aria-hidden="true" />
              <span className="sr-only">cariño</span>
              por
              {/* Pestaña nueva: es un sitio aparte, y quien está en medio de
                  un sorteo no debería perder la página del grupo. */}
              {/* `inline-block py-1 -my-1`: agranda el área táctil vertical
                  (WCAG 2.5.8) sin correr el texto de sitio, el `-my-1`
                  compensa el `py-1` para que el layout no se mueva. */}
              <a
                href="https://victorolave.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="link inline-block -my-1 py-1 font-bold text-ink"
              >
                Victor Olave
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </p>

            <div className="flex items-center gap-4">
              <nav aria-label="Legal" className="flex items-center gap-4">
                <Link to="/privacidad" className="link inline-block -my-1 py-1 font-bold">
                  Privacidad
                </Link>
                <Link to="/terminos" className="link inline-block -my-1 py-1 font-bold">
                  Términos
                </Link>
              </nav>
              <span className="text-ink-soft">© {new Date().getFullYear()} Dádiva</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
