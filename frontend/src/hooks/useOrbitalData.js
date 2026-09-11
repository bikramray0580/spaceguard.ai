import { useEffect, useMemo, useState } from 'react'
import {
  createPropagationWindow,
  propagateOrbit,
  toOrbitViewModel,
} from '../services/orbitApi'

const DEFAULT_VISIBLE_OBJECTS = 18
const DEFAULT_STEP_MINUTES = 2
const DEFAULT_WINDOW_MINUTES = 120

export function useOrbitalData(
  objects,
  {
    maxVisibleObjects = DEFAULT_VISIBLE_OBJECTS,
    stepMinutes = DEFAULT_STEP_MINUTES,
    durationMinutes = DEFAULT_WINDOW_MINUTES,
  } = {},
) {
  const visibleObjects = useMemo(
    () => objects.slice(0, maxVisibleObjects),
    [objects, maxVisibleObjects],
  )

  const objectIdsKey = useMemo(
    () => visibleObjects.map((object) => object.id).join('|'),
    [visibleObjects],
  )

  const [orbits, setOrbits] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [window, setWindow] = useState(null)

  useEffect(() => {
    if (!visibleObjects.length) {
      setOrbits([])
      setStatus('idle')
      setError(null)
      setWindow(null)
      return undefined
    }

    const controller = new AbortController()
    const propagationWindow = createPropagationWindow({
      durationMinutes,
      stepMinutes,
    })

    setStatus('loading')
    setError(null)
    setWindow(propagationWindow)

    async function loadOrbits() {
      try {
        const payload = await propagateOrbit(
          {
            objectId: visibleObjects.map((object) => object.id),
            ...propagationWindow,
            stepMinutes,
          },
          { signal: controller.signal },
        )

        setOrbits(payload.map(toOrbitViewModel))
        setStatus('connected')
      } catch (requestError) {
        if (requestError?.name === 'AbortError') return

        console.error('Unable to load propagated orbits:', requestError)
        setOrbits([])
        setStatus('error')
        setError(requestError)
      }
    }

    loadOrbits()

    return () => controller.abort()
  }, [
    durationMinutes,
    objectIdsKey,
    stepMinutes,
  ])

  const orbitById = useMemo(
    () => new Map(orbits.map((orbit) => [orbit.id, orbit])),
    [orbits],
  )

  return {
    orbits,
    orbitById,
    visibleObjects,
    status,
    error,
    window,
    visibleObjectCount: visibleObjects.length,
    totalObjectCount: objects.length,
  }
}
