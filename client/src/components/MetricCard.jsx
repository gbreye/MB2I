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

  return (
    <article
      className={`${tone} min-w-0 rounded-xl border border-line bg-paper-bright p-4 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-card`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-display text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          {metric.label}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium tabular-nums ${
            isTrendEmpty ? 'text-muted' : 'bg-ink/5 text-muted'
          }`}
        >
          {trend}
        </span>
      </div>

      <div className="mt-3 flex min-h-8 items-baseline gap-1">
        {hasValue ? (
          <>
            <span className="font-display text-3xl font-bold leading-none tracking-[-0.04em] tabular-nums">
              {metric.value.toFixed(precision)}
            </span>
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

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-[var(--tone)] transition-[width] duration-500"
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
