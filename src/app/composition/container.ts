import { getSupabaseClient, type DadivaClient } from '@core/infrastructure/supabase/client'

import { SupabaseAuthRepository } from '@modules/auth/infrastructure/SupabaseAuthRepository'
import { SignInWithGoogle } from '@modules/auth/application/use-cases/SignInWithGoogle'
import { RequestMagicLink } from '@modules/auth/application/use-cases/RequestMagicLink'
import { CompleteProfile } from '@modules/auth/application/use-cases/CompleteProfile'
import { SignOut } from '@modules/auth/application/use-cases/SignOut'
import type { AuthRepository } from '@modules/auth/domain/repositories/AuthRepository'

import { SupabaseGroupRepository } from '@modules/groups/infrastructure/SupabaseGroupRepository'
import { SupabaseAssignmentRepository } from '@modules/groups/infrastructure/SupabaseAssignmentRepository'
import { CreateGroup } from '@modules/groups/application/use-cases/CreateGroup'
import { JoinGroup } from '@modules/groups/application/use-cases/JoinGroup'
import { RunDraw } from '@modules/groups/application/use-cases/RunDraw'
import { ListMyGroups } from '@modules/groups/application/use-cases/ListMyGroups'
import { GetGroupDetail } from '@modules/groups/application/use-cases/GetGroupDetail'
import { RevealMyAssignment } from '@modules/groups/application/use-cases/RevealMyAssignment'
import type { GroupRepository } from '@modules/groups/domain/repositories/GroupRepository'
import type { AssignmentRepository } from '@modules/groups/domain/repositories/AssignmentRepository'

import { SupabasePromiseRepository } from '@modules/promises/infrastructure/SupabasePromiseRepository'
import { DrawMyPromise } from '@modules/promises/application/use-cases/DrawMyPromise'
import { GetMyPromise } from '@modules/promises/application/use-cases/GetMyPromise'
import type { PromiseRepository } from '@modules/promises/domain/repositories/PromiseRepository'

import { SupabaseWishlistRepository } from '@modules/wishlist/infrastructure/SupabaseWishlistRepository'
import { ListMyWishlist } from '@modules/wishlist/application/use-cases/ListMyWishlist'
import { AddWishlistItem } from '@modules/wishlist/application/use-cases/AddWishlistItem'
import { UpdateWishlistItem } from '@modules/wishlist/application/use-cases/UpdateWishlistItem'
import { DeleteWishlistItem } from '@modules/wishlist/application/use-cases/DeleteWishlistItem'
import type { WishlistRepository } from '@modules/wishlist/domain/repositories/WishlistRepository'

/**
 * Composition Root.
 *
 * ÚNICO lugar de la aplicación donde se decide qué implementación concreta
 * satisface cada puerto. Ningún componente, hook ni caso de uso construye sus
 * propias dependencias: las recibe ya armadas.
 *
 * Esto es lo que hace testeable la app. Un test llama a `createContainer` con
 * repositorios en memoria y ejercita la aplicación completa sin tocar la red.
 */

export interface Container {
  readonly auth: {
    readonly repository: AuthRepository
    readonly signInWithGoogle: SignInWithGoogle
    readonly requestMagicLink: RequestMagicLink
    readonly completeProfile: CompleteProfile
    readonly signOut: SignOut
  }
  readonly groups: {
    readonly repository: GroupRepository
    readonly create: CreateGroup
    readonly join: JoinGroup
    readonly runDraw: RunDraw
    readonly listMine: ListMyGroups
    readonly detail: GetGroupDetail
    readonly revealAssignment: RevealMyAssignment
  }
  readonly promises: {
    readonly repository: PromiseRepository
    readonly draw: DrawMyPromise
    readonly getMine: GetMyPromise
  }
  readonly wishlist: {
    readonly repository: WishlistRepository
    readonly list: ListMyWishlist
    readonly add: AddWishlistItem
    readonly update: UpdateWishlistItem
    readonly remove: DeleteWishlistItem
  }
}

export interface ContainerOverrides {
  readonly authRepository?: AuthRepository
  readonly groupRepository?: GroupRepository
  readonly assignmentRepository?: AssignmentRepository
  readonly promiseRepository?: PromiseRepository
  readonly wishlistRepository?: WishlistRepository
}

export const createContainer = (overrides: ContainerOverrides = {}): Container => {
  // Resolución perezosa: el cliente de Supabase solo se construye si algún
  // puerto lo necesita de verdad. Un test que inyecta los cuatro repositorios
  // nunca lo toca, y por tanto no necesita variables de entorno.
  let client: DadivaClient | null = null
  const resolveClient = (): DadivaClient => (client ??= getSupabaseClient())

  const authRepository =
    overrides.authRepository ?? new SupabaseAuthRepository(resolveClient())
  const groupRepository =
    overrides.groupRepository ?? new SupabaseGroupRepository(resolveClient())
  const assignmentRepository =
    overrides.assignmentRepository ?? new SupabaseAssignmentRepository(resolveClient())
  const promiseRepository =
    overrides.promiseRepository ?? new SupabasePromiseRepository(resolveClient())
  const wishlistRepository =
    overrides.wishlistRepository ?? new SupabaseWishlistRepository(resolveClient())

  return {
    auth: {
      repository: authRepository,
      signInWithGoogle: new SignInWithGoogle(authRepository),
      requestMagicLink: new RequestMagicLink(authRepository),
      completeProfile: new CompleteProfile(authRepository),
      signOut: new SignOut(authRepository),
    },
    groups: {
      repository: groupRepository,
      create: new CreateGroup(groupRepository),
      join: new JoinGroup(groupRepository),
      runDraw: new RunDraw(groupRepository),
      listMine: new ListMyGroups(groupRepository),
      detail: new GetGroupDetail(groupRepository),
      revealAssignment: new RevealMyAssignment(assignmentRepository),
    },
    promises: {
      repository: promiseRepository,
      draw: new DrawMyPromise(promiseRepository),
      getMine: new GetMyPromise(promiseRepository),
    },
    wishlist: {
      repository: wishlistRepository,
      list: new ListMyWishlist(wishlistRepository),
      add: new AddWishlistItem(wishlistRepository),
      update: new UpdateWishlistItem(wishlistRepository),
      remove: new DeleteWishlistItem(wishlistRepository),
    },
  }
}
