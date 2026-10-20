import { useCallback, useState } from 'react'
import AddEsp from './components/AddEsp'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import LoginPage from './components/LoginPage'
import SessionLoader from './components/SessionLoader'
import SettingsDialog from './components/SettingsDialog'
import Toast from './components/Toast'
import { useDashboard } from './hooks/useDashboard'
import { useTheme } from './hooks/useTheme'

function App() {
  const {
    isCheckingSession,
    isLoggedIn,
    realtimeConnected,
    user,
    espId,
    metrics,
    events,
    chart,
    summary,
    range,
    setRange,
    view,
    navigate,
    toast,
    handleLogin,
    handleLogout,
    handleAssociate,
    handleSync,
  } = useDashboard()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const openSettings = useCallback(() => setIsSettingsOpen(true), [])
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [])

  const settingsDialog = (
    <SettingsDialog
      open={isSettingsOpen}
      onClose={closeSettings}
      theme={theme}
      resolvedTheme={resolvedTheme}
      onThemeChange={setTheme}
    />
  )

  if (isCheckingSession) return <SessionLoader />

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage onLogin={handleLogin} onOpenSettings={openSettings} />
        {settingsDialog}
      </>
    )
  }

  return (
    <>
      <div className="min-h-dvh">
        <Header
          active={view}
          onNavigate={navigate}
          user={user}
          onLogout={handleLogout}
          onOpenSettings={openSettings}
        />

        <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          {view === 'add-esp' ? (
            <AddEsp
              espId={espId}
              onAssociate={handleAssociate}
              onBack={() => navigate('painel')}
              online={realtimeConnected}
              lastSyncLabel={summary.lastSyncLabel}
              onSync={handleSync}
              hasReading={summary.hasReadings}
            />
          ) : (
            <Dashboard
              summary={summary}
              metrics={metrics}
              chart={chart}
              range={range}
              onRangeChange={setRange}
              events={events}
              espId={espId}
              online={realtimeConnected}
            />
          )}
        </main>

        {toast ? <Toast message={toast} /> : null}
      </div>

      {settingsDialog}
    </>
  )
}

export default App
