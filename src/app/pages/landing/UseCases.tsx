import { Briefcase, Church, Home, UsersRound } from 'lucide-react'
import { useScrollReveal } from '@animations'
import { Sticker, type StickerTone } from '@ui/atoms'

/**
 * "Sage y sky solo aparecen en la landing o como garabato decorativo"
 * (regla de color en `src/styles/theme.css`): esta sección es uno de los
 * pocos lugares del producto donde tiene sentido usarlos.
 */
const USE_CASES: readonly { title: string; body: string; icon: typeof Home; tone: StickerTone }[] = [
  {
    icon: Home,
    tone: 'blush',
    title: 'En familia.',
    body: 'Primos, tíos y abuelos, aunque vivan lejos: el código de invitación llega igual por WhatsApp.',
  },
  {
    icon: Church,
    tone: 'lilac',
    title: 'En la iglesia o la célula.',
    body: 'Un grupo pequeño que quiere que el intercambio también deje algo para meditar.',
  },
  {
    icon: UsersRound,
    tone: 'sage',
    title: 'Entre amigos.',
    body: 'Sin la incomodidad de decidir en el chat quién le regala a quién.',
  },
  {
    icon: Briefcase,
    tone: 'sky',
    title: 'En la oficina.',
    body: 'Presupuesto claro y fecha fija, para que nadie se quede por fuera del intercambio.',
  },
]

export const UseCases = () => {
  const sectionRef = useScrollReveal<HTMLElement>()

  return (
    <section ref={sectionRef} aria-labelledby="para-quien" className="flex flex-col gap-8">
      <div className="text-center">
        <p className="eyebrow">Para quién es</p>
        <h2 id="para-quien" className="mt-2 text-h2">
          Cualquier grupo que se regala algo.
        </h2>
      </div>

      <ul data-reveal-group className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map((useCase) => (
          <Sticker
            key={useCase.title}
            as="li"
            tone={useCase.tone}
            className="flex list-none flex-col gap-3 p-5"
            data-reveal
          >
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-full border-2 border-ink bg-paper"
            >
              <useCase.icon className="size-4.5" />
            </span>
            <h3 className="text-base font-bold">{useCase.title}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{useCase.body}</p>
          </Sticker>
        ))}
      </ul>
    </section>
  )
}
