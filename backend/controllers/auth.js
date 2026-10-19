import jsonwebtoken from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import User from '../models/User.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET
const COOKIE_SAME_SITE = ['lax', 'strict', 'none'].includes(process.env.COOKIE_SAME_SITE)
  ? process.env.COOKIE_SAME_SITE
  : 'lax'
const COOKIE_SECURE =
  process.env.COOKIE_SECURE === 'true' ||
  process.env.NODE_ENV === 'production' ||
  COOKIE_SAME_SITE === 'none'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido')
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

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: COOKIE_SAME_SITE,
    secure: COOKIE_SECURE,
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  }
}

function setSessionCookie(res, user, remember = false) {
  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
  res.cookie('token', signToken(user, remember), cookieOptions(maxAge))
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
      setSessionCookie(res, user, remember)

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

      setSessionCookie(res, user)

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

  async logout(_req, res) {
    res.clearCookie('token', cookieOptions())
    return res.status(200).json({ mes: 'Sessão encerrada.' })
  }
}

export default new Auth()
