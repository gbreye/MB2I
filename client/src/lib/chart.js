import { RANGE_WINDOWS, METRIC_CONFIG } from '../constants/metrics'
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

function buildMetricSeries(readings, range, metricKey) {
  const windowMs = RANGE_WINDOWS[range] || RANGE_WINDOWS['24h']
  const cutoff = Date.now() - windowMs
  const points = (Array.isArray(readings) ? readings : [])
    .map((reading) => {
      const value = readMetricValue(reading, metricKey)
      const timestamp = Date.parse(reading?.receivedAt || '')
      return { value, timestamp }
    })
    .filter(
      ({ value, timestamp }) =>
        value !== null && Number.isFinite(timestamp) && timestamp >= cutoff,
    )

  return {
    key: metricKey,
    label: METRIC_CONFIG[metricKey]?.label || metricKey,
    unit: METRIC_CONFIG[metricKey]?.unit || '',
    tone: METRIC_CONFIG[metricKey]?.tone || 'green',
    values: points.map(({ value }) => value),
    timestamps: points.map(({ timestamp }) => timestamp),
  }
}

export function buildChartData(readings, range) {
  const soilSeries = buildMetricSeries(readings, range, 'soil')
  const temperatureSeries = buildMetricSeries(readings, range, 'temperature')
  const lightSeries = buildMetricSeries(readings, range, 'light')

  // Use soil timestamps for labels (fallback to any series with data)
  const referencePoints = soilSeries.timestamps.length > 0
    ? soilSeries.timestamps.map((timestamp) => ({ timestamp }))
    : temperatureSeries.timestamps.length > 0
      ? temperatureSeries.timestamps.map((timestamp) => ({ timestamp }))
      : lightSeries.timestamps.map((timestamp) => ({ timestamp }))

  return {
    series: [soilSeries, temperatureSeries, lightSeries].filter(
      (s) => s.values.length >= 2
    ),
    labels: buildChartLabels(referencePoints, range),
  }
}
