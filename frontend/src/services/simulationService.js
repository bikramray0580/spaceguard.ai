const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

function extractMinutes(window) {
  const match = window?.match(/(\d+)m/)
  return match ? Number(match[1]) : null
}

export async function runMockSimulation(
  threat,
  onProgress
) {
  if (!threat?.objectA || !threat?.objectB) {
    throw new Error(
      'A valid object pair is required for simulation.'
    )
  }

  const duration = 8000
  const interval = 100
  const steps = duration / interval

  for (let step = 0; step <= steps; step++) {
    const progress = Math.min(
      Math.round((step / steps) * 100),
      100
    )

    onProgress?.(progress)

    await wait(interval)
  }

  return {
    objectA: threat.objectA,
    objectB: threat.objectB,

    timeToTcaMinutes: extractMinutes(
      threat.window
    ),

    missDistanceKm: Number.parseFloat(
      threat.distance
    ),

    relativeVelocityKmS:
      Number.parseFloat(
        threat.velocity
          .replace('km/s', '')
          .trim()
      ),

    riskLevel: threat.level,

    window: threat.window,

    isMock: true,
  }
}