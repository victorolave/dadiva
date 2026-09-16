import type { BadgeTone, StickerTone } from '@ui/atoms'
import { GroupStatus } from '../domain/value-objects/GroupStatus'

/**
 * Tono visual por estado del grupo. Lilac es
 * identidad y sigue abierto a gente nueva, blush es la acción primaria que ya
 * ocurrió (el sorteo), neutro/deep es lo que ya cerró y no compite por
 * atención. Vive en la capa de presentación, no en el dominio: `GroupStatus`
 * no debe saber qué es un `Badge` o un `Sticker` (regla hexagonal del repo).
 *
 * Un solo lugar para esta tabla evita que `GroupsPage` y `GroupDetailPage`
 * diverjan sin querer la próxima vez que alguien la toque en una sola de las dos.
 */
export const GROUP_STATUS_BADGE_TONE: Record<GroupStatus, BadgeTone> = {
  [GroupStatus.Draft]: 'lilac',
  [GroupStatus.Drawn]: 'blush',
  [GroupStatus.Closed]: 'neutral',
}

export const GROUP_STATUS_CARD_TONE: Record<GroupStatus, StickerTone> = {
  [GroupStatus.Draft]: 'lilac',
  [GroupStatus.Drawn]: 'blush',
  [GroupStatus.Closed]: 'deep',
}
