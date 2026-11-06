import { useRef, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

const SERIES_COLORS = {
  soil: {
    stroke: 'var(--color-green)',
    fill: 'var(--color-green-bright)',
    fillOpacity: 0.14,
  },
  temperature: {
    stroke: 'var(--color-yellow)',
    fill: 'var(--color-yellow-bright)',
    fillOpacity: 0.14,
  },
  light: {
    stroke: 'var(--color-purple)',
    fill: 'var(--color-purple-bright)',
    fillOpacity: 0.14,
  },
}

function LineChart({ series }) {
  const lineRefs = useRef({})
  const areaRefs = useRef({})

  useGSAP(() => {
    if (prefersReducedMotion()) return

    Object.entries(lineRefs.current).forEach(([key, lineRef], seriesIndex) => {
      const areaRef = areaRefs.current[key]
      if (!lineRef || !areaRef) return

      gsap.fromTo(
        lineRef,
        { strokeDasharray: 1, strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 1.1,
          delay: seriesIndex * 0.15,
          ease: 'power2.inOut',
        },
      )

      gsap.fromTo(
        areaRef,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.7,
          delay: 0.2 + seriesIndex * 0.15,
          ease: 'power2.out',
        },
      )
    })
  }, [])

  // Compute all values using hooks FIRST (before any early return)
  const width = 660
  const height = 216
  const padding = 16

  const allValues = useMemo(() => {
    if (!Array.isArray(series) || series.length === 0) return []
    return series.flatMap((s) => s.values)
  }, [series])

  const hasValidData = useMemo(() => allValues.length >= 2, [allValues])

  const min = useMemo(() => (allValues.length > 0 ? Math.min(...allValues) : 0), [allValues])
  const max = useMemo(() => (allValues.length > 0 ? Math.max(...allValues) : 1), [allValues])
  const span = useMemo(() => max - min || 1, [min, max])

  // Precompute points for each series
  const seriesPoints = useMemo(() => {
    if (!hasValidData || !Array.isArray(series)) return []
    return series.map((s) => {
      const values = s.values
      return values.map((value, valueIndex) => {
        const x = padding + (valueIndex / (values.length - 1)) * (width - padding * 2)
        const y = height - padding - ((value - min) / span) * (height - padding * 2)
        return [x, y]
      })
    })
  }, [series, hasValidData, min, max, span, width, height, padding])

  const paths = useMemo(() => {
    if (!hasValidData || !Array.isArray(series) || !Array.isArray(seriesPoints)) return []
    return seriesPoints.map((points, seriesIndex) => {
      const line = points
        .map(([x, y], pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
        .join(' ')

      const first = points[0]
      const last = points[points.length - 1]
      const area = `${line} L ${last[0].toFixed(2)} ${height - padding} L ${first[0].toFixed(2)} ${height - padding} Z`

      const s = series[seriesIndex]
      const colors = SERIES_COLORS[s.key] || SERIES_COLORS.soil

      return {
        key: s.key,
        line,
        area,
        stroke: colors.stroke,
        fill: colors.fill,
        fillOpacity: colors.fillOpacity,
      }
    })
  }, [seriesPoints, series, hasValidData, height, padding])

  // Early return AFTER all hooks
  if (!hasValidData) return null

  return (
    <svg
      className="block h-48 w-full rounded-xl bg-paper-bright sm:h-60"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Histórico de saúde do solo: umidade, temperatura e luminosidade"
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

      {paths.map((path) => (
        <g key={path.key}>
          <path
            ref={(el) => { areaRefs.current[path.key] = el }}
            d={path.area}
            fill={path.fill}
            fillOpacity={path.fillOpacity}
          />
          <path
            ref={(el) => { lineRefs.current[path.key] = el }}
            d={path.line}
            fill="none"
            stroke={path.stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength="1"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  )
}

export default LineChart