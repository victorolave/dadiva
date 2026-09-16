import { Crown, ScrollText, Sparkles } from 'lucide-react'
import { Avatar, Badge, Sticker } from '@ui/atoms'
import type { Member } from '../../domain/entities/Member'

export interface MemberListProps {
  readonly members: readonly Member[]
  readonly currentUserId: string
}

export const MemberList = ({ members, currentUserId }: MemberListProps) => (
  <section aria-labelledby="participantes" className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="eyebrow">Participantes</p>
        <h2 id="participantes" className="mt-2 text-h3">
          Quiénes van.
        </h2>
      </div>

      <Badge tone="neutral">
        {members.length} {members.length === 1 ? 'persona' : 'personas'}
      </Badge>
    </div>

    {/* grid-cols-1 explícito: sin él, la columna implícita en móvil crece con
          su contenido (no usa minmax(0,1fr)), el truncate del nombre nunca se
          activa y un nombre largo desborda la pantalla a 360px. */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const isMe = member.userId === currentUserId

        return (
          <Sticker
            key={member.id}
            as="li"
            tone={isMe ? 'blush' : 'paper'}
            elevation="sm"
            className="flex list-none items-center gap-3 rounded-tile p-3.5"
          >
            <Avatar emoji={member.avatarEmoji} tint={isMe ? 'paper' : 'blush'} />

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {member.displayName}
                {isMe && <span className="ml-1.5 text-sm text-ink-soft">(tú)</span>}
              </p>

              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {member.isOwner && (
                  <Badge tone="apricot">
                    <Crown className="size-3" aria-hidden="true" />
                    Organiza
                  </Badge>
                )}
                {member.hasWishlist && (
                  <Badge tone="neutral">
                    <ScrollText className="size-3" aria-hidden="true" />
                    Tiene lista
                  </Badge>
                )}
                {member.hasDrawnPromise && (
                  <Badge tone="neutral">
                    <Sparkles className="size-3" aria-hidden="true" />
                    Promesa
                  </Badge>
                )}
              </div>
            </div>
          </Sticker>
        )
      })}
    </ul>
  </section>
)
