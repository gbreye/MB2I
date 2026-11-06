import { gsap } from 'gsap'

export const REVEAL_DURATION = 0.55
export const REVEAL_EASE = 'power3.out'

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export { gsap }
