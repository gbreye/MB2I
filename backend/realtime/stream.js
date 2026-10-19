import mongoose from 'mongoose'

const MAX_CONNECTIONS_PER_USER = 3
const MAX_CONNECTIONS_PER_ADDRESS = 50
const MAX_TOTAL_CONNECTIONS = 1_000

const SENSITIVE_FIELDS = new Set(["password", "__v"]);

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

    let changeStream = null
    let closed = false

    const closeChangeStream = () => {
      const stream = changeStream
      changeStream = null

      if (!stream) return

      try {
        Promise.resolve(stream.close()).catch(() => {})
      } catch {
        return
      }
    }

    const release = () => {
      if (closed) return

      closed = true
      decrement(connectionsByUser, userId)
      decrement(connectionsByAddress, address)
      totalConnections = Math.max(0, totalConnections - 1)
      closeChangeStream()
    }

    socket.once('disconnect', release)

    try {
      const database = mongoose.connection.db

      if (!database) {
        socket.emit('realtime error', { code: 'stream_unavailable' })
        socket.disconnect(true)
        return
      }

      const pipeline = [
        {
          $match: {
            'documentKey._id': new mongoose.Types.ObjectId(userId),
            operationType: { $in: ['insert', 'update', 'replace'] },
          },
        },
      ]

      const stream = database
        .collection('users')
        .watch(pipeline, { fullDocument: 'updateLookup' })

      if (closed) {
        Promise.resolve(stream.close()).catch(() => {})
        return
      }

      changeStream = stream

      stream.on('change', (change) => {
        if (closed || !socket.connected) return
        if (!change || !['insert', 'update', 'replace'].includes(change.operationType)) return

        const document = sanitizeDocument(change.fullDocument)

        if (!document || String(document._id) !== userId) return

        socket.emit('new data', { status: document })
      })

      stream.on('error', () => {
        if (closed) return

        socket.emit('realtime error', { code: 'stream_unavailable' })
        socket.disconnect(true)
      })

      stream.on('close', () => {
        if (closed) return

        socket.emit('realtime error', { code: 'stream_closed' })
        socket.disconnect(true)
      })
    } catch {
      if (closed) return

      socket.emit('realtime error', { code: 'stream_unavailable' })
      socket.disconnect(true)
    }
  })
}
