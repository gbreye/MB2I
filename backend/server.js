import 'dotenv/config'
import express from 'express'
import * as http from 'node:http'
import cors from 'cors'
import { Server } from 'socket.io'
import { initializeDatabase, closeDatabase } from './config/database.js'
import { authMiddleware } from './middlewares/tokenMiddleware.js'
import { registerRealtime } from './realtime/stream.js'
import AuthRouter from './routes/authRouter.js'
import EspRouter from './routes/espRouter.js'

const app = express()
const server = http.createServer(app)

app.set('trust proxy', 1)

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isAllowedOrigin(origin) {
  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true
    if (!allowed.includes('*')) return allowed === origin

    const pattern = new RegExp(
      `^${allowed.split('*').map(escapeRegExp).join('.*')}$`,
    )

    return pattern.test(origin)
  })
}

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.length === 0 || isAllowedOrigin(origin)) {
    callback(null, true)
    return
  }

  console.warn(`CORS bloqueado para origem: ${origin}`)
  callback(null, false)
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  optionsSuccessStatus: 204,
  maxAge: 86_400,
}

export const io = new Server(server, {
  cors: corsOptions,
})

io.use(authMiddleware)
registerRealtime(io)

app.set('io', io)
app.use(cors(corsOptions))
app.use(express.json())
app.use('/auth', AuthRouter)
app.use('/esp', EspRouter)

const PORT = Number(process.env.PORT) || 3000

app.get('/', (req, res) => {
  res.send('hello planta')
})

try {
  await initializeDatabase()
} catch (error) {
  console.error(`Falha ao inicializar o SQLite: ${error.message}`)
  process.exit(1)
}

server.listen(PORT, () => {
  console.log(`servidor rodando na porta ${PORT}`)
})

async function shutdown() {
  server.close(async () => {
    try {
      await closeDatabase()
      process.exit(0)
    } catch (error) {
      console.error(`Falha ao fechar o SQLite: ${error.message}`)
      process.exit(1)
    }
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
