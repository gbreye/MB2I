import { userEvents } from './bus.js'

const MAX_CONNECTIONS_PER_USER = 3
const MAX_CONNECTIONS_PER_ADDRESS = 50
const MAX_TOTAL_CONNECTIONS = 1_000

const SENSITIVE_FIELDS = new Set(['password', '__v'])

const connectionsByUser = new Map()
const connectionsByAddress = new Map()
let totalConnections = 0

function sanitizeDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return null

  const safeDocument = {}

  for (const [field, value] of Object.entries(document)) {
    if (SENSITIVE_FIELDS.has(field)) continue
    if (field === '__proto__' || field === 'constructor' || field === 'prototype') continue
    if (field.startsWith('$') || field.includes('.')) continue

    safeDocument[field] = value
  }

  return safeDocument
}

function decrement(counter, key) {
  const current = counter.get(key)

  if (!current) return

  if (current <= 1) counter.delete(key)
  else counter.set(key, current - 1)
}

export function registerRealtime(io) {
  io.on('connection', (socket) => {
    const userId = socket.data.userId
    const address = socket.data.address || 'unknown'

    if (typeof userId !== 'string' || userId.length === 0) {
      socket.emit('realtime error', { code: 'unauthorized' })
      socket.disconnect(true)
      return
    }

    const userCount = connectionsByUser.get(userId) || 0
    const addressCount = connectionsByAddress.get(address) || 0

    if (
      userCount >= MAX_CONNECTIONS_PER_USER ||
      addressCount >= MAX_CONNECTIONS_PER_ADDRESS ||
      totalConnections >= MAX_TOTAL_CONNECTIONS
    ) {
      socket.emit('realtime error', { code: 'connection_limit' })
      socket.disconnect(true)
      return
    }

    connectionsByUser.set(userId, userCount + 1)
    connectionsByAddress.set(address, addressCount + 1)
    totalConnections += 1

    let closed = false

    const onUserUpdate = (document) => {
      if (closed || !socket.connected) return

      const safeDocument = sanitizeDocument(document)

      if (!safeDocument || String(safeDocument.id) !== userId) return

      socket.emit('new data', { status: safeDocument })
    }

    const release = () => {
      if (closed) return

      closed = true
      userEvents.off(`user:${userId}`, onUserUpdate)
      decrement(connectionsByUser, userId)
      decrement(connectionsByAddress, address)
      totalConnections = Math.max(0, totalConnections - 1)
    }

    userEvents.on(`user:${userId}`, onUserUpdate)
    socket.once('disconnect', release)
  })
}
