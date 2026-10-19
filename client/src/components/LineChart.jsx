function LineChart({ values }) {
  const width = 660
  const height = 216
  const padding = 16
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / span) * (height - padding * 2)
    return [x, y]
  })

  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')

  const first = points[0]
  const last = points[points.length - 1]
  const area = `${line} L ${last[0].toFixed(2)} ${height - padding} L ${first[0].toFixed(2)} ${height - padding} Z`

  return (
    <svg
      className="line-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Histórico de umidade do solo"
    >
      <defs>
        <pattern
          id="chart-grid"
          width="33"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 33 0 L 0 0 0 24"
            fill="none"
            stroke="#1c1b17"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width={width} height={height} fill="#fffdf5" />
      <rect width={width} height={height} fill="url(#chart-grid)" />
      <path d={area} fill="#77b85a" fillOpacity="0.14" />
      <path
        d={line}
        fill="none"
        stroke="#4f8f4a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default LineChart
