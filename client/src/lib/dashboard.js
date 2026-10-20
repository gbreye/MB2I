import { formatElapsed, getFirstName } from './format'

export function buildDashboardSummary({
  metrics,
  readings,
  chart,
  range,
  lastSync,
  now,
  realtimeConnected,
  user,
}) {
  const hasReadings = readings.length > 0
  const lastSyncTime = lastSync instanceof Date ? lastSync.getTime() : NaN
  const elapsedSeconds =
    Number.isFinite(lastSyncTime) && Number.isFinite(now)
      ? Math.max(0, Math.floor((now - lastSyncTime) / 1000))
      : null
  const lastSyncLabel =
    elapsedSeconds === null
      ? hasReadings
        ? 'sem data'
        : 'nenhuma leitura'
      : formatElapsed(elapsedSeconds)
  const firstName = getFirstName(user)
  const displayFirstName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const hasSoilData =
    typeof metrics.soil?.value === 'number' && Number.isFinite(metrics.soil.value)
  const soilNeedsWater = hasSoilData && metrics.soil.value < 45
  const plantStatus = !hasSoilData
    ? 'Sem leitura de solo'
    : soilNeedsWater
      ? 'Precisa de água'
      : 'Saudável'
  const plantState = !hasSoilData ? 'empty' : soilNeedsWater ? 'warn' : 'ok'
  const hasChartData = chart.values.length >= 2
  const chartEmptyMessage =
    readings.length === 0
      ? 'Nenhuma leitura foi recebida do dispositivo.'
      : chart.values.length === 0
        ? `Nenhuma leitura de umidade do solo no período de ${range}.`
        : 'Aguardando pelo menos duas leituras para desenhar o histórico.'
  const greeting =
    elapsedSeconds !== null
      ? `Última leitura ${lastSyncLabel}.`
      : realtimeConnected
        ? 'Nenhuma leitura recebida ainda. Aguardando o dispositivo.'
        : 'Dispositivo offline e sem leituras recebidas.'

  return {
    displayFirstName,
    lastSyncLabel,
    hasReadings,
    hasSoilData,
    hasChartData,
    plantStatus,
    plantState,
    chartEmptyMessage,
    greeting,
  }
}
