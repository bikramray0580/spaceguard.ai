import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Clock3,
  Database,
  MapPinned,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  formatTca,
  formatTimeUntilTca,
} from '../services/conjunctionApi'
import { useMissionContext } from '../layouts/useMissionContext'
import '../styles/risk.css'

const RISK_ORDER = ['HIGH', 'MEDIUM', 'LOW']

const RISK_META = {
  HIGH: {
    label: 'High',
    short: 'Requires attention',
    tone: 'high',
    description: 'Backend classification indicates a high-priority conjunction.',
  },
  MEDIUM: {
    label: 'Medium',
    short: 'Monitor closely',
    tone: 'medium',
    description: 'Backend classification indicates a medium-priority conjunction.',
  },
  LOW: {
    label: 'Low',
    short: 'Nominal exposure',
    tone: 'low',
    description: 'Backend classification indicates a low-priority conjunction.',
  },
}

const formatObjectName = (name, fallback) => name || fallback

const threatSearchText = (threat) =>
  [
    threat.id,
    threat.objectA,
    threat.objectB,
    threat.objectAName,
    threat.objectBName,
    threat.riskLevel,
    threat.riskReason,
    threat.distance,
    threat.velocity,
    threat.tca,
  ]
    .join(' ')
    .toLowerCase()

function MiniThreatOrbit({ threat }) {
  return (
    <div
      className="risk-orbit-visual"
      data-risk-level={threat.riskLevel.toLowerCase()}
      aria-hidden="true"
    >
      <div className="risk-orbit-stars" />
      <div className="risk-orbit-ring risk-orbit-ring-a" />
      <div className="risk-orbit-ring risk-orbit-ring-b" />
      <div className="risk-orbit-earth">
        <span />
      </div>
      <span className="risk-orbit-object risk-orbit-object-a" />
      <span className="risk-orbit-object risk-orbit-object-b" />
      <div className="risk-orbit-link" />
      <div className="risk-orbit-caption">
        <MapPinned size={13} />
        <span>Closest-approach relationship</span>
      </div>
    </div>
  )
}

function ScreeningState({
  status,
  error,
  completed,
  attempted,
  candidateObjectCount,
  pairCount,
  successful,
  refreshThreats,
  disabled,
  objectsStatus,
  objectsError,
}) {
  const label =
    objectsStatus === 'loading'
      ? 'LOADING OBJECTS'
      : objectsStatus === 'error'
        ? 'BACKEND UNAVAILABLE'
        : objectsStatus === 'connected' && candidateObjectCount < 2
          ? 'NO OBJECTS'
          : status === 'loading'
            ? 'SCREENING'
            : status === 'partial'
              ? 'PARTIAL FEED'
              : status === 'connected'
                ? 'BACKEND CONNECTED'
                : status === 'error'
                  ? 'SCREENING ERROR'
                  : 'WAITING'

  const effectiveStatus =
    objectsStatus === 'loading'
      ? 'loading'
      : objectsStatus === 'error'
        ? 'error'
        : status

  return (
    <div className="risk-status-group">
      <div className={`risk-status ${effectiveStatus}`}>
        <i />
        <span>{label}</span>
      </div>

      <button
        type="button"
        className="risk-refresh-button"
        onClick={refreshThreats}
        disabled={disabled}
        title="Run the conjunction screen again"
      >
        <RefreshCw size={14} className={status === 'loading' ? 'spinning' : ''} />
        <span>{status === 'loading' ? `${completed}/${attempted}` : objectsStatus === 'error' ? 'Retry' : 'Rescreen'}</span>
      </button>

      <span className="risk-screening-note">
        {successful} results · {candidateObjectCount} objects · {pairCount} pairs
      </span>

      {(objectsError || (error && status !== 'connected')) && (
        <span className="risk-screening-error" title={(objectsError || error)?.message}>
          {(objectsError || error).message}
        </span>
      )}
    </div>
  )
}

export default function RiskPage() {
  const {
    selectedThreat,
    setSelectedThreat,
    threats,
    threatsStatus,
    threatsError,
    objectsStatus,
    objectsError,
    threatsCompleted,
    threatsAttempted,
    threatsSuccessful,
    threatCandidateObjectCount,
    threatPairCount,
    refreshThreats,
  } = useMissionContext()

  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedThreatId, setSelectedThreatId] = useState(null)
  const [detailTab, setDetailTab] = useState('overview')
  const searchRef = useRef(null)

  const riskCounts = useMemo(
    () =>
      RISK_ORDER.reduce((counts, level) => {
        counts[level] = threats.filter((threat) => threat.riskLevel === level).length
        return counts
      }, {}),
    [threats],
  )

  const highestRisk = threats[0] ?? null

  const filteredThreats = useMemo(() => {
    const query = search.trim().toLowerCase()

    return threats.filter((threat) => {
      const matchesFilter =
        filter === 'ALL' || threat.riskLevel === filter
      const matchesSearch = !query || threatSearchText(threat).includes(query)

      return matchesFilter && matchesSearch
    })
  }, [filter, search, threats])

  const activeSelectedThreat =
    threats.find((threat) => threat.id === selectedThreatId) ??
    (selectedThreatId ? null : selectedThreat)

  useEffect(() => {
    if (!selectedThreat) {
      setSelectedThreatId(null)
      return
    }

    setSelectedThreatId((current) =>
      current && threats.some((threat) => threat.id === current)
        ? current
        : selectedThreat.id,
    )
  }, [selectedThreat, threats])

  const selectThreat = (threat) => {
    setSelectedThreat(threat)
    setSelectedThreatId(threat.id)
    setDetailTab('overview')
  }

  const closeThreat = () => {
    setSelectedThreatId(null)
    setSelectedThreat(null)
    setDetailTab('overview')
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault()
        searchRef.current?.focus()
      }

      if (event.key === 'Escape') {
        closeThreat()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <section className="risk-page">
      <header className="risk-page-header">
        <div>
          <span className="eyebrow">RISK MONITOR</span>
          <h1>Collision risk</h1>
          <p>
            Real conjunction screening ranked by backend risk level, miss distance,
            and time to closest approach.
          </p>
        </div>

        <ScreeningState
          status={threatsStatus}
          error={threatsError}
          completed={threatsCompleted}
          attempted={threatsAttempted}
          candidateObjectCount={threatCandidateObjectCount}
          pairCount={threatPairCount}
          successful={threatsSuccessful}
          refreshThreats={refreshThreats}
          disabled={threatsStatus === 'loading' || objectsStatus === 'loading'}
          objectsStatus={objectsStatus}
          objectsError={objectsError}
        />
      </header>

      <section className="risk-overview" aria-label="Risk overview">
        <div className="risk-overview-lead">
          <span className="eyebrow">SCREENED EXPOSURE</span>
          <strong>{threats.length}</strong>
          <span>ranked conjunctions</span>
        </div>

        <div className="risk-summary" role="group" aria-label="Filter threats by severity">
          <button
            type="button"
            className={`risk-summary-button all ${filter === 'ALL' ? 'selected' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            <span>All</span>
            <b>{threats.length}</b>
          </button>

          {RISK_ORDER.map((level) => (
            <button
              key={level}
              type="button"
              className={`risk-summary-button ${level.toLowerCase()} ${
                filter === level ? 'selected' : ''
              }`}
              onClick={() =>
                setFilter((current) => (current === level ? 'ALL' : level))
              }
            >
              <span>{RISK_META[level].label}</span>
              <b>{riskCounts[level]}</b>
            </button>
          ))}
        </div>
      </section>

      {highestRisk && (
        <section
          className={`risk-priority ${highestRisk.riskLevel.toLowerCase()}`}
          aria-label="Highest priority conjunction"
        >
          <div className="risk-priority-copy">
            <span className="eyebrow">TOP THREAT</span>
            <strong>
              {formatObjectName(highestRisk.objectAName, highestRisk.objectA)} ×{' '}
              {formatObjectName(highestRisk.objectBName, highestRisk.objectB)}
            </strong>
            <span>
              {highestRisk.distance} miss distance ·{' '}
              {formatTimeUntilTca(highestRisk.tca)}
            </span>
          </div>

          <div className="risk-priority-side">
            <span className={`risk-severity-dot ${highestRisk.riskLevel.toLowerCase()}`} />
            <span className={`risk-priority-badge ${highestRisk.riskLevel.toLowerCase()}`}>
              {highestRisk.riskLevel}
            </span>
          </div>
        </section>
      )}

      {objectsStatus === 'loading' && (
        <section className="risk-loading-state">
          <RefreshCw size={17} className="spinning" />
          <div>
            <strong>Loading the orbital catalogue…</strong>
            <span>Fetching real tracked objects before conjunction screening begins.</span>
          </div>
        </section>
      )}

      {objectsStatus === 'error' && (
        <section className="risk-error-state">
          <ShieldAlert size={18} />
          <div>
            <strong>Unable to load the orbital catalogue.</strong>
            <span>{objectsError?.message || 'The SpaceGuard backend could not be reached.'}</span>
          </div>
          <button type="button" onClick={refreshThreats}>
            Retry backend
          </button>
        </section>
      )}

      {objectsStatus === 'connected' && threatsStatus === 'loading' && !threats.length && (
        <section className="risk-loading-state">
          <RefreshCw size={17} className="spinning" />
          <div>
            <strong>Screening real object pairs…</strong>
            <span>
              {threatsCompleted} of {threatsAttempted} conjunction requests completed.
            </span>
          </div>
        </section>
      )}

      {objectsStatus === 'connected' && threatsStatus === 'error' && !threats.length && (
        <section className="risk-error-state">
          <ShieldAlert size={18} />
          <div>
            <strong>Conjunction screening did not return a usable result.</strong>
            <span>
              {threatsError?.message ||
                'Check that the backend conjunction service and its ML dependencies are available.'}
            </span>
          </div>
          <button type="button" onClick={refreshThreats}>
            Try again
          </button>
        </section>
      )}

      <section className="risk-workspace">
        <div className="risk-threats">
          <div className="risk-section-header">
            <div>
              <span className="eyebrow">TOP THREATS</span>
              <h2>Priority conjunction queue</h2>
            </div>

            <span className="risk-count">
              {filteredThreats.length} of {threats.length}
            </span>
          </div>

          <div className="risk-controls">
            <label className="risk-search">
              <AlertTriangle size={15} />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search objects, risk, or explanation..."
                aria-label="Search threats, objects, or risk levels"
              />
              <kbd>/</kbd>
            </label>

            <button
              type="button"
              className="risk-clear-search"
              onClick={() => setSearch('')}
              disabled={!search}
            >
              Clear
            </button>
          </div>

          <div className="risk-threat-list">
            {filteredThreats.length ? (
              filteredThreats.map((threat) => {
                const selected = selectedThreatId === threat.id
                const meta = RISK_META[threat.riskLevel] || RISK_META.LOW

                return (
                  <button
                    key={threat.id}
                    type="button"
                    data-risk-threat-id={threat.id}
                    className={`risk-threat ${selected ? 'selected' : ''}`}
                    onClick={() => selectThreat(threat)}
                    aria-pressed={selected}
                    aria-label={`Inspect ${threat.objectAName || threat.objectA} and ${
                      threat.objectBName || threat.objectB
                    }, ${meta.label} risk`}
                  >
                    <span className={`risk-threat-accent ${threat.riskLevel.toLowerCase()}`} />

                    <span className="risk-threat-main">
                      <strong>
                        {formatObjectName(threat.objectAName, threat.objectA)}
                        <span> × </span>
                        {formatObjectName(threat.objectBName, threat.objectB)}
                      </strong>
                      <small>{formatTimeUntilTca(threat.tca)}</small>
                    </span>

                    <span className="risk-threat-context">
                      <small>Miss distance</small>
                      <strong>{threat.distance}</strong>
                    </span>

                    <span className="risk-threat-context time">
                      <small>Relative velocity</small>
                      <strong>{threat.velocity}</strong>
                    </span>

                    <span className={`risk-level ${threat.riskLevel.toLowerCase()}`}>
                      {meta.label}
                    </span>

                    <ArrowRight size={16} />
                  </button>
                )
              })
            ) : (
              <div className="risk-empty">
                <span className="risk-empty-icon">
                  <Database size={18} />
                </span>
                <strong>
                  {objectsStatus === 'loading'
                    ? 'Waiting for the orbital catalogue'
                    : objectsStatus === 'error'
                      ? 'Backend data is unavailable'
                      : threatsStatus === 'loading'
                        ? 'Screening real object pairs'
                        : 'No screened conjunctions match your filters'}
                </strong>
                <span>
                  {objectsStatus === 'loading'
                    ? 'The threat screen starts automatically after real tracked objects are loaded.'
                    : objectsStatus === 'error'
                      ? objectsError?.message || 'The SpaceGuard backend could not be reached.'
                      : threatsStatus === 'loading'
                        ? 'Results will appear here as the backend returns conjunction assessments.'
                        : 'The queue only contains results returned by the real backend screening API.'}
                </span>
                {objectsStatus === 'error' ? (
                  <button type="button" onClick={refreshThreats}>Retry backend</button>
                ) : threatsStatus !== 'loading' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setFilter('ALL')
                    }}
                  >
                    Reset filters
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {activeSelectedThreat && (
        <div className="risk-detail-layer">
          <button
            type="button"
            className="risk-detail-backdrop"
            aria-label="Close threat details"
            onClick={closeThreat}
          />

          <aside className="risk-detail" aria-label="Selected threat detail">
            <header className="risk-detail-header">
              <div>
                <span className="eyebrow">SELECTED THREAT</span>
                <p>Backend conjunction result</p>
              </div>

              <button
                type="button"
                className="risk-detail-close"
                onClick={closeThreat}
                aria-label="Close threat details"
              >
                <X size={18} />
              </button>
            </header>

            <div className="risk-detail-title">
              <div
                className="risk-detail-icon"
                data-risk-level={activeSelectedThreat.riskLevel.toLowerCase()}
              >
                <ShieldAlert size={20} />
              </div>

              <div>
                <span
                  className="risk-detail-level"
                  data-risk-level={activeSelectedThreat.riskLevel.toLowerCase()}
                >
                  {activeSelectedThreat.riskLevel}
                </span>
                <h2>
                  {formatObjectName(activeSelectedThreat.objectAName, activeSelectedThreat.objectA)}
                  <span> × </span>
                  {formatObjectName(activeSelectedThreat.objectBName, activeSelectedThreat.objectB)}
                </h2>
                <p>
                  {RISK_META[activeSelectedThreat.riskLevel]?.description ||
                    'Backend conjunction result.'}
                </p>
              </div>
            </div>

            <MiniThreatOrbit threat={activeSelectedThreat} />

            <nav className="risk-detail-tabs" aria-label="Threat detail">
              {['overview', 'risk', 'model', 'telemetry'].map((tab) => (
                <button
                  type="button"
                  key={tab}
                  className={detailTab === tab ? 'active' : ''}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab === 'model' ? 'AI / ML' : tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>

            {detailTab === 'overview' && (
              <div className="risk-detail-body">
                <div className="risk-detail-grid">
                  <div>
                    <span>Miss distance</span>
                    <strong>{activeSelectedThreat.distance}</strong>
                  </div>
                  <div>
                    <span>Time to TCA</span>
                    <strong>{formatTimeUntilTca(activeSelectedThreat.tca)}</strong>
                  </div>
                  <div>
                    <span>Relative velocity</span>
                    <strong>{activeSelectedThreat.velocity}</strong>
                  </div>
                  <div>
                    <span>Risk level</span>
                    <strong
                      className="risk-detail-risk-value"
                      data-risk-level={activeSelectedThreat.riskLevel.toLowerCase()}
                    >
                      {activeSelectedThreat.riskLevel}
                    </strong>
                  </div>
                </div>

                <div className="risk-explanation medium">
                  <span className="risk-explanation-icon">
                    <Clock3 size={15} />
                  </span>
                  <div>
                    <strong>Time of closest approach</strong>
                    <p>{formatTca(activeSelectedThreat.tca)}</p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'risk' && (
              <div className="risk-detail-body">
                <div className="risk-explanation high">
                  <span className="risk-explanation-icon">
                    <ShieldAlert size={15} />
                  </span>
                  <div>
                    <strong>Why is this threat risky?</strong>
                    <p>{activeSelectedThreat.riskReason}</p>
                  </div>
                </div>

                <div className="risk-factor-heading">
                  <span className="eyebrow">PRIMARY RISK FACTORS</span>
                  <span>Values returned by the backend screening result</span>
                </div>

                <div className="risk-factor-grid">
                  <div className="risk-factor-card">
                    <span>Miss distance</span>
                    <strong>{activeSelectedThreat.distance}</strong>
                    <small>Predicted separation at closest approach</small>
                  </div>
                  <div className="risk-factor-card">
                    <span>Relative velocity</span>
                    <strong>{activeSelectedThreat.velocity}</strong>
                    <small>Relative motion of the screened pair</small>
                  </div>
                  <div className="risk-factor-card">
                    <span>Time of closest approach</span>
                    <strong>{formatTimeUntilTca(activeSelectedThreat.tca)}</strong>
                    <small>{formatTca(activeSelectedThreat.tca)}</small>
                  </div>
                  <div className="risk-factor-card">
                    <span>Risk classification</span>
                    <strong data-risk-level={activeSelectedThreat.riskLevel.toLowerCase()}>
                      {activeSelectedThreat.riskLevel}
                    </strong>
                    <small>Collision engine result</small>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'model' && (
              <div className="risk-detail-body">
                {activeSelectedThreat.mlPrediction ? (
                  <>
                    <div className="risk-explanation low">
                      <span className="risk-explanation-icon">
                        <BrainCircuit size={15} />
                      </span>
                      <div>
                        <strong>AI / ML assessment</strong>
                        <p>
                          Model category: {activeSelectedThreat.mlPrediction.risk_category}
                        </p>
                      </div>
                    </div>

                    <div className="risk-detail-grid compact">
                      <div>
                        <span>Risk probability</span>
                        <strong>
                          {Math.round(
                            Number(activeSelectedThreat.mlPrediction.risk_probability || 0) * 100,
                          )}%
                        </strong>
                      </div>
                      <div>
                        <span>Risk score</span>
                        <strong>{activeSelectedThreat.mlPrediction.risk_score}</strong>
                      </div>
                      <div>
                        <span>Model category</span>
                        <strong>{activeSelectedThreat.mlPrediction.risk_category}</strong>
                      </div>
                      <div>
                        <span>Deterministic risk</span>
                        <strong>{activeSelectedThreat.riskLevel}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="risk-detail-message">
                    <span className="risk-detail-message-dot" />
                    <p>
                      No ML prediction was returned for this conjunction. The visible
                      risk level remains the backend collision-engine classification.
                    </p>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'telemetry' && (
              <div className="risk-detail-body">
                <div className="risk-detail-message">
                  <span className="risk-detail-message-dot" />
                  <p>
                    Live telemetry is not part of the current conjunction response.
                    This panel is reserved for future telemetry integration.
                  </p>
                </div>

                <div className="risk-detail-grid compact">
                  <div>
                    <span>Object A</span>
                    <strong>{activeSelectedThreat.objectAName || activeSelectedThreat.objectA}</strong>
                  </div>
                  <div>
                    <span>Object B</span>
                    <strong>{activeSelectedThreat.objectBName || activeSelectedThreat.objectB}</strong>
                  </div>
                  <div>
                    <span>TCA</span>
                    <strong>{formatTca(activeSelectedThreat.tca)}</strong>
                  </div>
                  <div>
                    <span>Source</span>
                    <strong>Backend</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="risk-detail-actions">
              <Link
                to={`/track?object=${encodeURIComponent(activeSelectedThreat.objectA)}`}
                className="risk-dashboard-button secondary"
              >
                <MapPinned size={15} />
                Track A
                <ArrowRight size={15} />
              </Link>

              <Link
                to={`/track?object=${encodeURIComponent(activeSelectedThreat.objectB)}`}
                className="risk-dashboard-button secondary"
              >
                <MapPinned size={15} />
                Track B
                <ArrowRight size={15} />
              </Link>

              <Link
                to={`/simulation?threat=${encodeURIComponent(activeSelectedThreat.id)}`}
                className="risk-dashboard-button primary"
              >
                <Clock3 size={15} />
                Simulate this threat
                <ArrowRight size={15} />
              </Link>

              <Link to="/" className="risk-dashboard-button secondary">
                <MapPinned size={15} />
                View on dashboard
                <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
