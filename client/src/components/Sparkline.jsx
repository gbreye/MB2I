import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

function Sparkline({ values }) {
  const lineRef = useRef(null)

  useGSAP(() => {
    if (prefersReducedMotion() || !lineRef.current) return

    gsap.fromTo(
      lineRef.current,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: 'power2.out',
      },
    )
  }, [])

  if (!Array.isArray(values) || values.length < 2) return null

  const width = 140
  const height = 34
  const padding = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / span) * (height - padding * 2)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      className="block h-8 w-full text-[var(--tone)]"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        ref={lineRef}
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength="1"
      />
    </svg>
  )
}

export default Sparkline
