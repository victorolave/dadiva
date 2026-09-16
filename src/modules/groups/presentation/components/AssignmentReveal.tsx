import { useCallback, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { paperConfetti } from '@animations'
import { ScratchReveal } from '@ui/molecules/ScratchReveal'
import { Avatar, Sticker } from '@ui/atoms'
import { Blob } from '@ui/brand'
import type { MyAssignment } from '../../domain/repositories/AssignmentRepository'

export interface AssignmentRevealProps {
  readonly assignment: MyAssignment
  readonly onReveal: () => void
}

/** Panel con el nombre. Es lo que queda debajo de la capa que se raspa. */
const ReceiverPanel = ({ assignment }: { readonly assignment: MyAssignment }) => (
  <div className="relative isolate flex min-h-52 flex-col items-center justify-center gap-3 overflow-hidden bg-blush-300 px-6 text-center">
    <Blob
      shape="a"
      tone="blush"
      shade={500}
      className="absolute top-1/2 left-1/2 -z-10 w-56 -translate-x-1/2 -translate-y-1/2"
    />
    {/*
      La mancha de fondo es blush-500: ahí `ink-soft` no pasa AA (4,14). Como el eyebrow y el nombre quedan centrados
      sobre esa mancha, van directo en `ink` en vez de en `.eyebrow` (que trae
      `ink-soft` por defecto) para no depender del orden de las utilidades.
    */}
    <p className="eyebrow" style={{ color: 'var(--color-ink)' }}>
      Tu amigo secreto es
    </p>
    <p className="flex flex-wrap items-center justify-center gap-2 text-h2 font-display">
      <Avatar emoji={assignment.receiverAvatarEmoji} size="lg" tint="paper" />
      {assignment.receiverName}
    </p>
  </div>
)

/**
 * Descubrir a quién le regalas.
 *
 * Se raspa una capa para revelar el nombre. Se eligió sobre la metáfora del
 * sobre porque el gesto es táctil de verdad: en el móvil se hace con el pulgar
 * y el nombre aparece donde pasa el dedo, no tras una animación que uno mira
 * pasivamente.
 *
 * Si la persona ya lo descubrió antes (`revealedAt`), no se vuelve a cubrir:
 * la sorpresa ocurre una sola vez y repetirla cada visita la abarataría.
 */
export const AssignmentReveal = ({ assignment, onReveal }: AssignmentRevealProps) => {
  const [isOpen, setIsOpen] = useState(assignment.revealedAt !== null)
  const stageRef = useRef<HTMLDivElement>(null)

  const handleRevealed = useCallback(() => {
    onReveal()
    setIsOpen(true)
    if (stageRef.current) paperConfetti(stageRef.current, 34)
  }, [onReveal])

  return (
    <div ref={stageRef} className="relative flex flex-col items-center gap-5 overflow-hidden">
      {/*
        La tarjeta mide EXACTAMENTE lo mismo antes y después de raspar.
        Antes crecía porque el estado revelado le añadía la lista de deseos
        dentro: la tarjeta saltaba de ancho y de alto justo en el momento de la
        sorpresa, que es cuando peor se siente un salto de maquetación.

        La lista pasa a ser un bloque aparte debajo. Además de no mover nada,
        separa mejor las dos ideas: a QUIÉN le regalas es una cosa, QUÉ le
        gustaría es otra.
      */}
      <div className="w-full max-w-sm">
        {isOpen ? (
          <Sticker tone="blush" strong size="hero" className="overflow-hidden shadow-celebrate">
            <ReceiverPanel assignment={assignment} />
          </Sticker>
        ) : (
          <ScratchReveal
            onRevealed={handleRevealed}
            className="rounded-hero border-[3px] border-ink shadow-sticker-lg"
          >
            <ReceiverPanel assignment={assignment} />
          </ScratchReveal>
        )}
      </div>

      {isOpen && (
        <Sticker size="card" className="w-full max-w-sm p-5" data-animate>
          {assignment.wishlist.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="eyebrow">Lo que le gustaría</h3>
              <ul className="divide-y divide-paper-shade">
                {assignment.wishlist.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="py-3">
                    <p className="font-medium">{item.title}</p>
                    {item.notes && <p className="text-sm text-ink-soft">{item.notes}</p>}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link mt-1 inline-flex items-center gap-1 text-sm"
                      >
                        Ver enlace
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">(se abre en una pestaña nueva)</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              Todavía no escribió su lista de deseos. Puedes sorprenderle igual.
            </p>
          )}
        </Sticker>
      )}
    </div>
  )
}
