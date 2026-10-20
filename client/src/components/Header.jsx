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

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper-bright/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('painel')}
          className="-ml-1 flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-paper-soft"
          aria-label="MB2I · ir para o painel"
        >
          <BrandMark className="size-6" />
          <span className="hidden font-display text-lg font-bold tracking-[-0.02em] sm:inline">
            MB2I
          </span>
        </button>

        <nav
          className="flex items-center gap-1 rounded-full border border-line bg-paper-soft p-1"
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

        <div className="ml-auto flex items-center gap-1.5">
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
            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink"
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
