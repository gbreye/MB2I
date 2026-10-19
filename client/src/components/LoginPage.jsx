import { useState } from 'react'
import WindowBar from './WindowBar'
import PlaceholderFigure from './PlaceholderFigure'
import { api } from '../lib/api'
import plantImage from '../assets/potted-plant_1fab4.png'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function authErrorMessage(error, isSignup) {
  if (error?.status === 401) return 'E-mail ou senha incorretos.'
  if (error?.status === 409) return 'Este e-mail já está cadastrado. Tente entrar.'
  if (error?.status === 429) {
    return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
  }
  if (error?.status === 400) {
    return isSignup
      ? 'Confira nome, e-mail e senha antes de continuar.'
      : 'Informe e-mail e senha válidos.'
  }

  return error?.message || 'Não foi possível concluir a solicitação.'
}

const COPY = {
  login: {
    title: 'Entrar',
    subtitle: 'Acesse seu painel de monitoramento.',
    action: 'Entrar no painel',
    loading: 'Entrando...',
    bar: 'ACESSO AO SISTEMA',
  },
  signup: {
    title: 'Criar conta',
    subtitle: 'Leve seu jardim para o digital em menos de um minuto.',
    action: 'Criar conta',
    loading: 'Criando conta...',
    bar: 'NOVO CADASTRO',
  },
}

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(false)
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const copy = COPY[mode]
  const isSignup = mode === 'signup'

  function switchMode(nextMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    setError('')
    setPassword('')
    setConfirm('')
  }

  function validate() {
    if (isSignup && name.trim().length < 2) {
      return 'Informe seu nome completo.'
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'Informe um e-mail válido.'
    }

    if (password.length < (isSignup ? 8 : 6)) {
      return isSignup
        ? 'A senha precisa ter pelo menos 8 caracteres.'
        : 'A senha precisa ter pelo menos 6 caracteres.'
    }

    if (isSignup && password !== confirm) {
      return 'As senhas não coincidem.'
    }

    if (isSignup && !terms) {
      return 'Aceite os termos para criar sua conta.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const data = isSignup
        ? await api.signup({
            username: name.trim(),
            email: email.trim(),
            password,
          })
        : await api.login({
            email: email.trim(),
            password,
            remember,
          })

      if (!data?.user) {
        throw new Error('O servidor não retornou o perfil da conta.')
      }

      onLogin(data.user)
    } catch (requestError) {
      setError(authErrorMessage(requestError, isSignup))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <header className="login-header">
        <div className="login-brand">
          <svg
            className="brand-mark"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <rect x="7" y="7" width="2" height="7" rx="1" fill="#2f5e33" />
            <rect x="3" y="3" width="5" height="4" rx="1.5" fill="#4f8f4a" />
            <rect x="8" y="1" width="5" height="4" rx="1.5" fill="#77b85a" />
            <rect x="4" y="12" width="8" height="2" rx="1" fill="#1c1b17" />
          </svg>
          <span className="brand-name">MB2I</span>
        </div>
        <p className="login-tagline">Sistema 2.0 · Módulo botânico</p>
      </header>

      <main className="login-main">
        <section className="window login-window">
          <WindowBar title={copy.bar} />
          <div className="window-body login-body">
            <div className="login-grid">
              <div className="login-illustration">
                <PlaceholderFigure
                  src={plantImage}
                  alt="Planta em vaso representando a planta monitorada"
                  label="MB2I"
                  caption="Sua planta, monitorada em tempo real."
                />
                <p className="illustration-caption">
                  Seu jardim, digitalizado.
                </p>
              </div>

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-switch" role="group" aria-label="Entrar ou criar conta">
                  <button
                    type="button"
                    aria-pressed={!isSignup}
                    className={!isSignup ? 'is-active' : ''}
                    onClick={() => switchMode('login')}
                    disabled={isLoading}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    aria-pressed={isSignup}
                    className={isSignup ? 'is-active' : ''}
                    onClick={() => switchMode('signup')}
                    disabled={isLoading}
                  >
                    Criar conta
                  </button>
                </div>

                <div>
                  <h1 className="login-title">{copy.title}</h1>
                  <p className="login-subtitle">{copy.subtitle}</p>
                </div>

                {error ? (
                  <div className="login-error" role="alert">
                    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm0-13.2a1 1 0 0 0-1 1V9a1 1 0 1 0 2 0V3.8a1 1 0 0 0-1-1zm0 10.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                ) : null}

                {isSignup ? (
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Nome
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Como devemos chamar você"
                      autoComplete="name"
                      disabled={isLoading}
                      required
                    />
                  </div>
                ) : null}

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className={isSignup ? 'form-row' : ''}>
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Senha
                    </label>
                    <div className="input-with-action">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={isSignup ? '8+ caracteres' : 'Sua senha'}
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="input-action"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        disabled={isLoading}
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  {isSignup ? (
                    <div className="form-group">
                      <label htmlFor="confirm" className="form-label">
                        Confirmar senha
                      </label>
                      <input
                        id="confirm"
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  ) : null}
                </div>

                {isSignup ? (
                  <label className="checkbox-label checkbox-label--terms">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={terms}
                      onChange={(event) => setTerms(event.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="checkbox-custom" aria-hidden="true" />
                    <span>
                      Concordo com os <a href="#termos">termos de uso</a> e a{' '}
                      <a href="#privacidade">política de privacidade</a>.
                    </span>
                  </label>
                ) : (
                  <div className="form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        disabled={isLoading}
                      />
                      <span className="checkbox-custom" aria-hidden="true" />
                      <span>Lembrar-me</span>
                    </label>
                    <a href="#recuperar" className="forgot-link">
                      Esqueci a senha
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-login"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      {copy.loading}
                    </>
                  ) : (
                    copy.action
                  )}
                </button>

                <p className="login-footer-note">
                  Protótipo · Sistema 2.0 · MB2I © 1984–2026
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <div className="footer-rainbow" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </footer>
    </div>
  )
}

export default LoginPage
