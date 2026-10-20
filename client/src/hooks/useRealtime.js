import { useEffect } from 'react'
import { connectSocket } from '../lib/socket'
import { normalizeUser } from '../lib/user'

/**
 * Mantém a conexão em tempo real ativa enquanto `enabled` for verdadeiro e
 * encaminha cada status recebido já normalizado.
 */
export function useRealtime({ enabled, onStatus, onConnectionChange }) {
  useEffect(() => {
    if (!enabled) return undefined

    const socket = connectSocket()

    const handleConnect = () => onConnectionChange(true)
    const handleDisconnect = () => onConnectionChange(false)
    const handleError = () => onConnectionChange(false)
    const handleNewData = (payload) => {
      const profile = normalizeUser(payload?.status)

      if (!profile?.id) return

      onStatus(profile)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleError)
    socket.on('realtime error', handleError)
    socket.on('new data', handleNewData)

    if (socket.connected) handleConnect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleError)
      socket.off('realtime error', handleError)
      socket.off('new data', handleNewData)
    }
  }, [enabled, onStatus, onConnectionChange])
}
