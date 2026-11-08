import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_PREFIX = 'mb2i:dashboard-order:'

function normalize(order, defaults) {
  const allowed = new Set(defaults)
  const seen = new Set()
  const result = []

  for (const id of Array.isArray(order) ? order : []) {
    if (!allowed.has(id) || seen.has(id)) continue

    seen.add(id)
    result.push(id)
  }

  defaults.forEach((id, index) => {
    if (seen.has(id)) return

    let insertAt = 0

    for (let previous = index - 1; previous >= 0; previous -= 1) {
      const position = result.indexOf(defaults[previous])

      if (position !== -1) {
        insertAt = position + 1
        break
      }
    }

    if (insertAt === 0) {
      for (let next = index + 1; next < defaults.length; next += 1) {
        const position = result.indexOf(defaults[next])

        if (position !== -1) {
          insertAt = position
          break
        }
      }
    }

    result.splice(insertAt, 0, id)
    seen.add(id)
  })

  return result
}

function readOrder(storageKey, defaults) {
  try {
    const raw = window.localStorage.getItem(storageKey)

    if (!raw) return defaults

    return normalize(JSON.parse(raw), defaults)
  } catch {
    return defaults
  }
}

function isSameOrder(a, b) {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

/**
 * Ordem persistente dos widgets do painel. Aceita arrastar, mover por
 * teclado (setas) e restaurar a ordem original.
 */
export function useWidgetOrder(defaultOrder, scope = 'painel') {
  const storageKey = `${STORAGE_PREFIX}${scope}`
  const [order, setOrder] = useState(() =>
    readOrder(storageKey, defaultOrder),
  )
  const normalizedOrder = useMemo(
    () => normalize(order, defaultOrder),
    [order, defaultOrder],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(normalizedOrder),
      )
    } catch {
      // Sem armazenamento disponível: a ordem vale apenas nesta sessão.
    }
  }, [normalizedOrder, storageKey])

  const moveTo = useCallback(
    (id, targetId) => {
      if (!id || !targetId || id === targetId) return

      setOrder((current) => {
        const base = normalize(current, defaultOrder)
        const from = base.indexOf(id)
        const to = base.indexOf(targetId)

        if (from === -1 || to === -1 || from === to) return current

        const next = base.slice()
        next.splice(from, 1)
        next.splice(to, 0, id)
        return next
      })
    },
    [defaultOrder],
  )

  const moveBy = useCallback(
    (id, delta) => {
      setOrder((current) => {
        const base = normalize(current, defaultOrder)
        const from = base.indexOf(id)

        if (from === -1 || !delta) return current

        const to = Math.min(
          base.length - 1,
          Math.max(0, from + delta),
        )

        if (to === from) return current

        const next = base.slice()
        next.splice(from, 1)
        next.splice(to, 0, id)
        return next
      })
    },
    [defaultOrder],
  )

  const reset = useCallback(() => {
    setOrder(normalize(defaultOrder, defaultOrder))
  }, [defaultOrder])

  const isDefault = isSameOrder(normalizedOrder, defaultOrder)

  return { order: normalizedOrder, moveTo, moveBy, reset, isDefault }
}
