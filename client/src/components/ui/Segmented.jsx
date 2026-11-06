function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex gap-1 rounded-xl bg-paper-soft p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option === value

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`min-w-10 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? 'bg-ink text-paper-bright'
                : 'text-ink-soft hover:bg-paper-bright hover:text-ink'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

export default Segmented
