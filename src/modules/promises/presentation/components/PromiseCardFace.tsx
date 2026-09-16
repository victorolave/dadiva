import { forwardRef } from 'react'
import { cn } from '@ui/utils/cn'
import type { PromiseCard } from '../../domain/entities/PromiseCard'
import { PromiseOrnament } from './PromiseOrnament'

export interface PromiseCardFaceProps {
  readonly card: PromiseCard
  readonly highlight?: readonly string[] | undefined
  readonly className?: string | undefined
  readonly compact?: boolean | undefined
}

const TYPOGRAPHY_CLASS = {
  script: 'font-script text-[1.65em] leading-[1.15]',
  display: 'font-display text-[1.12em] leading-[1.28]',
  grotesk: 'font-sans text-[0.98em] font-medium leading-[1.42]',
} as const

/**
 * La cara visible de una tarjeta de promesa.
 *
 * Todo el tamaño de texto se expresa en `em` sobre un `font-size` del
 * contenedor: así la tarjeta entera escala con una sola variable y se ve
 * proporcionada tanto en el mazo pequeño como a pantalla completa.
 */
export const PromiseCardFace = forwardRef<HTMLDivElement, PromiseCardFaceProps>(
  function PromiseCardFace({ card, highlight = [], className, compact = false }, ref) {
    const theme = card.theme
    const segments = card.segments(highlight)

    return (
      <div
        ref={ref}
        className={cn(
          'relative isolate flex flex-col justify-between overflow-hidden',
          'rounded-card border-2 border-ink shadow-sticker-lg',
          'aspect-[200/290] w-full',
          compact ? 'p-3 text-[0.62rem]' : 'p-5 text-[0.92rem] sm:p-6 sm:text-base',
          className,
        )}
        style={{ backgroundColor: theme.background, color: theme.ink }}
      >
        <PromiseOrnament theme={theme} />

        <span
          className="label-mono relative z-10 self-start opacity-70"
          style={{ color: theme.ink }}
        >
          {card.version}
        </span>

        <blockquote
          className={cn(
            'relative z-10 flex-1 place-content-center',
            theme.textAlign === 'center' ? 'text-center' : 'text-left',
            TYPOGRAPHY_CLASS[theme.typography],
          )}
        >
          <p className="[text-wrap:balance]">
            {segments.map((segment, index) =>
              segment.emphasized ? (
                <mark
                  key={index}
                  // Padding horizontal mínimo: con 0.22em el resaltado empujaba
                  // la puntuación siguiente y el texto se leía «temen .», como
                  // un error de tipeo. `box-decoration-break: clone` hace que
                  // un resaltado partido en dos líneas conserve sus esquinas
                  // redondeadas en ambas.
                  className="rounded-[0.3em] bg-transparent px-[0.06em] py-[0.08em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
                  style={{
                    // El acento va detrás del texto con baja opacidad para no
                    // comprometer el contraste AA que ya garantiza ink/background.
                    backgroundColor: `color-mix(in oklab, ${theme.accent} 42%, transparent)`,
                    color: theme.ink,
                  }}
                >
                  {segment.text}
                </mark>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </p>
        </blockquote>

        <footer className="relative z-10 flex items-end justify-between gap-2">
          <cite
            className="label-mono not-italic"
            style={{ color: theme.accent, filter: 'brightness(0.7)' }}
          >
            {card.reference}
          </cite>
          <span
            className="font-display text-[0.9em] leading-none opacity-55"
            style={{ color: theme.ink }}
          >
            Dádiva
          </span>
        </footer>
      </div>
    )
  },
)

/** Reverso del mazo: idéntico en todas las cartas para no delatar cuál es cuál. */
export const PromiseCardBack = forwardRef<HTMLDivElement, { readonly className?: string }>(
  function PromiseCardBack({ className }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'relative flex aspect-[200/290] w-full items-center justify-center overflow-hidden',
          'rounded-card border-2 border-ink bg-lilac-300 shadow-sticker-lg',
          className,
        )}
      >
        <svg viewBox="0 0 200 290" className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <pattern id="dadiva-back" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="6" cy="6" r="2.6" fill="#1b1917" opacity="0.16" />
              <path
                d="M19 13 Q 20 18 25 19 Q 20 20 19 25 Q 18 20 13 19 Q 18 18 19 13 Z"
                fill="#1b1917"
                opacity="0.13"
              />
            </pattern>
          </defs>
          <rect width="200" height="290" fill="url(#dadiva-back)" />
        </svg>

        <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-ink bg-paper">
          <span className="font-display text-2xl leading-none">D</span>
        </div>
      </div>
    )
  },
)
