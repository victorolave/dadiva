import { LinkButton, Sticker } from '@ui/atoms'
import { Blob } from '@ui/brand'

/**
 * Última invitación a actuar, después del versículo de cierre.
 *
 * Los mismos dos destinos que el hero (`/entrar` y `/unirse`): quien llegó
 * hasta acá ya leyó todo, así que el CTA no necesita copy nuevo, solo estar
 * a mano sin tener que volver a subir.
 */
export const FinalCta = () => (
  <section aria-labelledby="empezar" className="relative isolate flex justify-center">
    <Blob
      shape="b"
      tone="lilac"
      className="absolute top-1/2 left-1/2 -z-10 w-72 -translate-x-1/2 -translate-y-1/2"
    />

    <Sticker tone="blush" strong size="hero" className="flex max-w-lg flex-col items-center gap-5 p-8 text-center">
      <h2 id="empezar" className="text-h2">
        ¿Armamos tu grupo?
      </h2>
      <p className="text-base text-ink-soft">
        En un minuto tienes un código para compartir. El sorteo y la promesa esperan a que todos
        entren.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton to="/entrar" size="lg">
          Crear mi grupo
        </LinkButton>
        <LinkButton to="/unirse" size="lg" variant="secondary">
          Tengo un código
        </LinkButton>
      </div>
    </Sticker>
  </section>
)
