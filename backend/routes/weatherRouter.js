import express from 'express'
import { rateLimit } from 'express-rate-limit'
import Weather from '../controllers/weather.js'

const forecastLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mes: 'Muitas consultas de meteorologia. Aguarde um minuto e tente novamente.',
    code: 'WEATHER_RATE_LIMIT',
  },
})

const WeatherRouter = express.Router()

WeatherRouter.get('/', forecastLimiter, Weather.show)

export default WeatherRouter
