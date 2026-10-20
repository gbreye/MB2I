import { METRIC_CONFIG } from '../constants/metrics'

export function createEmptyMetrics() {
  return Object.fromEntries(
    Object.entries(METRIC_CONFIG).map(([key, metric]) => [
      key,
      { ...metric, value: null, history: [] },
    ]),
  )
}

export function readMetricValue(reading, key) {
  const value = reading?.[key]

  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (
    value &&
    typeof value === 'object' &&
    typeof value.value === 'number' &&
    Number.isFinite(value.value)
  ) {
    return value.value
  }

  return null
}

export function getValidReadings(plant) {
  return Array.isArray(plant)
    ? plant.filter((reading) => reading && typeof reading === 'object')
    : []
}

export function getLatestReading(plant) {
  const readings = getValidReadings(plant)
  return readings.length > 0 ? readings[readings.length - 1] : null
}

export function metricsFromPlant(plant, previous) {
  if (!Array.isArray(plant) || plant.length === 0) return null

  const latest = plant[plant.length - 1]

  if (!latest || typeof latest !== 'object') return null

  let changed = false
  const next = { ...previous }

  for (const key of Object.keys(METRIC_CONFIG)) {
    const value = readMetricValue(latest, key)

    if (value === null) continue

    const history = plant
      .map((reading) => readMetricValue(reading, key))
      .filter((item) => item !== null)
      .slice(-60)
    const current = previous[key] || {
      ...METRIC_CONFIG[key],
      value: null,
      history: [],
    }

    next[key] = {
      ...current,
      value,
      history,
    }
    changed = true
  }

  return changed ? next : null
}
