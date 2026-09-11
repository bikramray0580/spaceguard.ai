import {
  Activity,
  ArrowRight,
  Clock3,
  Crosshair,
  Radar,
  RefreshCw,
  Satellite,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import {
  calculateAltitudeKm,
  calculateSpeedKmS,
} from '../services/orbitApi'
import {
  formatTimeUntilTca,
} from '../services/conjunctionApi'

const metric = (icon, label, value) => (
  <div className="context-metric">
    {icon}
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)

function formatNumber(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return 'Unavailable'
  return value.toFixed(digits)
}

export default function ContextPanel({
  panel,
  selectedThreat,
  selectedObject,
  selectedOrbit,
  onSelectThreat,
  simulation,
  onRunSimulation,
  onClose,
  threats = [],
  threatsStatus = 'idle',
  threatsCompleted = 0,
  threatsAttempted = 0,
  refreshThreats,
}) {
  if (!panel) return null

  const title = {
    track: 'Tracked object',
    risk: 'Collision risk',
    simulate: 'Simulation',
    analytics: 'Orbital analytics',
    intel: 'Mission intelligence',
  }[panel]

  const initialState = selectedOrbit?.states?.[0] ?? null
  const altitudeKm = calculateAltitudeKm(initialState)
  const speedKmS = calculateSpeedKmS(initialState)

  return (
    <aside className="context-panel" aria-label={title}>
      <header>
        <div>
          <span className="context-icon">
            {panel === 'track' ? (
              <Satellite size={24} />
            ) : panel === 'risk' ? (
              <ShieldAlert size={24} />
            ) : panel === 'simulate' ? (
              <Crosshair size={24} />
            ) : panel === 'analytics' ? (
              <Activity size={24} />
            ) : (
              <Radar size={24} />
            )}
          </span>

          <div>
            <h2>
              {panel === 'track'
                ? selectedObject?.name ?? 'Select an object'
                : title}
            </h2>
            <p>
              {panel === 'track'
                ? selectedObject
                  ? `${selectedObject.id} · Backend object`
                  : 'Select a tracked object from the globe'
                : title}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="panel-close"
          onClick={onClose}
          aria-label="Close panel"
        >
          ×
        </button>
      </header>

      {panel === 'track' && (
        <>
          <div className="panel-tabs">
            <button className="active">Overview</button>
            <button>Orbit</button>
            <button>Telemetry</button>
          </div>

          {selectedObject ? (
            <>
              <div className="context-grid">
                {metric(
                  <Satellite size={17} />,
                  'Altitude',
                  altitudeKm == null
                    ? 'Unavailable'
                    : `${formatNumber(altitudeKm, 0)} km`,
                )}
                {metric(
                  <Zap size={17} />,
                  'Velocity',
                  speedKmS == null
                    ? 'Unavailable'
                    : `${formatNumber(speedKmS, 2)} km/s`,
                )}
                {metric(
                  <Crosshair size={17} />,
                  'Frame',
                  selectedOrbit?.coordinateFrame ?? 'Unavailable',
                )}
                {metric(
                  <Clock3 size={17} />,
                  'Propagation',
                  selectedOrbit?.states?.length
                    ? `${selectedOrbit.states.length} states`
                    : 'Unavailable',
                )}
              </div>

              <div className="context-source-note">
                Real backend propagation · TEME coordinates · 120 min window
              </div>

              <button className="context-cta" type="button">
                View details <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <div className="context-empty-state">
              Click a satellite marker or orbital path on the mission globe to inspect it here.
            </div>
          )}
        </>
      )}

      {panel === 'risk' && (
        <div className="risk-list">
          {!threats.length && threatsStatus === 'loading' && (
            <div className="context-empty-state">
              <RefreshCw size={16} className="spinning" />
              Screening {threatsCompleted}/{threatsAttempted} object pairs…
            </div>
          )}

          {!threats.length && threatsStatus === 'error' && (
            <div className="context-empty-state">
              Unable to load backend conjunction results.
              <button
                type="button"
                className="context-cta"
                onClick={refreshThreats}
              >
                Retry screening <ArrowRight size={17} />
              </button>
            </div>
          )}

          {threats.map((threat) => (
            <button
              key={threat.id}
              type="button"
              onClick={() => onSelectThreat(threat)}
              className={selectedThreat?.id === threat.id ? 'selected' : ''}
            >
              <i className={threat.riskLevel.toLowerCase()} />
              <span>
                <b>
                  {threat.objectAName || threat.objectA} × {threat.objectBName || threat.objectB}
                </b>
                <small>
                  {formatTimeUntilTca(threat.tca)} · {threat.distance}
                </small>
              </span>
              <em>{threat.riskLevel}</em>
            </button>
          ))}
        </div>
      )}

      {panel === 'simulate' && (
        <div className="simulation-context">
          {selectedThreat ? (
            <>
              <p>Run a closest-approach assessment for the selected real conjunction.</p>
              <strong>
                {selectedThreat.objectAName || selectedThreat.objectA} ×{' '}
                {selectedThreat.objectBName || selectedThreat.objectB}
              </strong>
              <small className="result-line">
                {selectedThreat.distance} · {selectedThreat.velocity} ·{' '}
                {selectedThreat.riskLevel}
              </small>
              {simulation.active && (
                <div className="simulation-progress">
                  <i style={{ width: `${simulation.progress}%` }} />
                  <span>{simulation.progress}% processing</span>
                </div>
              )}
              <button
                type="button"
                className="context-cta"
                disabled={simulation.active}
                onClick={onRunSimulation}
              >
                {simulation.active ? 'Simulation running' : 'Run simulation'}{' '}
                <ArrowRight size={17} />
              </button>
              {simulation.result && (
                <small className="result-line">
                  Result: {simulation.result.missDistanceKm} km miss distance ·{' '}
                  {simulation.result.riskLevel}
                </small>
              )}
            </>
          ) : (
            <div className="context-empty-state">
              Select a backend-screened conjunction first.
            </div>
          )}
        </div>
      )}

      {panel === 'analytics' && (
        <div className="analytics-context">
          <div>
            {metric(
              <Activity size={17} />,
              'Objects available',
              selectedObject ? '1 selected' : 'Live catalogue',
            )}
            {metric(
              <ShieldAlert size={17} />,
              'Conjunctions',
              threats.length,
            )}
          </div>
          <div>
            {metric(
              <Crosshair size={17} />,
              'High risk',
              threats.filter((threat) => threat.riskLevel === 'HIGH').length,
            )}
            {metric(
              <Radar size={17} />,
              'Feed',
              threatsStatus === 'connected' ? 'Backend' : threatsStatus,
            )}
          </div>
        </div>
      )}

      {panel === 'intel' && (
        <div className="intel-context">
          {selectedThreat ? (
            <>
              <span className="status-line">
                <i /> Backend risk posture: {selectedThreat.riskLevel}
              </span>
              <h3>Priority review</h3>
              <p>
                {selectedThreat.objectAName || selectedThreat.objectA} and{' '}
                {selectedThreat.objectBName || selectedThreat.objectB} are the
                current highest-ranked screened pair. Review the backend risk reason
                and TCA before investigating further.
              </p>
              <button className="context-cta" type="button">
                Open intelligence <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <div className="context-empty-state">
              No screened conjunction is currently selected.
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
