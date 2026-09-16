import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { prefersReducedMotion } from '@animations'
import { cn } from '../utils/cn'
import { Button } from '../atoms/Button'

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

/** Radio del "dedo" que borra, en píxeles CSS. */
const BRUSH_RADIUS = 26

/** Cada cuántos milisegundos se recalcula cuánto se ha raspado. */
const SAMPLE_INTERVAL_MS = 120

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

  const [isRevealed, setIsRevealed] = useState(false)
  const [hasScratched, setHasScratched] = useState(false)

  const reveal = useCallback(() => {
    if (hasRevealed.current) return
    hasRevealed.current = true

    const canvas = canvasRef.current
    if (canvas) {
      if (prefersReducedMotion()) {
        canvas.style.opacity = '0'
      } else {
        canvas.style.transition = 'opacity 420ms ease-out'
        canvas.style.opacity = '0'
      }
    }

    setIsRevealed(true)
    onRevealed()
  }, [onRevealed])

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

    // Esperamos a las fuentes: si no, la etiqueta se dibuja con la tipografía
    // de reserva y queda distinta al resto de la interfaz.
    try {
      await document.fonts.ready
    } catch {
      // Sin soporte de la API de fuentes seguimos con la de reserva.
    }

    ctx.fillStyle = '#1b1917'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `500 13px 'DM Mono', ui-monospace, monospace`
    ctx.letterSpacing = '0.18em'
    ctx.fillText(coverLabel, width / 2, height / 2)
  }, [coverLabel])

  useEffect(() => {
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
    return (
      <div className={cn('relative', className)}>
        {children}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className={cn('relative overflow-hidden rounded-card', className)}>
        {/* `aria-hidden` mientras está cubierto: quien usa lector de pantalla
            no debe escuchar el nombre antes de pedir revelarlo. */}
        <div aria-hidden="true">{children}</div>

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
        <p className="label-mono text-ink-soft" role="status">
          {hasScratched ? 'Sigue raspando…' : 'Raspa con el dedo para descubrirlo'}
        </p>
        <Button variant="ghost" size="sm" onClick={reveal}>
          {skipLabel}
        </Button>
      </div>
    </div>
  )
}
