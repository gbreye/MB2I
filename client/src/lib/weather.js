import { weatherApi } from './requests'

const CODES = {
  0: { label: 'Céu limpo', icon: '☀️', nightIcon: '🌙' },
  1: { label: 'Predomínio de sol', icon: '🌤️', nightIcon: '🌙' },
  2: { label: 'Parcialmente nublado', icon: '⛅', nightIcon: '☁️' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Nevoeiro', icon: '🌫️' },
  48: { label: 'Nevoeiro com geada', icon: '🌫️' },
  51: { label: 'Garoa leve', icon: '🌦️' },
  53: { label: 'Garoa', icon: '🌦️' },
  55: { label: 'Garoa forte', icon: '🌧️' },
  56: { label: 'Garoa congelante', icon: '🌧️' },
  57: { label: 'Garoa congelante forte', icon: '🌧️' },
  61: { label: 'Chuva leve', icon: '🌦️' },
  63: { label: 'Chuva', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  66: { label: 'Chuva congelante', icon: '🌧️' },
  67: { label: 'Chuva congelante forte', icon: '🌧️' },
  71: { label: 'Neve leve', icon: '🌨️' },
  73: { label: 'Neve', icon: '❄️' },
  75: { label: 'Neve forte', icon: '❄️' },
  77: { label: 'Grãos de neve', icon: '🌨️' },
  80: { label: 'Pancadas de chuva', icon: '🌦️' },
  81: { label: 'Pancadas moderadas', icon: '🌧️' },
  82: { label: 'Pancadas fortes', icon: '⛈️' },
  85: { label: 'Pancadas de neve', icon: '🌨️' },
  86: { label: 'Pancadas de neve forte', icon: '❄️' },
  95: { label: 'Tempestade', icon: '⛈️' },
  96: { label: 'Tempestade com granizo', icon: '⛈️' },
  99: { label: 'Tempestade com granizo forte', icon: '⛈️' },
}

const UNKNOWN_CONDITION = { label: 'Condição indisponível', icon: '🌡️' }

const PLACE_SOURCES = {
  city: 'Cidade definida por você',
  ip: 'Local estimado pela sua conexão',
  default: 'Local padrão do painel',
}

function toNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function describeWeather(code, isDay = true) {
  const condition = CODES[code]

  if (!condition) return UNKNOWN_CONDITION

  return {
    label: condition.label,
    icon: isDay ? condition.icon : condition.nightIcon || condition.icon,
  }
}

/** Formata um número do clima, mostrando um traço quando não há leitura. */
export function formatWeatherValue(value, digits = 0, unit = '') {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'

  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ''}`
}

/** Sugestão de cuidado com a planta conforme o tempo do dia. */
export function buildWeatherAdvice(weather) {
  if (!weather) return 'Aguardando a previsão para sugerir cuidados.'

  const rainChance = weather.rainProbability ?? 0
  const rainToday = weather.rainSum ?? 0
  const humidity = weather.humidity
  const maxTemp = weather.maxTemperature
  const minTemp = weather.minTemperature

  if (rainChance >= 60 || rainToday >= 5) {
    return 'Chuva prevista: reduza a rega e proteja as plantas mais sensíveis.'
  }

  if (typeof maxTemp === 'number' && maxTemp >= 32) {
    return 'Calor intenso: regue no início do dia e evite sol direto ao meio-dia.'
  }

  if (typeof minTemp === 'number' && minTemp <= 10) {
    return 'Noite fria: afaste as plantas da janela e reduza a rega.'
  }

  if (typeof humidity === 'number' && humidity <= 40) {
    return 'Ar seco: borrife as folhas e aumente a umidade perto das plantas.'
  }

  if (typeof humidity === 'number' && humidity >= 85) {
    return 'Umidade alta: fique de olho em manchas e fungos nas folhas.'
  }

  return 'Tempo estável: mantenha a rotina de rega e observação das folhas.'
}

export function describePlaceSource(source) {
  return PLACE_SOURCES[source] || PLACE_SOURCES.default
}

/**
 * Busca a previsão no backend. Sem cidade, o backend usa o local aproximado
 * do IP da conexão; com cidade, geocodifica o nome digitado.
 */
export async function fetchWeather({ city = '' } = {}) {
  const data = await weatherApi.current(city)
  const raw = data?.weather

  if (!raw) {
    throw new Error('A meteorologia não retornou dados para este local.')
  }

  return {
    place: {
      label: data?.place?.label || 'sua região',
      source: data?.place?.source || 'default',
    },
    temperature: toNumber(raw.temperature),
    apparentTemperature: toNumber(raw.apparentTemperature),
    humidity: toNumber(raw.humidity),
    windSpeed: toNumber(raw.windSpeed),
    precipitation: toNumber(raw.precipitation),
    condition: describeWeather(raw.weatherCode, raw.isDay !== false),
    maxTemperature: toNumber(raw.maxTemperature),
    minTemperature: toNumber(raw.minTemperature),
    rainProbability: toNumber(raw.rainProbability),
    rainSum: toNumber(raw.rainSum),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  }
}
