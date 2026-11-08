import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { Panel, PanelBadge, PanelTitle } from './ui/Panel'

const TONE_CLASSES = {
  ok: 'bg-green-bright',
  warn: 'bg-yellow',
  info: 'bg-blue',
  muted: 'bg-platinum-deep',
}

function EventLog({ events }) {
  const listRef = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !listRef.current) return

      gsap.from(Array.from(listRef.current.children), {
        autoAlpha: 0,
        x: -10,
        duration: 0.35,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
      })
    },
    { dependencies: [events.length], scope: listRef },
  )

  return (
    <Panel className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <PanelTitle>Diário</PanelTitle>
        <PanelBadge>{events.length}</PanelBadge>
      </div>

      {events.length === 0 ? (
        <div className="mt-3 flex flex-1 items-center justify-center rounded-xl bg-paper-soft px-4 py-6 text-center">
          <p className="max-w-[30ch] text-sm leading-relaxed text-pretty text-muted">
            Nenhuma atividade nesta sessão. Os eventos aparecerão aqui quando
            houver leituras ou ações no sistema.
          </p>
        </div>
      ) : (
        <ul
          ref={listRef}
          className="scrollbar-slim mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1"
        >
          {events.map((event) => (
            <li className="flex gap-3" key={event.id}>
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  TONE_CLASSES[event.type] || 'bg-muted'
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm leading-snug text-pretty">{event.text}</p>
                <p className="mt-0.5 text-[11px] tabular-nums text-muted">
                  {event.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default EventLog
