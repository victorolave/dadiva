import { forwardRef } from 'react'
import { Isotipo } from '@ui/brand'
import { cn } from '@ui/utils/cn'
import type { PromiseCard } from '../../domain/entities/PromiseCard'
import { PromiseOrnament } from './PromiseOrnament'

/**
 * Tamaño de renderizado, no de layout: la MISMA carta se pinta chica dentro
 * del mazo (136–160px, `PromiseDeck` durante el volteo) y grande ya
 * revelada (20rem). Un radio/borde/sombra "hero" a 136px se ve como una
 * pastilla (30px de radio es ~22% del ancho) — de ahí los dos escalones en
 * vez de uno solo. La tipografía interna, en cambio, sí es continua: usa
 * `cqw` sobre `container-type: inline-size`, así que escala sola con el
 * ancho real sin necesitar un tercer escalón.
 */
export type PromiseCardSize = 'deck' | 'hero'

export interface PromiseCardFaceProps {
  readonly card: PromiseCard
  readonly highlight?: readonly string[] | undefined
  readonly className?: string | undefined
  /** `hero` (por defecto): carta ya revelada, a tamaño protagonista.
   *  `deck`: carta todavía del tamaño del mazo (136–160px). */
  readonly size?: PromiseCardSize | undefined
}

const TYPOGRAPHY_CLASS = {
  script: 'font-script text-[clamp(1.125rem,8.5cqw,2rem)] leading-[1.15]',
  // Fraunces 600, clamp(16px, 7.5cqw, 30px): valores del ancla de la
  // anatomía de la carta del Design System.
  display: 'font-display text-[clamp(1rem,7.5cqw,1.875rem)] leading-[1.25]',
  grotesk: 'font-sans text-[clamp(0.9375rem,6.6cqw,1.625rem)] font-medium leading-[1.42]',
} as const

const SIZE_CLASS: Record<PromiseCardSize, string> = {
  deck: 'rounded-tile border-2 shadow-sticker',
  hero: 'rounded-hero border-[3px] shadow-sticker-lg',
}

/** Opacidad del ornamento en la cara revelada. El reverso, que no
 *  usa `PromiseOrnament` (no conoce el tema, ver `PromiseCardBack` abajo),
 *  se queda con el 1 (100%) por defecto del componente. */
const FACE_ORNAMENT_OPACITY = 0.55

/**
 * La cara visible de una tarjeta de promesa.
 *
 * Formato 3/4 con `container-type: inline-size`: toda la tipografía interna
 * está en `cqw`, así que la tarjeta escala como una sola pieza sea cual sea
 * su ancho real.
 */
export const PromiseCardFace = forwardRef<HTMLDivElement, PromiseCardFaceProps>(
  function PromiseCardFace({ card, highlight = [], className, size = 'hero' }, ref) {
    const theme = card.theme
    const segments = card.segments(highlight)

    return (
      <div
        ref={ref}
        className={cn(
          'relative isolate flex aspect-[3/4] w-full flex-col justify-between overflow-hidden',
          'border-ink [container-type:inline-size]',
          SIZE_CLASS[size],
          // `%`, no `cqw`: este div es el que DECLARA `container-type:
          // inline-size`, y una unidad de consulta de contenedor en el
          // propio elemento contenedor no puede resolverse contra sí mismo
          // (dependencia circular) — el spec la resuelve contra el
          // contenedor ANCESTRO más cercano (aquí, el viewport). El
          // resultado real era un padding fijo de ~115px sin relación con
          // el ancho real de la tarjeta (136px en el mazo o 320px ya
          // revelada), que en `deck` dejaba casi nulo el área de texto y
          // empujaba el pie fuera de la tarjeta. `%` sí es relativo al
          // propio content-box del elemento vía el modelo de caja normal
          // de CSS, sin pasar por container queries.
          'p-[6%]',
          className,
        )}
        style={{ backgroundColor: theme.background, color: theme.ink }}
      >
        <PromiseOrnament theme={theme} opacity={FACE_ORNAMENT_OPACITY} />

        <span
          className="relative z-10 self-start text-[clamp(0.5625rem,2.2cqw,0.75rem)] font-bold tracking-[0.14em] uppercase"
          style={{ color: theme.ink }}
        >
          Una promesa para ti
        </span>

        <blockquote
          className={cn(
            // `min-h-0` es obligatorio en un hijo flex con `flex-1`: sin él,
            // su altura mínima por defecto es la del contenido (`min-height:
            // auto`), así que un versículo largo lo empuja más allá del alto
            // fijo de la tarjeta (`aspect-[3/4]`) y saca el `<footer>` —con
            // la referencia y la versión— por fuera del `overflow-hidden`
            // exterior. Con `min-h-0` el bloque respeta el espacio
            // disponible de verdad y el recorte de abajo (`line-clamp`) es
            // el que decide, no el layout.
            'relative z-10 flex-1 min-h-0 place-content-center overflow-hidden',
            theme.textAlign === 'center' ? 'text-center' : 'text-left',
          )}
        >
          {/* Placa del mismo color que el fondo de la tarjeta: el ornamento
              va al 55% detrás, y sin esto sus trazos podrían restar
              contraste al versículo en algún punto del texto. La placa
              garantiza que el AA de ink/background siga intacto. */}
          <div className="rounded-tile px-[6%] py-[4%]" style={{ backgroundColor: theme.background }}>
            {/*
              `line-clamp`: sin tope, un versículo largo (p. ej. Salmos
              103:11-12, 193 caracteres) desbordaba la placa y empujaba el
              pie de la tarjeta —donde ahora vive la versión, RVR1960— fuera
              del área visible. Mejor un final con puntos suspensivos y el
              pie siempre visible, que un corte a media palabra sin aviso y
              la cita de la traducción desaparecida. El tope es más bajo en
              `deck` (136–160px, el volteo del mazo) que en `hero`, donde hay
              mucho más alto disponible.
            */}
            <p
              className={cn(
                '[text-wrap:balance] overflow-hidden',
                size === 'deck' ? 'line-clamp-5' : 'line-clamp-10',
                TYPOGRAPHY_CLASS[theme.typography],
              )}
            >
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
          </div>
        </blockquote>

        <footer
          className={cn(
            // `shrink-0`: nunca se comprime para hacerle espacio al
            // versículo. Referencia, versión y (en hero) el isotipo deben
            // verse completos siempre.
            'relative z-10 flex shrink-0 flex-col gap-[2.5cqw]',
            theme.textAlign === 'center' ? 'items-center' : 'items-start',
          )}
        >
          {/* Barra de acento: puramente decorativa, no es texto — por eso el
              acento SÍ puede vivir acá. La referencia de abajo, en cambio, es
              texto que hay que leer, y por eso va en `theme.ink` y no en
              `theme.accent`: el acento contra el fondo del tema mide entre
              1,54 y 4,42 de contraste en los 12 temas, por debajo de AA. */}
          <span
            aria-hidden="true"
            className="h-[3px] w-[30%] rounded-pill"
            style={{ backgroundColor: theme.accent }}
          />
          <div className="flex w-full items-end justify-between gap-2">
            {/*
              La versión (p. ej. RVR1960) va en un <span> HERMANO de <cite>,
              nunca dentro: la Reina-Valera 1960 tiene derechos de autor y su
              traducción debe citarse siempre junto al versículo. Sacarla del
              pie (como se hizo antes solo para que `getByText('Santiago
              1:17')` calzara con el `textContent` exacto de `<cite>`) es
              incorrecto — el test debe adaptarse al requisito legal, no al
              revés. Al vivir fuera del `<cite>`, `getByText('Santiago
              1:17')` sigue siendo una igualdad exacta y válida.
            */}
            {/* Misma placa del color de fondo que protege al versículo: los
                ornamentos de varios temas (las margaritas, las hojas) caen
                justo en las esquinas inferiores y, sin ella, la referencia
                quedaba encima de un trazo oscuro y dejaba de leerse. */}
            <div
              className={cn(
                'flex flex-col gap-[0.5cqw] rounded-control px-[3cqw] py-[1.5cqw]',
                theme.textAlign === 'center' ? 'items-center' : 'items-start',
              )}
              style={{ backgroundColor: theme.background }}
            >
              <cite
                className="not-italic text-[clamp(0.625rem,2.4cqw,0.75rem)] font-bold tracking-[0.1em] uppercase"
                style={{ color: theme.ink }}
              >
                {card.reference}
              </cite>
              <span
                // Mínimo 10px: por debajo, la atribución de la traducción
                // existe en el DOM pero en la práctica no se puede leer.
                className="text-[clamp(0.625rem,2cqw,0.6875rem)] font-medium tracking-[0.08em] uppercase opacity-80"
                style={{ color: theme.ink }}
              >
                {card.version}
              </span>
            </div>
            {/* El isotipo mono reemplaza «Dádiva» en Fraunces: ese texto
                reconstruía la marca con tipografía, algo que la regla de
                marca prohíbe. Solo en `hero`: a
                tamaño de mazo (136–160px) 32px de isotipo quedaría
                desproporcionado. */}
            {size === 'hero' && <Isotipo mono size={32} className="opacity-85" />}
          </div>
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
          'relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-[4cqw] overflow-hidden',
          'rounded-tile border-2 border-ink bg-lilac-300 shadow-sticker [container-type:inline-size]',
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

        {/* El isotipo mono reemplaza la «D» en Fraunces: no es un ornamento
            por tema (el reverso NO conoce el tema de la carta — a propósito,
            para que ninguna de las 9 del mazo delate cuál es cuál antes de
            elegirla). Su interior transparente toma este fondo de papel. */}
        <div className="relative flex size-[34cqw] items-center justify-center rounded-full border-[3px] border-ink bg-paper">
          <Isotipo mono size={40} className="size-[58%]" />
        </div>

        <div className="relative rounded-control border-2 border-ink bg-paper px-[4cqw] py-[1.6cqw]">
          <span className="font-display text-[clamp(0.5625rem,2.6cqw,0.8125rem)] font-bold tracking-[0.08em] text-ink uppercase">
            Tocar para revelar
          </span>
        </div>
      </div>
    )
  },
)
