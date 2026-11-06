import Button from './ui/Button'
import Led from './ui/Led'
import { Panel, PanelTitle } from './ui/Panel'

function DevicePanel({
  espId,
  lastSyncLabel,
  onSync,
  onAddEsp,
  online = false,
  hasReading = false,
  ...rest
}) {
  return (
    <Panel {...rest}>
      <div className="flex items-center justify-between gap-3">
        <PanelTitle>Dispositivo</PanelTitle>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
            online ? 'bg-green/10 text-green-dark' : 'bg-red/10 text-red'
          }`}
        >
          <Led tone={online ? 'green' : 'red'} size="xs" blinking={online} />
          {online ? 'online' : 'offline'}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="col-span-2 min-w-0">
          <dt className="text-xs text-muted">ID</dt>
          <dd className="mt-0.5 truncate font-medium">
            {espId || 'Não associado'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">
            Última leitura
          </dt>
          <dd
            className={`mt-0.5 truncate font-medium ${
              hasReading ? '' : 'text-muted'
            }`}
          >
            {hasReading ? lastSyncLabel : 'Nenhuma'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">
            Sensores
          </dt>
          <dd
            className={`mt-0.5 truncate font-medium ${
              hasReading ? '' : 'text-muted'
            }`}
          >
            {hasReading ? 'Recebendo' : 'Aguardando'}
          </dd>
        </div>
      </dl>

      {!espId || !hasReading ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-paper-soft px-3 py-2 text-xs text-ink-soft">
          <Led tone="red" size="xs" />
          {!espId
            ? 'Nenhum ESP associado a este perfil.'
            : 'Nenhuma leitura recebida deste dispositivo.'}
        </p>
      ) : null}

      <div className={`mt-4 grid gap-2 ${onAddEsp ? 'sm:grid-cols-2' : ''}`}>
        <Button variant="primary" onClick={onSync}>
          Sincronizar
        </Button>
        {onAddEsp ? <Button onClick={onAddEsp}>Adicionar ESP</Button> : null}
      </div>
    </Panel>
  )
}

export default DevicePanel
