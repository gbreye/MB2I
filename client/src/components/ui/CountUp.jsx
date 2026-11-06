import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../../lib/gsap'

function CountUp({ value, precision = 0, className = '' }) {
  const numberRef = useRef(null)
  const previousRef = useRef(0)

  useGSAP(
    () => {
      const node = numberRef.current
      const isNumber = typeof value === 'number' && Number.isFinite(value)

      if (!node || !isNumber || prefersReducedMotion()) {
        previousRef.current = isNumber ? value : 0
        return
      }

      const proxy = { current: previousRef.current }

      gsap.to(proxy, {
        current: value,
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          node.textContent = proxy.current.toFixed(precision)
        },
        onComplete: () => {
          previousRef.current = value
        },
      })
    },
    { dependencies: [value, precision] },
  )

  const isNumber = typeof value === 'number' && Number.isFinite(value)

  return (
    <span ref={numberRef} className={className}>
      {isNumber ? value.toFixed(precision) : '—'}
    </span>
  )
}

export default CountUp
