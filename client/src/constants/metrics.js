export const METRIC_CONFIG = {
  soil: {
    label: 'Umidade do solo',
    unit: '%',
    hint: 'Ideal entre 45% e 60%',
    tone: 'green',
    min: 0,
    max: 100,
  },
  temperature: {
    label: 'Temperatura',
    unit: '°C',
    hint: 'Faixa ideal 18–26 °C',
    tone: 'yellow',
    min: 10,
    max: 35,
  },
  light: {
    label: 'Luminosidade',
    unit: 'lx',
    hint: 'Luz indireta por até 12h',
    tone: 'purple',
    min: 0,
    max: 2000,
  },
}

export const METRIC_PRECISION = {
  soil: 0,
  temperature: 1,
  light: 0,
}

export const RANGE_OPTIONS = ['24h', '7d', '30d']

export const RANGE_WINDOWS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}
