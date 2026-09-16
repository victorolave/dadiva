import { useCallback, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { paperConfetti } from '@animations'
import { ScratchReveal } from '@ui/molecules/ScratchReveal'
import { Sticker } from '@ui/atoms'
import type { MyAssignment } from '../../domain/repositories/AssignmentRepository'

export interface AssignmentRevealProps {
  readonly assignment: MyAssignment
  readonly onReveal: () => void
}

/** Panel con el nombre. Es lo que queda debajo de la capa que se raspa. */
const ReceiverPanel = ({ assignment }: { readonly assignment: MyAssignment }) => (
  <div className="flex h-44 flex-col items-center justify-center gap-2 bg-blush-100 px-6 text-center">
    <p className="label-mono text-ink-soft">Tu amigo secreto es</p>
    <p className="flex flex-wrap items-center justify-center gap-2 text-display-md">
      <span aria-hidden="true">{assignment.receiverAvatarEmoji}</span>
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
    <div ref={stageRef} className="relative overflow-hidden">
      {isOpen ? (
        <Sticker tone="blush" className="flex flex-col gap-4 overflow-hidden">
          <ReceiverPanel assignment={assignment} />

          <div className="flex flex-col gap-2 px-6 pb-6">
            {assignment.wishlist.length > 0 ? (
              <>
                <h3 className="label-mono text-ink-soft">Lo que le gustaría</h3>
                <ul className="flex flex-col gap-2">
                  {assignment.wishlist.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      className="rounded-sticker border-2 border-ink/15 bg-paper px-3 py-2"
                    >
                      <p className="font-medium">{item.title}</p>
                      {item.notes && <p className="text-sm text-ink-soft">{item.notes}</p>}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-sm text-lilac-900 underline"
                        >
                          Ver enlace
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                          <span className="sr-only">(se abre en una pestaña nueva)</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                Todavía no escribió su lista de deseos. Puedes sorprenderle igual.
              </p>
            )}
          </div>
        </Sticker>
      ) : (
        <ScratchReveal
          onRevealed={handleRevealed}
          className="w-full max-w-sm border-2 border-ink shadow-sticker-lg"
        >
          <ReceiverPanel assignment={assignment} />
        </ScratchReveal>
      )}
    </div>
  )
}
