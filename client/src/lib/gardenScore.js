const RULES = {
  soil: { ideal: [45, 60], bounds: [0, 100], weight: 0.4 },
  temperature: { ideal: [18, 26], bounds: [10, 35], weight: 0.35 },
  light: { ideal: [300, 1200], bounds: [0, 2000], weight: 0.25 },
}

const LEVELS = [
  {
    min: 85,
    id: 'excellent',
    label: 'Excelente',
    tone: 'green',
    message: 'Condições ideais para a planta.',
  },
  {
    min: 65,
    id: 'good',
    label: 'Bom',
    tone: 'blue',
    message: 'O jardim está bem, com pequenos ajustes possíveis.',
  },
  {
    min: 40,
    id: 'attention',
    label: 'Atenção',
    tone: 'yellow',
    message: 'Alguns fatores precisam de atenção.',
  },
  {
    min: 0,
    id: 'critical',
    label: 'Crítico',
    tone: 'red',
    message: 'O jardim precisa de cuidados urgentes.',
  },
]

const EMPTY_LEVEL = {
  id: 'empty',
  label: 'Sem dados',
  tone: 'muted',
  message: 'Aguardando leituras para calcular a saúde do jardim.',
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function scoreValue(value, rule) {
  const [idealMin, idealMax] = rule.ideal
  const [boundMin, boundMax] = rule.bounds

  if (value >= idealMin && value <= idealMax) return 100

  if (value < idealMin) {
    const span = idealMin - boundMin
    return span <= 0 ? 0 : clamp(((value - boundMin) / span) * 100)
  }

  const span = boundMax - idealMax
  return span <= 0 ? 0 : clamp(((boundMax - value) / span) * 100)
}

/**
 * Calcula uma nota de 0 a 100 para o jardim a partir das métricas
 * disponíveis, considerando a faixa ideal de cada uma.
 */
export function buildGardenScore(metrics) {
  let weighted = 0
  let totalWeight = 0
  const evaluated = []

  for (const [key, rule] of Object.entries(RULES)) {
    const value = metrics?.[key]?.value

    if (typeof value !== 'number' || !Number.isFinite(value)) continue

    const score = scoreValue(value, rule)

    weighted += score * rule.weight
    totalWeight += rule.weight
    evaluated.push({ key, score: Math.round(score) })
  }

  if (totalWeight === 0) {
    return { score: null, level: EMPTY_LEVEL, evaluated, hasData: false }
  }

  const score = Math.round(weighted / totalWeight)
  const level = LEVELS.find((item) => score >= item.min) || LEVELS[LEVELS.length - 1]

  return { score, level, evaluated, hasData: true }
}
