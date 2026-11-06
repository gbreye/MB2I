import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import Button from './ui/Button'

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Claro',
    description: 'Fundo claro e alto contraste.',
    Icon: SunIcon,
  },
  {
    id: 'dark',
    label: 'Escuro',
    description: 'Tons escuros para ambientes com pouca luz.',
    Icon: MoonIcon,
  },
  {
    id: 'system',
    label: 'Sistema',
    description: 'Segue a preferência do seu dispositivo.',
    Icon: MonitorIcon,
  },
]

const MOTION_OPTIONS = [
  { id: 'full', label: 'Ativadas' },
  { id: 'system', label: 'Sistema' },
  { id: 'reduced', label: 'Reduzidas' },
]

function SunIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M15.3 4.7 14 6M6 14l-1.3 1.3" />
    </svg>
  )
}

function MoonIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.2 12.4A6.8 6.8 0 0 1 7.6 3.8 7 7 0 1 0 16.2 12.4Z" />
    </svg>
  )
}

function MonitorIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2.8" y="3.5" width="14.4" height="10" rx="1.4" />
      <path d="M7.2 16.5h5.6M10 13.5v3" />
    </svg>
  )
}

function CloseIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  )
}

function SettingsDialog({
  open,
  onClose,
  theme,
  resolvedTheme,
  onThemeChange,
  motion,
  onMotionChange,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      gsap.killTweensOf(dialog)

      if (!dialog.open) dialog.showModal()

      if (prefersReducedMotion()) return

      gsap.fromTo(
        dialog,
        { autoAlpha: 0, y: 14, scale: 0.97 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
        },
      )

      gsap.from(dialog.querySelectorAll('[data-theme-option]'), {
        autoAlpha: 0,
        x: -8,
        duration: 0.3,
        delay: 0.08,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
      })
    } else if (dialog.open) {
      if (prefersReducedMotion()) {
        dialog.close()
        return
      }

      gsap.killTweensOf(dialog)
      gsap.to(dialog, {
        autoAlpha: 0,
        y: 10,
        scale: 0.98,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          dialog.close()
          gsap.set(dialog, { clearProps: 'opacity,visibility,transform' })
        },
      })
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined

    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)

    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function handleBackdropClick(event) {
    const dialog = dialogRef.current
    if (!dialog || event.target !== event.currentTarget) return

    const rect = dialog.getBoundingClientRect()
    const clickedInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom

    if (!clickedInside) closeDialog()
  }

  function closeDialog() {
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="settings-dialog fixed inset-0 z-50 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-paper-bright p-0 text-ink shadow-soft"
      aria-labelledby="settings-title"
      onClick={handleBackdropClick}
    >
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <h2
            id="settings-title"
            className="font-display text-lg font-bold tracking-[-0.02em]"
          >
            Configurações
          </h2>
          <p className="mt-1 text-sm text-muted">
            Ajuste a aparência do aplicativo.
          </p>
        </div>

        <button
          type="button"
          onClick={closeDialog}
          autoFocus
          className="grid size-8 shrink-0 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
          aria-label="Fechar configurações"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-end">
          <span className="text-xs text-muted">
            Atual: {resolvedTheme === 'dark' ? 'escuro' : 'claro'}
          </span>
        </div>

        <div
          className="mt-2 grid gap-2"
          role="radiogroup"
          aria-label="Tema"
        >
          {THEME_OPTIONS.map((option) => {
            const active = theme === option.id

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                data-theme-option
                aria-checked={active}
                onClick={() => onThemeChange(option.id)}
                className={`flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                  active
                    ? 'bg-green/10'
                    : 'bg-paper-soft hover:bg-paper-soft/70'
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                    active
                      ? 'bg-green/10 text-green-dark'
                      : 'bg-paper-bright text-ink-soft'
                  }`}
                >
                  <option.Icon className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="block text-xs leading-relaxed text-muted">
                    {option.description}
                  </span>
                </span>

                <span
                  className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                    active ? 'border-green-dark' : 'border-line-strong'
                  }`}
                  aria-hidden="true"
                >
                  {active ? (
                    <span className="size-2 rounded-full bg-green-dark" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          A escolha fica salva neste navegador. O modo “Sistema” acompanha a
          preferência do seu dispositivo.
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Animações</p>
            <span className="text-xs text-muted">Movimento da interface</span>
          </div>

          <div
            className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-paper-soft p-1"
            role="group"
            aria-label="Animações da interface"
          >
            {MOTION_OPTIONS.map((option) => {
              const active = motion === option.id

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onMotionChange(option.id)}
                  className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-paper-bright text-ink shadow-xs'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            “Ativadas” mantém as transições mesmo quando o sistema está com a
            redução de movimento ligada.
          </p>
        </div>
      </div>

      <div className="flex justify-end p-3 sm:px-5">
        <Button size="sm" onClick={closeDialog}>
          Fechar
        </Button>
      </div>
    </dialog>
  )
}

export default SettingsDialog
