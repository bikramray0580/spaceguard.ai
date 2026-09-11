import { Outlet } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import NavigationRail from '../components/NavigationRail'
import TopBar from '../components/TopBar'
import { fetchObjects, toObjectViewModel } from '../services/objectsApi'
import { useThreatScreening } from '../hooks/useThreatScreening'

const EMPTY_SIMULATION = {
  active: false,
  progress: 0,
  result: null,
}

export default function AppShell() {
  const [selectedThreat, setSelectedThreat] = useState(null)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [simulation, setSimulation] = useState(EMPTY_SIMULATION)
  const [threatRefreshKey, setThreatRefreshKey] = useState(0)

  const [objects, setObjects] = useState([])
  const [objectsStatus, setObjectsStatus] = useState('loading')
  const [objectsError, setObjectsError] = useState(null)

  const loadObjects = useCallback(async (signal) => {
    setObjectsStatus('loading')
    setObjectsError(null)

    try {
      const payload = await fetchObjects({ signal })
      const records = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.objects)
          ? payload.objects
          : []

      const nextObjects = records.map(toObjectViewModel)

      setObjects(nextObjects)
      setObjectsStatus('connected')
    } catch (error) {
      if (error?.name === 'AbortError') return

      console.error('Unable to load orbital objects:', error)
      setObjects([])
      setObjectsStatus('error')
      setObjectsError(error)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadObjects(controller.signal)
    return () => controller.abort()
  }, [loadObjects])

  const threatData = useThreatScreening(objects, {
    refreshKey: threatRefreshKey,
    objectLimit: 10,
    durationMinutes: 120,
    stepMinutes: 5,
    concurrency: 3,
  })

  useEffect(() => {
    if (!selectedThreat) return

    const stillAvailable = threatData.threats.some((threat) => threat.id === selectedThreat.id)
    if (!stillAvailable) {
      setSelectedThreat(null)
    }
  }, [selectedThreat, setSelectedThreat, threatData.threats])

  const reloadObjects = useCallback(() => {
    void loadObjects()
  }, [loadObjects])

  const refreshThreats = () => {
    if (objectsStatus === 'error') {
      reloadObjects()
      return
    }

    setThreatRefreshKey((value) => value + 1)
  }

  return (
    <main className="app-shell">
      <TopBar
        onMenuToggle={() =>
          setNavigationOpen((open) => !open)
        }
      />

      <NavigationRail
        isOpen={navigationOpen}
        onNavigate={() => setNavigationOpen(false)}
      />

      <div className="app-grid">
        <section className="content-area">
          <Outlet
            context={{
              selectedThreat,
              setSelectedThreat,
              simulation,
              setSimulation,
              objects,
              objectsStatus,
              objectsError,
              reloadObjects,
              threats: threatData.threats,
              threatsStatus: threatData.status,
              threatsError: threatData.error,
              threatsCompleted: threatData.completed,
              threatsAttempted: threatData.attempted,
              threatsSuccessful: threatData.successful,
              threatCandidateObjects: threatData.candidateObjects,
              threatCandidateObjectCount: threatData.candidateObjectCount,
              threatPairCount: threatData.pairCount,
              threatScreeningWindowMinutes: threatData.screeningWindowMinutes,
              threatStepMinutes: threatData.stepMinutes,
              refreshThreats,
            }}
          />
        </section>
      </div>
    </main>
  )
}
