const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
    )
  }

  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { mes: text }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.mes || payload?.message || 'O servidor não concluiu a solicitação.',
      response.status,
      payload,
    )
  }

  return payload
}

export const api = {
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

  associateEsp(espId) {
    return request('/esp/associate', {
      method: 'POST',
      body: { espId },
    })
  },
}

export function normalizeUser(user) {
  if (!user) return null

  const name =
    user.name ||
    user.username ||
    (typeof user.email === 'string' ? user.email.split('@')[0] : '') ||
    'Jardineiro'

  return {
    ...user,
    name,
    plant: Array.isArray(user.plant) ? user.plant : [],
  }
}

export { API_URL }
