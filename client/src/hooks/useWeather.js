import { useCallback, useEffect, useState } from 'react'
import { fetchWeather } from '../lib/weather'

const REFRESH_MS = 15 * 60 * 1000

/**
 * Previsão do tempo do card de meteorologia, atualizada a cada 15 minutos.
 * Sem `city`, o backend estima o local pelo IP da conexão.
 */
export function useWeather(city = '') {
  const [weather, setWeather] = useState(null)
  const [place, setPlace] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setStatus('loading')
    setAttempt((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const next = await fetchWeather({ city })

        if (cancelled) return

        setWeather(next)
        setPlace(next.place)
        setStatus('ready')
      } catch (error) {
        if (cancelled) return

        if (error?.status === 404) {
          setWeather(null)
          setStatus('notfound')
          return
        }

        setStatus('error')
      }
    }

    load()

    const timer = window.setInterval(load, REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [city, attempt])

  return { weather, place, status, reload }
}
