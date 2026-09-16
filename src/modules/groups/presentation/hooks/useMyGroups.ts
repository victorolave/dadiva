import { useCallback, useEffect, useState } from 'react'
import { useContainer } from '@app/composition/ContainerProvider'
import { useAuth } from '@modules/auth/presentation/AuthProvider'
import type { DomainError } from '@core/domain/DomainError'
import type { GroupSummary } from '../../domain/repositories/GroupRepository'

export const useMyGroups = () => {
  const { groups } = useContainer()
  const { user } = useAuth()
  const [data, setData] = useState<readonly GroupSummary[] | null>(null)
  const [error, setError] = useState<DomainError | null>(null)

  const reload = useCallback(async () => {
    if (!user) return

    const result = await groups.listMine.execute(user.id)
    result.match({
      ok: (summaries) => {
        setData(summaries)
        setError(null)
      },
      err: (domainError) => setError(domainError),
    })
  }, [groups.listMine, user])

  useEffect(() => {
    void reload()
  }, [reload])

  return { groups: data, error, isLoading: data === null && error === null, reload }
}
