import { gsap } from 'gsap'

export const REVEAL_DURATION = 0.55
export const REVEAL_EASE = 'power3.out'

const MOTION_KEY = 'mb2i:motion'
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

export const MOTION_MODES = ['full', 'system', 'reduced']

export function getMotionMode() {
  try {
    const stored = window.localStorage.getItem(MOTION_KEY)
    return MOTION_MODES.includes(stored) ? stored : 'full'
  } catch {
    return 'full'
  }
}

export function resolveMotionMode(mode) {
  if (mode === 'system') {
    return window.matchMedia?.(REDUCED_QUERY).matches ? 'reduced' : 'full'
  }

  return mode === 'reduced' ? 'reduced' : 'full'
}

export function applyMotionMode(mode) {
  const resolved = resolveMotionMode(mode)

  document.documentElement.dataset.motion = resolved

  try {
    window.localStorage.setItem(MOTION_KEY, mode)
  } catch {
    // Sem armazenamento disponível: mantém a escolha apenas nesta sessão.
  }

  return resolved
}

export function prefersReducedMotion() {
  if (typeof document === 'undefined') return false

  return document.documentElement.dataset.motion === 'reduced'
}

export { gsap }
