import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import CountUp from './ui/CountUp'

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const TONES = {
  green: {
    color: 'var(--color-green)',
    badge: 'bg-green/10 text-green-dark',
  },
  blue: {
    color: 'var(--color-blue)',
    badge: 'bg-blue/10 text-blue',
  },
  yellow: {
    color: 'var(--color-yellow)',
    badge: 'bg-yellow/15 text-yellow-deep',
  },
  red: {
    color: 'var(--color-red)',
    badge: 'bg-red/10 text-danger',
  },
  muted: {
    color: 'var(--color-muted)',
    badge: 'bg-ink/5 text-muted',
  },
}

function GardenScore({ garden }) {
  const ringRef = useRef(null)
  const previousOffsetRef = useRef(CIRCUMFERENCE)
  const score = garden?.score
  const hasScore = typeof score === 'number' && Number.isFinite(score)
  const safeScore = hasScore ? Math.min(100, Math.max(0, score)) : 0
  const offset = CIRCUMFERENCE * (1 - safeScore / 100)
  const tone = TONES[garden?.level?.tone] || TONES.muted
  const label = garden?.level?.label || 'Sem dados'
  const message =
    garden?.level?.message || 'Aguardando leituras para calcular.'

  useGSAP(
    () => {
      if (!ringRef.current) return

      if (prefersReducedMotion()) {
        gsap.set(ringRef.current, { strokeDashoffset: offset })
        previousOffsetRef.current = offset
        return
      }

      gsap.fromTo(
        ringRef.current,
        { strokeDashoffset: previousOffsetRef.current },
        {
          strokeDashoffset: offset,
          duration: 0.9,
          ease: 'power2.out',
        },
      )

      previousOffsetRef.current = offset
    },
    { dependencies: [offset] },
  )

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl bg-paper-bright p-3 shadow-xs transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-sans text-xs font-semibold text-ink-soft">
          Saúde do jardim
        </span>
        <span
          className={`shrink-0 rounded-pill px-2 py-0.5 text-[0.7rem] font-medium ${tone.badge}`}
        >
          {label}
        </span>
      </div>

      <div className="mt-2 flex flex-1 items-center justify-center">
        <div className="relative size-[4.75rem] sm:size-24">
          <svg
            viewBox="0 0 120 120"
            className="size-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-ink/10"
            />
            <circle
              ref={ringRef}
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={tone.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>

          <div className="absolute inset-0 grid place-items-center">
            {hasScore ? (
              <span className="flex items-baseline font-sans font-bold leading-none tracking-[-0.04em] tabular-nums">
                <CountUp
                  value={score}
                  precision={0}
                  className="text-xl sm:text-2xl"
                />
                <span className="text-[0.7rem] font-semibold text-muted">
                  %
                </span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-muted">—</span>
            )}
          </div>
        </div>
      </div>

      <p
        className="mt-1 hidden truncate text-center text-xs text-muted sm:block"
        title={message}
      >
        {message}
      </p>
    </article>
  )
}

export default GardenScore
