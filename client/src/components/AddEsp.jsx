import { useState } from 'react'

const ESP_PATTERN = /^[A-Za-z0-9._:-]{4,64}$/

function AddEsp({ espId, onAssociate, onBack }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
    <div className="add-esp-view">
      <section className="window add-esp-card">
        <div className="panel-head">
          <div>
            <p className="section-kicker">Novo módulo</p>
            <h1 className="panel-title">Adicionar ESP32</h1>
          </div>
          <span className="panel-badge">Por ID</span>
        </div>

        <div className="panel-body add-esp-body">
          <p className="add-esp-lede">
            Conecte um novo módulo informando o ID gravado no dispositivo.
            O vínculo é salvo no seu perfil.
          </p>

          <form className="add-esp-form" onSubmit={handleSubmit} noValidate>
            <label className="form-label" htmlFor="new-esp">
              ID do dispositivo
            </label>
            <div className="add-esp-row">
              <input
                id="new-esp"
                className="input"
                name="espId"
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="ESP32-01"
                autoComplete="off"
                spellCheck="false"
                aria-invalid={Boolean(error)}
                aria-describedby="new-esp-hint"
                disabled={isLoading}
              />
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
            <p
              className={`form-hint ${error ? 'is-error' : ''}`}
              id="new-esp-hint"
              role={error ? 'alert' : undefined}
            >
              {error || 'Exemplo: ESP32-01, ESTUFA-02 ou MB2I-QUARTO.'}
            </p>
          </form>

          <div className="add-esp-current">
            <span>Dispositivo atual</span>
            <strong>{espId}</strong>
          </div>

          <button className="btn add-esp-back" type="button" onClick={onBack}>
            Voltar ao painel
          </button>
        </div>
      </section>
    </div>
  )
}

export default AddEsp
