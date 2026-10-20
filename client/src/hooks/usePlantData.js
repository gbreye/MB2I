import { useCallback, useRef, useState } from 'react'
import {
  createEmptyMetrics,
  getValidReadings,
  metricsFromPlant,
} from '../lib/metrics'

/** Estado das leituras da planta e aplicação de um novo snapshot do backend. */
export function usePlantData() {
  const [metrics, setMetrics] = useState(createEmptyMetrics)
  const [readings, setReadings] = useState([])
  const lastReadingAt = useRef('')

  const applyPlant = useCallback((plant) => {
    const validReadings = getValidReadings(plant)

    if (validReadings.length === 0) {
      lastReadingAt.current = ''
      setReadings([])
      setMetrics(createEmptyMetrics())
      return null
    }

    const latest = validReadings[validReadings.length - 1]
    const receivedAt =
      typeof latest.receivedAt === 'string' ? latest.receivedAt : ''

    if (receivedAt) lastReadingAt.current = receivedAt

    setReadings(validReadings)
    setMetrics((previous) => metricsFromPlant(validReadings, previous) || previous)

    return latest
  }, [])

  const resetPlant = useCallback(() => {
    lastReadingAt.current = ''
    setReadings([])
    setMetrics(createEmptyMetrics())
  }, [])

  return { metrics, readings, applyPlant, resetPlant, lastReadingAt }
}
