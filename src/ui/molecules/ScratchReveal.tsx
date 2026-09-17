import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { prefersReducedMotion } from '@animations'
import { cn } from '../utils/cn'
import { Button } from '../atoms/Button'
import isotipoMono128 from '../../assets/brand/isotipo-monocromo-128.webp'

export interface ScratchRevealProps {
  /** Lo que queda debajo de la capa que se raspa. */
  readonly children: ReactNode
  /** Texto de la cubierta. Corto: se dibuja en canvas. */
  readonly coverLabel?: string
  /** Texto del botón accesible que revela sin raspar. */
  readonly skipLabel?: string
  /** Proporción raspada a partir de la cual se revela sola. 0 a 1. */
  readonly threshold?: number
  readonly onRevealed: () => void
  readonly className?: string
}

/**
 * Opciones del contexto 2D.
 *
 * `willReadFrequently` avisa al navegador de que vamos a leer píxeles seguido
 * (para medir cuánto se raspó) y mantiene el lienzo en memoria en vez de en la
 * GPU, donde cada `getImageData` costaría una transferencia. IMPORTA que todas
 * las llamadas a `getContext` usen las mismas opciones: solo se aplican en la
 * primera, y las siguientes devuelven el contexto ya creado.
 */
const CONTEXT_OPTIONS: CanvasRenderingContext2DSettings = { willReadFrequently: true }

/**
 * Familia de la etiqueta del canvas, tal como la registra Fontsource en
 * `--font-sans` (ver `src/styles/theme.css`). Se lee del token en vez de
 * repetir el nombre literal aquí: un canvas no hereda CSS, así que
 * `ctx.font` necesita el nombre EXACTO de la familia — si el token cambia
 * (como pasó al migrar de la Google Fonts `'Nunito Sans'` a la
 * autoalojada `'Nunito Sans Variable'`) y este archivo sigue con el nombre
 * viejo, el canvas cae en silencio a la tipografía del sistema: no hay
 * error, solo un texto que se ve distinto al resto de la app. Leyendo el
 * token, un cambio de fuente futuro no puede volver a desincronizar esto.
 */
const FALLBACK_SANS_FONT_FAMILY =
  "'Nunito Sans Variable', ui-sans-serif, system-ui, -apple-system, sans-serif"

export const resolveSansFontFamily = (): string => {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
    return FALLBACK_SANS_FONT_FAMILY
  }

  const token = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim()
  return token || FALLBACK_SANS_FONT_FAMILY
}

/** Radio del "dedo" que borra, en píxeles CSS. */
const BRUSH_RADIUS = 26

/** Cada cuántos milisegundos se recalcula cuánto se ha raspado. */
const SAMPLE_INTERVAL_MS = 120

/** Duración del fundido de la capa al completarse el raspado. */
const FADE_MS = 420

/**
 * Isotipo monocromo compartido entre todas las instancias de la cubierta:
 * un solo `Image` que se cachea y se reutiliza, en vez de crear uno por
 * cada tarjeta que se raspa en la pantalla.
 */
let cachedIsotipoMono: HTMLImageElement | null = null
const getIsotipoMono = (): HTMLImageElement => {
  if (!cachedIsotipoMono) {
    const img = new Image()
    img.src = isotipoMono128
    cachedIsotipoMono = img
  }
  return cachedIsotipoMono
}

/**
 * Raspa para revelar.
 *
 * La cubierta es un canvas encima del contenido. Al arrastrar se borra con
 * `destination-out`, que recorta el trazo del relleno en vez de pintar encima:
 * por eso aparece el contenido real y no un color.
 *
 * Accesibilidad: raspar es un gesto de puntero y no todo el mundo puede
 * hacerlo. Siempre hay un botón visible que revela sin raspar — no escondido
 * tras una preferencia ni disponible solo con teclado, porque quien usa un
 * lector de pantalla o tiene poca movilidad no debería tener que descubrir un
 * atajo. La capa de canvas es decorativa y queda fuera del árbol de
 * accesibilidad.
 */
export const ScratchReveal = ({
  children,
  coverLabel = 'RASPA AQUÍ',
  skipLabel = 'Revelar sin raspar',
  threshold = 0.5,
  onRevealed,
  className,
}: ScratchRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isPointerDown = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const lastSampleAt = useRef(0)
  const hasRevealed = useRef(false)
  const fadeTimer = useRef<number | undefined>(undefined)

  const [isRevealed, setIsRevealed] = useState(false)
  const [hasScratched, setHasScratched] = useState(false)
  // `true` recién después de que el primer `fillRect` opaco pinta el canvas.
  // Mientras es `false`, el contenido de abajo queda oculto con
  // `visibility:hidden` (ver el wrapper más abajo): es la fuga de privacidad
  // que se corrige acá. Sin esto, el canvas nace transparente (recién
  // adquiere tamaño real un instante después) y en ese primer fotograma se
  // alcanza a ver el nombre del amigo secreto debajo, aunque tenga
  // `aria-hidden`, porque eso solo afecta al árbol de accesibilidad, no al
  // pintado visual.
  const [coverReady, setCoverReady] = useState(false)

  const reveal = useCallback(() => {
    if (hasRevealed.current) return
    hasRevealed.current = true

    const canvas = canvasRef.current
    const reduced = prefersReducedMotion()

    if (canvas) {
      if (!reduced) canvas.style.transition = `opacity ${FADE_MS}ms ease-out`
      canvas.style.opacity = '0'
    }

    // El aviso al padre se retrasa hasta que el fundido termina.
    // Antes se llamaba de inmediato y el padre cambiaba el elemento en el
    // acto: el fundido existía en el código pero nunca se veía.
    const finish = () => {
      setIsRevealed(true)
      onRevealed()
    }

    if (reduced) finish()
    else fadeTimer.current = window.setTimeout(finish, FADE_MS)
  }, [onRevealed])

  useEffect(() => () => window.clearTimeout(fadeTimer.current), [])

  /** Pinta la cubierta. Se rehace si cambia el tamaño y aún nadie ha raspado. */
  const paintCover = useCallback(async () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    // El canvas se dibuja a la resolución real del dispositivo; si no, en
    // pantallas retina la cubierta se ve borrosa.
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d', CONTEXT_OPTIONS)
    if (!ctx) return

    ctx.scale(ratio, ratio)
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#cbc8f1'
    ctx.fillRect(0, 0, width, height)

    // A partir de acá el canvas ya es 100% opaco: es seguro dejar ver el
    // contenido de abajo (el wrapper con `visibility:hidden` lo revela).
    // Todo lo que sigue (chispas, isotipo, etiqueta) es decoración que se
    // dibuja ENCIMA de un relleno que ya cubre por completo.
    setCoverReady(true)

    // Chispas del mismo lenguaje que el reverso de las cartas del mazo.
    ctx.fillStyle = 'rgba(27, 25, 23, 0.14)'
    const step = 26
    for (let y = step / 2; y < height; y += step) {
      for (let x = step / 2; x < width; x += step) {
        const alterna = Math.round((x + y) / step) % 2 === 0
        ctx.beginPath()
        if (alterna) {
          ctx.arc(x, y, 2.6, 0, Math.PI * 2)
        } else {
          ctx.moveTo(x, y - 5)
          ctx.quadraticCurveTo(x + 1, y - 1, x + 5, y)
          ctx.quadraticCurveTo(x + 1, y + 1, x, y + 5)
          ctx.quadraticCurveTo(x - 1, y + 1, x - 5, y)
          ctx.quadraticCurveTo(x - 1, y - 1, x, y - 5)
        }
        ctx.fill()
      }
    }

    // Isotipo monocromo centrado. Su interior transparente toma el color de
    // la cubierta (lilac-300) que ya está pintada debajo. Se dibuja "mejor
    // esfuerzo": si la imagen todavía no cargó o falla, seguimos sin ella —
    // nunca bloquea el relleno opaco, que ya quedó garantizado arriba.
    const mono = getIsotipoMono()
    const drawMono = () => {
      // Puede resolver después de que este componente se desmonte o de que
      // ya se haya empezado a raspar; en ambos casos no hay canvas válido
      // que pintar (o pintaríamos sobre el progreso de la persona).
      if (!canvasRef.current || hasRevealed.current) return
      try {
        ctx.drawImage(mono, width / 2 - 22, height / 2 - 40, 44, 44)
      } catch {
        // SVG/WebP corrupto o decodificación fallida: se omite en silencio.
      }
    }
    if (mono.complete && mono.naturalWidth > 0) {
      drawMono()
    } else {
      mono.addEventListener('load', drawMono, { once: true })
    }

    // Nunito Sans 700, igual que la utilidad `.eyebrow` del resto de la app
    // (antes DM Mono, que ahora queda solo para código y datos técnicos).
    const sansFontFamily = resolveSansFontFamily()
    const canvasFont = `700 13px ${sansFontFamily}`

    // Esperamos a las fuentes: si no, la etiqueta se dibuja con la tipografía
    // de reserva y queda distinta al resto de la interfaz. `fonts.ready` por
    // sí solo solo cubre las fuentes que YA se pidieron para el layout
    // actual: si nada más en pantalla usó todavía el peso 700 de la
    // variable, esa cara concreta podría no estar cargada aún. `fonts.load`
    // la pide explícitamente antes de esperar a `ready`.
    try {
      await document.fonts.load(canvasFont)
      await document.fonts.ready
    } catch {
      // Sin soporte de la API de fuentes seguimos con la de reserva.
    }

    ctx.fillStyle = '#1b1917'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = canvasFont
    ctx.letterSpacing = '0.14em'
    ctx.fillText(coverLabel, width / 2, height / 2 + 24)
  }, [coverLabel])

  // Ancla el pintado antes del primer pintado del navegador. Con `useEffect`
  // React confirma el DOM (los `children` reales ya montados) y el navegador
  // alcanza a pintar ESE fotograma antes de que el efecto corra; con
  // `useLayoutEffect` el relleno opaco del canvas se dibuja de forma
  // síncrona como parte del mismo commit, así que nunca existe un fotograma
  // intermedio con la cubierta vacía. Esta es la otra mitad de la corrección
  // de la fuga (la otra mitad es `coverReady` más abajo).
  useLayoutEffect(() => {
    void paintCover()

    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      // Repintar borraría el progreso, así que solo se hace mientras nadie
      // haya empezado a raspar.
      if (!hasScratched && !hasRevealed.current) void paintCover()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [paintCover, hasScratched])

  /** Proporción de cubierta ya borrada, muestreando 1 de cada 16 píxeles. */
  const scratchedRatio = useCallback((): number => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', CONTEXT_OPTIONS)
    if (!canvas || !ctx) return 0

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let transparent = 0
    let total = 0

    // Paso de 16 píxeles (64 bytes): suficiente para estimar y barato de leer
    // en cada muestreo.
    for (let i = 3; i < data.length; i += 64) {
      total += 1
      if ((data[i] ?? 255) < 128) transparent += 1
    }

    return total === 0 ? 0 : transparent / total
  }, [])

  const scratchAt = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d', CONTEXT_OPTIONS)
      if (!canvas || !ctx) return

      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = BRUSH_RADIUS * 2

      const previous = lastPoint.current
      ctx.beginPath()
      if (previous) {
        // Unir con el punto anterior: sin esto, un arrastre rápido deja
        // círculos sueltos en vez de un trazo continuo.
        ctx.moveTo(previous.x, previous.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      lastPoint.current = { x, y }

      const now = performance.now()
      if (now - lastSampleAt.current < SAMPLE_INTERVAL_MS) return
      lastSampleAt.current = now

      if (scratchedRatio() >= threshold) reveal()
    },
    [reveal, scratchedRatio, threshold],
  )

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  if (isRevealed) {
    return <div className={cn('relative w-full', className)}>{children}</div>
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/*
        `w-full` es obligatorio aquí: el contenedor padre usa `items-center`,
        que encoge a los hijos al ancho de su contenido. Sin esto la tarjeta
        cubierta medía 363px y la revelada 384px, así que al raspar se
        ensanchaba de golpe — justo lo que se quiso evitar.
      */}
      <div
        ref={containerRef}
        className={cn('relative w-full overflow-hidden rounded-hero', className)}
      >
        {/* `aria-hidden` protege del árbol de accesibilidad; `visibility`
            protege del pintado visual. Hacen falta las dos: un lector de
            pantalla nunca debe anunciar el nombre antes de tiempo, y el
            navegador nunca debe pintarlo antes de que la cubierta esté
            lista (ver `coverReady` arriba). */}
        <div aria-hidden="true" style={{ visibility: coverReady ? 'visible' : 'hidden' }}>
          {children}
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            isPointerDown.current = true
            setHasScratched(true)
            lastPoint.current = null
            const { x, y } = pointFromEvent(event)
            scratchAt(x, y)
          }}
          onPointerMove={(event) => {
            if (!isPointerDown.current) return
            const { x, y } = pointFromEvent(event)
            scratchAt(x, y)
          }}
          onPointerUp={() => {
            isPointerDown.current = false
            lastPoint.current = null
            // Al soltar se comprueba una vez más, sin esperar al muestreo.
            if (scratchedRatio() >= threshold) reveal()
          }}
          onPointerLeave={() => {
            isPointerDown.current = false
            lastPoint.current = null
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="eyebrow" role="status">
          {hasScratched ? 'Sigue raspando…' : 'Raspa con el dedo para descubrirlo'}
        </p>
        <Button variant="ghost" size="sm" onClick={reveal}>
          {skipLabel}
        </Button>
      </div>
    </div>
  )
}
