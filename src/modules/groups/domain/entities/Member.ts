import { Entity, type MemberId, type UserId } from '@core/domain/Entity'

export const MemberRole = {
  Owner: 'owner',
  Member: 'member',
} as const

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole]

interface MemberProps {
  readonly id: MemberId
  readonly userId: UserId
  readonly displayName: string
  readonly avatarEmoji: string
  readonly role: MemberRole
  readonly joinedAt: Date
  readonly hasWishlist: boolean
  readonly hasDrawnPromise: boolean
}

/** Una persona dentro de un grupo concreto. */
export class Member extends Entity<MemberId> {
  readonly userId: UserId
  readonly displayName: string
  readonly avatarEmoji: string
  readonly role: MemberRole
  readonly joinedAt: Date
  readonly hasWishlist: boolean
  readonly hasDrawnPromise: boolean

  private constructor(props: MemberProps) {
    super(props.id)
    this.userId = props.userId
    this.displayName = props.displayName
    this.avatarEmoji = props.avatarEmoji
    this.role = props.role
    this.joinedAt = props.joinedAt
    this.hasWishlist = props.hasWishlist
    this.hasDrawnPromise = props.hasDrawnPromise
  }

  static create(props: MemberProps): Member {
    return new Member(props)
  }

  get isOwner(): boolean {
    return this.role === MemberRole.Owner
  }

  get initials(): string {
    return this.displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }
}
