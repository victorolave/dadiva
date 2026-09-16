import { useCallback, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
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
      {/*
        El sobre se dibuja en SVG y no con clip-path.
        Un clip-path recorta el borde junto con el relleno: la solapa quedaba
        como un triángulo de color sin contorno en sus diagonales, y el conjunto
        no se leía como una figura cerrada. En SVG el trazo sigue el contorno
        real de cada pieza, que es justo lo que pide la estética de tinta.

        Cuatro capas, en este orden de profundidad:
          1. cuerpo    — el sobre completo, al fondo
          2. papel     — sale de adentro
          3. bolsillo  — panel frontal; tapa la parte baja del papel
          4. solapa    — gira hacia atrás al abrirse
      */}
      <div
        ref={envelopeRef}
        className="relative aspect-[3/2] w-full max-w-xs"
        style={{ perspective: '900px' }}
      >
        {/* 1 · cuerpo */}
        <svg viewBox="0 0 300 200" className="absolute inset-0 size-full" aria-hidden="true">
          <rect
            x="1.5"
            y="1.5"
            width="297"
            height="197"
            rx="12"
            className="fill-apricot-300 stroke-ink"
            strokeWidth="2.5"
          />
        </svg>

        {/* 2 · el papel con el nombre */}
        <div
          ref={slipRef}
          // Arranca a media altura, escondido detrás del bolsillo, y sube sin
          // llegar a despegarse: el pie queda tapado para que el papel parezca
          // salir DE DENTRO del sobre y no flotar encima.
          className="absolute inset-x-7 top-[52%] z-10 rounded-sticker border-2 border-ink bg-paper px-4 py-3 text-center opacity-0"
        >
          <p className="label-mono text-ink-faint">Te tocó</p>
          <p ref={nameRef} className="mt-1 font-display text-2xl leading-tight opacity-0">
            {assignment.receiverAvatarEmoji} {assignment.receiverName}
          </p>
        </div>

        {/* 3 · bolsillo frontal: el papel parece salir de detrás de él */}
        <svg
          viewBox="0 0 300 200"
          className="pointer-events-none absolute inset-0 z-20 size-full"
          aria-hidden="true"
        >
          <path
            d="M1.5 96 L150 170 L298.5 96 L298.5 186.5 Q298.5 198.5 286.5 198.5 L13.5 198.5 Q1.5 198.5 1.5 186.5 Z"
            className="fill-apricot-500 stroke-ink"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* 4 · solapa */}
        <div
          ref={flapRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-30 h-[58%] origin-top"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <svg viewBox="0 0 300 116" className="size-full overflow-visible">
            <path
              d="M1.5 13.5 Q1.5 1.5 13.5 1.5 L286.5 1.5 Q298.5 1.5 298.5 13.5 L150 112 Z"
              className="fill-apricot-500 stroke-ink"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Sello sobre la punta de la solapa: refuerza la lectura de
                «cerrado» y se levanta junto con ella al abrir. */}
            <circle cx="150" cy="93" r="15" className="fill-blush-500 stroke-ink" strokeWidth="2.5" />
            <text
              x="150"
              y="93"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-ink font-display"
              fontSize="16"
            >
              D
            </text>
          </svg>
        </div>
      </div>

      <Button size="lg" onClick={() => void handleOpen()} isLoading={isAnimating}>
        Abrir mi sobre
      </Button>
    </div>
  )
}
