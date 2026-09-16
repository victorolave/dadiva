import { CalendarClock, Lock, Smartphone } from 'lucide-react'
import { GoogleMark } from '@ui/atoms'
import { useScrollReveal } from '@animations'

/**
 * Franja de datos rápidos, justo bajo el hero.
 *
 * Cada dato es verificable en el código, no una promesa de marketing:
 * "gratis" porque no hay ninguna integración de pagos en el repo, "con
 * Google" porque es el único proveedor que ofrece `SignInPage`, "servidor"
 * porque el sorteo vive en `draw_group()` (Postgres, `SECURITY DEFINER`) y
 * no en el navegador.
 */
const FACTS = [
  {
    icon: GoogleMark,
    text: 'Entras con tu cuenta de Google',
  },
  {
    icon: Lock,
    text: 'El sorteo se hace en el servidor',
  },
  {
    icon: CalendarClock,
    text: 'Fecha, presupuesto y cuenta regresiva',
  },
  {
    icon: Smartphone,
    text: 'Se usa desde el navegador, sin instalar nada',
  },
] as const

export const TrustStrip = () => {
  const listRef = useScrollReveal<HTMLDivElement>()

  return (
    <section aria-labelledby="datos-clave" ref={listRef}>
      <h2 id="datos-clave" className="sr-only">
        Datos clave
      </h2>

      <ul
        data-reveal-group
        className="flex flex-wrap justify-center gap-3 sm:gap-4"
      >
        {FACTS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            data-reveal
            className="flex list-none items-center gap-2 rounded-pill border-2 border-ink bg-paper px-4 py-2 text-sm font-bold text-ink"
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </section>
  )
}
