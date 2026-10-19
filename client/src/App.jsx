import { useCallback, useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import MetricCard from './components/MetricCard'
import LineChart from './components/LineChart'
import EventLog from './components/EventLog'
import DevicePanel from './components/DevicePanel'
import AddEsp from './components/AddEsp'
import LoginPage from './components/LoginPage'
import { api, normalizeUser } from './lib/api'
import { connectSocket, disconnectSocket } from './lib/socket'
import plantImage from './assets/potted-plant_1fab4.png'
import './App.css'

const INITIAL_METRICS = {
  soil: {
    label: 'Umidade do solo',
    value: 42,
    unit: '%',
    hint: 'Ideal entre 45% e 60%',
    tone: 'green',
    min: 0,
    max: 100,
    trend: '−4,2%',
    history: [51, 49, 50, 48, 47, 45, 46, 44, 43, 44, 42, 43, 42, 41, 42],
  },
  temperature: {
    label: 'Temperatura',
    value: 24.5,
    unit: '°C',
    hint: 'Faixa ideal 18–26 °C',
    tone: 'yellow',
    min: 10,
    max: 35,
    trend: '+0,8%',
    history: [22.8, 23.1, 23.4, 23.2, 23.8, 24.1, 23.9, 24.3, 24.2, 24.6, 24.4, 24.7, 24.5],
  },
  light: {
    label: 'Luminosidade',
    value: 780,
    unit: 'lx',
    hint: 'Luz indireta · 12h de exposição',
    tone: 'purple',
    min: 0,
    max: 2000,
    trend: '−2,1%',
    history: [640, 680, 710, 690, 730, 760, 740, 790, 810, 780, 770, 780],
  },
}

const METRIC_PRECISION = {
  soil: 0,
  temperature: 1,
  light: 0,
}

const CHART_DATA = {
  '24h': {
    values: [
      46, 45, 44, 43, 42, 41, 40, 41, 43, 45, 44, 43, 42, 41, 40, 42, 45, 47,
      46, 44, 43, 42, 41, 42,
    ],
    labels: ['00h', '04h', '08h', '12h', '16h', '20h', '24h'],
  },
  '7d': {
    values: [48, 46, 44, 43, 45, 47, 45, 43, 42, 44, 46, 45, 43, 42],
    labels: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'],
  },
  '30d': {
    values: [
      52, 50, 49, 47, 48, 46, 45, 44, 46, 48, 47, 45, 43, 44, 46, 45, 43, 42,
      44, 46, 45, 43, 42, 41, 43, 45, 44, 42, 41, 42,
    ],
    labels: ['01', '05', '10', '15', '20', '25', '30'],
  },
}

const INITIAL_EVENTS = [
  {
    id: 'event-1',
    time: '09:42',
    text: 'Solo abaixo de 45%. Irrigação recomendada.',
    type: 'warn',
  },
  {
    id: 'event-2',
    time: '09:30',
    text: 'Sincronização com ESP32-01 concluída.',
    type: 'ok',
  },
  {
    id: 'event-3',
    time: '08:15',
    text: 'Luminosidade estável por 2 horas.',
    type: 'info',
  },
  {
    id: 'event-4',
    time: 'ontem',
    text: 'Rotina noturna ativada.',
    type: 'muted',
  },
]

function metricsFromPlant(plant, previous) {
  if (!Array.isArray(plant) || plant.length === 0) return null

  const latest = plant[plant.length - 1]

  if (!latest || typeof latest !== 'object') return null

  let changed = false
  const next = { ...previous }

  for (const key of Object.keys(INITIAL_METRICS)) {
    if (typeof latest[key] !== 'number' || !Number.isFinite(latest[key])) continue

    const history = plant
      .map((reading) =>
        reading && typeof reading === 'object' ? reading[key] : null,
      )
      .filter((value) => typeof value === 'number' && Number.isFinite(value))
      .slice(-20)

    next[key] = {
      ...previous[key],
      value: latest[key],
      history:
        history.length >= 2
          ? history
          : [...previous[key].history.slice(-19), latest[key]],
    }
    changed = true
  }

  return changed ? next : null
}

function formatElapsed(seconds) {
  if (seconds < 5) return 'agora mesmo'
  if (seconds < 60) return `há ${seconds}s`

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) return `há ${minutes}min`

  const hours = Math.floor(minutes / 60)
  return `há ${hours}h`
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [user, setUser] = useState(null)

  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [events, setEvents] = useState(INITIAL_EVENTS)
  const [range, setRange] = useState('24h')
  const [view, setView] = useState('painel')
  const [espId, setEspId] = useState('')
  const [lastSync, setLastSync] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const lastReadingAt = useRef('')

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = useCallback((message) => {
    setToast(message)

    if (toastTimer.current) clearTimeout(toastTimer.current)

    toastTimer.current = setTimeout(() => setToast(''), 3600)
  }, [])

  const addEvent = useCallback((text, type = 'info') => {
    const time = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    setEvents((previous) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        time,
        text,
        type,
      },
      ...previous,
    ].slice(0, 6))
  }, [])

  const applyPlant = useCallback((plant) => {
    if (!Array.isArray(plant) || plant.length === 0) return null

    const latest = plant[plant.length - 1]

    if (!latest || typeof latest !== 'object') return null

    if (typeof latest.receivedAt === 'string') {
      lastReadingAt.current = latest.receivedAt
    }

    setMetrics((previous) => metricsFromPlant(plant, previous) || previous)

    return latest
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const data = await api.session()

        if (cancelled) return

        const profile = normalizeUser(data?.user)

        if (!profile) return

        const latest = applyPlant(profile.plant)

        setUser(profile)
        setEspId(profile.esp || '')
        setLastSync(
          latest?.receivedAt ? new Date(latest.receivedAt) : null,
        )
        setIsLoggedIn(true)
      } catch {
        // Sem sessão ativa: permanece na tela de login.
      } finally {
        if (!cancelled) setIsCheckingSession(false)
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [applyPlant])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    const socket = connectSocket()

    const handleConnect = () => setRealtimeConnected(true)
    const handleDisconnect = () => setRealtimeConnected(false)
    const handleConnectError = () => setRealtimeConnected(false)

    const handleNewData = (payload) => {
      const status = payload?.status

      if (!status?.id) return

      const profile = normalizeUser(status)
      const latest = Array.isArray(profile.plant)
        ? profile.plant[profile.plant.length - 1]
        : null
      const receivedAt =
        typeof latest?.receivedAt === 'string' ? latest.receivedAt : ''
      const isNewReading =
        Boolean(receivedAt) && receivedAt !== lastReadingAt.current

      setUser((previous) => ({ ...(previous || {}), ...profile }))

      if (profile.esp) setEspId(profile.esp)

      applyPlant(profile.plant)

      if (receivedAt) setLastSync(new Date(receivedAt))

      if (isNewReading) {
        const parts = []

        if (typeof latest.soil === 'number') {
          parts.push(`solo ${Math.round(latest.soil)}%`)
        }

        if (typeof latest.temperature === 'number') {
          parts.push(`${latest.temperature.toFixed(1)} °C`)
        }

        if (typeof latest.light === 'number') {
          parts.push(`${Math.round(latest.light)} lx`)
        }

        addEvent(
          `Leitura de ${profile.esp || 'ESP32'}${
            parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
          }.`,
          'info',
        )
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('realtime error', handleConnectError)
    socket.on('new data', handleNewData)

    if (socket.connected) handleConnect()
    else connectSocket()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('realtime error', handleConnectError)
      socket.off('new data', handleNewData)
    }
  }, [isLoggedIn, applyPlant, addEvent])

  function handleLogin(rawProfile) {
    const profile = normalizeUser(rawProfile)

    if (!profile) return

    const latest = applyPlant(profile.plant)

    setUser(profile)
    setEspId(profile.esp || '')
    setLastSync(latest?.receivedAt ? new Date(latest.receivedAt) : null)
    setView('painel')
    setIsLoggedIn(true)
    showToast(
      `Bem-vindo, ${profile.name.trim().split(/\s+/)[0] || 'jardineiro'}.`,
    )
  }

  async function handleLogout() {
    try {
      await api.logout()
    } catch {
      // O cookie pode já ter expirado; encerrar a sessão local mesmo assim.
    }

    disconnectSocket()
    setRealtimeConnected(false)
    setIsLoggedIn(false)
    setUser(null)
    setEspId('')
    setView('painel')
    setLastSync(null)
    setMetrics(INITIAL_METRICS)
    setEvents(INITIAL_EVENTS)
    lastReadingAt.current = ''
  }

  async function handleAssociate(nextId) {
    const data = await api.associateEsp(nextId)
    const nextEspId = data?.esp || nextId
    const profile = normalizeUser(data?.user)

    setEspId(nextEspId)
    setUser((previous) => ({
      ...(previous || {}),
      ...(profile || {}),
      esp: nextEspId,
    }))
    addEvent(`Novo dispositivo associado: ${nextEspId}.`, 'ok')
    showToast(`${nextEspId} vinculado ao seu perfil.`)
    setView('painel')
  }

  async function handleSync() {
    try {
      const data = await api.session()
      const profile = normalizeUser(data?.user)

      if (!profile) return

      const latest = applyPlant(profile.plant)

      setUser(profile)
      setEspId(profile.esp || '')
      setLastSync(latest?.receivedAt ? new Date(latest.receivedAt) : null)
      addEvent(
        `Sincronização manual com ${profile.esp || espId || 'ESP32'} concluída.`,
        'ok',
      )
      showToast('Leituras sincronizadas com o servidor.')
    } catch (error) {
      if (error?.status === 401) {
        await handleLogout()
        return
      }

      showToast(error?.message || 'Não foi possível sincronizar agora.')
    }
  }

  function handleNavigate(nextView) {
    setView(nextView)
  }

  const chart =
    range === '24h'
      ? {
          ...CHART_DATA['24h'],
          values:
            metrics.soil.history.length >= 2
              ? metrics.soil.history
              : CHART_DATA['24h'].values,
        }
      : CHART_DATA[range]
  const elapsedSeconds = lastSync
    ? Math.max(0, Math.floor((now - lastSync.getTime()) / 1000))
    : null
  const lastSyncLabel =
    elapsedSeconds === null ? 'aguardando leitura' : formatElapsed(elapsedSeconds)
  const firstName =
    user?.name?.trim().split(/\s+/)[0] || user?.username || 'jardineiro'
  const displayFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const soilNeedsWater = metrics.soil.value < 45

  if (isCheckingSession) {
    return (
      <div className="auth-session" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <span>Recuperando sessão...</span>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app-shell">
      <Header
        active={view}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
        online={realtimeConnected}
      />

      <main className="app-main">
        {view === 'add-esp' ? (
          <AddEsp
            espId={espId}
            onAssociate={handleAssociate}
            onBack={() => handleNavigate('painel')}
          />
        ) : (
          <div className="dashboard">
            <div className="dash-top">
              <div className="dash-greeting">
                <p className="eyebrow">Sistema 2.0 · Módulo botânico</p>
                <h1 className="dash-title">Olá, {displayFirstName}.</h1>
                <p className="dash-sub">
                  {lastSync
                    ? `Seu jardim está sob controle. Última leitura ${lastSyncLabel}.`
                    : 'Aguardando a primeira leitura do dispositivo.'}
                </p>
              </div>

              <div className="dash-top-side">
                <div
                  className={`dash-status ${realtimeConnected ? '' : 'is-offline'}`}
                  role="status"
                >
                  <span
                    className={`led ${realtimeConnected ? 'is-blinking' : 'is-offline'}`}
                    aria-hidden="true"
                  />
                  <span>{espId || 'sem ESP'}</span>
                  <span className="status-divider">·</span>
                  <span>{lastSyncLabel}</span>
                  <span className="status-divider">·</span>
                  <span>3 sensores</span>
                </div>

                <div className="dash-plant">
                  <div className="dash-plant-media">
                    <img
                      className="dash-plant-img"
                      src={plantImage}
                      alt="Planta em vaso representando a Ficus elastica monitorada"
                    />
                  </div>
                  <div className="dash-plant-meta">
                    <span
                      className={`dash-plant-status ${soilNeedsWater ? 'is-warn' : ''}`}
                    >
                      <span className="led" aria-hidden="true" />
                      {soilNeedsWater ? 'Precisa de água' : 'Saudável'}
                    </span>
                    <strong>Ficus elastica</strong>
                    <span>Planta 01</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="metric-grid">
              {Object.entries(metrics).map(([key, metric]) => (
                <MetricCard
                  key={key}
                  metric={metric}
                  precision={METRIC_PRECISION[key]}
                />
              ))}
            </div>

            <div className="dash-main">
              <section className="window chart-window">
                <div className="panel-head">
                  <div>
                    <p className="section-kicker">Saúde do solo</p>
                    <p className="chart-value">
                      {metrics.soil.value.toFixed(0)}
                      <span>%</span>
                    </p>
                  </div>
                  <div
                    className="segmented"
                    role="group"
                    aria-label="Período do histórico"
                  >
                    {['24h', '7d', '30d'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={range === option ? 'is-active' : ''}
                        onClick={() => setRange(option)}
                        aria-pressed={range === option}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel-body chart-body">
                  <div className="chart-canvas">
                    <LineChart values={chart.values} />
                  </div>
                  <div className="chart-labels" aria-hidden="true">
                    {chart.labels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <span className="legend-line" aria-hidden="true" />
                    Umidade do solo
                    <span className="legend-ideal">ideal 45–60%</span>
                  </div>
                </div>
              </section>

              <div className="dash-side">
                <DevicePanel
                  espId={espId}
                  lastSyncLabel={lastSyncLabel}
                  onSync={handleSync}
                  onAddEsp={() => handleNavigate('add-esp')}
                  online={realtimeConnected}
                />
                <EventLog events={events} />
              </div>
            </div>
          </div>
        )}
      </main>

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

export default App
