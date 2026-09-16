import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Coins, Shuffle } from 'lucide-react'
import { asGroupId } from '@core/domain/Entity'
import type { DomainError } from '@core/domain/DomainError'
import { useContainer } from '@app/composition/ContainerProvider'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { useGroupDetail } from '@modules/groups/presentation/hooks/useGroupDetail'
import { MemberList } from '@modules/groups/presentation/components/MemberList'
import { InviteCodeCard } from '@modules/groups/presentation/components/InviteCodeCard'
import { AssignmentReveal } from '@modules/groups/presentation/components/AssignmentReveal'
import type { MyAssignment } from '@modules/groups/domain/repositories/AssignmentRepository'
import {
  GROUP_STATUS_DESCRIPTION,
  GROUP_STATUS_LABEL,
} from '@modules/groups/domain/value-objects/GroupStatus'
import { PromiseDeck } from '@modules/promises/presentation/components/PromiseDeck'
import { PROMISE_CATALOG } from '@modules/promises/infrastructure/data/promiseCatalog'
import type { PromiseCard } from '@modules/promises/domain/entities/PromiseCard'
import { Alert, Badge, Button, Skeleton, Sticker } from '@ui/atoms'

const STATUS_TONE = { draft: 'sky', drawn: 'sage', closed: 'neutral' } as const

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(date)

const formatMoney = (amount: number, currency: string): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

export const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { groups, promises } = useContainer()

  const groupId = id ? asGroupId(id) : null
  const { group, error, isLoading, reload } = useGroupDetail(groupId)

  const [assignment, setAssignment] = useState<MyAssignment | null>(null)
  const [promise, setPromise] = useState<PromiseCard | null>(null)
  const [actionError, setActionError] = useState<DomainError | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Al sortear, cargamos la asignación propia y la promesa guardada.
  useEffect(() => {
    if (!groupId || group?.status !== 'drawn') return

    void groups.revealAssignment.execute({ groupId, markRevealed: false }).then((result) => {
      result.match({ ok: setAssignment, err: () => setAssignment(null) })
    })

    void promises.getMine.execute(groupId).then((result) => {
      result.match({ ok: setPromise, err: () => setPromise(null) })
    })
  }, [groupId, group?.status, groups.revealAssignment, promises.getMine])

  const handleDraw = useCallback(async () => {
    if (!groupId || !user) return

    setActionError(null)
    setIsDrawing(true)

    const result = await groups.runDraw.execute({ groupId, requestedBy: user.id })
    setIsDrawing(false)

    result.match({
      ok: () => void reload(),
      err: (domainError) => setActionError(domainError),
    })
  }, [groupId, user, groups.runDraw, reload])

  const handleDrawPromise = useCallback(async (): Promise<PromiseCard | null> => {
    if (!groupId) return null

    const result = await promises.draw.execute(groupId)
    return result.match<PromiseCard | null>({
      ok: (card) => {
        setPromise(card)
        return card
      },
      err: (domainError) => {
        setActionError(domainError)
        return null
      },
    })
  }, [groupId, promises.draw])

  const markRevealed = useCallback(() => {
    if (!groupId) return
    void groups.revealAssignment.execute({ groupId, markRevealed: true })
  }, [groupId, groups.revealAssignment])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (error || !group || !user) {
    return <Alert tone="error">{error?.message ?? 'No encontramos ese grupo.'}</Alert>
  }

  const isOwner = group.isOwnedBy(user.id)
  const drawGuard = group.canDraw(user.id)
  const daysLeft = group.daysUntilExchange()

  // Las palabras a resaltar viven junto al versículo en el catálogo semilla.
  const highlight =
    PROMISE_CATALOG.find((seed) => seed.reference === promise?.reference)?.highlight ?? []

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-lg">{group.name}</h1>
          <Badge tone={STATUS_TONE[group.status]}>{GROUP_STATUS_LABEL[group.status]}</Badge>
        </div>

        {group.description && <p className="max-w-2xl text-ink-soft">{group.description}</p>}

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          {group.exchangeDate && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              <dt className="sr-only">Fecha del intercambio</dt>
              <dd>
                {formatDate(group.exchangeDate)}
                {daysLeft !== null && daysLeft >= 0 && (
                  <span className="ml-1.5 font-medium text-ink">
                    · {daysLeft === 0 ? '¡es hoy!' : `faltan ${daysLeft} días`}
                  </span>
                )}
              </dd>
            </div>
          )}

          {group.budget && (
            <div className="flex items-center gap-1.5">
              <Coins className="size-4" aria-hidden="true" />
              <dt className="sr-only">Presupuesto</dt>
              <dd>Hasta {formatMoney(group.budget.amount, group.budget.currency)}</dd>
            </div>
          )}
        </dl>

        <p className="text-sm text-ink-faint">{GROUP_STATUS_DESCRIPTION[group.status]}</p>
      </header>

      {actionError && <Alert tone="error">{actionError.message}</Alert>}

      {group.isOpen && (
        <div className="grid gap-5 md:grid-cols-2">
          <InviteCodeCard code={group.inviteCode} groupName={group.name} />

          {isOwner && (
            <Sticker tone="apricot" className="flex flex-col justify-between gap-4 p-6">
              <div>
                <h2 className="text-display-sm">Hacer el sorteo</h2>
                <p className="mt-1.5 text-sm text-ink-soft">
                  Una vez hecho, no se puede deshacer y el grupo se cierra a nuevas personas.
                </p>
              </div>

              {drawGuard.isErr ? (
                <Alert tone="info">{drawGuard.error.message}</Alert>
              ) : (
                <Button
                  size="lg"
                  onClick={() => void handleDraw()}
                  isLoading={isDrawing}
                  iconStart={<Shuffle className="size-5" aria-hidden="true" />}
                >
                  Sortear ahora
                </Button>
              )}
            </Sticker>
          )}
        </div>
      )}

      {group.isDrawn && assignment && (
        <section aria-labelledby="mi-amigo" className="flex flex-col gap-4">
          <h2 id="mi-amigo" className="text-display-md">
            A quién le regalas
          </h2>
          <AssignmentReveal assignment={assignment} onReveal={markRevealed} />
        </section>
      )}

      {group.isDrawn && (
        <section aria-labelledby="mi-promesa" className="flex flex-col gap-4">
          <div>
            <h2 id="mi-promesa" className="text-display-md">
              Tu promesa
            </h2>
            <p className="mt-1 text-ink-soft">
              Una carta del mazo, tuya para todo el intercambio.
            </p>
          </div>

          <PromiseDeck savedCard={promise} highlight={highlight} onDraw={handleDrawPromise} />
        </section>
      )}

      <MemberList members={group.members} currentUserId={user.id} />
    </div>
  )
}
