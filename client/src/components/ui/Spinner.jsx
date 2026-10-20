function Spinner({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spinner rounded-pill border-2 border-transparent border-t-current border-r-current ${className}`}
    />
  )
}

export default Spinner
