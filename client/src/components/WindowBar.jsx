function WindowBar({ title }) {
  return (
    <div className="window-bar">
      <span className="window-controls" aria-hidden="true">
        <span className="window-control" />
        <span className="window-control" />
        <span className="window-control" />
      </span>
      <span className="window-title">{title}</span>
      <span className="window-grip" aria-hidden="true" />
    </div>
  )
}

export default WindowBar
