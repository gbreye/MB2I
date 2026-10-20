import jsonwebtoken from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import User from '../models/User.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET
const VALID_SAME_SITE = new Set(['lax', 'strict', 'none'])
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido')
}

function isSecureRequest(req) {
  if (req?.secure) return true

  const forwardedProto = req?.get?.('x-forwarded-proto')
  return (
    typeof forwardedProto === 'string' &&
    forwardedProto.split(',')[0].trim() === 'https'
  )
}

function isSecureOrigin(req) {
  const origin = req?.get?.('origin')

  if (!origin) return false

  try {
    return new URL(origin).protocol === 'https:'
  } catch {
    return false
  }
}

function isCrossSiteRequest(req) {
  const origin = req?.get?.('origin')

  if (!origin) return false

  try {
    return new URL(origin).hostname !== req.hostname
  } catch {
    return false
  }
}

function cookiePolicy(req) {
  const configuredSameSite = process.env.COOKIE_SAME_SITE
  const requestedSameSite = VALID_SAME_SITE.has(configuredSameSite)
    ? configuredSameSite
    : null
  const crossSite = isCrossSiteRequest(req)
  const secureRequest = isSecureRequest(req) || isSecureOrigin(req)
  const sameSite =
    crossSite && secureRequest
      ? 'none'
      : requestedSameSite || (IS_PRODUCTION ? 'none' : 'lax')
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    IS_PRODUCTION ||
    sameSite === 'none' ||
    secureRequest

  return { sameSite, secure }
}

const isStr = (value, max = 50) =>
  typeof value === 'string' && value.trim() !== '' && value.length <= max

function signToken(user, remember) {
  return jsonwebtoken.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: remember ? '30d' : '1h' },
  )
}

function cookieOptions(maxAge, req) {
  const { sameSite, secure } = cookiePolicy(req)

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  }
}

function setSessionCookie(res, user, remember = false, req) {
  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
  res.cookie('token', signToken(user, remember), cookieOptions(maxAge, req))
}

class Auth {
  async login(req, res) {
    try {
      const { email, password } = req.body
      if (!isStr(email) || !isStr(password)) {
        return res.status(400).json({ mes: 'Informe e-mail e senha.' })
      }

      const user = await User.findByEmail(email.trim().toLowerCase())
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ mes: 'E-mail ou senha incorretos.' })
      }

      const remember = req.body?.remember === true
      setSessionCookie(res, user, remember, req)

      return res.status(200).json({
        mes: 'Login realizado com sucesso!',
        user: User.toPublic(user),
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ mes: 'Erro interno do servidor.' })
    }
  }

  async signup(req, res) {
    try {
      const { username, email, password } = req.body
      if (!isStr(username) || !isStr(email) || !isStr(password)) {
        return res.status(400).json({ mes: 'Confira nome, e-mail e senha.' })
      }

      const hash = await bcrypt.hash(password, 12)
      const user = await User.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: hash,
      })

      setSessionCookie(res, user, false, req)

      return res.status(201).json({
        mes: 'Usuário criado com sucesso!',
        user: User.toPublic(user),
      })
    } catch (error) {
      if (
        error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        error.code === 'SQLITE_CONSTRAINT' ||
        /UNIQUE constraint failed: users\.email/i.test(error.message)
      ) {
        return res.status(409).json({ mes: 'Este e-mail já está em uso.' })
      }

      console.error(error)
      return res.status(500).json({ mes: 'Erro interno do servidor.' })
    }
  }

  async findUser(req, res) {
    if (!req.user?.id) {
      return res.status(401).json({ mes: 'Não autorizado.' })
    }

    try {
      const user = await User.findById(req.user.id)

      if (!user) {
        return res.status(401).json({ mes: 'Sessão expirada.' })
      }

      return res.status(200).json({
        mes: 'Sessão ativa.',
        user: User.toPublic(user),
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ mes: 'Erro interno do servidor.' })
    }
  }

  async logout(req, res) {
    res.clearCookie('token', cookieOptions(undefined, req))
    return res.status(200).json({ mes: 'Sessão encerrada.' })
  }
}

export default new Auth()
