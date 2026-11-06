import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion, REVEAL_EASE } from '../lib/gsap'
import { api } from '../lib/requests'
import BrandMark from './ui/BrandMark'
import Button from './ui/Button'
import Checkbox from './ui/Checkbox'
import { Panel } from './ui/Panel'
import SettingsIcon from './ui/SettingsIcon'
import Spinner from './ui/Spinner'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COPY = {
  login: {
    title: 'Entrar',
    subtitle: 'Acesse seu painel de monitoramento.',
    action: 'Entrar no painel',
    loading: 'Entrando...',
  },
  signup: {
    title: 'Criar conta',
    subtitle: 'Leve seu jardim para o digital em menos de um minuto.',
    action: 'Criar conta',
    loading: 'Criando conta...',
  },
}

const FIELD_CLASS =
  'h-11 w-full rounded-xl bg-paper-soft px-3 text-base outline-none transition placeholder:text-muted focus:ring-2 focus:ring-blue/20 disabled:cursor-not-allowed disabled:opacity-60'

const LABEL_CLASS =
  'text-sm font-medium text-ink-soft'

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

function LoginPage({ onLogin, onOpenSettings }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scope = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !scope.current) return

      const timeline = gsap.timeline({
        defaults: {
          ease: REVEAL_EASE,
          clearProps: 'opacity,visibility,transform',
        },
      })

      timeline
        .from('[data-login-brand]', { autoAlpha: 0, y: -14, duration: 0.45 })
        .from(
          '[data-login-card]',
          { autoAlpha: 0, y: 24, scale: 0.97, duration: 0.55 },
          '-=0.2',
        )
        .from(
          '[data-reveal]',
          { autoAlpha: 0, y: 14, duration: 0.4, stagger: 0.055 },
          '-=0.35',
        )
    },
    { scope },
  )

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
    <div ref={scope} className="relative flex min-h-dvh flex-col lg:flex-row">
      {onOpenSettings ? (
        <button
          type="button"
          onClick={onOpenSettings}
          data-reveal
          className="absolute right-4 top-4 z-20 grid size-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink sm:right-6 sm:top-6"
          aria-label="Abrir configurações do app"
          aria-haspopup="dialog"
          title="Configurações"
        >
          <SettingsIcon className="size-5" />
        </button>
      ) : null}

      <div className="flex min-h-dvh w-full flex-col px-4 pb-10 sm:px-6 lg:w-1/2 lg:items-center lg:justify-center lg:gap-8 lg:bg-paper-bright lg:px-12 lg:pb-12 lg:shadow-soft">
        <header
          data-login-brand
          className="flex w-full max-w-md flex-col items-start gap-3 pt-10 pb-6 text-left lg:items-center lg:pt-0 lg:pb-0 lg:text-center"
        >
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-8" />
            <span className="font-display text-2xl font-bold tracking-[-0.02em]">
              MB2I
            </span>
          </div>
        </header>

        <main className="flex w-full max-w-md flex-1 flex-col lg:flex-none">
          <Panel
            data-login-card
            padded={false}
            className="h-fit w-full p-5 sm:p-6 lg:bg-transparent lg:p-0 lg:shadow-none"
          >
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div
              data-reveal
              className="grid grid-cols-2 gap-1 rounded-xl bg-paper-soft p-1"
              role="group"
              aria-label="Entrar ou criar conta"
            >
              <button
                type="button"
                aria-pressed={!isSignup}
                onClick={() => switchMode('login')}
                disabled={isLoading}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                  isSignup
                    ? 'text-ink-soft hover:text-ink'
                    : 'bg-paper-bright text-ink shadow-xs'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                aria-pressed={isSignup}
                onClick={() => switchMode('signup')}
                disabled={isLoading}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                  isSignup
                    ? 'bg-paper-bright text-ink shadow-xs'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Criar conta
              </button>
            </div>

            <div data-reveal>
              <h1 className="font-display text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                {copy.title}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">
                {copy.subtitle}
              </p>
            </div>

            {error ? (
              <div
                className="flex items-start gap-2 rounded-xl bg-red/[0.08] px-3 py-2.5 text-sm font-medium text-danger"
                role="alert"
              >
                <svg
                  className="mt-0.5 size-4 shrink-0"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm0-13.2a1 1 0 0 0-1 1V9a1 1 0 1 0 2 0V3.8a1 1 0 0 0-1-1zm0 10.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" />
                </svg>
                <span>{error}</span>
              </div>
            ) : null}

            {isSignup ? (
              <div data-reveal className="flex flex-col gap-1.5">
                <label htmlFor="name" className={LABEL_CLASS}>
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  className={FIELD_CLASS}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Como devemos chamar você"
                  autoComplete="name"
                  disabled={isLoading}
                  required
                />
              </div>
            ) : null}

            <div data-reveal className="flex flex-col gap-1.5">
              <label htmlFor="email" className={LABEL_CLASS}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className={FIELD_CLASS}
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

            <div data-reveal className={isSignup ? 'grid gap-3 sm:grid-cols-2' : ''}>
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor="password" className={LABEL_CLASS}>
                  Senha
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${FIELD_CLASS} pr-[76px]`}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isSignup ? '8+ caracteres' : 'Sua senha'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    disabled={isLoading}
                    className="absolute right-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue hover:bg-blue/[0.08]"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {isSignup ? (
                <div className="flex min-w-0 flex-col gap-1.5">
                  <label htmlFor="confirm" className={LABEL_CLASS}>
                    Confirmar senha
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    className={FIELD_CLASS}
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

            {!isSignup ? (
              <div data-reveal className="flex flex-wrap items-center justify-between gap-3">
                <Checkbox
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Lembrar-me
                </Checkbox>
                <a
                  href="#recuperar"
                  className="whitespace-nowrap text-sm font-medium text-blue no-underline hover:underline hover:underline-offset-2"
                >
                  Esqueci a senha
                </a>
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              data-reveal
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  {copy.loading}
                </>
              ) : (
                copy.action
              )}
            </Button>
          </form>
        </Panel>
      </main>
      </div>
    </div>
  )
}

export default LoginPage
