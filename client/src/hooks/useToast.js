import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast(duration = 3600) {
  const [toast, setToast] = useState('')
  const [leaving, setLeaving] = useState(false)
  const timer = useRef(null)

  const dismissToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setLeaving(false)
    setToast('')
  }, [])

  const showToast = useCallback(
    (message) => {
      setToast(message)
      setLeaving(false)

      if (timer.current) clearTimeout(timer.current)

      timer.current = setTimeout(() => setLeaving(true), duration)
    },
    [duration],
  )

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return { toast, toastLeaving: leaving, dismissToast, showToast }
}
