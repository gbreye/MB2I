import { useCallback, useState } from 'react'
import { useWeather } from '../hooks/useWeather'
import {
  buildWeatherAdvice,
  describePlaceSource,
  formatWeatherValue,
} from '../lib/weather'
import Button from './ui/Button'
import CountUp from './ui/CountUp'
import { Panel, PanelTitle } from './ui/Panel'

const CITY_STORAGE_KEY = 'mb2i:weather-city'
const MAX_CITY_LENGTH = 80

function readSavedCity() {
  try {
    return window.localStorage.getItem(CITY_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function saveCity(city) {
  try {
    if (city) window.localStorage.setItem(CITY_STORAGE_KEY, city)
    else window.localStorage.removeItem(CITY_STORAGE_KEY)
  } catch {
    // Sem armazenamento disponível: a cidade vale apenas nesta sessão.
  }
}

function formatPercent(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'

  return `${value.toFixed(0)}%`
}

function PencilIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13.6 2.9a1.9 1.9 0 0 1 2.7 0l.8.8a1.9 1.9 0 0 1 0 2.7l-8.4 8.4-3.6 1 .8-3.7 8.4-8.4-.7-.8Zm.9 1.2-8.1 8.1-.4 1.8 1.8-.4 8.1-8.1-.8-.8-.6-.6Z" />
    </svg>
  )
}

function WeatherStat({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-sans text-sm font-semibold tabular-nums">
        {value}
        {hint ? (
          <span className="ml-1 text-[11px] font-medium text-muted">{hint}</span>
        ) : null}
      </dd>
    </div>
  )
}

function WeatherCard() {
  const [city, setCity] = useState(readSavedCity)
  const [cityInput, setCityInput] = useState(readSavedCity)
  const [isEditingPlace, setIsEditingPlace] = useState(false)
  const { weather, place, status, reload } = useWeather(city)

  const placeLabel = place?.label || city || 'sua região'
  const placeHint = `${describePlaceSource(place?.source)}. Clique para digitar outra cidade.`
  const advice = buildWeatherAdvice(weather)
  const updatedLabel =
    status === 'error'
      ? 'sem conexão'
      : status === 'loading'
        ? 'atualizando…'
        : weather?.updatedAt
          ? `atualizado às ${weather.updatedAt.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'consultando…'

  const openPlaceEditor = useCallback(() => {
    setCityInput(city)
    setIsEditingPlace(true)
  }, [city])

  const closePlaceEditor = useCallback(() => setIsEditingPlace(false), [])

  const applyCity = useCallback(
    (next) => {
      setCity(next)
      saveCity(next)
      setIsEditingPlace(false)
      reload()
    },
    [reload],
  )

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault()

      const next = cityInput.trim().replace(/\s+/g, ' ')

      if (!next) return

      applyCity(next)
    },
    [applyCity, cityInput],
  )

  const useConnectionLocation = useCallback(() => {
    if (city) {
      applyCity('')
      return
    }

    setIsEditingPlace(false)
    reload()
  }, [applyCity, city, reload])

  return (
    <Panel className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <PanelTitle>Meteorologia</PanelTitle>

          <button
            type="button"
            onClick={openPlaceEditor}
            title={placeHint}
            aria-label={`Trocar a cidade da meteorologia (${placeLabel})`}
            className="inline-flex min-w-0 max-w-[15rem] items-center gap-1 rounded-pill bg-paper-soft px-2 py-1 font-sans text-[0.7rem] font-semibold text-ink-soft transition-colors hover:bg-platinum hover:text-ink"
          >
            <span className="truncate">{placeLabel}</span>
            <PencilIcon className="size-3 flex-none opacity-60" />
          </button>
        </div>

        <p className="text-[11px] tabular-nums text-muted">{updatedLabel}</p>
      </div>

      {isEditingPlace ? (
        <form
          onSubmit={handleSubmit}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
            placeholder="Cidade (ex.: Curitiba)"
            aria-label="Cidade da meteorologia"
            maxLength={MAX_CITY_LENGTH}
            autoFocus
            className="min-h-8 min-w-0 flex-1 basis-40 rounded-lg bg-paper-soft px-3 text-xs text-ink placeholder:text-muted"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!cityInput.trim() || status === 'loading'}
          >
            Buscar
          </Button>
          {city ? (
            <Button size="sm" onClick={useConnectionLocation}>
              Usar conexão
            </Button>
          ) : null}
          <Button size="sm" onClick={closePlaceEditor}>
            Cancelar
          </Button>
        </form>
      ) : null}

      {weather ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] sm:items-center sm:gap-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-3xl leading-none" aria-hidden="true">
                {weather.condition.icon}
              </span>

              <div className="min-w-0">
                <p className="flex items-baseline gap-1 font-sans leading-none">
                  {typeof weather.temperature === 'number' ? (
                    <CountUp
                      value={weather.temperature}
                      precision={1}
                      className="text-2xl font-bold tracking-[-0.04em] tabular-nums sm:text-3xl"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-muted">—</span>
                  )}
                  <span className="text-xs font-medium text-muted">°C</span>
                </p>
                <p className="mt-1 truncate text-xs text-ink-soft">
                  {weather.condition.label} · máx{' '}
                  {formatWeatherValue(weather.maxTemperature, 0, '°')} · mín{' '}
                  {formatWeatherValue(weather.minTemperature, 0, '°')}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <WeatherStat
                label="Sensação"
                value={formatWeatherValue(weather.apparentTemperature, 1, '°C')}
              />
              <WeatherStat
                label="Umidade do ar"
                value={formatPercent(weather.humidity)}
              />
              <WeatherStat
                label="Vento"
                value={formatWeatherValue(weather.windSpeed, 0, 'km/h')}
              />
              <WeatherStat
                label="Chuva hoje"
                value={formatPercent(weather.rainProbability)}
                hint={`${formatWeatherValue(weather.rainSum, 1)} mm`}
              />
            </dl>
          </div>

          <p className="mt-3 rounded-xl bg-paper-soft px-3 py-2 text-xs text-ink-soft">
            {advice}
          </p>
        </>
      ) : status === 'notfound' ? (
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red/10 px-3 py-2 text-xs text-danger"
          role="alert"
        >
          <span>Não encontrei “{city}”. Confira o nome da cidade.</span>
          <Button size="sm" onClick={openPlaceEditor}>
            Outra cidade
          </Button>
        </div>
      ) : status === 'error' ? (
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper-soft px-3 py-2 text-xs text-ink-soft"
          role="status"
        >
          <span>Não foi possível carregar a previsão agora.</span>
          <Button size="sm" onClick={reload}>
            Tentar de novo
          </Button>
        </div>
      ) : (
        <div
          className="mt-3 flex items-center gap-2 rounded-xl bg-paper-soft px-3 py-2 text-xs text-muted"
          role="status"
        >
          <span className="inline-block size-2 flex-none animate-led-pulse rounded-pill bg-green-bright" />
          Consultando a meteorologia de {placeLabel}…
        </div>
      )}
    </Panel>
  )
}

export default WeatherCard
