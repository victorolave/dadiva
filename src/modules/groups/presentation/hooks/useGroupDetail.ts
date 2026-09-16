import { useCallback, useEffect, useState } from 'react'
import { useContainer } from '@app/composition/ContainerProvider'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupId } from '@core/domain/Entity'
import type { Group } from '../../domain/entities/Group'

export const useGroupDetail = (groupId: GroupId | null) => {
  const { groups } = useContainer()
  const [group, setGroup] = useState<Group | null>(null)
  const [error, setError] = useState<DomainError | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchGroup = useCallback(async () => {
    if (!groupId) return

    const result = await groups.detail.execute(groupId)
    result.match({
      ok: (loaded) => {
        setGroup(loaded)
        setError(null)
      },
      err: (domainError) => setError(domainError),
    })
  }, [groups.detail, groupId])

  const reload = useCallback(async () => {
    setIsLoading(true)
    await fetchGroup()
    setIsLoading(false)
  }, [fetchGroup])

  // Refresca sin pasar por `isLoading`: la página no vuelve al skeleton, así
  // que no se desmonta nada. Si se desmontara, `AssignmentReveal` perdería el
  // estado de la carta ya raspada y la volvería a cubrir.
  const refresh = useCallback(() => fetchGroup(), [fetchGroup])

  useEffect(() => {
    void reload()
  }, [reload])

  return { group, error, isLoading, reload, refresh }
}
