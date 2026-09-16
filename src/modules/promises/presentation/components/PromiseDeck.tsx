import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  anchorCards,
  geometryForWidth,
  idleDeckPulse,
  liftCard,
  presentSavedCard,
  revealChosenCard,
  spreadDeck,
  paperConfetti,
  prefersReducedMotion,
} from '@animations'
import { Button } from '@ui/atoms'
import { cn } from '@ui/utils/cn'
import type { PromiseCard } from '../../domain/entities/PromiseCard'
import { PromiseCardBack, PromiseCardFace } from './PromiseCardFace'

/** Cuántos dorsos mostramos en el abanico. Suficiente para sentir un mazo. */
const DECK_SIZE = 9

type DeckPhase = 'closed' | 'choosing' | 'revealing' | 'revealed'

export interface PromiseDeckProps {
  /** Promesa ya sacada. Si viene, se presenta directamente sin ritual. */
  readonly savedCard: PromiseCard | null
  readonly highlight?: readonly string[] | undefined
  /** Pide la promesa al servidor. Idempotente allá. */
  readonly onDraw: () => Promise<PromiseCard | null>
  readonly isBusy?: boolean | undefined
}

/**
 * Baraja de promesas.
 *
 * Nota honesta sobre la aleatoriedad: qué carta toque la persona NO determina
 * el versículo. El servidor decide, y decide una sola vez. Es exactamente lo
 * que pasa con un mazo boca abajo en la vida real — al elegir no sabes qué hay
 * en ninguna, así que cualquier elección es igual de azarosa. El gesto es
 * ceremonia, y la ceremonia es el producto.
 */
export const PromiseDeck = ({ savedCard, highlight = [], onDraw, isBusy = false }: PromiseDeckProps) => {
  const [phase, setPhase] = useState<DeckPhase>(savedCard ? 'revealed' : 'closed')
  const [revealedCard, setRevealedCard] = useState<PromiseCard | null>(savedCard)
  const [focusedIndex, setFocusedIndex] = useState(Math.floor(DECK_SIZE / 2))
  const [chosenIndex, setChosenIndex] = useState<number | null>(null)
  // Se activa en el cruce de los 90° del volteo, cuando la carta está de
  // canto y el cambio de cara es invisible.
  const [faceUp, setFaceUp] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  // El botón lleva la posición del abanico; el hijo lleva el levantamiento.
  const innerRefs = useRef<(HTMLDivElement | null)[]>([])
  const savedCardRef = useRef<HTMLDivElement>(null)
  const idleTween = useRef<gsap.core.Tween | null>(null)

  // Si la promesa llega después del primer render (carga asíncrona), nos
  // sincronizamos sin volver a disparar el ritual.
  useEffect(() => {
    if (savedCard && phase !== 'revealed') {
      setRevealedCard(savedCard)
      setPhase('revealed')
    }
  }, [savedCard, phase])

  useEffect(() => {
    if (phase !== 'revealed' || !savedCardRef.current) return
    presentSavedCard(savedCardRef.current)
  }, [phase, revealedCard])

  // Ancla el centrado antes del primer pintado. Va en useLayoutEffect y no en
  // useEffect porque con useEffect el navegador alcanza a pintar un fotograma
  // con las cartas descentradas.
  useLayoutEffect(() => {
    const cards = cardRefs.current.filter((c): c is HTMLButtonElement => c !== null)
    if (cards.length > 0) anchorCards(cards)
  }, [phase])

  // Pulso de invitación mientras el mazo está cerrado.
  useEffect(() => {
    if (phase !== 'closed') {
      idleTween.current?.kill()
      idleTween.current = null
      return
    }

    const deck = cardRefs.current[0]
    if (deck) idleTween.current = idleDeckPulse(deck)

    return () => {
      idleTween.current?.kill()
      idleTween.current = null
    }
  }, [phase])

  const handleOpen = useCallback(() => {
    if (phase !== 'closed') return

    idleTween.current?.kill()

    // La interactividad NO espera a que termine la animación.
    //
    // Si esperáramos al `await spreadDeck(...)`, un tween que se demore, se
    // interrumpa o falle dejaría las cartas muertas para siempre. La animación
    // es decoración; el mazo tiene que responder aunque ella no ocurra. Además
    // se siente mejor: puedes tomar una carta mientras todavía se abre, igual
    // que con un mazo de verdad.
    setPhase('choosing')

    const cards = cardRefs.current.filter((card): card is HTMLButtonElement => card !== null)
    void spreadDeck(cards, geometryForWidth(window.innerWidth))

    // El foco va a la carta del centro para que quien usa teclado sepa
    // inmediatamente dónde está parado.
    cardRefs.current[Math.floor(DECK_SIZE / 2)]?.focus()
  }, [phase])

  const handleChoose = useCallback(
    async (index: number) => {
      if (phase !== 'choosing') return

      const chosen = cardRefs.current[index]
      const others = cardRefs.current.filter(
        (card, cardIndex): card is HTMLButtonElement => card !== null && cardIndex !== index,
      )
      if (!chosen) return

      setPhase('revealing')
      setChosenIndex(index)

      // Pedimos la carta al servidor ANTES de animar: si la red está lenta, el
      // volteo no puede terminar mostrando un dorso vacío.
      const card = await onDraw()
      if (!card) {
        setPhase('choosing')
        setChosenIndex(null)
        return
      }

      setRevealedCard(card)

      // El cambio de fase va DESPUÉS de que la animación termine. Si lo
      // hiciéramos en el callback de la mitad del volteo, el return temprano de
      // la fase 'revealed' desmontaría el nodo que GSAP está animando y la
      // animación moriría a media vuelta.
      await revealChosenCard(chosen, others, () => setFaceUp(true))

      if (stageRef.current) paperConfetti(stageRef.current, 36)
      setPhase('revealed')
    },
    [phase, onDraw],
  )

  /** Flechas para moverse entre cartas, como en una lista de opciones real. */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (phase !== 'choosing') return

      const move = (delta: number) => {
        event.preventDefault()
        const next = (index + delta + DECK_SIZE) % DECK_SIZE
        setFocusedIndex(next)
        cardRefs.current[next]?.focus()
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') move(1)
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') move(-1)
      if (event.key === 'Home') move(-index)
      if (event.key === 'End') move(DECK_SIZE - 1 - index)
    },
    [phase],
  )

  if (phase === 'revealed' && revealedCard) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div ref={savedCardRef} className="w-full max-w-[19rem]">
          <PromiseCardFace card={revealedCard} highlight={highlight} />
        </div>
        <p
          className="max-w-sm text-center text-sm text-ink-soft"
          role="status"
        >
          Esta es tu promesa para este grupo. Te va a estar esperando aquí cada vez que entres.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        ref={stageRef}
        className={cn(
          'relative flex w-full items-center justify-center overflow-hidden',
          'h-[22rem] sm:h-[26rem]',
        )}
        style={{ perspective: '1400px' }}
      >
        <div
          role={phase === 'choosing' ? 'group' : undefined}
          aria-label={phase === 'choosing' ? 'Elige una carta del mazo' : undefined}
          className="relative size-full"
        >
          {Array.from({ length: DECK_SIZE }, (_, index) => {
            return (
              <button
                key={index}
                ref={(node) => {
                  cardRefs.current[index] = node
                }}
                type="button"
                // Solo una carta entra en el orden de tabulación; entre ellas
                // se navega con flechas. Nueve paradas de tab seguidas serían
                // una tortura para quien usa teclado o lector de pantalla.
                tabIndex={phase === 'choosing' && index === focusedIndex ? 0 : -1}
                aria-label={`Carta ${index + 1} de ${DECK_SIZE}`}
                disabled={phase !== 'choosing'}
                onClick={() => void handleChoose(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onFocus={() => {
                  setFocusedIndex(index)
                  const card = cardRefs.current[index]
                  if (card && phase === 'choosing') liftCard(card, true)
                }}
                onBlur={() => {
                  const card = cardRefs.current[index]
                  if (card) liftCard(card, false)
                }}
                onPointerEnter={() => {
                  const card = cardRefs.current[index]
                  if (card && phase === 'choosing') liftCard(card, true)
                }}
                onPointerLeave={() => {
                  const card = cardRefs.current[index]
                  if (card && phase === 'choosing') liftCard(card, false)
                }}
                className={cn(
                  // Sin `-translate-x-1/2`: el centrado lo pone GSAP con
                  // xPercent/yPercent para no pelear por la misma propiedad.
                  'absolute left-1/2 top-1/2 w-[8.5rem] rounded-card sm:w-[10rem]',
                  phase === 'choosing'
                    ? 'cursor-pointer focus-visible:outline-4'
                    : 'cursor-default',
                )}
                style={{
                  zIndex: DECK_SIZE - index,
                  transformStyle: 'preserve-3d',
                  // Invisible hasta que anchorCards la coloque, para que nunca
                  // se vea un fotograma con la carta sin centrar.
                  visibility: 'hidden',
                }}
              >
                <div
                  ref={(node) => {
                    innerRefs.current[index] = node
                  }}
                  className="will-change-transform"
                >
                  {faceUp && revealedCard && index === chosenIndex ? (
                    <PromiseCardFace card={revealedCard} highlight={highlight} />
                  ) : (
                    <PromiseCardBack />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {phase === 'closed' && (
        <div className="flex flex-col items-center gap-3 text-center">
          <Button size="lg" onClick={handleOpen} isLoading={isBusy}>
            Abrir el mazo
          </Button>
          <p className="max-w-xs text-sm text-ink-soft">
            {prefersReducedMotion()
              ? 'Elige una carta y recibe tu promesa.'
              : 'Las cartas se abrirán en abanico. Elige la que quieras.'}
          </p>
        </div>
      )}

      {phase === 'choosing' && (
        <p className="label-mono text-ink-soft" role="status">
          Toca una carta · o usa las flechas y Enter
        </p>
      )}
    </div>
  )
}
