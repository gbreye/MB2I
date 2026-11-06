import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

function LineChart({ values }) {
  const lineRef = useRef(null)
  const areaRef = useRef(null)

  useGSAP(() => {
    if (prefersReducedMotion() || !lineRef.current || !areaRef.current) return

    gsap.fromTo(
      lineRef.current,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power2.inOut',
      },
    )

    gsap.fromTo(
      areaRef.current,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.7,
        delay: 0.2,
        ease: 'power2.out',
      },
    )
  }, [])

  if (!Array.isArray(values) || values.length < 2) return null

  const width = 660
  const height = 216
  const padding = 16
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / span) * (height - padding * 2)
    return [x, y]
  })

  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')

  const first = points[0]
  const last = points[points.length - 1]
  const area = `${line} L ${last[0].toFixed(2)} ${height - padding} L ${first[0].toFixed(2)} ${height - padding} Z`

  return (
    <svg
      className="block h-48 w-full rounded-xl bg-paper-bright sm:h-60"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Histórico de umidade do solo"
    >
      <defs>
        <pattern
          id="chart-grid"
          width="33"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 33 0 L 0 0 0 24"
            fill="none"
            stroke="var(--color-ink)"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width={width} height={height} fill="var(--color-paper-bright)" />
      <rect width={width} height={height} fill="url(#chart-grid)" />
      <path
        ref={areaRef}
        d={area}
        fill="var(--color-green-bright)"
        fillOpacity="0.14"
      />
      <path
        ref={lineRef}
        d={line}
        fill="none"
        stroke="var(--color-green)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default LineChart
