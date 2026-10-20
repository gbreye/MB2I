import { io } from 'socket.io-client'
import { API_URL } from './env'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    })
  }

  return socket
}

export function connectSocket() {
  const current = getSocket()

  if (!current.connected) current.connect()

  return current
}

export function disconnectSocket() {
  if (!socket) return

  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}
