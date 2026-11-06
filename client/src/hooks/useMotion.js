import { useCallback, useEffect, useState } from 'react'
import { applyMotionMode, getMotionMode } from '../lib/gsap'

export function useMotion() {
  const [motion, setMotionState] = useState(getMotionMode)

  useEffect(() => {
    applyMotionMode(motion)

    if (motion !== 'system') return undefined

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => applyMotionMode('system')

    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [motion])

  const setMotion = useCallback((next) => setMotionState(next), [])

  return { motion, setMotion }
}
