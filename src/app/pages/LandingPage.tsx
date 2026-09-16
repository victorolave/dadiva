import { Gift, Sparkles, Users } from 'lucide-react'
import { useEntranceAnimation, useScrollReveal } from '@animations'
import { Badge, LinkButton, Sticker } from '@ui/atoms'

const STEPS = [
  {
    icon: Users,
    tone: 'blush' as const,
    title: 'Arma tu grupo',
    body: 'Ponle nombre, fecha y presupuesto. Te damos un código para compartir por donde quieras.',
  },
  {
    icon: Gift,
    tone: 'lilac' as const,
    title: 'Sortea en secreto',
    body: 'Nadie se saca a sí mismo. Ni siquiera quien organiza puede ver a quién le tocó cada persona.',
  },
  {
    icon: Sparkles,
    tone: 'sage' as const,
    title: 'Saca tu promesa',
    body: 'Elige una carta del mazo y recibe un versículo que te acompaña hasta el día del intercambio.',
  },
]

export const LandingPage = () => {
  const heroRef = useEntranceAnimation<HTMLElement>({ stagger: 0.09 })
  const stepsRef = useScrollReveal<HTMLElement>()

  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      <section ref={heroRef} className="flex flex-col items-center gap-6 text-center">
        <span data-animate>
          <Badge tone="apricot">Amigo secreto · con promesa</Badge>
        </span>

        <h1 data-animate className="max-w-3xl text-display-xl">
          Regala algo lindo.
          <br />
          <span className="marker">Recibe una promesa.</span>
        </h1>

        <p data-animate className="max-w-xl text-lg text-ink-soft">
          Dádiva organiza tu amigo secreto y le suma lo que de verdad queda: una
          tarjeta con un versículo que es tuya, y que te espera aquí cada vez que vuelvas.
        </p>

        <div data-animate className="flex flex-col gap-3 sm:flex-row">
          <LinkButton to="/entrar" size="lg">
            Crear mi grupo
          </LinkButton>
          <LinkButton to="/unirse" size="lg" variant="secondary">
            Tengo un código
          </LinkButton>
        </div>
      </section>

      <section ref={stepsRef} aria-labelledby="como-funciona" className="flex flex-col gap-8">
        <h2 id="como-funciona" className="text-center text-display-md">
          Cómo funciona
        </h2>

        <ul data-reveal-group className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <Sticker
              key={step.title}
              as="li"
              tone={step.tone}
              tilt={index === 1 ? 0 : index === 0 ? -1.2 : 1.2}
              className="flex list-none flex-col gap-3 p-6"
              data-reveal
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-full border-2 border-ink bg-paper"
              >
                <step.icon className="size-5" />
              </span>
              <h3 className="text-display-sm">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </Sticker>
          ))}
        </ul>
      </section>

      <section className="flex justify-center">
        <Sticker withTape tone="paper" className="max-w-lg p-8 text-center">
          <p className="font-script text-2xl leading-snug">
            «Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad,
            porque Dios ama al dador alegre.»
          </p>
          <p className="label-mono mt-4 text-ink-faint">2 Corintios 9:7</p>
        </Sticker>
      </section>
    </div>
  )
}
