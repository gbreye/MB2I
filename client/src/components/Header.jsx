import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { id: 'painel', label: 'Painel' },
  { id: 'add-esp', label: 'Adicionar ESP' },
]

function Header({ active, onNavigate, user, onLogout, online = false }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const time = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const displayName = user?.name || user?.username || user?.email || ''
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M'

  return (
    <header className="menu-bar">
      <button
        className="menu-brand"
        type="button"
        onClick={() => onNavigate('painel')}
        aria-label="MB2I · ir para o painel"
      >
        <svg className="brand-mark" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="7" y="7" width="2" height="7" rx="1" fill="#2f5e33" />
          <rect x="3" y="3" width="5" height="4" rx="1.5" fill="#4f8f4a" />
          <rect x="8" y="1" width="5" height="4" rx="1.5" fill="#77b85a" />
          <rect x="4" y="12" width="8" height="2" rx="1" fill="#1c1b17" />
        </svg>
        <span className="brand-name">MB2I</span>
      </button>

      <nav className="menu-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-link ${active === item.id ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="menu-meta">
        <span className={`menu-online ${online ? '' : 'is-offline'}`}>
          <span
            className={`led ${online ? 'is-blinking' : 'is-offline'}`}
            aria-hidden="true"
          />
          {online ? 'online' : 'offline'}
        </span>

        <span className="menu-clock">
          <time dateTime={now.toISOString()}>{time}</time>
        </span>

        {user ? (
          <div className="menu-user">
            <span className="user-chip" title={user.email}>
              <span className="user-avatar" aria-hidden="true">
                {initial}
              </span>
              <span className="user-meta">
                <span className="user-name">
                  {user.name || user.username || user.email}
                </span>
                {user.email ? (
                  <span className="user-email">{user.email}</span>
                ) : null}
              </span>
            </span>
            <button type="button" className="btn btn-sm" onClick={onLogout}>
              Sair
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default Header
