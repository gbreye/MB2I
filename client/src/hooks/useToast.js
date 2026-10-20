import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast(duration = 3600) {
  const [toast, setToast] = useState('')
  const timer = useRef(null)

  const showToast = useCallback(
    (message) => {
      setToast(message)

      if (timer.current) clearTimeout(timer.current)

      timer.current = setTimeout(() => setToast(''), duration)
    },
    [duration],
  )

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return { toast, showToast }
}
