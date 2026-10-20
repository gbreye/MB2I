import { RANGE_WINDOWS } from '../constants/metrics'
import { readMetricValue } from './metrics'

function buildChartLabels(points, range) {
  if (points.length === 0) return []

  const count = Math.min(6, points.length)
  const labels = []

  for (let index = 0; index < count; index += 1) {
    const pointIndex =
      count === 1 ? 0 : Math.round((index * (points.length - 1)) / (count - 1))
    const date = new Date(points[pointIndex].timestamp)
    const label =
      range === '24h'
        ? date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          })

    if (labels[labels.length - 1] !== label) labels.push(label)
  }

  return labels
}

export function buildChartData(readings, range) {
  const windowMs = RANGE_WINDOWS[range] || RANGE_WINDOWS['24h']
  const cutoff = Date.now() - windowMs
  const points = (Array.isArray(readings) ? readings : [])
    .map((reading) => {
      const value = readMetricValue(reading, 'soil')
      const timestamp = Date.parse(reading?.receivedAt || '')
      return { value, timestamp }
    })
    .filter(
      ({ value, timestamp }) =>
        value !== null && Number.isFinite(timestamp) && timestamp >= cutoff,
    )

  return {
    values: points.map(({ value }) => value),
    labels: buildChartLabels(points, range),
  }
}
