import plantImage from '../assets/potted-plant_1fab4.png'
import Led from './ui/Led'

const STATES = {
  ok: { text: 'text-green-dark', ring: 'bg-green/10', led: 'green' },
  warn: { text: 'text-yellow-deep', ring: 'bg-yellow/15', led: 'yellow' },
  empty: { text: 'text-muted', ring: 'bg-ink/5', led: 'neutral' },
}

function PlantStatus({ status, state = 'ok', espId, online = false }) {
  const tone = STATES[state] || STATES.ok

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`grid size-14 shrink-0 place-items-center rounded-full ${tone.ring}`}
      >
        <img
          src={plantImage}
          alt="Planta monitorada"
          className={`size-11 object-contain ${
            state === 'empty' ? 'opacity-50 grayscale' : ''
          }`}
        />
      </div>

      <div className="min-w-0">
        <p
          className={`flex items-center gap-1.5 text-sm font-semibold ${tone.text}`}
        >
          <Led tone={tone.led} />
          {status}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <Led tone={online ? 'green' : 'red'} size="xs" blinking={online} />
          <span className="max-w-[160px] truncate">{espId || 'sem ESP'}</span>
          <span aria-hidden="true">·</span>
          <span className={online ? '' : 'text-red'}>
            {online ? 'online' : 'offline'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default PlantStatus
