import { Link } from 'react-router-dom'
import { CalendarDays, Plus, Ticket, Users } from 'lucide-react'
import { useMyGroups } from '@modules/groups/presentation/hooks/useMyGroups'
import { GROUP_STATUS_LABEL } from '@modules/groups/domain/value-objects/GroupStatus'
import {
  GROUP_STATUS_BADGE_TONE,
  GROUP_STATUS_CARD_TONE,
} from '@modules/groups/presentation/groupStatusTone'
import { useEntranceAnimation } from '@animations'
import { Alert, Badge, LinkButton, Skeleton, Sticker } from '@ui/atoms'
import { StateBlock } from '@ui/molecules/StateBlock'

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' }).format(date)

export const GroupsPage = () => {
  const { groups, error, isLoading } = useMyGroups()
  const containerRef = useEntranceAnimation<HTMLDivElement>({ stagger: 0.06 }, [groups?.length])

  return (
    <div ref={containerRef} className="flex flex-col gap-8">
      <header
        data-animate
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="eyebrow">Tus grupos</p>
          <h1 className="mt-2 text-h1">Mis grupos.</h1>
          <p className="mt-2 text-lead text-ink-soft">Todo lo tuyo, en un solo lugar.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton
            to="/unirse"
            variant="secondary"
            className="w-full sm:w-auto"
            iconStart={<Ticket className="size-4" aria-hidden="true" />}
          >
            Unirme con un código
          </LinkButton>
          <LinkButton
            to="/grupos/nuevo"
            className="w-full sm:w-auto"
            iconStart={<Plus className="size-4" aria-hidden="true" />}
          >
            Crear mi grupo
          </LinkButton>
        </div>
      </header>

      {error && <Alert tone="error">{error.message}</Alert>}

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2" aria-busy="true">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}

      {groups?.length === 0 && (
        <StateBlock
          tone="empty"
          eyebrow="Empieza aquí"
          title="Todavía no tienes grupos."
          data-animate
          action={
            <LinkButton to="/grupos/nuevo" size="lg">
              Crear mi primer grupo
            </LinkButton>
          }
        >
          Crea el primero e invita a tu familia, tu célula o tu oficina. Solo necesitas
          un nombre y ganas.
        </StateBlock>
      )}

      {groups && groups.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2">
          {groups.map((group) => (
            <Sticker
              key={group.id}
              as="li"
              tone={GROUP_STATUS_CARD_TONE[group.status]}
              className="list-none"
              data-animate
            >
              {/* El hover vive en el hijo (el `Link`), no en el `li` que GSAP
                  anima: GSAP escribe `transform` inline en el elemento con
                  `data-animate`, y un `hover:-translate-y-1` de Tailwind ahí
                  mismo quedaría pisado por ese `transform`. */}
              <Link
                to={`/grupos/${group.id}`}
                className="flex flex-col gap-3 rounded-card p-6 no-underline transition-colors duration-120 hover:bg-paper/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-h3">{group.name}</h2>
                  <Badge tone={GROUP_STATUS_BADGE_TONE[group.status]} dot>
                    {GROUP_STATUS_LABEL[group.status]}
                  </Badge>
                </div>

                <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden="true" />
                    <dt className="sr-only">Personas</dt>
                    <dd>
                      {group.memberCount} {group.memberCount === 1 ? 'persona' : 'personas'}
                    </dd>
                  </div>

                  {group.exchangeDate && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-4" aria-hidden="true" />
                      <dt className="sr-only">Fecha del intercambio</dt>
                      <dd>{formatDate(group.exchangeDate)}</dd>
                    </div>
                  )}
                </dl>

                {group.isOwner && (
                  <Badge tone="apricot" className="self-start">
                    Tú organizas
                  </Badge>
                )}
              </Link>
            </Sticker>
          ))}
        </ul>
      )}
    </div>
  )
}
