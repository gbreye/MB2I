function BrandMark({ className = '' }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <rect x="7" y="7" width="2" height="7" rx="1" fill="var(--color-green-dark)" />
      <rect x="3" y="3" width="5" height="4" rx="1.5" fill="var(--color-green)" />
      <rect x="8" y="1" width="5" height="4" rx="1.5" fill="var(--color-green-bright)" />
      <rect x="4" y="12" width="8" height="2" rx="1" fill="var(--color-ink)" />
    </svg>
  )
}

export default BrandMark
