import { API_URL } from './env'

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export async function request(path, { method = 'GET', body } = {}) {
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
