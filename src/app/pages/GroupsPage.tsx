import { Link } from 'react-router-dom'
import { CalendarDays, Plus, Ticket, Users } from 'lucide-react'
import { useMyGroups } from '@modules/groups/presentation/hooks/useMyGroups'
import { GROUP_STATUS_LABEL } from '@modules/groups/domain/value-objects/GroupStatus'
import { useEntranceAnimation } from '@animations'
import { Alert, Badge, LinkButton, Skeleton, Sticker } from '@ui/atoms'

const STATUS_TONE = {
  draft: 'sky',
  drawn: 'sage',
  closed: 'neutral',
} as const

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' }).format(date)

export const GroupsPage = () => {
  const { groups, error, isLoading } = useMyGroups()
  const containerRef = useEntranceAnimation<HTMLDivElement>({ stagger: 0.06 }, [groups?.length])

  return (
    <div ref={containerRef} className="flex flex-col gap-8">
      <header data-animate className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg">Mis grupos</h1>
          <p className="mt-1 text-ink-soft">Todo lo tuyo, en un solo lugar.</p>
        </div>

        <div className="flex gap-2">
          <LinkButton to="/unirse" variant="secondary" iconStart={<Ticket className="size-4" />}>
            Unirme
          </LinkButton>
          <LinkButton to="/grupos/nuevo" iconStart={<Plus className="size-4" />}>
            Crear grupo
          </LinkButton>
        </div>
      </header>

      {error && <Alert tone="error">{error.message}</Alert>}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}

      {groups?.length === 0 && (
        <Sticker data-animate withTape tone="blush" className="p-10 text-center">
          <p className="font-script text-3xl">Todavía no tienes grupos</p>
          <p className="mx-auto mt-3 max-w-sm text-ink-soft">
            Crea el primero e invita a tu familia, tu célula o tu oficina. Solo necesitas
            un nombre y ganas.
          </p>
          <div className="mt-6 flex justify-center">
            <LinkButton to="/grupos/nuevo" size="lg">
              Crear mi primer grupo
            </LinkButton>
          </div>
        </Sticker>
      )}

      {groups && groups.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {groups.map((group, index) => (
            <Sticker
              key={group.id}
              as="li"
              tone={index % 2 === 0 ? 'paper' : 'lilac'}
              className="list-none transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
              data-animate
            >
              <Link to={`/grupos/${group.id}`} className="flex flex-col gap-3 p-6 no-underline">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-display-sm">{group.name}</h2>
                  <Badge tone={STATUS_TONE[group.status]}>{GROUP_STATUS_LABEL[group.status]}</Badge>
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

                {group.isOwner && <Badge tone="apricot">Tú organizas</Badge>}
              </Link>
            </Sticker>
          ))}
        </ul>
      )}
    </div>
  )
}
