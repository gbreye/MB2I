import { useReveal } from '../hooks/useReveal'
import BrandMark from './ui/BrandMark'
import Button from './ui/Button'
import SettingsIcon from './ui/SettingsIcon'

const NAV_ITEMS = [
  { id: 'painel', label: 'Painel', short: 'Painel' },
  { id: 'add-esp', label: 'Adicionar ESP', short: 'ESP' },
]

function Header({ active, onNavigate, user, onLogout, onOpenSettings }) {
  const displayName = user?.name || user?.username || user?.email || ''
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M'
  const scope = useReveal({ y: -10, stagger: 0.05 })

  return (
    <header
      ref={scope}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:sticky sm:inset-x-auto sm:bottom-auto sm:top-0 sm:px-0 sm:pb-0 sm:bg-paper-bright/90 sm:backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-1 rounded-full border border-line/60 bg-paper-bright/95 p-1.5 shadow-soft backdrop-blur-xl sm:max-w-6xl sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:px-6 sm:py-2.5 sm:shadow-none sm:backdrop-blur-none">
        <button
          type="button"
          data-reveal
          onClick={() => onNavigate('painel')}
          className="-ml-0.5 flex shrink-0 items-center gap-2 rounded-full px-1 py-1 hover:bg-paper-soft sm:-ml-1 sm:rounded-xl"
          aria-label="MB2I · ir para o painel"
        >
          <BrandMark className="size-6" />
          <span className="hidden font-display text-lg font-bold tracking-[-0.02em] sm:inline">
            MB2I
          </span>
        </button>

        <nav
          data-reveal
          className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-paper-soft p-1 sm:flex-none sm:justify-start"
          aria-label="Navegação principal"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ink text-paper-bright'
                    : 'text-ink-soft hover:bg-paper-bright hover:text-ink'
                }`}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div data-reveal className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          {user ? (
            <span className="hidden min-w-0 items-center gap-2 sm:flex">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full bg-green-dark text-xs font-semibold uppercase text-paper-bright"
                title={user.email}
              >
                {initial}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-medium md:inline">
                {user.name || user.username || user.email}
              </span>
            </span>
          ) : null}

          <button
            type="button"
            onClick={onOpenSettings}
            className="grid size-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink sm:rounded-xl"
            aria-label="Abrir configurações do app"
            aria-haspopup="dialog"
            title="Configurações"
          >
            <SettingsIcon className="size-5" />
          </button>

          <Button type="button" size="sm" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header
