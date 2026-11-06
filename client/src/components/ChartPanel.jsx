import { RANGE_OPTIONS } from '../constants/metrics'
import LineChart from './LineChart'
import CountUp from './ui/CountUp'
import { Panel, PanelTitle } from './ui/Panel'
import Segmented from './ui/Segmented'

function ChartPanel({
  chart,
  range,
  onRangeChange,
  soilValue,
  hasSoilData,
  hasChartData,
  emptyMessage,
}) {
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <PanelTitle>Saúde do solo</PanelTitle>
          <p
            className={`mt-1 font-sans tabular-nums ${
              hasSoilData
                ? 'text-3xl font-bold leading-none tracking-[-0.04em]'
                : 'text-xl font-semibold leading-none text-muted'
            }`}
          >
            {hasSoilData ? (
              <>
                <CountUp value={soilValue} precision={0} />
                <span className="ml-1 text-sm font-medium text-muted">%</span>
              </>
            ) : (
              'Sem dados'
            )}
          </p>
        </div>

        <Segmented
          options={RANGE_OPTIONS}
          value={range}
          onChange={onRangeChange}
          label="Período do histórico"
        />
      </div>

      <div className="mt-4">
        {hasChartData ? (
          <>
            <LineChart key={range} values={chart.values} />
            <div
              className="mt-2 flex justify-between gap-1 text-[11px] tabular-nums text-muted"
              aria-hidden="true"
            >
              {chart.labels.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
              <span
                className="inline-block h-0.5 w-5 rounded-full bg-green"
                aria-hidden="true"
              />
              Umidade do solo
              <span className="ml-auto rounded-full bg-green/10 px-2 py-0.5 font-medium text-green-dark">
                ideal 45–60%
              </span>
            </div>
          </>
        ) : (
          <div
            className="flex h-48 flex-col items-center justify-center gap-1.5 rounded-xl bg-paper-soft px-4 text-center text-sm text-muted sm:h-60"
            role="status"
          >
            <strong className="font-display text-sm font-semibold text-ink-soft">
              Sem dados no período
            </strong>
            <span className="max-w-[34ch] text-pretty">{emptyMessage}</span>
          </div>
        )}
      </div>
    </Panel>
  )
}

export default ChartPanel
