import { useCallback, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import AddEsp from './components/AddEsp'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import LoginPage from './components/LoginPage'
import SessionLoader from './components/SessionLoader'
import SettingsDialog from './components/SettingsDialog'
import Toast from './components/Toast'
import { useDashboard } from './hooks/useDashboard'
import { useMotion } from './hooks/useMotion'
import { useTheme } from './hooks/useTheme'
import { gsap, prefersReducedMotion, REVEAL_EASE } from './lib/gsap'

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
    toastLeaving,
    dismissToast,
    handleLogin,
    handleLogout,
    handleAssociate,
    handleSync,
  } = useDashboard()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { motion, setMotion } = useMotion()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const shellRef = useRef(null)
  const openSettings = useCallback(() => setIsSettingsOpen(true), [])
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [])

  useGSAP(
    () => {
      if (prefersReducedMotion() || !shellRef.current) return

      gsap.fromTo(
        shellRef.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.4,
          ease: REVEAL_EASE,
          clearProps: 'opacity,visibility',
        },
      )
    },
    { dependencies: [isCheckingSession, isLoggedIn, view], scope: shellRef },
  )

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [view])

  const settingsDialog = (
    <SettingsDialog
      open={isSettingsOpen}
      onClose={closeSettings}
      theme={theme}
      resolvedTheme={resolvedTheme}
      onThemeChange={setTheme}
      motion={motion}
      onMotionChange={setMotion}
    />
  )

  let content

  if (isCheckingSession) {
    content = <SessionLoader />
  } else if (!isLoggedIn) {
    content = <LoginPage onLogin={handleLogin} onOpenSettings={openSettings} />
  } else {
    content = (
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

        {toast ? (
          <Toast
            message={toast}
            leaving={toastLeaving}
            onExited={dismissToast}
          />
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div ref={shellRef}>{content}</div>
      {settingsDialog}
    </>
  )
}

export default App
