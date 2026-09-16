import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, Coins, Crown, Shuffle } from 'lucide-react'
import { asGroupId } from '@core/domain/Entity'
import type { DomainError } from '@core/domain/DomainError'
import { useContainer } from '@app/composition/ContainerProvider'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import { useGroupDetail } from '@modules/groups/presentation/hooks/useGroupDetail'
import { MemberList } from '@modules/groups/presentation/components/MemberList'
import { InviteCodeCard } from '@modules/groups/presentation/components/InviteCodeCard'
import { AssignmentReveal } from '@modules/groups/presentation/components/AssignmentReveal'
import { GROUP_STATUS_BADGE_TONE } from '@modules/groups/presentation/groupStatusTone'
import type { MyAssignment } from '@modules/groups/domain/repositories/AssignmentRepository'
import {
  GROUP_STATUS_DESCRIPTION,
  GROUP_STATUS_LABEL,
} from '@modules/groups/domain/value-objects/GroupStatus'
import { PromiseDeck } from '@modules/promises/presentation/components/PromiseDeck'
import { PROMISE_CATALOG } from '@modules/promises/infrastructure/data/promiseCatalog'
import type { PromiseCard } from '@modules/promises/domain/entities/PromiseCard'
import { WishlistSection } from '@modules/wishlist/presentation/components/WishlistSection'
import { Alert, Badge, Button, Skeleton, Sticker, VisibilityNote } from '@ui/atoms'

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
  const { group, error, isLoading, reload, refresh } = useGroupDetail(groupId)

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
  const showCountdown = daysLeft !== null && daysLeft >= 0
  const myMember = group.memberForUser(user.id)

  // El nombre de quien organiza es público para el grupo (group_members lo
  // expone a todo miembro, ver supabase/migrations/0003_rls_policies.sql),
  // así que mostrarlo en la tarjeta de invitación no filtra nada.
  const hostMember = group.members.find((member) => member.isOwner)
  const hostName = hostMember?.displayName ?? group.name

  // Las palabras a resaltar viven junto al versículo en el catálogo semilla.
  const highlight =
    PROMISE_CATALOG.find((seed) => seed.reference === promise?.reference)?.highlight ?? []

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={GROUP_STATUS_BADGE_TONE[group.status]} dot>
              {GROUP_STATUS_LABEL[group.status]}
            </Badge>
            {isOwner && (
              <Badge tone="apricot">
                <Crown className="size-3" aria-hidden="true" />
                Tú organizas
              </Badge>
            )}
          </div>

          <h1 className="text-h1">{group.name}</h1>

          {group.description && (
            <p className="max-w-reading text-lead text-ink-soft">{group.description}</p>
          )}

          {(group.exchangeDate || group.budget) && (
            <div className="flex flex-wrap gap-2">
              {group.exchangeDate && (
                <span className="inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatDate(group.exchangeDate)}
                </span>
              )}

              {group.budget && (
                <span className="inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold">
                  <Coins className="size-4" aria-hidden="true" />
                  Hasta {formatMoney(group.budget.amount, group.budget.currency)}
                </span>
              )}
            </div>
          )}

          <p className="text-sm text-ink-soft">{GROUP_STATUS_DESCRIPTION[group.status]}</p>
        </div>

        {showCountdown && (
          <Sticker tone="apricot" tilt={2} className="shrink-0 self-start px-6 py-4 text-center">
            {daysLeft === 0 ? (
              <>
                <p className="eyebrow">El intercambio</p>
                <p className="mt-1 text-h2">¡Es hoy!</p>
              </>
            ) : (
              <>
                <p className="eyebrow">Faltan</p>
                <p className="mt-1 font-display text-h1">{daysLeft}</p>
                <p className="text-sm font-bold">{daysLeft === 1 ? 'día' : 'días'}</p>
              </>
            )}
          </Sticker>
        )}
      </header>

      {actionError && <Alert tone="error">{actionError.message}</Alert>}

      {group.isOpen && !isOwner && (
        <InviteCodeCard
          code={group.inviteCode}
          groupName={group.name}
          hostName={hostName}
          className="md:max-w-[36rem]"
        />
      )}

      {group.isOpen && isOwner && (
        <div className="grid items-start gap-6 md:grid-cols-[1.25fr_1fr]">
          <InviteCodeCard code={group.inviteCode} groupName={group.name} hostName={hostName} />

          {/* Apricot, no lilac: "organizar y el tiempo" —sorteo, cuenta
              regresiva— es apricot en todo el resto de la app (ver el
              comentario de reglas de color en src/styles/theme.css). El UI
              kit real trae esta pantalla en lilac, pero eso rompería la regla
              de tono ya vigente y sembraría inconsistencia con la tarjeta de
              cuenta regresiva de arriba, que sí es apricot en ambas fuentes. */}
          <Sticker tone="apricot" className="flex flex-col justify-between gap-4 p-6">
            <div>
              <p className="eyebrow">Sorteo</p>
              <h2 className="mt-2 text-h3">Casi todo listo.</h2>
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

            <VisibilityNote>
              El sorteo se hace en el servidor. Ni siquiera tú vas a poder ver quién le toca a
              quién: cada quien entra y revela solo lo suyo.
            </VisibilityNote>
          </Sticker>
        </div>
      )}

      {group.isDrawn && assignment && (
        <section aria-labelledby="mi-amigo" className="flex flex-col gap-4">
          <div>
            <p className="eyebrow">Revelación</p>
            <h2 id="mi-amigo" className="mt-2 text-h2">
              A quién le regalas.
            </h2>
          </div>

          <VisibilityNote>
            Solo tú ves a quién le regalas. Ni quien organiza puede verlo.
          </VisibilityNote>

          <AssignmentReveal assignment={assignment} onReveal={markRevealed} />
        </section>
      )}

      {group.isDrawn && (
        <section aria-labelledby="mi-promesa" className="flex flex-col gap-4">
          <div>
            <p className="eyebrow">Promesa</p>
            <h2 id="mi-promesa" className="mt-2 text-h2">
              Tu promesa.
            </h2>
            <p className="mt-1 text-ink-soft">
              Una carta del mazo, tuya para todo el intercambio.
            </p>
          </div>

          <VisibilityNote>Tu carta es privada. Nadie más del grupo la ve.</VisibilityNote>

          <PromiseDeck savedCard={promise} highlight={highlight} onDraw={handleDrawPromise} />
        </section>
      )}

      <WishlistSection
        memberId={myMember?.id ?? null}
        canEdit={group.status !== 'closed'}
        onItemsChanged={refresh}
      />

      <MemberList members={group.members} currentUserId={user.id} />
    </div>
  )
}
