function Checkbox({
  checked,
  onChange,
  disabled = false,
  align = 'center',
  boxClassName = '',
  className = '',
  children,
}) {
  return (
    <label
      className={`relative inline-flex cursor-pointer gap-[9px] text-ink-soft ${
        align === 'start' ? 'items-start' : 'items-center'
      } ${className}`}
    >
      <input
        type="checkbox"
        className="peer pointer-events-none absolute size-0 opacity-0"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span
        className={`grid size-[18px] flex-none place-items-center rounded-xs border border-line-strong bg-paper-bright transition-[border-color,background-color] duration-150 peer-checked:border-green-dark peer-checked:bg-green-dark peer-checked:[&_svg]:block peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-blue/55 peer-disabled:opacity-50 ${boxClassName}`}
      >
        <svg
          className="hidden size-3 text-paper-bright"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 6.2 4.6 8.8 10 3.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  )
}

export default Checkbox
