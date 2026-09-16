/**
 * Primitivas tácticas de DDD.
 *
 * Entity: identidad estable en el tiempo. Dos entidades son la misma si
 * comparten id, aunque todos sus atributos difieran.
 *
 * ValueObject: sin identidad. Dos value objects son iguales si sus atributos
 * son iguales. Siempre inmutables y siempre válidos por construcción — si
 * lograste instanciarlo, es válido.
 */

export abstract class Entity<Id extends string> {
  protected constructor(readonly id: Id) {}

  equals(other: Entity<Id> | null | undefined): boolean {
    if (other === null || other === undefined) return false
    if (this === other) return true
    return this.id === other.id
  }
}

export abstract class ValueObject<Props extends object> {
  protected constructor(protected readonly props: Readonly<Props>) {
    Object.freeze(this.props)
  }

  equals(other: ValueObject<Props> | null | undefined): boolean {
    if (other === null || other === undefined) return false
    if (this === other) return true
    const a = this.props
    const b = other.props
    const keys = Object.keys(a) as (keyof Props)[]
    if (keys.length !== Object.keys(b).length) return false
    return keys.every((key) => Object.is(a[key], b[key]))
  }
}

/** Identificadores nominales: evita pasar un GroupId donde se espera un MemberId. */
declare const brand: unique symbol
export type Branded<T, B extends string> = T & { readonly [brand]: B }

export type GroupId = Branded<string, 'GroupId'>
export type MemberId = Branded<string, 'MemberId'>
export type UserId = Branded<string, 'UserId'>
export type PromiseCardId = Branded<string, 'PromiseCardId'>
export type WishlistItemId = Branded<string, 'WishlistItemId'>
export type MessageId = Branded<string, 'MessageId'>

export const asGroupId = (value: string): GroupId => value as GroupId
export const asMemberId = (value: string): MemberId => value as MemberId
export const asUserId = (value: string): UserId => value as UserId
export const asPromiseCardId = (value: string): PromiseCardId => value as PromiseCardId
export const asWishlistItemId = (value: string): WishlistItemId => value as WishlistItemId
export const asMessageId = (value: string): MessageId => value as MessageId
