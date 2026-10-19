function DevicePanel({ espId, lastSyncLabel, onSync, onAddEsp, online = false }) {
  return (
    <section className="window device-window">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Conexão</p>
          <h2 className="panel-title">Dispositivo</h2>
        </div>
        <span className={`device-state ${online ? '' : 'is-offline'}`}>
          <span
            className={`led ${online ? 'is-blinking' : 'is-offline'}`}
            aria-hidden="true"
          />
          {online ? 'online' : 'offline'}
        </span>
      </div>

      <div className="panel-body device-body">
        <div className="device-id">
          <strong>{espId || 'NÃO ASSOCIADO'}</strong>
          <span className="device-chip">ESP32</span>
        </div>

        <div className="device-rows">
          <div className="device-row">
            <span>Sinal</span>
            <span>−57 dBm</span>
          </div>
          <div className="device-row">
            <span>Firmware</span>
            <span>v2.4.1</span>
          </div>
          <div className="device-row">
            <span>Última leitura</span>
            <span>{lastSyncLabel}</span>
          </div>
          <div className="device-row">
            <span>Sensores</span>
            <span>3 ativos</span>
          </div>
          <div className="device-row">
            <span>Uptime</span>
            <span>14d 06h</span>
          </div>
        </div>

        <div className="device-actions">
          <button className="btn btn-primary" type="button" onClick={onSync}>
            Sincronizar
          </button>
          <button className="btn" type="button" onClick={onAddEsp}>
            Adicionar ESP
          </button>
        </div>
      </div>
    </section>
  )
}

export default DevicePanel
