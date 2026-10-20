function SettingsIcon({ className = '' }) {
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
      <path d="M3.5 6.5h13M3.5 13.5h13" />
      <circle cx="7.5" cy="6.5" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="13.5" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default SettingsIcon
