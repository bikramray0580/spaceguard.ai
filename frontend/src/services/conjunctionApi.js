import { apiFetch } from './api'

export async function screenConjunction(
  {
    objectA,
    objectB,
    start,
    end,
    stepMinutes = 5,
  },
  options = {},
) {
  if (!objectA || !objectB || !start || !end) {
    throw new Error(
      'Conjunction screening requires two object IDs and a time window.',
    )
  }

  return apiFetch('/api/conjunctions/screen', {
    method: 'POST',
    ...options,
    body: {
      object_a: objectA,
      object_b: objectB,
      start,
      end,
      step_minutes: stepMinutes,
    },
  })
}

export function normalizeRiskLevel(value) {
  const normalized = String(value || 'UNKNOWN').toUpperCase()

  if (normalized === 'MEDIUM' || normalized === 'MODERATE') return 'MEDIUM'
  if (normalized === 'HIGH') return 'HIGH'
  if (normalized === 'LOW') return 'LOW'

  return 'UNKNOWN'
}

export function toThreatViewModel(
  result,
  {
    objectAName = result.object_a,
    objectBName = result.object_b,
  } = {},
) {
  const tca = new Date(result.time_of_closest_approach)
  const riskLevel = normalizeRiskLevel(result.risk_level)

  return {
    id: `${result.object_a}-${result.object_b}-${tca.toISOString()}`,
    objectA: result.object_a,
    objectB: result.object_b,
    objectAName,
    objectBName,
    missDistanceKm: Number(result.miss_distance_km),
    relativeVelocityKmS: Number(result.relative_velocity_km_s),
    distance: formatDistance(result.miss_distance_km),
    velocity: formatVelocity(result.relative_velocity_km_s),
    window: formatTimeUntilTca(result.time_of_closest_approach),
    riskLevel,
    level: riskLevel,
    riskReason: result.risk_reason || 'Backend did not provide a risk explanation.',
    mlPrediction: result.ml_prediction || null,
    tca: result.time_of_closest_approach,
    tcaDate: tca,
    source: 'backend',
  }
}

export function formatDistance(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 'Unavailable'
  return `${number >= 10 ? number.toFixed(1) : number.toFixed(2)} km`
}

export function formatVelocity(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 'Unavailable'
  return `${number.toFixed(2)} km/s`
}

export function formatTca(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatTimeUntilTca(value, now = new Date()) {
  const tca = new Date(value)
  if (Number.isNaN(tca.getTime())) return 'Unavailable'

  const minutes = Math.round((tca.getTime() - now.getTime()) / 60000)

  if (minutes <= 0) return 'TCA reached'
  if (minutes < 60) return `TCA + ${minutes}m`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes
    ? `TCA + ${hours}h ${remainingMinutes}m`
    : `TCA + ${hours}h`
}
