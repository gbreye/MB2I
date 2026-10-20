const BASE =
  'inline-flex items-center justify-center gap-2 border font-display font-semibold shadow-xs transition-[background-color,border-color,box-shadow,transform,filter] duration-150 disabled:cursor-not-allowed disabled:opacity-60'

const SIZES = {
  sm: 'min-h-8 rounded-md px-3 py-1.5 text-xs',
  md: 'min-h-10 rounded-lg px-4 py-2 text-sm',
  lg: 'min-h-11 rounded-lg px-4 text-sm',
}

const VARIANTS = {
  default:
    'border-line-strong bg-paper-bright text-ink hover:border-ink/40 hover:bg-paper-soft hover:shadow-card active:translate-y-px active:scale-[0.99] active:shadow-none',
  primary:
    'border-green-dark bg-green-dark text-paper-bright hover:brightness-95 hover:shadow-card active:translate-y-px active:scale-[0.99] active:shadow-none',
}

function Button({
  variant = 'default',
  size = 'md',
  full = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const classes = [
    BASE,
    SIZES[size],
    VARIANTS[variant],
    full ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
