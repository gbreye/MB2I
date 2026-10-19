function PlaceholderFigure({
  label = 'FIGURA',
  caption,
  src,
  alt = '',
  className = '',
}) {
  return (
    <figure className={`placeholder-figure ${className}`.trim()}>
      <div className={`placeholder-frame ${src ? 'has-media' : ''}`.trim()}>
        <span className="frame-label">{label}</span>
        {src ? (
          <img className="placeholder-media" src={src} alt={alt} />
        ) : (
          <div className="placeholder-content">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="placeholder-text">Adicione sua figura</span>
            <span className="placeholder-hint">Troque este bloco pela sua imagem</span>
          </div>
        )}
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

export default PlaceholderFigure
