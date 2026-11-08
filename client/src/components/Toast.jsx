import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

function Toast({ message, leaving = false, onExited }) {
  const scope = useRef(null)

  useGSAP(
    () => {
      const node = scope.current

      if (!node) return

      gsap.killTweensOf(node)

      if (leaving) {
        if (prefersReducedMotion()) {
          onExited?.()
          return
        }

        gsap.to(node, {
          autoAlpha: 0,
          y: 12,
          scale: 0.97,
          duration: 0.22,
          ease: 'power2.in',
          onComplete: () => onExited?.(),
        })

        return
      }

      if (prefersReducedMotion()) return

      gsap.fromTo(
        node,
        { autoAlpha: 0, y: 18, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: 'back.out(1.6)',
          clearProps: 'opacity,visibility,transform',
        },
      )
    },
    { dependencies: [leaving], scope },
  )

  return (
    <div
      ref={scope}
      className="fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-sm text-paper-bright shadow-card sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}

export default Toast
