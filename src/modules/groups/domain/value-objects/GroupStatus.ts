/**
 * Ciclo de vida de un grupo.
 *
 *   draft ──(sorteo)──> drawn ──(cierre)──> closed
 *
 * Las transiciones son de una sola dirección. Deshacer un sorteo sería
 * catastrófico: la gente ya vio a quién le tocaba y no se puede "des-ver".
 */
export const GroupStatus = {
  Draft: 'draft',
  Drawn: 'drawn',
  Closed: 'closed',
} as const

export type GroupStatus = (typeof GroupStatus)[keyof typeof GroupStatus]

const TRANSITIONS: Record<GroupStatus, readonly GroupStatus[]> = {
  [GroupStatus.Draft]: [GroupStatus.Drawn, GroupStatus.Closed],
  [GroupStatus.Drawn]: [GroupStatus.Closed],
  [GroupStatus.Closed]: [],
}

export const canTransition = (from: GroupStatus, to: GroupStatus): boolean =>
  TRANSITIONS[from].includes(to)

export const GROUP_STATUS_LABEL: Record<GroupStatus, string> = {
  [GroupStatus.Draft]: 'Abierto',
  [GroupStatus.Drawn]: 'Sorteado',
  [GroupStatus.Closed]: 'Cerrado',
}

export const GROUP_STATUS_DESCRIPTION: Record<GroupStatus, string> = {
  [GroupStatus.Draft]: 'Todavía puede entrar gente al grupo.',
  [GroupStatus.Drawn]: 'Ya se hizo el sorteo. Cada quien puede ver a su amigo secreto.',
  [GroupStatus.Closed]: 'El intercambio terminó.',
}
