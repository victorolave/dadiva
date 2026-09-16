import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@ui/atoms'
import type { InviteCode } from '../../domain/value-objects/InviteCode'
import { GroupInvitationCard } from './GroupInvitationCard'

export interface InviteCodeCardProps {
  readonly code: InviteCode
  readonly groupName: string
  readonly hostName: string
  readonly className?: string | undefined
}

export const InviteCodeCard = ({ code, groupName, hostName, className }: InviteCodeCardProps) => {
  const [copied, setCopied] = useState(false)

  const inviteUrl = `${window.location.origin}/unirse/${code.value}`
  const shareText = `Te invito al amigo secreto "${groupName}" en Dádiva. Entra con este enlace: ${inviteUrl}`
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

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
    if (!canShare) {
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
    <GroupInvitationCard
      groupName={groupName}
      hostName={hostName}
      codeText={code.formatted}
      onCopyCode={() => void handleCopy()}
      copied={copied}
      className={className}
    >
      {/* Botón único de acción (UI kit del Design System): copia o comparte según lo que
          soporte el dispositivo. La placa de código de arriba también copia
          al tocarla, así que "copiar" siempre queda a un toque sin depender
          de este botón. */}
      <Button
        variant="secondary"
        onClick={() => void handleShare()}
        className="border-ink bg-lilac-300 text-ink hover:bg-lilac-500 active:bg-lilac-500"
        iconStart={<Share2 className="size-4" aria-hidden="true" />}
      >
        {canShare ? 'Compartir enlace' : 'Copiar enlace'}
      </Button>

      {/* El estado de copiado se anuncia sin interrumpir al lector de pantalla. */}
      <p role="status" className="sr-only">
        {copied ? 'Enlace copiado al portapapeles' : ''}
      </p>
    </GroupInvitationCard>
  )
}
