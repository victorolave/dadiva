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

  const reload = useCallback(async () => {
    if (!groupId) return

    setIsLoading(true)
    const result = await groups.detail.execute(groupId)
    setIsLoading(false)

    result.match({
      ok: (loaded) => {
        setGroup(loaded)
        setError(null)
      },
      err: (domainError) => setError(domainError),
    })
  }, [groups.detail, groupId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { group, error, isLoading, reload }
}
