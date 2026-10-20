import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'mb2i:theme'
const THEMES = new Set(['light', 'dark', 'system'])
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return THEMES.has(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === 'system' ? getSystemTheme() : theme,
  )

  useEffect(() => {
    const media = window.matchMedia(MEDIA_QUERY)
    const syncTheme = () => {
      setResolvedTheme(theme === 'system' ? getSystemTheme() : theme)
    }

    syncTheme()

    if (theme !== 'system') return undefined

    media.addEventListener('change', syncTheme)
    return () => media.removeEventListener('change', syncTheme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const isDark = resolvedTheme === 'dark'

    root.classList.toggle('dark', isDark)
    root.style.colorScheme = resolvedTheme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#12140f' : '#e8e2d2')
  }, [resolvedTheme])

  const setTheme = useCallback((nextTheme) => {
    if (!THEMES.has(nextTheme)) return

    setThemeState(nextTheme)

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // Sem armazenamento disponível: mantém a escolha apenas nesta sessão.
    }
  }, [])

  return { theme, resolvedTheme, setTheme }
}
