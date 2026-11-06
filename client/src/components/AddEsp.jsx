import { useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import Button from './ui/Button'
import DevicePanel from './DevicePanel'
import { Panel, PanelBadge, PanelTitle } from './ui/Panel'

const ESP_PATTERN = /^[A-Za-z0-9._:-]{4,64}$/

const FIELD_CLASS =
  'h-11 min-w-0 flex-1 rounded-xl bg-paper-soft px-3 text-base outline-none transition placeholder:text-muted focus:ring-2 focus:ring-blue/20 disabled:cursor-not-allowed disabled:opacity-60'

function AddEsp({
  espId,
  onAssociate,
  onBack,
  online = false,
  lastSyncLabel = '',
  onSync,
  hasReading = false,
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scope = useReveal()

  async function handleSubmit(event) {
    event.preventDefault()
    const nextId = draft.trim()

    if (!ESP_PATTERN.test(nextId)) {
      setError('Use de 4 a 64 caracteres: letras, números, ponto, hífen, dois-pontos ou sublinhado.')
      return
    }

    if (nextId === espId) {
      setError('Este módulo já está vinculado ao seu perfil.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await onAssociate(nextId)
      setDraft('')
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Não foi possível vincular o dispositivo. Tente novamente.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={scope} className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <Panel data-reveal="scale">
        <div className="flex items-center justify-between gap-3">
          <PanelTitle as="h1">Adicionar ESP32</PanelTitle>
          <PanelBadge>Por ID</PanelBadge>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted">
          Conecte um novo módulo informando o ID gravado no dispositivo. O
          vínculo é salvo no seu perfil.
        </p>

        <form className="mt-4 flex flex-col gap-2" onSubmit={handleSubmit} noValidate>
          <label
            className="text-sm font-medium text-ink-soft"
            htmlFor="new-esp"
          >
            ID do dispositivo
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="new-esp"
              className={FIELD_CLASS}
              name="espId"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoComplete="off"
              spellCheck="false"
              aria-invalid={Boolean(error)}
              aria-describedby="new-esp-hint"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="primary"
              className="h-11 shrink-0"
              disabled={isLoading}
            >
              {isLoading ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>

          <p
            className={`min-h-[1.25rem] text-xs leading-relaxed ${
              error ? 'text-red' : 'text-muted'
            }`}
            id="new-esp-hint"
            role={error ? 'alert' : undefined}
          >
            {error || 'Exemplo: ESP32-01, ESTUFA-02 ou MB2I-QUARTO.'}
          </p>
        </form>

        <Button className="mt-4" onClick={onBack}>
          Voltar ao painel
        </Button>
      </Panel>

      <DevicePanel
        data-reveal
        espId={espId}
        lastSyncLabel={lastSyncLabel}
        onSync={onSync}
        online={online}
        hasReading={hasReading}
      />
    </div>
  )
}

export default AddEsp
