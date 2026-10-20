export function Panel({ className = '', padded = true, children }) {
  return (
    <section
      className={`rounded-xl border border-line bg-paper-bright shadow-soft ${
        padded ? 'p-4 sm:p-5' : ''
      } ${className}`}
    >
      {children}
    </section>
  )
}

export function PanelTitle({ as: Tag = 'h2', className = '', children }) {
  return (
    <Tag
      className={`min-w-0 font-display text-base font-semibold tracking-[-0.01em] ${className}`}
    >
      {children}
    </Tag>
  )
}

export function PanelBadge({ className = '', children }) {
  return (
    <span
      className={`inline-grid h-6 min-w-6 shrink-0 place-items-center rounded-md border border-line bg-paper-soft px-1.5 font-display text-xs font-semibold text-ink-soft ${className}`}
    >
      {children}
    </span>
  )
}
