const DEFAULT_API_URL = 'https://mb2i-backend.vercel.app'

export const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(
  /\/+$/,
  '',
)
