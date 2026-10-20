import Spinner from './ui/Spinner'

function SessionLoader() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center gap-3 px-4 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      <Spinner className="text-green-dark" />
      <span>Recuperando sessão...</span>
    </div>
  )
}

export default SessionLoader
