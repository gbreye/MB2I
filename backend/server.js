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

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    callback(null, true)
    return
  }

  callback(new Error('Origem não permitida pelo CORS'))
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
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
