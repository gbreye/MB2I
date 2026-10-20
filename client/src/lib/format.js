import { readMetricValue } from './metrics'

export function formatElapsed(seconds) {
  if (!Number.isFinite(seconds)) return 'sem data'
  if (seconds < 60) return 'agora mesmo'

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) return `há ${minutes}min`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `há ${hours}h`

  return `há ${Math.floor(hours / 24)}d`
}

export function formatEventTime(date = new Date()) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatReadingSummary(reading) {
  const soil = readMetricValue(reading, 'soil')
  const temperature = readMetricValue(reading, 'temperature')
  const light = readMetricValue(reading, 'light')
  const parts = []

  if (soil !== null) parts.push(`solo ${Math.round(soil)}%`)
  if (temperature !== null) parts.push(`${temperature.toFixed(1)} °C`)
  if (light !== null) parts.push(`${Math.round(light)} lx`)

  return parts.length > 0 ? ` — ${parts.join(' · ')}` : ''
}

export function getFirstName(user) {
  return (
    user?.name?.trim().split(/\s+/)[0] || user?.username || 'jardineiro'
  )
}
