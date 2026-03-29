export const VITAL_STANDARDS = {
  heartRate: {
    label: 'Heart Rate',
    sensor: 'MAX30102',
    unit: 'bpm',
    min: 50,
    max: 110,
    dangerMin: 45,
    dangerMax: 130,
  },
  ambientTemperature: {
    label: 'Ambient Temperature',
    sensor: 'DHT22',
    unit: 'deg C',
    min: 18,
    max: 35,
    dangerMin: 8,
    dangerMax: 40,
  },
  humidity: {
    label: 'Humidity',
    sensor: 'DHT22',
    unit: '%',
    min: 30,
    max: 70,
    dangerMin: 15,
    dangerMax: 90,
  },
  noiseLevel: {
    label: 'Noise Level',
    sensor: 'MAX4466',
    unit: 'dBA',
    max: 85,
    dangerMax: 90,
  },
  airQualityPpm: {
    label: 'Air Quality',
    sensor: 'MQ135',
    unit: 'ppm',
    max: 1000,
    dangerMax: 1400,
  },
  vibrationLevel: {
    label: 'Vibration',
    sensor: 'MPU6050',
    unit: 'g',
    max: 1.5,
    dangerMax: 2.2,
  },
  tiltAngle: {
    label: 'Tilt Angle',
    sensor: 'MPU6050',
    unit: 'deg',
    max: 35,
    dangerMax: 50,
  },
}

export function getVitalStatus(key, rawValue) {
  const standard = VITAL_STANDARDS[key]
  const value = Number(rawValue)

  if (!standard || !Number.isFinite(value) || value === 0) {
    return { status: 'normal', outOfRange: false }
  }

  const minThreshold =
    typeof standard.dangerMin === 'number' ? standard.dangerMin : standard.min
  const maxThreshold =
    typeof standard.dangerMax === 'number' ? standard.dangerMax : standard.max

  const belowMin = typeof minThreshold === 'number' && value < minThreshold
  const aboveMax = typeof maxThreshold === 'number' && value > maxThreshold
  const outOfRange = belowMin || aboveMax

  if (!outOfRange) {
    return { status: 'normal', outOfRange: false }
  }

  return {
    status: 'danger',
    outOfRange: true,
  }
}

export function evaluateVitals(vitals = {}) {
  const evaluated = {}

  for (const key of Object.keys(VITAL_STANDARDS)) {
    const value = vitals[key]
    evaluated[key] = { value, ...getVitalStatus(key, value) }
  }

  return evaluated
}
