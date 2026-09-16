import { Sticker } from '@ui/atoms'
import { Blob, Doodle, Isotipo } from '@ui/brand'

/**
 * Collage de la portada: dos tarjetas superpuestas sobre un par de blobs,
 * igual que en el tablero de marca.
 *
 * Es SOLO maquetación: no importa el módulo de promesas ni datos reales, así
 * la landing sigue en el bundle inicial (ver el comentario de lazy-loading
 * en `App.tsx`). El código «ABCD-2345» y el nombre del grupo son ficticios a
 * propósito — nunca se filtra información real de una asignación aquí.
 *
 * `[container-type:inline-size]` habilita las unidades `cqw` de dentro:
 * el tamaño de la tipografía de las tarjetas escala con el ancho del propio
 * collage, no con el viewport, así se ve bien tanto en la columna angosta
 * de móvil como en la ancha de escritorio.
 */
export const HeroCollage = () => (
  <div
    data-animate
    aria-hidden="true"
    className="relative isolate mx-auto aspect-[5/4] w-full max-w-[20rem] [container-type:inline-size] sm:max-w-[28rem]"
  >
    <Blob shape="a" tone="lilac" className="absolute -top-[6%] -right-[8%] -z-10 w-[70%]" />
    <Blob shape="c" tone="sage" className="absolute -bottom-[4%] -left-[6%] -z-10 w-[32%]" />

    {/* Tarjeta trasera: la promesa que espera al final del intercambio. */}
    <Sticker
      tone="paper"
      size="card"
      className="absolute top-0 right-0 w-[62%] rotate-[4deg] p-[5cqw] text-center"
    >
      <Isotipo size={40} className="mx-auto" />
      <p className="mt-[3cqw] font-display text-[6.5cqw] leading-tight">
        Una promesa para guardar.
      </p>
      <span className="mx-auto my-[3cqw] block h-[3px] w-[18%] rounded-pill bg-lilac-500" />
      <p className="eyebrow">Santiago 1:17</p>
    </Sticker>

    {/* Tarjeta delantera: la invitación, el primer contacto con el grupo. */}
    <Sticker
      tone="blush"
      strong
      size="hero"
      className="absolute bottom-0 left-0 w-[70%] -rotate-[3deg] overflow-hidden p-[5cqw] text-center"
    >
      {/* Sin z-index: al no estar posicionados, los hijos de abajo (todos
          `relative`) pintan encima de este blob en el mismo orden del DOM. */}
      <Blob shape="b" tone="blush" shade={500} className="absolute -top-[15%] -left-[15%] w-[55%]" />
      <Isotipo size={56} className="relative mx-auto" />
      <p className="relative mt-[3cqw] font-display text-[7.5cqw] leading-tight">
        Un detalle. Una alegría.
      </p>
      <p className="relative mt-[1cqw] text-[4cqw] text-ink">Te invito a mi grupo</p>
      <span className="relative mt-[3cqw] inline-block rounded-control border-2 border-ink bg-paper px-[3cqw] py-[1cqw] font-mono font-medium text-[4.5cqw] tracking-[0.14em]">
        ABCD-2345
      </span>
    </Sticker>

    <Doodle kind="heart" className="absolute right-[4%] bottom-[30%] w-[10%] text-lilac-500" />
  </div>
)
