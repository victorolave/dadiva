import { Gift, Sparkles, Users } from 'lucide-react'
import { useEntranceAnimation, useScrollReveal } from '@animations'
import { LinkButton, Sticker } from '@ui/atoms'
import { Blob } from '@ui/brand'
import { HeroCollage } from './landing/HeroCollage'

const STEPS = [
  {
    icon: Users,
    tone: 'blush' as const,
    title: 'Arma tu grupo.',
    body: 'Ponle nombre, fecha y presupuesto. Te damos un código para compartir por donde quieras.',
  },
  {
    icon: Gift,
    tone: 'lilac' as const,
    title: 'Sortea en secreto.',
    body: 'Nadie se saca a sí mismo. Ni siquiera quien organiza puede ver a quién le tocó cada persona.',
  },
  {
    icon: Sparkles,
    tone: 'sage' as const,
    title: 'Saca tu promesa.',
    body: 'Elige una carta del mazo y recibe un versículo que te acompaña hasta el día del intercambio.',
  },
]

export const LandingPage = () => {
  const heroRef = useEntranceAnimation<HTMLElement>({ stagger: 0.09 })
  const stepsRef = useScrollReveal<HTMLElement>()

  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      <section ref={heroRef} className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <p data-animate className="eyebrow">
            Amigo secreto · con promesa
          </p>

          <h1 data-animate className="text-display">
            Regala algo lindo.
            <br />
            <span className="marker">Recibe una promesa.</span>
          </h1>

          <p data-animate className="max-w-[34rem] text-lead text-ink-soft">
            Dádiva organiza tu amigo secreto y le suma lo que de verdad queda: una
            tarjeta con un versículo que es tuya, y que te espera aquí cada vez que vuelvas.
          </p>

          <div
            data-animate
            className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <LinkButton to="/entrar" size="lg">
              Crear mi grupo
            </LinkButton>
            <LinkButton to="/unirse" size="lg" variant="secondary">
              Tengo un código
            </LinkButton>
          </div>

          <p data-animate className="text-sm text-ink-soft">
            Entras con Google. Ni quien organiza ve el sorteo.
          </p>
        </div>

        <HeroCollage />
      </section>

      <section ref={stepsRef} aria-labelledby="como-funciona" className="flex flex-col gap-8">
        <div className="text-center">
          <p className="eyebrow">Paso a paso</p>
          <h2 id="como-funciona" className="mt-2 text-h2">
            Cómo funciona.
          </h2>
        </div>

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
              <p className="eyebrow">Paso {index + 1}</p>
              <h3 className="text-h3">{step.title}</h3>
              <p className="text-base leading-relaxed text-ink-soft">{step.body}</p>
            </Sticker>
          ))}
        </ul>
      </section>

      <section className="relative isolate flex justify-center">
        <Blob
          shape="a"
          tone="blush"
          className="absolute top-1/2 left-1/2 -z-10 w-90 -translate-x-1/2 -translate-y-1/2"
        />
        <Sticker withTape tone="paper" className="max-w-lg p-8 text-center">
          <p className="font-display text-verse">
            «Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad,
            porque Dios ama al dador alegre.»
          </p>
          <p className="eyebrow mt-4">2 Corintios 9:7</p>
        </Sticker>
      </section>
    </div>
  )
}
