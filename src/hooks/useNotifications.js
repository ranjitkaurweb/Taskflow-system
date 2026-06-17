import { useMemo } from 'react'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export function useNotifications(tasks = [], profile = null) {
  const pendingTasks = useMemo(() => {
    if (!profile || profile.role !== 'employee') return []

    return tasks.filter(t =>
      t.status !== 'completed' &&
      (!t.due || t.due === '') &&
      t.created &&
      (Date.now() - t.created) > THREE_DAYS_MS
    )
  }, [tasks, profile])

  return { pendingTasks }
}
