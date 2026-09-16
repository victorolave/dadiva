import type { DadivaClient } from '@core/infrastructure/supabase/client'
import { ok, err, type Result } from '@core/domain/Result'
import { unexpectedError, type DomainError } from '@core/domain/DomainError'
import { mapPostgrestError } from '@core/infrastructure/supabase/mapPostgrestError'
import { asPromiseCardId, type GroupId } from '@core/domain/Entity'
import { PromiseCard } from '../domain/entities/PromiseCard'
import type { PromiseThemeKey } from '../domain/value-objects/PromiseTheme'
import { PROMISE_THEMES } from '../domain/value-objects/PromiseTheme'
import type { PromiseRepository } from '../domain/repositories/PromiseRepository'

const FALLBACK_THEME: PromiseThemeKey = 'arcoiris'

/**
 * El `theme_key` viaja como texto libre desde la base. Si alguna vez llega uno
 * que el front no conoce (una semilla nueva desplegada antes que el cliente),
 * caemos a un tema válido en vez de renderizar una tarjeta rota.
 */
const toThemeKey = (raw: string): PromiseThemeKey =>
  raw in PROMISE_THEMES ? (raw as PromiseThemeKey) : FALLBACK_THEME

export class SupabasePromiseRepository implements PromiseRepository {
  constructor(private readonly client: DadivaClient) {}

  async findMine(groupId: GroupId): Promise<Result<PromiseCard | null, DomainError>> {
    try {
      const { data, error } = await this.client
        .from('member_promises')
        .select('drawn_at, promise_cards(id, reference, text, version, theme_key)')
        .eq('group_id', groupId)
        .maybeSingle()

      if (error) return err(mapPostgrestError(error, 'promise.find'))
      if (!data?.promise_cards) return ok(null)

      const card = data.promise_cards

      return ok(
        PromiseCard.create({
          id: asPromiseCardId(card.id),
          reference: card.reference,
          text: card.text,
          version: card.version,
          themeKey: toThemeKey(card.theme_key),
          drawnAt: new Date(data.drawn_at),
        }),
      )
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }

  async draw(groupId: GroupId): Promise<Result<PromiseCard, DomainError>> {
    try {
      const { data, error } = await this.client.rpc('draw_promise', { p_group_id: groupId })

      if (error) return err(mapPostgrestError(error, 'promise.draw'))

      // La función de Postgres devuelve una fila; el cliente la tipa como
      // objeto o arreglo según la firma, así que normalizamos ambos casos.
      const card = Array.isArray(data) ? data[0] : data
      if (!card) {
        return err(unexpectedError(new Error('draw_promise no devolvió ninguna tarjeta')))
      }

      return ok(
        PromiseCard.create({
          id: asPromiseCardId(card.id),
          reference: card.reference,
          text: card.text,
          version: card.version,
          themeKey: toThemeKey(card.theme_key),
          drawnAt: new Date(),
        }),
      )
    } catch (cause) {
      return err(unexpectedError(cause))
    }
  }
}
