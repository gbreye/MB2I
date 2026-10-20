import { useCallback, useEffect, useState } from 'react'
import { formatReadingSummary, getFirstName } from '../lib/format'
import { getLatestReading } from '../lib/metrics'
import { api } from '../lib/requests'
import { disconnectSocket } from '../lib/socket'
import { normalizeUser } from '../lib/user'
import { useEventLog } from './useEventLog'
import { usePlantData } from './usePlantData'
import { useRealtime } from './useRealtime'
import { useToast } from './useToast'

/** Sessão, perfil, leituras, eventos e conexão em tempo real. */
export function useSession({ onLogout } = {}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [user, setUser] = useState(null)
  const [espId, setEspId] = useState('')
  const [lastSync, setLastSync] = useState(null)

  const { metrics, readings, applyPlant, resetPlant, lastReadingAt } =
    usePlantData()
  const { events, addEvent, clearEvents } = useEventLog()
  const { toast, showToast } = useToast()

  const applyProfile = useCallback(
    (profile) => {
      if (!profile) return null

      const latest = applyPlant(profile.plant)

      setUser(profile)
      setEspId(profile.esp || '')
      setLastSync(latest?.receivedAt ? new Date(latest.receivedAt) : null)

      return latest
    },
    [applyPlant],
  )

  // Restaura a sessão a partir do cookie httpOnly.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const data = await api.session()

        if (cancelled) return

        const profile = normalizeUser(data?.user)

        if (!profile) return

        applyProfile(profile)
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
  }, [applyProfile])

  const handleStatus = useCallback(
    (profile) => {
      const latest = getLatestReading(profile.plant)
      const receivedAt =
        typeof latest?.receivedAt === 'string' ? latest.receivedAt : ''
      const isNewReading =
        Boolean(receivedAt) && receivedAt !== lastReadingAt.current

      setUser((previous) => ({ ...(previous || {}), ...profile }))

      if (profile.esp) setEspId(profile.esp)

      applyPlant(profile.plant)
      setLastSync(receivedAt ? new Date(receivedAt) : null)

      if (isNewReading) {
        addEvent(
          `Leitura de ${profile.esp || 'ESP32'}${formatReadingSummary(latest)}.`,
          'info',
        )
      }
    },
    [applyPlant, addEvent, lastReadingAt],
  )

  useRealtime({
    enabled: isLoggedIn,
    onStatus: handleStatus,
    onConnectionChange: setRealtimeConnected,
  })

  const handleLogin = useCallback(
    (rawProfile) => {
      const profile = normalizeUser(rawProfile)

      if (!profile) return

      applyProfile(profile)
      setIsLoggedIn(true)
      showToast(`Bem-vindo, ${getFirstName(profile)}.`)
    },
    [applyProfile, showToast],
  )

  const handleLogout = useCallback(async () => {
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
    setLastSync(null)
    resetPlant()
    clearEvents()
    onLogout?.()
  }, [resetPlant, clearEvents, onLogout])

  const handleAssociate = useCallback(
    async (nextId) => {
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
    },
    [addEvent, showToast],
  )

  const handleSync = useCallback(async () => {
    try {
      const data = await api.session()
      const profile = normalizeUser(data?.user)

      if (!profile) return

      const latest = applyProfile(profile)

      if (latest) {
        addEvent(
          `Sincronização manual com ${profile.esp || espId || 'ESP32'} concluída.`,
          'ok',
        )
        showToast('Leituras sincronizadas com o servidor.')
      } else {
        addEvent('Sincronização concluída sem leituras do dispositivo.', 'muted')
        showToast('Nenhuma leitura recebida do dispositivo.')
      }
    } catch (error) {
      if (error?.status === 401) {
        await handleLogout()
        return
      }

      showToast(error?.message || 'Não foi possível sincronizar agora.')
    }
  }, [applyProfile, addEvent, showToast, espId, handleLogout])

  return {
    isLoggedIn,
    isCheckingSession,
    realtimeConnected,
    user,
    espId,
    lastSync,
    metrics,
    readings,
    events,
    toast,
    handleLogin,
    handleLogout,
    handleAssociate,
    handleSync,
  }
}
