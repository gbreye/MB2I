import { timingSafeEqual } from 'node:crypto'
import User from '../models/User.js'
import { emitUserUpdate } from '../realtime/bus.js'

const ESP_ID_PATTERN = /^[A-Za-z0-9._:-]{4,64}$/
const MAX_READING_DEPTH = 3
const MAX_READING_KEYS = 50
const MAX_STRING_LENGTH = 500
const MAX_READINGS = 100

function normalizeEspId(value) {
  if (typeof value !== 'string') return null

  const espId = value.trim()
  return ESP_ID_PATTERN.test(espId) ? espId : null
}

function isPlainObject(value) {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function sanitizeValue(value, depth) {
  if (value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH)

  if (depth >= MAX_READING_DEPTH || !isPlainObject(value)) return undefined

  const entries = Object.entries(value)

  if (entries.length > MAX_READING_KEYS) return undefined

  const result = {}

  for (const [key, item] of entries) {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(key)) continue

    const sanitized = sanitizeValue(item, depth + 1)

    if (sanitized !== undefined) result[key] = sanitized
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function sanitizeReading(value) {
  if (!isPlainObject(value)) return null

  const reading = sanitizeValue(value, 0)
  return reading && Object.keys(reading).length > 0 ? reading : null
}

function hasValidApiKey(req) {
  const expected = process.env.ESP_API_KEY

  if (!expected) return true

  const header = req.get('x-api-key')
  const authorization = req.get('authorization')
  const provided =
    header ||
    (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')
      ? authorization.slice(7).trim()
      : null)

  if (typeof provided !== 'string' || provided.length === 0) return false

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  )
}

class Esp {
  async associate(req, res) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ mes: 'Não autorizado' })
      }

      const espId = normalizeEspId(req.body?.espId ?? req.body?.id)

      if (!espId) {
        return res.status(400).json({ mes: 'espId inválido' })
      }

      const conflict = await User.findByEsp(espId)

      if (conflict && conflict.id !== req.user.id) {
        return res.status(409).json({ mes: 'ESP já associado a outro usuário' })
      }

      const user = await User.setEsp(req.user.id, espId)

      if (!user) {
        return res.status(404).json({ mes: 'Usuário não encontrado' })
      }

      emitUserUpdate(User.toPublic(user))

      return res.status(200).json({
        mes: 'ESP associado com sucesso',
        esp: user.esp,
        user: User.toPublic(user),
      })
    } catch (error) {
      if (error.code === 'ESP_CONFLICT') {
        return res.status(409).json({ mes: error.message })
      }

      console.error(error)
      return res.status(500).json({ mes: 'Erro interno' })
    }
  }

  async receive(req, res) {
    try {
      if (!hasValidApiKey(req)) {
        return res.status(401).json({ mes: 'Não autorizado' })
      }

      const body = isPlainObject(req.body) ? req.body : {}
      const espId = normalizeEspId(body.espId ?? body.id ?? req.query?.espId)

      if (!espId) {
        return res.status(400).json({ mes: 'espId inválido' })
      }

      const rawReading = isPlainObject(body.data)
        ? body.data
        : isPlainObject(body.reading)
          ? body.reading
          : Object.fromEntries(
              Object.entries(body).filter(
                ([key]) => !['espId', 'id', 'data', 'reading'].includes(key),
              ),
            )
      const reading = sanitizeReading(rawReading)

      if (!reading) {
        return res.status(400).json({ mes: 'Dados inválidos' })
      }

      const user = await User.appendPlantReading(espId, reading, MAX_READINGS)

      if (!user) {
        return res.status(404).json({ mes: 'ESP não associado a nenhum usuário' })
      }

      emitUserUpdate(User.toPublic(user))

      return res.status(201).json({ mes: 'Dados recebidos com sucesso' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ mes: 'Erro interno' })
    }
  }
}

export default new Esp()
