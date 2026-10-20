import { METRIC_PRECISION } from '../constants/metrics'
import ChartPanel from './ChartPanel'
import EventLog from './EventLog'
import MetricCard from './MetricCard'
import PlantStatus from './PlantStatus'
import { Panel } from './ui/Panel'

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
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Panel className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Object.entries(metrics).map(([key, metric]) => (
          <MetricCard
            key={key}
            metric={metric}
            precision={METRIC_PRECISION[key]}
            showSparkline={key !== 'soil'}
          />
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartPanel
          chart={chart}
          range={range}
          onRangeChange={onRangeChange}
          soilValue={metrics.soil.value}
          hasSoilData={summary.hasSoilData}
          hasChartData={summary.hasChartData}
          emptyMessage={summary.chartEmptyMessage}
        />

        <EventLog events={events} />
      </div>
    </div>
  )
}

export default Dashboard
