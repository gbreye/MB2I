function Toast({ message }) {
  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-toast-in rounded-lg bg-ink px-4 py-3 text-sm text-paper-bright shadow-card sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}

export default Toast
