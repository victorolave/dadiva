import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { Button, Sticker } from '@ui/atoms'
import type { InviteCode } from '../../domain/value-objects/InviteCode'

export interface InviteCodeCardProps {
  readonly code: InviteCode
  readonly groupName: string
}

export const InviteCodeCard = ({ code, groupName }: InviteCodeCardProps) => {
  const [copied, setCopied] = useState(false)

  const inviteUrl = `${window.location.origin}/unirse/${code.value}`
  const shareText = `Te invito al amigo secreto "${groupName}" en Dádiva. Entra con este enlace: ${inviteUrl}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // Sin permiso de portapapeles (o contexto inseguro) el código sigue
      // visible en pantalla para teclearlo a mano. No hace falta alarmar.
    }
  }

  const handleShare = async () => {
    // `share` no existe en escritorio; ahí caemos a copiar, que es lo útil.
    if (!navigator.share) {
      await handleCopy()
      return
    }

    try {
      await navigator.share({ title: `Dádiva · ${groupName}`, text: shareText, url: inviteUrl })
    } catch {
      // La persona canceló el diálogo del sistema. No es un error.
    }
  }

  return (
    <Sticker tone="lilac" className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="label-mono text-ink-soft">Código de invitación</h2>
        <p className="mt-1 font-mono text-3xl tracking-[0.18em]">{code.formatted}</p>
      </div>

      <p className="text-sm text-ink-soft">
        Comparte el código o el enlace. Quien lo reciba entra directo al grupo.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleCopy()}
          iconStart={
            copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />
          }
        >
          {copied ? 'Copiado' : 'Copiar enlace'}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleShare()}
          iconStart={<Share2 className="size-4" aria-hidden="true" />}
        >
          Compartir
        </Button>
      </div>

      {/* El estado de copiado se anuncia sin interrumpir al lector de pantalla. */}
      <p role="status" className="sr-only">
        {copied ? 'Enlace copiado al portapapeles' : ''}
      </p>
    </Sticker>
  )
}
