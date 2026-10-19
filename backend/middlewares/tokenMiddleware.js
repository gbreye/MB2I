import 'dotenv/config'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido')
}

const USER_ID_PATTERN = /^[1-9]\d*$/
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const AUTH_WINDOW_MS = 60_000
const AUTH_MAX_ATTEMPTS = 20
const AUTH_TIMEOUT_MS = 8_000
const MAX_COOKIE_HEADER_LENGTH = 8_192
const MAX_TOKEN_LENGTH = 4_096

const authAttempts = new Map()

function isSocket(source) {
  return Boolean(source?.handshake && source?.request)
}

function getAddress(source) {
  if (isSocket(source)) {
    const address = source.handshake.address
    return typeof address === 'string' && address ? address : 'unknown'
  }

  const address = source.ip || source.socket?.remoteAddress
  return typeof address === 'string' && address ? address : 'unknown'
}

function getHeader(source, name) {
  if (isSocket(source)) return source.handshake.headers?.[name]
  return source.headers?.[name]
}

function parseCookies(header) {
  const cookies = Object.create(null)

  for (const part of header.split(';')) {
    const separator = part.indexOf('=')

    if (separator < 1) continue

    const name = part.slice(0, separator).trim()

    if (!name || name === '__proto__' || name === 'constructor' || name === 'prototype') continue

    let value = part.slice(separator + 1).trim()

    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }

    try {
      value = decodeURIComponent(value)
    } catch {
      continue
    }

    cookies[name] = value
  }

  return cookies
}

function extractToken(source) {
  if (isSocket(source)) {
    const authToken = source.handshake.auth?.token

    if (typeof authToken === 'string' && authToken) return authToken
  } else if (typeof source.cookies?.token === 'string' && source.cookies.token) {
    return source.cookies.token
  }

  const authorization = getHeader(source, 'authorization')

  if (typeof authorization === 'string') {
    const [scheme, value] = authorization.split(' ')

    if (scheme?.toLowerCase() === 'bearer' && value) return value.trim()
  }

  const cookieHeader = getHeader(source, 'cookie')

  if (
    typeof cookieHeader === 'string' &&
    cookieHeader.length > 0 &&
    cookieHeader.length <= MAX_COOKIE_HEADER_LENGTH
  ) {
    const cookies = parseCookies(cookieHeader)
    return cookies.token || cookies._id || null
  }

  return null
}

function allowAttempt(address) {
  const now = Date.now()
  const current = authAttempts.get(address)

  if (!current || now - current.startedAt >= AUTH_WINDOW_MS) {
    authAttempts.set(address, { startedAt: now, count: 1 })

    if (authAttempts.size > 5_000) {
      for (const [entryKey, entry] of authAttempts) {
        if (now - entry.startedAt >= AUTH_WINDOW_MS) authAttempts.delete(entryKey)
      }
    }

    return true
  }

  if (current.count >= AUTH_MAX_ATTEMPTS) return false

  current.count += 1
  return true
}

function releaseAttempt(address) {
  const current = authAttempts.get(address)

  if (!current) return

  if (current.count <= 1) authAttempts.delete(address)
  else current.count -= 1
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)
    timer.unref?.()

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function resolveUser(source) {
  const token = extractToken(source)

  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw new Error('unauthorized')
  }

  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    clockTolerance: 5,
  })

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.id !== 'string' ||
    typeof payload.exp !== 'number' ||
    !USER_ID_PATTERN.test(payload.id)
  ) {
    throw new Error('unauthorized')
  }

  const user = await User.findAuthById(payload.id)

  if (!user) {
    throw new Error('unauthorized')
  }

  return { id: user.id, admin: user.admin }
}

export async function authMiddleware(source, response, next) {
  const socket = isSocket(source)
  const socketNext = socket ? response : next
  const res = socket ? null : response

  if (socket) {
    const origin = source.handshake.headers.origin

    if (ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
      return socketNext(new Error('forbidden'))
    }
  }

  const address = getAddress(source)

  if (!allowAttempt(address)) {
    if (socket) return socketNext(new Error('rate_limited'))
    return res.status(429).json({ message: 'Muitas tentativas. Tente novamente mais tarde.' })
  }

  try {
    const user = await withTimeout(resolveUser(source), AUTH_TIMEOUT_MS)

    releaseAttempt(address)
    source.user = user

    if (socket) {
      source.data.userId = user.id
      source.data.user = user
      source.data.address = address
      return socketNext()
    }

    return next()
  } catch {
    if (socket) return socketNext(new Error('unauthorized'))
    return res.status(401).json({ message: 'Não autorizado' })
  }
}

export function adminMiddleware(source, response, next) {
  const socket = isSocket(source)
  const socketNext = socket ? response : next
  const res = socket ? null : response

  if (!source.user?.admin) {
    if (socket) return socketNext(new Error('forbidden'))
    return res.status(403).json({ message: 'Acesso restrito a administradores' })
  }

  return socket ? socketNext() : next()
}
