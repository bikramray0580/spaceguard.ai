import { apiFetch } from './api'

export const EARTH_RADIUS_KM = 6371
export const EARTH_RENDER_RADIUS = 1.72
export const ORBIT_RENDER_SCALE =
  EARTH_RENDER_RADIUS / EARTH_RADIUS_KM

export async function propagateOrbit(
  {
    objectId = null,
    start,
    end,
    stepMinutes = 5,
  },
  options = {},
) {
  if (!start || !end) {
    throw new Error('Orbit propagation requires start and end timestamps.')
  }

  return apiFetch('/api/orbits/propagate', {
    method: 'POST',
    ...options,
    body: {
      ...(objectId ? { object_id: objectId } : {}),
      start,
      end,
      step_minutes: stepMinutes,
    },
  })
}

export function createPropagationWindow({
  durationMinutes = 120,
  stepMinutes = 2,
  anchor = new Date(),
} = {}) {
  const start = new Date(anchor)
  start.setSeconds(0, 0)

  const stepCount = Math.max(
    1,
    Math.round(durationMinutes / stepMinutes),
  )

  const end = new Date(
    start.getTime() +
      stepCount * stepMinutes * 60 * 1000,
  )

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export function toOrbitViewModel(result) {
  return {
    id: result.object_id,
    name: result.object_name,
    coordinateFrame: result.states[0]?.coordinate_frame || 'TEME',
    states: result.states.map((state) => ({
      timestamp: state.timestamp,
      position: state.position,
      velocity: state.velocity,
      renderPosition: [
        state.position.x_km * ORBIT_RENDER_SCALE,
        state.position.z_km * ORBIT_RENDER_SCALE,
        state.position.y_km * ORBIT_RENDER_SCALE,
      ],
    })),
  }
}

export function calculateAltitudeKm(state) {
  if (!state?.position) return null

  const { x_km: x, y_km: y, z_km: z } = state.position
  const geocentricRadius = Math.hypot(x, y, z)

  return geocentricRadius - EARTH_RADIUS_KM
}

export function calculateSpeedKmS(state) {
  if (!state?.velocity) return null

  const {
    x_km_s: x,
    y_km_s: y,
    z_km_s: z,
  } = state.velocity

  return Math.hypot(x, y, z)
}
