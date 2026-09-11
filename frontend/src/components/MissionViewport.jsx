import { MousePointer2 } from 'lucide-react'
import OrbitalScene from './OrbitalScene'
import RenderErrorBoundary from './RenderErrorBoundary'
import ClockStatus from './ClockStatus'

export default function MissionViewport({
  selectedThreat,
  selectedObject,
  selectedObjectId,
  onObjectSelect,
  simulation,
  orbitalData = {
    status: 'idle',
    orbits: [],
    visibleObjectCount: 0,
    totalObjectCount: 0,
  },
}) {
  const statusLabel =
    orbitalData.status === 'connected'
      ? `REAL ORBIT FEED · ${orbitalData.visibleObjectCount}/${orbitalData.totalObjectCount}`
      : orbitalData.status === 'loading'
        ? 'PROPAGATING ORBITS…'
        : orbitalData.status === 'error'
          ? 'ORBIT FEED UNAVAILABLE'
          : 'ORBIT FEED IDLE'

  return (
    <section className="mission-viewport">
      <div className="staging-canvas orbital-canvas">
        <RenderErrorBoundary
          variant="viewport"
          fallback={
            <div className="mission-render-fallback" role="status">
              <div>
                <span className="eyebrow">VISUALIZATION</span>
                <strong>3D viewport unavailable</strong>
                <p>The mission interface is still available while the orbital renderer recovers.</p>
              </div>
            </div>
          }
        >
          <OrbitalScene
            selectedThreat={selectedThreat}
            selectedObjectId={selectedObjectId}
            onObjectSelect={onObjectSelect}
            simulation={simulation}
            orbits={orbitalData.orbits}
          />
        </RenderErrorBoundary>

        <ClockStatus />

        <div className="orbit-feed-status" data-state={orbitalData.status}>
          <i />
          <span>{statusLabel}</span>
        </div>

        {selectedObject && (
          <div className="selected-overlay">
            <MousePointer2 size={15} />
            {selectedObject.name}
            <span>·</span>
            {selectedObject.id}
          </div>
        )}
      </div>
    </section>
  )
}
