import { memo } from 'react'
import type { PromisePattern, PromiseTheme } from '../../domain/value-objects/PromiseTheme'

interface OrnamentProps {
  readonly theme: PromiseTheme
}

export interface PromiseOrnamentProps extends OrnamentProps {
  /**
   * Opacidad del ornamento completo. El reverso lo usa al 100% (1, valor por
   * defecto): ahí el ornamento ES el reverso. La cara revelada lo baja a
   * 0.55 para que compita menos con el versículo, que además se protege con
   * una placa del color de fondo del tema detrás del texto (ver
   * `PromiseCardFace`).
   */
  readonly opacity?: number | undefined
}

/** Toma un color de la paleta de forma cíclica, sin salirse del arreglo. */
const pick = (palette: readonly string[], index: number): string =>
  palette[index % palette.length] ?? palette[0] ?? '#efa8c8'

const Arcs = ({ theme }: OrnamentProps) => (
  <>
    <g transform="translate(18 132)">
      {[0, 1, 2, 3].map((ring) => (
        <path
          key={ring}
          d={`M0 0 A ${46 - ring * 11} ${46 - ring * 11} 0 0 1 ${92 - ring * 22} 0`}
          fill="none"
          stroke={pick(theme.palette, ring)}
          strokeWidth="9"
          strokeLinecap="round"
          transform={`translate(${ring * 11} 0)`}
        />
      ))}
    </g>
    <g transform="translate(182 34) rotate(180)">
      {[0, 1, 2].map((ring) => (
        <path
          key={ring}
          d={`M0 0 A ${34 - ring * 10} ${34 - ring * 10} 0 0 1 ${68 - ring * 20} 0`}
          fill="none"
          stroke={pick(theme.palette, ring + 2)}
          strokeWidth="8"
          strokeLinecap="round"
          transform={`translate(${ring * 10} 0)`}
        />
      ))}
    </g>
  </>
)

const Daisy = ({ cx, cy, r, petal, center }: { cx: number; cy: number; r: number; petal: string; center: string }) => (
  <g transform={`translate(${cx} ${cy})`}>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <ellipse
        key={angle}
        cx="0"
        cy={-r}
        rx={r * 0.42}
        ry={r * 0.72}
        fill={petal}
        transform={`rotate(${angle})`}
      />
    ))}
    <circle r={r * 0.45} fill={center} />
  </g>
)

const Daisies = ({ theme }: OrnamentProps) => (
  <>
    <Daisy cx={34} cy={42} r={19} petal={pick(theme.palette, 0)} center={pick(theme.palette, 3)} />
    <Daisy cx={168} cy={36} r={13} petal={pick(theme.palette, 1)} center={pick(theme.palette, 4)} />
    <Daisy cx={156} cy={228} r={22} petal={pick(theme.palette, 2)} center={pick(theme.palette, 0)} />
    <Daisy cx={28} cy={236} r={14} petal={pick(theme.palette, 3)} center={pick(theme.palette, 1)} />
  </>
)

const Waves = ({ theme }: OrnamentProps) => (
  <>
    {[0, 1, 2].map((index) => (
      <path
        key={`top-${index}`}
        d={`M-10 ${22 + index * 15} q 30 -14 60 0 t 60 0 t 60 0 t 60 0`}
        fill="none"
        stroke={pick(theme.palette, index)}
        strokeWidth="7"
        strokeLinecap="round"
        opacity={0.9 - index * 0.12}
      />
    ))}
    {[0, 1, 2].map((index) => (
      <path
        key={`bottom-${index}`}
        d={`M-10 ${212 + index * 15} q 30 14 60 0 t 60 0 t 60 0 t 60 0`}
        fill="none"
        stroke={pick(theme.palette, index + 2)}
        strokeWidth="7"
        strokeLinecap="round"
        opacity={0.9 - index * 0.12}
      />
    ))}
  </>
)

const Star = ({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) => (
  <path
    d={`M${cx} ${cy - r} Q ${cx + r * 0.16} ${cy - r * 0.16} ${cx + r} ${cy}
        Q ${cx + r * 0.16} ${cy + r * 0.16} ${cx} ${cy + r}
        Q ${cx - r * 0.16} ${cy + r * 0.16} ${cx - r} ${cy}
        Q ${cx - r * 0.16} ${cy - r * 0.16} ${cx} ${cy - r} Z`}
    fill={fill}
  />
)

const Sparkles = ({ theme }: OrnamentProps) => (
  <>
    <Star cx={30} cy={38} r={17} fill={pick(theme.palette, 0)} />
    <Star cx={170} cy={58} r={11} fill={pick(theme.palette, 1)} />
    <Star cx={52} cy={228} r={13} fill={pick(theme.palette, 2)} />
    <Star cx={162} cy={214} r={20} fill={pick(theme.palette, 3)} />
    <Star cx={100} cy={26} r={8} fill={pick(theme.palette, 4)} />
    <Star cx={122} cy={246} r={9} fill={pick(theme.palette, 0)} />
  </>
)

const Dots = ({ theme }: OrnamentProps) => (
  <>
    {Array.from({ length: 26 }, (_, index) => {
      const column = index % 6
      const row = Math.floor(index / 6)
      const isEdge = row === 0 || row === 4 || column === 0 || column === 5
      if (!isEdge) return null

      return (
        <circle
          key={index}
          cx={20 + column * 32}
          cy={24 + row * 56}
          r={index % 3 === 0 ? 8 : 5}
          fill={pick(theme.palette, index)}
        />
      )
    })}
  </>
)

const Rays = ({ theme }: OrnamentProps) => (
  <g transform="translate(100 -24)">
    {Array.from({ length: 11 }, (_, index) => (
      <path
        key={index}
        d="M0 0 L -13 86 L 13 86 Z"
        fill={pick(theme.palette, index)}
        opacity="0.8"
        transform={`rotate(${-75 + index * 15})`}
      />
    ))}
    <circle r="26" fill={pick(theme.palette, 3)} />
  </g>
)

const Flowers = ({ theme }: OrnamentProps) => (
  <>
    <g transform="translate(26 224)">
      <path d="M0 40 C 0 12 8 0 8 0" stroke={pick(theme.palette, 2)} strokeWidth="4" fill="none" />
      <Daisy cx={8} cy={-2} r={15} petal={pick(theme.palette, 0)} center={pick(theme.palette, 3)} />
    </g>
    <g transform="translate(172 216)">
      <path d="M0 48 C 0 16 -8 0 -8 0" stroke={pick(theme.palette, 2)} strokeWidth="4" fill="none" />
      <Daisy cx={-8} cy={-2} r={19} petal={pick(theme.palette, 1)} center={pick(theme.palette, 4)} />
    </g>
    <Daisy cx={166} cy={38} r={12} petal={pick(theme.palette, 3)} center={pick(theme.palette, 0)} />
  </>
)

const GradientBands = ({ theme }: OrnamentProps) => (
  <>
    {[0, 1, 2, 3].map((index) => (
      <path
        key={index}
        d={`M-10 ${186 + index * 22} q 55 -26 110 0 t 110 0 L 210 290 L -10 290 Z`}
        fill={pick(theme.palette, index)}
        opacity={0.55 + index * 0.12}
      />
    ))}
  </>
)

const Clouds = ({ theme }: OrnamentProps) => (
  <>
    <g transform="translate(24 34)">
      <ellipse cx="0" cy="8" rx="26" ry="16" fill={pick(theme.palette, 0)} />
      <ellipse cx="22" cy="2" rx="20" ry="14" fill={pick(theme.palette, 0)} />
      <ellipse cx="42" cy="10" rx="18" ry="12" fill={pick(theme.palette, 0)} />
    </g>
    <g transform="translate(126 232)">
      <ellipse cx="0" cy="8" rx="30" ry="18" fill={pick(theme.palette, 1)} />
      <ellipse cx="26" cy="0" rx="22" ry="15" fill={pick(theme.palette, 1)} />
    </g>
    <circle cx="176" cy="50" r="16" fill={pick(theme.palette, 2)} />
  </>
)

const Leaves = ({ theme }: OrnamentProps) => (
  <>
    {[
      { x: 22, y: 30, rotate: -18, scale: 1 },
      { x: 176, y: 44, rotate: 34, scale: 0.75 },
      { x: 30, y: 234, rotate: 148, scale: 0.85 },
      { x: 170, y: 224, rotate: 198, scale: 1.05 },
    ].map((leaf, index) => (
      <g
        key={index}
        transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}
      >
        <path
          d="M0 0 C 26 -14 44 4 30 34 C 14 50 -6 34 0 0 Z"
          fill={pick(theme.palette, index)}
        />
        <path d="M2 4 C 14 12 22 22 26 30" stroke={theme.background} strokeWidth="2.5" fill="none" />
      </g>
    ))}
  </>
)

const Confetti = ({ theme }: OrnamentProps) => (
  <>
    {Array.from({ length: 18 }, (_, index) => {
      // Posiciones deterministas: un Math.random() aquí haría que la tarjeta
      // se redibujara distinta en cada render y parpadearía al animarse.
      const x = 14 + ((index * 53) % 176)
      const y = 18 + ((index * 97) % 250)
      const inSafeArea = y > 74 && y < 200
      if (inSafeArea) return null

      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={index % 3 === 0 ? 10 : 6}
          height={index % 2 === 0 ? 14 : 9}
          rx="2"
          fill={pick(theme.palette, index)}
          transform={`rotate(${(index * 37) % 180} ${x + 5} ${y + 6})`}
        />
      )
    })}
  </>
)

const Crescents = ({ theme }: OrnamentProps) => (
  <>
    <g transform="translate(32 40)">
      <path d="M0 0 A 22 22 0 1 0 22 22 A 17 17 0 1 1 0 0 Z" fill={pick(theme.palette, 0)} />
    </g>
    <g transform="translate(168 220) rotate(150)">
      <path d="M0 0 A 26 26 0 1 0 26 26 A 20 20 0 1 1 0 0 Z" fill={pick(theme.palette, 1)} />
    </g>
    <Star cx={166} cy={46} r={10} fill={pick(theme.palette, 2)} />
    <Star cx={40} cy={234} r={13} fill={pick(theme.palette, 3)} />
    <Star cx={104} cy={22} r={7} fill={pick(theme.palette, 4)} />
  </>
)

const RENDERERS: Record<PromisePattern, (props: OrnamentProps) => React.JSX.Element> = {
  arcs: Arcs,
  daisies: Daisies,
  waves: Waves,
  sparkles: Sparkles,
  dots: Dots,
  rays: Rays,
  flowers: Flowers,
  gradientBands: GradientBands,
  clouds: Clouds,
  leaves: Leaves,
  confetti: Confetti,
  crescents: Crescents,
}

/**
 * Ornamento decorativo de la tarjeta.
 *
 * `aria-hidden` porque es puramente decorativo: el lector de pantalla debe
 * leer el versículo, no describirle guirnaldas a nadie. El viewBox fijo de
 * 200×290 permite escalar la tarjeta sin recalcular geometría.
 */
export const PromiseOrnament = memo(function PromiseOrnament({ theme, opacity = 1 }: PromiseOrnamentProps) {
  const Pattern = RENDERERS[theme.pattern]

  return (
    <svg
      viewBox="0 0 200 290"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 size-full"
      style={{ opacity }}
    >
      <Pattern theme={theme} />
    </svg>
  )
})
