import { useCallback, useMemo, useState } from 'react'
import { buildChartData } from '../lib/chart'
import { buildDashboardSummary } from '../lib/dashboard'
import { useNow } from './useNow'
import { useSession } from './useSession'

/** Estado completo da tela autenticada (sessão + navegação + visão derivada). */
export function useDashboard() {
  const [view, setView] = useState('painel')
  const [range, setRange] = useState('24h')
  const resetView = useCallback(() => setView('painel'), [])
  const session = useSession({ onLogout: resetView })
  const now = useNow(30_000)

  const chart = useMemo(
    () => buildChartData(session.readings, range),
    [session.readings, range],
  )

  const summary = useMemo(
    () =>
      buildDashboardSummary({
        metrics: session.metrics,
        readings: session.readings,
        chart,
        range,
        lastSync: session.lastSync,
        now,
        realtimeConnected: session.realtimeConnected,
        user: session.user,
      }),
    [
      session.metrics,
      session.readings,
      chart,
      range,
      session.lastSync,
      now,
      session.realtimeConnected,
      session.user,
    ],
  )

  const navigate = useCallback((nextView) => setView(nextView), [])

  return {
    ...session,
    view,
    navigate,
    range,
    setRange,
    chart,
    summary,
  }
}
