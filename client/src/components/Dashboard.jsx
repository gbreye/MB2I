import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Flip } from 'gsap/Flip'
import { METRIC_CONFIG, METRIC_PRECISION } from '../constants/metrics'
import { useReveal } from '../hooks/useReveal'
import { useWidgetOrder } from '../hooks/useWidgetOrder'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import AiReport from './AiReport'
import ChartPanel from './ChartPanel'
import EventLog from './EventLog'
import GardenScore from './GardenScore'
import MetricCard from './MetricCard'
import PlantStatus from './PlantStatus'
import WeatherCard from './WeatherCard'
import Button from './ui/Button'
import { Panel } from './ui/Panel'

gsap.registerPlugin(Flip)

const METRIC_WIDGET_IDS = Object.keys(METRIC_CONFIG).map(
  (key) => `metric-${key}`,
)

const SQUARE_WIDGET_IDS = [...METRIC_WIDGET_IDS, 'garden']

const DEFAULT_ORDER = [
  'summary',
  ...METRIC_WIDGET_IDS,
  'garden',
  'weather',
  'ai',
  'chart',
  'events',
]

const WIDGET_META = {
  summary: {
    label: 'Resumo da planta',
    span: 'col-span-2 sm:col-span-4 lg:col-span-12',
  },
  ai: {
    label: 'Relatório de IA',
    span: 'col-span-2 sm:col-span-4 lg:col-span-12',
  },
  chart: {
    label: 'Saúde do solo',
    span: 'col-span-2 sm:col-span-4 lg:col-span-8',
  },
  events: {
    label: 'Diário',
    span: 'col-span-2 sm:col-span-4 lg:col-span-4',
  },
  garden: {
    label: 'Saúde do jardim',
    span: 'col-span-1 sm:col-span-1 lg:col-span-3',
  },
  weather: {
    label: 'Meteorologia',
    span: 'col-span-2 sm:col-span-4 lg:col-span-12',
  },
}

const MOVE_KEYS = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
}

function GripIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <circle cx="7" cy="5" r="1.4" />
      <circle cx="13" cy="5" r="1.4" />
      <circle cx="7" cy="10" r="1.4" />
      <circle cx="13" cy="10" r="1.4" />
      <circle cx="7" cy="15" r="1.4" />
      <circle cx="13" cy="15" r="1.4" />
    </svg>
  )
}

function Dashboard({
  summary,
  metrics,
  chart,
  range,
  onRangeChange,
  events,
  espId,
  online,
}) {
  const scope = useReveal()
  const { order, moveTo, moveBy, reset, isDefault } = useWidgetOrder(
    DEFAULT_ORDER,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const dragRef = useRef(null)
  const gridRef = useRef(null)
  const flipStateRef = useRef(null)
  const orderRef = useRef(order)

  useLayoutEffect(() => {
    orderRef.current = order
  }, [order])

  const captureLayout = useCallback(() => {
    if (prefersReducedMotion() || !gridRef.current) return

    const items = gridRef.current.querySelectorAll('[data-widget-id]')

    if (items.length === 0) return

    Flip.killFlipsOf(items)
    flipStateRef.current = Flip.getState(items)
  }, [])

  const reorder = useCallback(
    (id, targetId) => {
      const current = orderRef.current
      const from = current.indexOf(id)
      const to = current.indexOf(targetId)

      if (from === -1 || to === -1 || from === to) return

      captureLayout()
      moveTo(id, targetId)
    },
    [captureLayout, moveTo],
  )

  useLayoutEffect(() => {
    const state = flipStateRef.current
    flipStateRef.current = null

    if (!state || prefersReducedMotion()) return

    Flip.from(state, {
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.015,
    })
  }, [order])

  const handlePointerDown = useCallback(
    (event, id) => {
      if (!isEditing) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      event.preventDefault()
      dragRef.current = { id, pointerId: event.pointerId }
      setDraggingId(id)
    },
    [isEditing],
  )

  useEffect(() => {
    if (!draggingId) return undefined

    function handleMove(event) {
      const drag = dragRef.current

      if (!drag || drag.pointerId !== event.pointerId) return

      event.preventDefault()

      const stack = document.elementsFromPoint(
        event.clientX,
        event.clientY,
      )
      let targetId = null

      for (const node of stack) {
        const widget = node.closest?.('[data-widget-id]')

        if (!widget) continue

        if (widget.dataset.widgetId === drag.id) continue

        targetId = widget.dataset.widgetId
        break
      }

      if (targetId) reorder(drag.id, targetId)
    }

    function handleUp(event) {
      const drag = dragRef.current

      if (!drag) return
      if (event?.pointerId !== undefined && drag.pointerId !== event.pointerId) {
        return
      }

      dragRef.current = null
      setDraggingId(null)
    }

    window.addEventListener('pointermove', handleMove, { passive: false })
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    window.addEventListener('blur', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
      window.removeEventListener('blur', handleUp)
    }
  }, [draggingId, reorder])

  const handleKeyDown = useCallback(
    (event, id) => {
      const delta = MOVE_KEYS[event.key]

      if (!delta) return

      event.preventDefault()

      const current = orderRef.current
      const from = current.indexOf(id)
      const to = from + delta

      if (from === -1 || to < 0 || to >= current.length) return

      captureLayout()
      moveBy(id, delta)
    },
    [captureLayout, moveBy],
  )

  const handleReset = useCallback(() => {
    if (isDefault) return

    captureLayout()
    reset()
  }, [captureLayout, isDefault, reset])

  const widgetNodes = {
    summary: (
      <Panel className="grid h-full items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
            Olá, {summary.displayFirstName}.
          </h1>
          <p className="mt-1 text-sm text-muted">{summary.greeting}</p>
        </div>

        <PlantStatus
          status={summary.plantStatus}
          state={summary.plantState}
          espId={espId}
          online={online}
        />
      </Panel>
    ),
    ...Object.fromEntries(
      Object.entries(metrics).map(([key, metric]) => [
        `metric-${key}`,
        <MetricCard
          key={`metric-${key}`}
          metric={metric}
          precision={METRIC_PRECISION[key]}
          showSparkline={key !== 'soil'}
        />,
      ]),
    ),
    garden: <GardenScore garden={summary.garden} />,
    weather: <WeatherCard />,
    ai: (
      <AiReport
        summary={summary}
        metrics={metrics}
        chart={chart}
        range={range}
        espId={espId}
        online={online}
      />
    ),
    chart: (
      <ChartPanel
        chart={chart}
        range={range}
        onRangeChange={onRangeChange}
        soilValue={metrics.soil.value}
        hasSoilData={summary.hasSoilData}
        hasChartData={summary.hasChartData}
        emptyMessage={summary.chartEmptyMessage}
      />
    ),
    events: <EventLog events={events} />,
  }

  return (
    <div ref={scope} className="flex flex-col gap-3 sm:gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs leading-relaxed text-muted">
          {isEditing
            ? 'Arraste pelo ícone para mudar o lugar dos widgets.'
            : 'Personalize seu painel e deixe os cards do seu jeito.'}
        </p>

        <div className="flex shrink-0 items-center gap-1.5">
          {isEditing && !isDefault ? (
            <Button size="sm" onClick={handleReset}>
              Restaurar
            </Button>
          ) : null}

          <Button
            size="sm"
            variant={isEditing ? 'primary' : 'default'}
            aria-pressed={isEditing}
            onClick={() => setIsEditing((current) => !current)}
          >
            {isEditing ? 'Concluir' : 'Organizar'}
          </Button>
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-12 lg:gap-5"
      >
        {order.map((id) => {
          const node = widgetNodes[id]

          if (!node) return null

          const meta = WIDGET_META[id]
          const isSquare = SQUARE_WIDGET_IDS.includes(id)
          const isDragging = draggingId === id
          const span =
            meta?.span || (isSquare ? 'col-span-1 lg:col-span-3' : 'col-span-1')

          return (
            <div
              key={id}
              data-widget-id={id}
              data-reveal={isSquare ? 'scale' : 'up'}
              className={`group relative min-w-0 ${span} ${
                isSquare ? 'aspect-square sm:aspect-auto' : ''
              } ${
                isEditing
                  ? `rounded-2xl ring-2 ring-offset-2 ring-offset-paper ${
                      isDragging ? 'ring-green/60' : 'ring-green/25'
                    }`
                  : ''
              } ${isDragging ? 'z-20 opacity-90' : ''}`}
            >
              {node}

              {isEditing ? (
                <button
                  type="button"
                  onPointerDown={(event) => handlePointerDown(event, id)}
                  onKeyDown={(event) => handleKeyDown(event, id)}
                  className="absolute right-1.5 top-1.5 z-10 grid size-8 cursor-grab touch-none place-items-center rounded-full bg-paper-bright/95 text-ink-soft shadow-xs backdrop-blur transition-colors hover:text-ink active:cursor-grabbing"
                  aria-label={`Mover ${meta?.label || id}. Use as setas para reposicionar.`}
                  title="Arraste para reorganizar"
                >
                  <GripIcon className="size-4" />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
