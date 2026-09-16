import { BookOpenText, CalendarClock, Hand, Lock } from 'lucide-react'
import { useScrollReveal } from '@animations'
import { Sticker } from '@ui/atoms'
import { Isotipo } from '@ui/brand'

/**
 * Vitrina de las 4 cosas que hacen a Dádiva distinta de un sorteo cualquiera.
 *
 * Cada mockup de abajo es maquetación fija, con texto ficticio a propósito
 * (igual que `HeroCollage`): la landing no puede importar el módulo de
 * promesas ni el de grupos (ver el comentario en `src/app/App.tsx`), así que
 * ninguno de estos paneles es el componente real ni usa datos reales.
 */
const FEATURES = [
  {
    icon: Lock,
    title: 'Un sorteo de verdad secreto.',
    body: 'Nadie se saca a sí mismo. El sorteo ocurre en el servidor, y ni siquiera quien organiza el grupo puede consultar quién le tocó a quién.',
  },
  {
    icon: Hand,
    title: 'Raspa para descubrir.',
    body: 'Descubres a tu amigo secreto raspando la tarjeta con el dedo, como una lotería de verdad. Si prefieres, también puedes revelarlo con un toque.',
  },
  {
    icon: BookOpenText,
    title: 'Una promesa que se queda.',
    body: 'Eliges una carta de un mazo con más de 60 versículos de la Reina-Valera 1960, en 12 estilos ilustrados distintos. Tu carta queda guardada para siempre.',
  },
  {
    icon: CalendarClock,
    title: 'Fecha, presupuesto y cuenta regresiva.',
    body: 'Define cuándo es el intercambio y hasta cuánto gastar. El grupo entero ve cuántos días faltan, sin tener que preguntar.',
  },
] as const

/** Mockup de la revelación por raspado. Estático, no es `ScratchReveal`. */
const ScratchMockup = () => (
  <div className="relative isolate mx-auto aspect-[4/3] w-full max-w-[14rem] overflow-hidden rounded-tile border-2 border-ink shadow-sticker-sm">
    <div className="absolute inset-0 flex items-center justify-center bg-blush-300 px-3 text-center">
      <p className="eyebrow" style={{ color: 'var(--color-ink)' }}>
        Tu amigo secreto es
        <br />
        <span className="font-display text-base normal-case">Alguien especial ✨</span>
      </p>
    </div>

    {/* Capa "raspada": un recorte en diagonal deja ver una esquina del panel
        de abajo, como si ya se hubiera raspado un poco. Es un `clip-path`
        fijo, no hay canvas ni interacción. */}
    <div
      className="absolute inset-0 flex items-center justify-center bg-lilac-300"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 62%, 38% 100%, 0 88%)' }}
    >
      <Isotipo mono size={32} className="opacity-70" />
    </div>

    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 eyebrow whitespace-nowrap">
      Raspa aquí
    </span>
  </div>
)

/** Mockup de la carta de promesa. Verso citado a mano, no viene del catálogo. */
const PromiseMockup = () => (
  <Sticker
    tone="lilac"
    size="hero"
    className="mx-auto flex aspect-[3/4] w-full max-w-[11rem] flex-col justify-between p-4 text-center"
  >
    <span className="eyebrow">Una promesa para ti</span>
    <p className="font-display text-lg leading-tight text-ink">
      «Todo lo puedo en Cristo que me fortalece.»
    </p>
    <div className="flex flex-col items-center gap-1">
      <span className="h-[3px] w-8 rounded-pill bg-lilac-700" aria-hidden="true" />
      <cite className="not-italic text-xs font-bold tracking-wide text-ink uppercase">
        Filipenses 4:13
      </cite>
    </div>
  </Sticker>
)

/** Mockup del sorteo secreto: nadie ve el mapa completo, ni el organizador. */
const SecretDrawMockup = () => (
  <div className="mx-auto flex aspect-[4/3] w-full max-w-[14rem] flex-col items-center justify-center gap-3 rounded-tile border-2 border-ink bg-apricot-100 p-4">
    <div className="flex -space-x-2" aria-hidden="true">
      {['🎁', '🌷', '✨'].map((emoji, index) => (
        <span
          key={index}
          className="grid size-10 place-items-center rounded-full border-2 border-ink bg-paper text-lg"
        >
          {emoji}
        </span>
      ))}
    </div>
    <p className="eyebrow flex items-center gap-1.5">
      <Lock className="size-3.5" aria-hidden="true" />
      Solo tú ves tu asignación
    </p>
  </div>
)

/** Mockup de fecha, presupuesto y cuenta regresiva ficticios. */
const CountdownMockup = () => (
  <div className="mx-auto flex aspect-[4/3] w-full max-w-[14rem] flex-col items-center justify-center gap-3">
    <Sticker tone="apricot" className="px-6 py-3 text-center">
      <p className="eyebrow">Faltan</p>
      <p className="font-display text-h2 leading-none">12</p>
      <p className="text-xs font-bold">días</p>
    </Sticker>
    <span className="inline-flex items-center gap-1.5 rounded-pill border-2 border-ink bg-paper px-3 py-1 text-xs font-bold">
      Hasta $50.000
    </span>
  </div>
)

const MOCKUPS = [SecretDrawMockup, ScratchMockup, PromiseMockup, CountdownMockup] as const

export const FeatureShowcase = () => {
  const sectionRef = useScrollReveal<HTMLElement>()

  return (
    <section ref={sectionRef} aria-labelledby="funciones" className="flex flex-col gap-8">
      <div className="text-center">
        <p className="eyebrow">Más que un sorteo</p>
        <h2 id="funciones" className="mt-2 text-h2">
          Lo que hace especial a Dádiva.
        </h2>
      </div>

      <ul data-reveal-group className="grid gap-6 sm:grid-cols-2">
        {FEATURES.map((feature, index) => {
          const Mockup = MOCKUPS[index]
          return (
            <Sticker
              key={feature.title}
              as="li"
              className="flex list-none flex-col gap-4 p-6"
              data-reveal
            >
              {/* Escenario de alto fijo: cada mockup mide distinto (la carta
                  de promesa es 3/4, los demás 4/3), y sin esto el ícono y el
                  título de cada tarjeta arrancan a una altura diferente. */}
              <div className="grid h-60 place-items-center">{Mockup && <Mockup />}</div>

              <div>
                <span
                  aria-hidden="true"
                  className="mb-3 grid size-10 place-items-center rounded-full border-2 border-ink bg-paper"
                >
                  <feature.icon className="size-4" />
                </span>
                <h3 className="text-h3">{feature.title}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-ink-soft">{feature.body}</p>
              </div>
            </Sticker>
          )
        })}
      </ul>
    </section>
  )
}
