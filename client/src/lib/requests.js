import { request } from './http'

/** Endpoints de autenticação. */
export const authApi = {
  login({ email, password, remember = false }) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password, remember },
    })
  },

  signup({ username, email, password }) {
    return request('/auth/signup', {
      method: 'POST',
      body: { username, email, password },
    })
  },

  logout() {
    return request('/auth/logout', { method: 'POST' })
  },

  session() {
    return request('/auth/find')
  },
}

/** Endpoints de dispositivos. */
export const espApi = {
  associate(espId) {
    // O backend identifica o usuário pelo cookie httpOnly; não envie userId.
    return request('/esp/associate', {
      method: 'POST',
      body: { espId },
    })
  },
}

/** Relatório gerado por IA a partir dos dados do painel. */
export const aiApi = {
  report(context) {
    return request('/ai/report', {
      method: 'POST',
      body: context,
    })
  },
}

/** Fachada única usada pelos componentes. */
export const api = {
  ...authApi,
  ...espApi,
  ...aiApi,
  associateEsp: espApi.associate,
}
