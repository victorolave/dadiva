import { Crown, ScrollText, Sparkles } from 'lucide-react'
import { Badge, Sticker } from '@ui/atoms'
import type { Member } from '../../domain/entities/Member'

export interface MemberListProps {
  readonly members: readonly Member[]
  readonly currentUserId: string
}

export const MemberList = ({ members, currentUserId }: MemberListProps) => (
  <section aria-labelledby="participantes" className="flex flex-col gap-3">
    <h2 id="participantes" className="text-display-sm">
      Quiénes van ({members.length})
    </h2>

    <ul className="grid gap-2 sm:grid-cols-2">
      {members.map((member) => {
        const isMe = member.userId === currentUserId

        return (
          <Sticker
            key={member.id}
            as="li"
            tone={isMe ? 'blush' : 'paper'}
            className="flex list-none items-center gap-3 p-3.5"
          >
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper text-lg"
            >
              {member.avatarEmoji}
            </span>

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
                  <Badge tone="sky">
                    <ScrollText className="size-3" aria-hidden="true" />
                    Tiene lista
                  </Badge>
                )}
                {member.hasDrawnPromise && (
                  <Badge tone="sage">
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
