import type { ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { Sticker } from '@ui/atoms'
import { Doodle, Isotipo } from '@ui/brand'
import { cn } from '@ui/utils/cn'
import { InviteCode } from '../../domain/value-objects/InviteCode'

export interface GroupInvitationCardProps {
  readonly groupName: string
  readonly hostName: string
  readonly codeText: string
  /** Tocar la placa de código también copia el enlace (UI kit: "código
   *  como botón copiable"). Sin este callback la placa queda como texto
   *  plano, no interactivo — así el componente sigue siendo útil aunque
   *  quien lo use no tenga lógica de copiado a mano (p. ej. una vista previa). */
  readonly onCopyCode?: (() => void) | undefined
  readonly copied?: boolean | undefined
  /** Acción principal de la tarjeta: el botón de copiar/compartir enlace. */
  readonly children: ReactNode
  readonly className?: string | undefined
}

/**
 * Anatomía de la tarjeta de invitación tomada del UI kit real
 * (`components/dadiva/GroupInvitationCard.jsx` del Design System): blush-300
 * protagonista, dos círculos ornamentales detrás, isotipo, eyebrow, titular
 * y placa de código.
 *
 * Puramente presentacional: la lógica de copiar/compartir con Web Share vive
 * en `InviteCodeCard`, que le pasa el botón de acción como `children`. Así
 * `CreateGroupPage` puede reusarla algún día para una vista previa sin
 * arrastrar `navigator.clipboard` ni `navigator.share`.
 */
export const GroupInvitationCard = ({
  groupName,
  hostName,
  codeText,
  onCopyCode,
  copied = false,
  children,
  className,
}: GroupInvitationCardProps) => (
  <Sticker
    tone="blush"
    strong
    size="hero"
    className={cn('relative isolate overflow-hidden p-6 text-center sm:p-8', className)}
  >
    {/* Círculos ornamentales del tablero: recortados por el overflow-hidden
        de la propia tarjeta, nunca sobre el texto de encima. */}
    <span
      aria-hidden="true"
      className="absolute -left-12 -top-12 -z-10 size-40 rounded-full bg-blush-500/50"
    />
    <span
      aria-hidden="true"
      className="absolute -bottom-14 -right-14 -z-10 size-44 rounded-full bg-lilac-300/80"
    />
    <Doodle kind="sparks" className="absolute right-6 top-6 size-6 text-apricot-500" />

    <Isotipo size={56} />
    <p className="eyebrow mt-4">Invitación</p>
    <h2 className="mt-2 text-h2">Hay un lugar para ti.</h2>
    <p className="mx-auto mt-2 max-w-xs text-base">
      {hostName} te invita al amigo secreto «{groupName}».
    </p>

    {onCopyCode ? (
      <button
        type="button"
        onClick={onCopyCode}
        aria-label={copied ? 'Código copiado' : 'Copiar código de invitación'}
        className="mt-5 inline-flex items-center gap-2 rounded-control border-2 border-ink bg-paper px-5 py-2 font-mono font-medium text-code tracking-[0.14em] text-ink shadow-sticker-sm transition-shadow duration-120 hover:shadow-sticker focus-visible:shadow-sticker"
      >
        {codeText}
        {copied ? (
          <Check className="size-5 shrink-0" aria-hidden="true" />
        ) : (
          <Copy className="size-5 shrink-0 text-ink-soft" aria-hidden="true" />
        )}
      </button>
    ) : (
      <p className="mt-5 inline-block rounded-control border-2 border-ink bg-paper px-5 py-2 font-mono font-medium text-code tracking-[0.14em] shadow-sticker-sm">
        {codeText}
      </p>
    )}

    <p className="mt-3 text-sm text-ink-soft">
      Código de {InviteCode.LENGTH} caracteres. Solo quien lo tenga puede entrar.
    </p>

    <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>
  </Sticker>
)
