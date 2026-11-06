import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { api } from '../lib/requests'
import Button from './ui/Button'
import { Panel, PanelBadge, PanelTitle } from './ui/Panel'
import Spinner from './ui/Spinner'

const CACHE_PREFIX = 'mb2i:ai-report:'

function readCache(key) {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sem armazenamento: o relatório continua apenas em memória.
  }
}

function buildSignature(metrics, range) {
  return JSON.stringify({
    range,
    values: Object.fromEntries(
      Object.entries(metrics).map(([key, metric]) => [key, metric.value]),
    ),
  })
}

function buildContext({ summary, metrics, chart, range, espId, online }) {
  return {
    device: { espId, online },
    plant: {
      status: summary.plantStatus,
      lastReading: summary.lastSyncLabel,
      greeting: summary.greeting,
      metrics: Object.entries(metrics).map(([key, metric]) => ({
        key,
        label: metric.label,
        value: metric.value,
        unit: metric.unit,
        ideal: metric.hint,
        history: Array.isArray(metric.history)
          ? metric.history.slice(-12)
          : [],
      })),
    },
    history: {
      range,
      values: chart.values.slice(-24),
    },
  }
}

function formatModelLabel(model) {
  if (!model) return 'Gemini'

  return model
    .replace(/^models\//, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatGeneratedAt(value) {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) return ''

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SparkleIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10 2.8 11.5 7l4.2 1.5-4.2 1.5L10 14.2 8.5 10 4.3 8.5 8.5 7 10 2.8Z" />
      <path d="M15.4 13.2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </svg>
  )
}

function AiReport({ summary, metrics, chart, range, espId, online }) {
  const hasData = Object.values(metrics).some(
    (metric) =>
      typeof metric.value === 'number' && Number.isFinite(metric.value),
  )
  const cacheKey = `${CACHE_PREFIX}${espId || 'sem-dispositivo'}`
  const signature = useMemo(
    () => buildSignature(metrics, range),
    [metrics, range],
  )
  const [cachedOnMount] = useState(() => {
    const cached = readCache(cacheKey)
    return cached?.signature === signature ? cached : null
  })
  const [report, setReport] = useState(cachedOnMount?.report || '')
  const [model, setModel] = useState(cachedOnMount?.model || '')
  const [generatedAt, setGeneratedAt] = useState(
    cachedOnMount?.generatedAt || '',
  )
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const reportRef = useRef(null)
  const requestedRef = useRef(Boolean(cachedOnMount))

  const generate = useCallback(async () => {
    if (!hasData || isLoading) return

    setIsLoading(true)
    setError('')

    try {
      const data = await api.report(
        buildContext({ summary, metrics, chart, range, espId, online }),
      )

      setReport(data?.report || '')
      setModel(data?.model || '')
      setGeneratedAt(data?.generatedAt || new Date().toISOString())

      writeCache(cacheKey, {
        report: data?.report || '',
        model: data?.model || '',
        generatedAt: data?.generatedAt || new Date().toISOString(),
        signature,
      })
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Não foi possível gerar o relatório de IA agora.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    cacheKey,
    chart,
    espId,
    hasData,
    isLoading,
    metrics,
    online,
    range,
    signature,
    summary,
  ])

  useEffect(() => {
    if (!hasData || requestedRef.current) return

    requestedRef.current = true
    generate()
  }, [generate, hasData])

  useGSAP(
    () => {
      if (!report || prefersReducedMotion() || !reportRef.current) return

      gsap.fromTo(
        reportRef.current,
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
        },
      )
    },
    { dependencies: [report] },
  )

  return (
    <Panel data-reveal className="relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-green/10 text-green-dark">
              <SparkleIcon className="size-4" />
            </span>
            <PanelTitle>Relatório de IA</PanelTitle>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">
            Análise das leituras da sua planta, gerada a partir dos dados deste
            painel.
          </p>
        </div>

        <PanelBadge>{formatModelLabel(model)}</PanelBadge>
      </div>

      {isLoading ? (
        <>
          <div className="mt-4 space-y-2" aria-hidden="true">
            <div className="h-3 w-[92%] animate-pulse rounded-full bg-ink/10" />
            <div className="h-3 w-[84%] animate-pulse rounded-full bg-ink/10" />
            <div className="h-3 w-[68%] animate-pulse rounded-full bg-ink/10" />
            <div className="h-3 w-[76%] animate-pulse rounded-full bg-ink/10" />
          </div>
          <p className="sr-only" role="status">
            Gerando relatório de IA...
          </p>
        </>
      ) : error ? (
        <p
          className="mt-4 rounded-xl bg-red/[0.08] px-3 py-2.5 text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : report ? (
        <p
          ref={reportRef}
          className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft"
        >
          {report}
        </p>
      ) : (
        <p className="mt-4 rounded-xl bg-paper-soft px-3 py-2.5 text-sm leading-relaxed text-muted">
          {hasData
            ? 'Gere uma análise com diagnóstico, pontos de atenção e próximos passos para a sua planta.'
            : 'Ainda não há leituras suficientes para a IA analisar. Assim que o dispositivo enviar dados, o relatório ficará disponível.'}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {generatedAt
            ? `Gerado em ${formatGeneratedAt(generatedAt)}`
            : 'Análise sob demanda'}
        </span>

        <Button
          size="sm"
          variant={report ? 'default' : 'primary'}
          onClick={generate}
          disabled={isLoading || !hasData}
        >
          {isLoading ? (
            <>
              <Spinner />
              Gerando...
            </>
          ) : report ? (
            'Gerar novamente'
          ) : (
            'Gerar relatório'
          )}
        </Button>
      </div>
    </Panel>
  )
}

export default AiReport
