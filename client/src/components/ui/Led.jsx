const TONES = {
  green: 'bg-green-bright shadow-[0_0_0_3px_rgba(119,184,90,0.18)]',
  red: 'bg-red shadow-[0_0_0_3px_rgba(204,75,63,0.14)]',
  yellow: 'bg-yellow shadow-[0_0_0_2px_rgba(217,167,51,0.17)]',
  neutral: 'bg-platinum-deep shadow-[0_0_0_2px_rgba(28,27,23,0.06)]',
  blue: 'bg-blue',
  muted: 'bg-platinum-deep',
}

const SIZES = {
  xs: 'size-[6px]',
  sm: 'size-[7px]',
  md: 'size-2',
}

function Led({ tone = 'green', size = 'sm', blinking = false, className = '' }) {
  const classes = [
    'inline-block flex-none rounded-pill',
    SIZES[size],
    TONES[tone],
    blinking ? 'animate-led-pulse' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span aria-hidden="true" className={classes} />
}

export default Led
