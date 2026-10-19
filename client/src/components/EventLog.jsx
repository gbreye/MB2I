function EventLog({ events }) {
  return (
    <section className="window events-window">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Atividade</p>
          <h2 className="panel-title">Diário</h2>
        </div>
        <span className="panel-badge">{events.length}</span>
      </div>

      <div className="panel-body event-body">
        <ul className="event-list">
          {events.map((event) => (
            <li className="event-item" key={event.id}>
              <span
                className={`event-led tone-${event.type}`}
                aria-hidden="true"
              />
              <span className="event-time">{event.time}</span>
              <span className="event-text">{event.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default EventLog
