import { useCallback, useState } from 'react'
import { formatEventTime } from '../lib/format'

const DEFAULT_LIMIT = 6

export function useEventLog(limit = DEFAULT_LIMIT) {
  const [events, setEvents] = useState([])

  const addEvent = useCallback(
    (text, type = 'info') => {
      setEvents((previous) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            time: formatEventTime(),
            text,
            type,
          },
          ...previous,
        ].slice(0, limit),
      )
    },
    [limit],
  )

  const clearEvents = useCallback(() => setEvents([]), [])

  return { events, addEvent, clearEvents }
}
