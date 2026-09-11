import { useState } from 'react'
import MissionViewport from '../components/MissionViewport'
import ContextPanel from '../components/ContextPanel'
import FeatureDock from '../components/FeatureDock'
import ViewControls from '../components/ViewControls'
import { useMissionContext } from '../layouts/useMissionContext'
import { useOrbitalData } from '../hooks/useOrbitalData'
import { runMockSimulation } from '../services/simulationService'

export default function DashboardPage() {
  const {
    selectedThreat,
    setSelectedThreat,
    simulation,
    setSimulation,
    objects,
    threats,
    threatsStatus,
    threatsCompleted,
    threatsAttempted,
    refreshThreats,
  } = useMissionContext()

  const [activePanel, setActivePanel] = useState(null)
  const [selectedObjectId, setSelectedObjectId] = useState(null)

  const orbitalData = useOrbitalData(objects)

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  ) ?? null

  const selectedOrbit = selectedObjectId
    ? orbitalData.orbitById.get(selectedObjectId) ?? null
    : null

  const selectObject = (objectId) => {
    setSelectedObjectId(objectId)
    setActivePanel('track')
  }

  const handleSimulation = async () => {
    if (simulation.active) return

    if (!threats.length) return

    setSimulation({
      active: true,
      progress: 0,
      result: null,
    })

    try {
      const result = await runMockSimulation(
        selectedThreat ?? threats[0],
        (progress) =>
          setSimulation((current) => ({
            ...current,
            progress,
          })),
      )

      setSimulation({
        active: false,
        progress: 100,
        result,
      })
    } catch (error) {
      console.error('Simulation failed:', error)
      setSimulation({
        active: false,
        progress: 0,
        result: null,
      })
    }
  }

  return (
    <section className="dashboard-workspace">
      <MissionViewport
        selectedThreat={selectedThreat}
        selectedObject={selectedObject}
        selectedObjectId={selectedObjectId}
        onObjectSelect={selectObject}
        simulation={simulation}
        orbitalData={orbitalData}
      />

      <ContextPanel
        panel={activePanel}
        selectedThreat={selectedThreat}
        selectedObject={selectedObject}
        selectedOrbit={selectedOrbit}
        onSelectThreat={setSelectedThreat}
        simulation={simulation}
        onRunSimulation={handleSimulation}
        onClose={() => setActivePanel(null)}
        threats={threats}
        threatsStatus={threatsStatus}
        threatsCompleted={threatsCompleted}
        threatsAttempted={threatsAttempted}
        refreshThreats={refreshThreats}
      />

      <FeatureDock
        activePanel={activePanel}
        onSelect={setActivePanel}
      />

      <ViewControls />
    </section>
  )
}
