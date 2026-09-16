import { useCallback, useRef, useState } from 'react'
import { ExternalLink, Gift } from 'lucide-react'
import { revealAssignment, paperConfetti } from '@animations'
import { Button, Sticker } from '@ui/atoms'
import type { MyAssignment } from '../../domain/repositories/AssignmentRepository'

export interface AssignmentRevealProps {
  readonly assignment: MyAssignment
  readonly onReveal: () => void
}

/**
 * El sobre con el nombre del amigo secreto.
 *
 * Si la persona ya lo abrió antes (`revealedAt`), no repetimos el ritual: se
 * muestra directo. La sorpresa ocurre una sola vez y volver a "abrirlo" cada
 * visita la abarataría.
 */
export const AssignmentReveal = ({ assignment, onReveal }: AssignmentRevealProps) => {
  const [isOpen, setIsOpen] = useState(assignment.revealedAt !== null)
  const [isAnimating, setIsAnimating] = useState(false)

  const envelopeRef = useRef<HTMLDivElement>(null)
  const flapRef = useRef<HTMLDivElement>(null)
  const slipRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLParagraphElement>(null)

  const handleOpen = useCallback(async () => {
    const envelope = envelopeRef.current
    const flap = flapRef.current
    const slip = slipRef.current
    const name = nameRef.current
    if (!envelope || !flap || !slip || !name) return

    setIsAnimating(true)
    onReveal()

    await revealAssignment(envelope, flap, slip, name)

    if (envelope.parentElement) paperConfetti(envelope.parentElement, 30)
    setIsOpen(true)
    setIsAnimating(false)
  }, [onReveal])

  if (isOpen && !isAnimating) {
    return (
      <Sticker tone="blush" className="flex flex-col gap-4 p-6">
        <p className="label-mono text-ink-soft">Tu amigo secreto es</p>

        <p className="flex items-center gap-3 text-display-md">
          <span aria-hidden="true">{assignment.receiverAvatarEmoji}</span>
          {assignment.receiverName}
        </p>

        {assignment.wishlist.length > 0 ? (
          <div className="flex flex-col gap-2">
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
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Todavía no escribió su lista de deseos. Puedes sorprenderle igual.
          </p>
        )}
      </Sticker>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-6 overflow-hidden py-4">
      <div
        ref={envelopeRef}
        className="relative aspect-[3/2] w-full max-w-xs"
        style={{ perspective: '900px' }}
      >
        <div className="absolute inset-0 rounded-card border-2 border-ink bg-apricot-300 shadow-sticker-lg" />

        {/* El papel sale de adentro: va detrás de la solapa y delante del fondo. */}
        <div
          ref={slipRef}
          className="absolute inset-x-6 top-4 z-10 rounded-sticker border-2 border-ink bg-paper px-4 py-3 text-center opacity-0"
        >
          <p className="label-mono text-ink-faint">Te tocó</p>
          <p ref={nameRef} className="mt-1 font-display text-2xl leading-tight opacity-0">
            {assignment.receiverAvatarEmoji} {assignment.receiverName}
          </p>
        </div>

        <div
          ref={flapRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-20 h-1/2 origin-top"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="size-full border-2 border-ink bg-apricot-500"
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
          />
        </div>

        <span className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2">
          <Gift className="size-6" aria-hidden="true" />
        </span>
      </div>

      <Button size="lg" onClick={() => void handleOpen()} isLoading={isAnimating}>
        Abrir mi sobre
      </Button>
    </div>
  )
}
