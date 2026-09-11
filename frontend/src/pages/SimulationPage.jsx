import {
  Check,
  ChevronDown,
  Clock3,
  Crosshair,
  Pause,
  Play,
  RotateCcw,
  Satellite,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { runMockSimulation } from '../services/simulationService'
import { useMissionContext } from '../layouts/useMissionContext'
import { useOrbitalData } from '../hooks/useOrbitalData'
import MissionViewport from '../components/MissionViewport'
import '../styles/simulation.css'

const SCENARIOS = [
  {
    id: 'conjunction',
    label: 'Orbital conjunction',
    description: 'Screen a selected object pair for closest approach.',
  },
]

const SPEEDS = [0.5, 1, 2]

export default function SimulationPage() {
  const [searchParams] = useSearchParams()
  const {
    selectedThreat,
    setSelectedThreat,
    simulation,
    setSimulation,
    threats = [],
    threatsStatus,
    threatsCompleted,
    threatsAttempted,
    objects = [],
  } = useMissionContext()

  const orbitalData = useOrbitalData(objects || [])

  const [scenario, setScenario] = useState('conjunction')
  const [duration, setDuration] = useState('1 h')
  const [step, setStep] = useState('1 min')
  const [speed, setSpeed] = useState(1)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const runIdRef = useRef(0)

  const selectedPair = useMemo(
    () =>
      threats.find(
        (threat) => threat.id === selectedThreat?.id,
      ) ?? threats[0] ?? null,
    [selectedThreat, threats],
  )

  useEffect(() => {
    const requestedThreatId = searchParams.get('threat')
    if (!requestedThreatId || !threats.length) return

    const requestedThreat = threats.find((threat) => threat.id === requestedThreatId)
    if (requestedThreat && requestedThreat.id !== selectedThreat?.id) {
      setSelectedThreat(requestedThreat)
    }
  }, [searchParams, selectedThreat, setSelectedThreat, threats])

  const setPair = (id) => {
    const next = threats.find((threat) => threat.id === id)
    if (next) {
      setSelectedThreat(next)
      setSimulation((current) => ({
        ...current,
        result: null,
        progress: 0,
      }))
    }
  }

  const runSimulation = async () => {
    if (simulation?.active || !selectedPair) return

    const currentRun = ++runIdRef.current

    setSimulation({
      active: true,
      progress: 0,
      result: null,
    })

    try {
      const result = await runMockSimulation(
        selectedPair,
        (progress) => {
          if (runIdRef.current !== currentRun) return

          setSimulation((current) => ({
            ...current,
            progress,
          }))
        },
      )

      if (runIdRef.current !== currentRun) return

      setSimulation({
        active: false,
        progress: 100,
        result,
      })
    } catch (error) {
      console.error('Simulation failed:', error)

      if (runIdRef.current !== currentRun) return

      setSimulation({
        active: false,
        progress: 0,
        result: null,
      })
    }
  }

  const resetSimulation = () => {
    runIdRef.current += 1

    setSimulation({
      active: false,
      progress: 0,
      result: null,
    })
  }

  const cancelVisualRun = () => {
    runIdRef.current += 1

    setSimulation((current) => ({
      ...current,
      active: false,
      result: null,
      progress: current.progress,
    }))
  }

  useEffect(() => {
    return () => {
      runIdRef.current += 1
    }
  }, [])

  const isRunning = Boolean(simulation?.active)
  const isComplete = Boolean(simulation?.result) && !isRunning

  return (
    <section className="simulation-page">
      <MissionViewport
        selectedThreat={selectedPair}
        simulation={simulation}
        onObjectSelect={() => {}}
        orbitalData={orbitalData}
      />

      <div className="simulation-vignette" aria-hidden="true" />

      <header className="simulation-heading">
        <span className="eyebrow">MISSION SIMULATION</span>
        <h1>Simulation mode</h1>
        <p>
          Configure a focused orbital scenario, run it, and inspect the
          resulting closest-approach assessment.
        </p>
      </header>

      <aside className="simulation-config" aria-label="Simulation configuration">
        <div className="simulation-panel-heading">
          <div>
            <span className="eyebrow">CONFIGURATION</span>
            <strong>Scenario setup</strong>
          </div>

          <span className="simulation-ready-dot">
            <i />
            {isRunning ? 'RUNNING' : isComplete ? 'COMPLETE' : 'READY'}
          </span>
        </div>

        <div className="simulation-section">
          <span className="simulation-label">SCENARIO</span>

          <div className="simulation-scenario">
            {SCENARIOS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={scenario === item.id ? 'active' : ''}
                onClick={() => setScenario(item.id)}
              >
                <span className="simulation-scenario-icon">
                  <Crosshair size={15} />
                </span>

                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>

                {scenario === item.id && <Check size={15} />}
              </button>
            ))}
          </div>
        </div>

        <div className="simulation-section">
          <div className="simulation-label-row">
            <span className="simulation-label">OBJECT PAIR</span>
            <span className="simulation-muted">2 objects</span>
          </div>

          <label className="simulation-select">
            <Satellite size={15} />
            <select
              value={selectedPair?.id ?? ''}
              onChange={(event) => setPair(event.target.value)}
              disabled={isRunning || !threats.length}
            >
              {threats.map((threat) => (
                <option key={threat.id} value={threat.id}>
                  {threat.objectA} × {threat.objectB}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </label>

          <div className="simulation-object-preview">
            {selectedPair ? (
              <>
                <span>{selectedPair.objectAName || selectedPair.objectA}</span>
                <i>×</i>
                <span>{selectedPair.objectBName || selectedPair.objectB}</span>
              </>
            ) : (
              <span>No screened conjunction selected</span>
            )}
          </div>

          {!selectedPair && (
            <div className="simulation-data-note" role="status">
              {threatsStatus === 'loading'
                ? 'Waiting for the real conjunction screen to finish.'
                : threatsStatus === 'error'
                  ? 'The conjunction service did not return a usable result.'
                  : 'No screened conjunction is available yet.'}
            </div>
          )}
        </div>

        <div className="simulation-section">
          <span className="simulation-label">ESSENTIAL PARAMETERS</span>

          <div className="simulation-parameters">
            <label>
              <span>Duration</span>
              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                disabled={isRunning}
              >
                <option>30 min</option>
                <option>1 h</option>
                <option>2 h</option>
                <option>6 h</option>
              </select>
            </label>

            <label>
              <span>Step</span>
              <select
                value={step}
                onChange={(event) => setStep(event.target.value)}
                disabled={isRunning}
              >
                <option>30 sec</option>
                <option>1 min</option>
                <option>5 min</option>
              </select>
            </label>
          </div>
        </div>

        <div className="simulation-advanced">
          <button
            type="button"
            className="simulation-advanced-toggle"
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-expanded={advancedOpen}
          >
            <span>
              <SlidersHorizontal size={14} />
              Advanced parameters
            </span>
            <ChevronDown
              size={14}
              className={advancedOpen ? 'rotated' : ''}
            />
          </button>

          {advancedOpen && (
            <div className="simulation-advanced-body">
              <div>
                <span>Visualization</span>
                <strong>Orbital 3D</strong>
              </div>
              <div>
                <span>Risk model</span>
                <strong>Prototype screening</strong>
              </div>
              <div>
                <span>Threshold source</span>
                <strong>Existing risk engine</strong>
              </div>
            </div>
          )}
        </div>

        <div className="simulation-actions">
          <button
            type="button"
            className="simulation-primary"
            onClick={runSimulation}
            disabled={isRunning || !selectedPair}
          >
            <Play size={15} />
            {isRunning ? 'Simulation running' : isComplete ? 'Run again' : 'Run simulation'}
          </button>

          <button
            type="button"
            className="simulation-secondary"
            onClick={resetSimulation}
            disabled={isRunning && simulation.progress === 0}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {isRunning && (
          <button
            type="button"
            className="simulation-stop-link"
            onClick={cancelVisualRun}
          >
            <Pause size={13} />
            Stop visual run
          </button>
        )}
      </aside>

      <aside className="simulation-status" aria-live="polite">
        <div className="simulation-status-top">
          <span className="eyebrow">SIMULATION STATUS</span>
          <span className={`simulation-state ${isRunning ? 'running' : isComplete ? 'complete' : 'ready'}`}>
            {isRunning ? 'RUNNING' : isComplete ? 'COMPLETE' : 'READY'}
          </span>
        </div>

        <div className="simulation-status-title">
          {selectedPair ? (
            <>
              <strong>{selectedPair.objectAName || selectedPair.objectA}</strong>
              <span>×</span>
              <strong>{selectedPair.objectBName || selectedPair.objectB}</strong>
            </>
          ) : (
            <strong>Waiting for a screened conjunction</strong>
          )}
        </div>

        <div className="simulation-status-meta">
          <span>
            <Clock3 size={13} />
            {duration}
          </span>
          <span>
            <TimerReset size={13} />
            {step}
          </span>
        </div>

        {isRunning && (
          <div className="simulation-progress-block">
            <div className="simulation-progress-row">
              <span>Progress</span>
              <strong>{simulation.progress}%</strong>
            </div>
            <div className="simulation-progress-track">
              <i style={{ width: `${simulation.progress}%` }} />
            </div>
          </div>
        )}

        {!isRunning && isComplete && selectedPair && (
          <div className="simulation-result-brief" data-risk-level={selectedPair.level.toLowerCase()}>
            <span className="simulation-result-kicker">
              {simulation.result?.riskLevel ?? selectedPair.level} RESULT
            </span>

            <strong>
              {simulation.result?.missDistanceKm ?? selectedPair.distance} km
            </strong>

            <span>
              Closest approach · {simulation.result?.timeToTcaMinutes ?? '—'} min to TCA
            </span>
          </div>
        )}
      </aside>

      <div className="simulation-bottom-bar">
        <div className="simulation-bottom-copy">
          <Sparkles size={14} />
          <div>
            <span className="eyebrow">ORBITAL CONJUNCTION</span>
            <strong>
              {isRunning
                ? 'Tracking the simulated closest approach'
                : isComplete
                  ? 'Simulation complete'
                  : 'Ready to run the selected scenario'}
            </strong>
          </div>
        </div>

        <div className="simulation-speed" aria-label="Simulation speed">
          <span>Speed</span>
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              className={speed === value ? 'active' : ''}
              onClick={() => setSpeed(value)}
              disabled={isRunning}
            >
              {value}×
            </button>
          ))}
        </div>

        <div className="simulation-disclaimer">
          Prototype maneuver engine · real backend threat input
        </div>
      </div>

      {isComplete && selectedPair && (
        <section className="simulation-complete-card" data-risk-level={selectedPair.level.toLowerCase()}>
          <div>
            <span className="eyebrow">SIMULATION COMPLETE</span>
            <h2>
              {simulation.result?.objectA} <span>×</span>{' '}
              {simulation.result?.objectB}
            </h2>
            <p>
              {selectedPair.level === 'CRITICAL'
                ? 'Potentially significant conjunction requiring review.'
                : selectedPair.level === 'HIGH'
                  ? 'Elevated conjunction requiring closer monitoring.'
                  : 'Simulation completed for the selected object pair.'}
            </p>
          </div>

          <div className="simulation-complete-metrics">
            <div>
              <span>Miss distance</span>
              <strong>{simulation.result?.missDistanceKm} km</strong>
            </div>
            <div>
              <span>Time to TCA</span>
              <strong>{simulation.result?.timeToTcaMinutes} min</strong>
            </div>
            <div>
              <span>Relative velocity</span>
              <strong>{simulation.result?.relativeVelocityKmS} km/s</strong>
            </div>
          </div>

          <button
            type="button"
            className="simulation-complete-close"
            onClick={resetSimulation}
            aria-label="Dismiss simulation result"
          >
            <X size={16} />
          </button>
        </section>
      )}
    </section>
  )
}
