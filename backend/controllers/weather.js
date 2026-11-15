import 'dotenv/config'

const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search'
const IP_ENDPOINT = 'https://ipwho.is'

const REQUEST_TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS) || 8_000
const FORECAST_TTL_MS = 10 * 60 * 1000
const IP_TTL_MS = 30 * 60 * 1000
const MAX_FORECAST_ENTRIES = 200
const MAX_IP_ENTRIES = 500
const MAX_CITY_LENGTH = 80

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'is_day',
].join(',')

const DAILY_FIELDS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'precipitation_sum',
].join(',')

// Letras (com acentos), espaço, apóstrofo, ponto e hífen.
const CITY_PATTERN = /^[\p{L}\p{M}\s'.-]+$/u

const PRIVATE_IP_PATTERNS = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^f[cd][0-9a-f]{2}:/i,
  /^fe80:/i,
]

function readCoordinate(value, fallback) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

// Local usado quando o IP não é público ou a consulta de IP falha.
const DEFAULT_PLACE = {
  label: (process.env.WEATHER_DEFAULT_PLACE || 'São Paulo').trim() || 'São Paulo',
  latitude: readCoordinate(process.env.WEATHER_DEFAULT_LAT, -23.55),
  longitude: readCoordinate(process.env.WEATHER_DEFAULT_LON, -46.63),
}

const forecastCache = new Map()
const ipCache = new Map()

function cacheGet(cache, key) {
  const entry = cache.get(key)

  if (!entry) return undefined

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return undefined
  }

  return entry.value
}

function cacheSet(cache, key, value, ttlMs, maxEntries) {
  if (cache.size >= maxEntries) {
    const oldestKey = cache.keys().next().value

    if (oldestKey !== undefined) cache.delete(oldestKey)
  }

  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  return response.json()
}

function buildPlaceLabel({ name, region, country }) {
  const parts = []

  for (const value of [name, region, country]) {
    if (typeof value !== 'string') continue

    const clean = value.trim()

    if (!clean) continue
    if (parts.some((item) => item.toLowerCase() === clean.toLowerCase())) continue

    parts.push(clean)
  }

  return parts.slice(0, 2).join(', ')
}

function normalizeIp(value) {
  if (typeof value !== 'string') return ''

  let ip = value.trim()

  if (ip.toLowerCase().startsWith('::ffff:')) ip = ip.slice(7)
  if (!/^[0-9a-fA-F:.]{3,45}$/.test(ip)) return ''

  return ip
}

function isPrivateIp(ip) {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip))
}

/** Traduz o IP da conexão em um local aproximado (cidade, região e país). */
async function lookupIpLocation(ip) {
  const cached = cacheGet(ipCache, ip)

  if (cached !== undefined) return cached

  let place = null

  try {
    const data = await fetchJson(`${IP_ENDPOINT}/${encodeURIComponent(ip)}?lang=pt`)
    const latitude = readCoordinate(data?.latitude, NaN)
    const longitude = readCoordinate(data?.longitude, NaN)

    if (data?.success !== false && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      place = {
        label:
          buildPlaceLabel({
            name: data.city,
            region: data.region,
            country: data.country,
          }) || DEFAULT_PLACE.label,
        latitude,
        longitude,
      }
    }
  } catch {
    place = null
  }

  cacheSet(ipCache, ip, place, IP_TTL_MS, MAX_IP_ENTRIES)

  return place
}

/** Encontra as coordenadas de uma cidade escrita pelo usuário. */
async function geocodeCity(city) {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: 'pt',
    format: 'json',
  })

  const data = await fetchJson(`${GEOCODING_ENDPOINT}?${params}`)
  const result = Array.isArray(data?.results) ? data.results[0] : null
  const latitude = readCoordinate(result?.latitude, NaN)
  const longitude = readCoordinate(result?.longitude, NaN)

  if (!result || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return {
    label:
      buildPlaceLabel({
        name: result.name,
        region: result.admin1,
        country: result.country,
      }) || city,
    latitude,
    longitude,
  }
}

/** Previsão atual + resumo do dia. O Open-Meteo não exige chave de API. */
async function getForecast(latitude, longitude) {
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`
  const cached = cacheGet(forecastCache, cacheKey)

  if (cached !== undefined) return cached

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    timezone: 'auto',
    forecast_days: '1',
  })

  const data = await fetchJson(`${FORECAST_ENDPOINT}?${params}`)
  const current = data?.current

  if (!current) throw new Error('previsão sem dados atuais')

  const daily = data?.daily
  const firstDaily = (values) => (Array.isArray(values) ? values[0] : null)
  const forecast = {
    temperature: current.temperature_2m ?? null,
    apparentTemperature: current.apparent_temperature ?? null,
    humidity: current.relative_humidity_2m ?? null,
    windSpeed: current.wind_speed_10m ?? null,
    precipitation: current.precipitation ?? null,
    weatherCode: current.weather_code ?? null,
    isDay: current.is_day === 1,
    maxTemperature: firstDaily(daily?.temperature_2m_max),
    minTemperature: firstDaily(daily?.temperature_2m_min),
    rainProbability: firstDaily(daily?.precipitation_probability_max),
    rainSum: firstDaily(daily?.precipitation_sum),
  }

  cacheSet(forecastCache, cacheKey, forecast, FORECAST_TTL_MS, MAX_FORECAST_ENTRIES)

  return forecast
}

class Weather {
  /**
   * GET /weather          → local aproximado pelo IP da conexão
   * GET /weather?city=... → local definido pelo nome digitado
   */
  async show(req, res) {
    const rawCity =
      typeof req.query?.city === 'string'
        ? req.query.city.trim().replace(/\s+/g, ' ')
        : ''

    if (rawCity && (rawCity.length > MAX_CITY_LENGTH || !CITY_PATTERN.test(rawCity))) {
      return res.status(400).json({
        mes: 'Informe o nome de uma cidade.',
        code: 'WEATHER_CITY_INVALID',
      })
    }

    let place = null
    let source = 'default'

    if (rawCity) {
      try {
        place = await geocodeCity(rawCity)
      } catch {
        return res.status(502).json({
          mes: 'Não foi possível buscar essa cidade agora. Tente novamente.',
          code: 'WEATHER_UPSTREAM',
        })
      }

      if (!place) {
        return res.status(404).json({
          mes: `Não encontrei "${rawCity}". Confira o nome da cidade.`,
          code: 'WEATHER_PLACE_NOT_FOUND',
        })
      }

      source = 'city'
    } else {
      const ip = normalizeIp(req.ip)

      if (ip && !isPrivateIp(ip)) place = await lookupIpLocation(ip)

      if (place) {
        source = 'ip'
      } else {
        place = { ...DEFAULT_PLACE }
        source = 'default'
      }
    }

    try {
      const weather = await getForecast(place.latitude, place.longitude)

      return res.json({
        mes: 'Previsão carregada',
        place: {
          label: place.label,
          latitude: place.latitude,
          longitude: place.longitude,
          source,
        },
        weather: { ...weather, updatedAt: new Date().toISOString() },
      })
    } catch (error) {
      console.error(`Falha ao consultar a meteorologia: ${error.message}`)

      return res.status(502).json({
        mes: 'Não foi possível consultar a meteorologia agora.',
        code: 'WEATHER_UPSTREAM',
      })
    }
  }
}

export default new Weather()
