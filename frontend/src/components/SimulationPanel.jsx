import { Play } from 'lucide-react'

export default function SimulationPanel({
  selectedThreat,
  simulation,
  onRunSimulation,
}) {
  return (
    <>
      <div className="simulation-panel">
        <div>
          <span className="eyebrow">
            COLLISION SIMULATION
          </span>

          <strong>
            {selectedThreat.objectA} × {selectedThreat.objectB}
          </strong>

          <small>
            Predict the closest approach using prototype orbital data.
          </small>
        </div>

        <button
          type="button"
          onClick={onRunSimulation}
          disabled={simulation?.active}
          className="simulation-button"
        >
          <Play size={15} />

          {simulation?.active
            ? 'SIMULATION RUNNING...'
            : 'RUN SIMULATION'}
        </button>
      </div>

      {simulation?.result && (
        <div className="simulation-result">
          <div>
            <span className="eyebrow">
              SIMULATION RESULT
            </span>

            <h3>
              {simulation.result.objectA} ×{' '}
              {simulation.result.objectB}
            </h3>
          </div>

          <div className="simulation-metrics">
            <div>
              <span>TIME TO TCA</span>
              <strong>
                {simulation.result.timeToTcaMinutes} min
              </strong>
            </div>

            <div>
              <span>MISS DISTANCE</span>
              <strong>
                {simulation.result.missDistanceKm} km
              </strong>
            </div>

            <div>
              <span>RELATIVE VELOCITY</span>
              <strong>
                {simulation.result.relativeVelocityKmS} km/s
              </strong>
            </div>

            <div>
              <span>RISK</span>
              <strong>
                {simulation.result.riskLevel}
              </strong>
            </div>
          </div>

          <small className="simulation-disclaimer">
            Prototype simulation using mock orbital data.
            Not scientifically accurate.
          </small>
        </div>
      )}
    </>
  )
}