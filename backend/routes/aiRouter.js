import express from 'express'
import { rateLimit } from 'express-rate-limit'
import Ai from '../controllers/ai.js'
import { authMiddleware } from '../middlewares/tokenMiddleware.js'

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mes: 'Muitas solicitações de relatório. Aguarde um minuto e tente novamente.',
    code: 'AI_RATE_LIMIT',
  },
})

const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

const AiRouter = express.Router()

AiRouter.get('/status', statusLimiter, authMiddleware, Ai.status)
AiRouter.post('/report', reportLimiter, authMiddleware, Ai.report)

export default AiRouter
