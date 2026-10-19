import Sparkline from './Sparkline'

function MetricCard({ metric, precision }) {
  const filled = Math.round(
    ((metric.value - metric.min) / (metric.max - metric.min)) * 10,
  )

  return (
    <article className={`metric-card tone-${metric.tone}`}>
      <div className="metric-top">
        <span className="metric-label">{metric.label}</span>
        <span className="metric-trend">{metric.trend}</span>
      </div>
      <div className="metric-reading">
        <span className="metric-value">{metric.value.toFixed(precision)}</span>
        <span className="metric-unit">{metric.unit}</span>
      </div>
      <Sparkline values={metric.history} />
      <div className="segment-bar" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <span key={index} className={index < filled ? 'on' : ''} />
        ))}
      </div>
      <p className="metric-hint">{metric.hint}</p>
    </article>
  )
}

export default MetricCard
