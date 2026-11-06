import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import CountUp from './ui/CountUp'
import Sparkline from './Sparkline'

function formatTrend(metric, precision) {
  const history = Array.isArray(metric.history) ? metric.history : []

  if (typeof metric.value !== 'number' || !Number.isFinite(metric.value)) {
    return 'sem dados'
  }

  if (history.length < 2) return 'sem histórico'

  const previous = history[history.length - 2]

  if (typeof previous !== 'number' || !Number.isFinite(previous)) {
    return 'sem histórico'
  }

  const delta = metric.value - previous

  if (Math.abs(delta) < 0.0001) return 'estável'

  const arrow = delta > 0 ? '↑' : '↓'
  const digits = Math.abs(delta) >= 10 ? 0 : Math.max(precision, 1)

  return `${arrow} ${Math.abs(delta).toFixed(digits)}`
}

const TONES = {
  green: '[--tone:var(--color-green)]',
  yellow: '[--tone:var(--color-yellow)]',
  blue: '[--tone:var(--color-blue)]',
  purple: '[--tone:var(--color-purple)]',
}

function MetricCard({ metric, precision, showSparkline = true }) {
  const progressRef = useRef(null)
  const history = Array.isArray(metric.history) ? metric.history : []
  const hasValue =
    typeof metric.value === 'number' && Number.isFinite(metric.value)
  const span = metric.max - metric.min
  const progress =
    hasValue && span > 0
      ? Math.min(100, Math.max(0, ((metric.value - metric.min) / span) * 100))
      : 0
  const trend = formatTrend(metric, precision)
  const isTrendEmpty = trend === 'sem dados' || trend === 'sem histórico'
  const hasHistory = history.length >= 2
  const tone = TONES[metric.tone] || TONES.green

  useGSAP(() => {
    if (prefersReducedMotion() || !progressRef.current) return

    gsap.from(progressRef.current, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.9,
      ease: 'power2.out',
      delay: 0.15,
    })
  }, [])

  return (
    <article
      data-reveal="scale"
      className={`${tone} min-w-0 rounded-2xl bg-paper-bright p-4 shadow-xs transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-sans text-xs font-semibold text-ink-soft">
          {metric.label}
        </span>
        <span
          className={`shrink-0 rounded-pill px-2 py-0.5 text-[0.7rem] font-medium tabular-nums ${
            isTrendEmpty ? 'text-muted' : 'bg-ink/5 text-muted'
          }`}
        >
          {trend}
        </span>
      </div>

      <div className="mt-3 flex min-h-8 items-baseline gap-1">
        {hasValue ? (
          <>
            <CountUp
              value={metric.value}
              precision={precision}
              className="font-sans text-3xl font-bold leading-none tracking-[-0.04em] tabular-nums"
            />
            <span className="text-xs font-medium text-muted">{metric.unit}</span>
          </>
        ) : (
          <span className="text-base font-semibold text-muted">Sem dados</span>
        )}
      </div>

      <div className="mt-2 h-8">
        {showSparkline ? (
          hasHistory ? (
            <Sparkline values={history} />
          ) : (
            <p className="flex h-full items-center text-xs text-muted">
              {hasValue ? 'Sem histórico ainda' : 'Sem leitura recebida'}
            </p>
          )
        ) : (
          <p className="flex h-full items-center text-xs text-muted">
            {hasValue ? 'Histórico no gráfico' : 'Sem leitura recebida'}
          </p>
        )}
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-ink/10">
        <div
          ref={progressRef}
          className="h-full rounded-pill bg-[var(--tone)] transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 truncate text-xs text-muted" title={metric.hint}>
        {hasValue ? metric.hint : 'Dados não recebidos do dispositivo.'}
      </p>
    </article>
  )
}

export default MetricCard
