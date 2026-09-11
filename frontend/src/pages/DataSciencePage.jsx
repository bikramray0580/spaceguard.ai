import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Gauge,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { mockMissionMeta, mockThreats } from '../data/mockMissionData'
import '../styles/datascience.css'

const OBJECT_COUNT = mockMissionMeta.monitoredObjects

const RISK_ORDER = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'NORMAL']

const RISK_META = {
  CRITICAL: {
    label: 'Critical',
    tone: 'critical',
  },
  HIGH: {
    label: 'High',
    tone: 'high',
  },
  MODERATE: {
    label: 'Moderate',
    tone: 'moderate',
  },
  LOW: {
    label: 'Low',
    tone: 'low',
  },
  NORMAL: {
    label: 'Normal',
    tone: 'normal',
  },
}

const ANALYSIS_TABS = [
  { id: 'overview', label: 'Overview', icon: Radar },
  { id: 'risk', label: 'Risk', icon: ShieldAlert },
  { id: 'conjunctions', label: 'Conjunctions', icon: Target },
  { id: 'velocity', label: 'Velocity', icon: Zap },
  { id: 'telemetry', label: 'Telemetry', icon: Activity },
]

const threatCounts = RISK_ORDER.reduce((accumulator, level) => {
  accumulator[level] =
    level === 'NORMAL'
      ? 0
      : mockThreats.filter((item) => item.level === level).length
  return accumulator
}, {})

threatCounts.NORMAL = Math.max(
  0,
  OBJECT_COUNT -
    threatCounts.CRITICAL -
    threatCounts.HIGH -
    threatCounts.MODERATE -
    threatCounts.LOW,
)

const attentionCount = threatCounts.CRITICAL + threatCounts.HIGH
const nominalShare = ((threatCounts.NORMAL / OBJECT_COUNT) * 100).toFixed(1)

const sortedThreats = [...mockThreats].sort(
  (a, b) =>
    Number.parseFloat(a.distance) -
    Number.parseFloat(b.distance),
)

const parseNumber = (value) =>
  Number.parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0

const highestRiskThreat = sortedThreats.find(
  (threat) => threat.level === 'CRITICAL',
) ?? sortedThreats[0]

function formatObject(value) {
  return value
    .toLowerCase()
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase())
}

function severityLabel(level) {
  return RISK_META[level]?.label ?? level
}

export default function DataSciencePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedThreatId, setSelectedThreatId] = useState(null)
  const [showInsights, setShowInsights] = useState(false)
  const searchRef = useRef(null)

  const selectedThreat = useMemo(
    () =>
      mockThreats.find((threat) => threat.id === selectedThreatId) ?? null,
    [selectedThreatId],
  )

  const handleSelectThreat = (threat) => {
    setSelectedThreatId(threat.id)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault()
        searchRef.current?.focus()
      }

      if (event.key === 'Escape') {
        setSelectedThreatId(null)
        setShowInsights(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <section className="data-science-page">
      <header className="ds-page-header">
        <div className="ds-header-copy">
          <span className="ds-eyebrow">MISSION INTELLIGENCE</span>
          <h1>Data analysis</h1>
          <p>
            Understand the monitored orbital environment without digging through
            every metric at once.
          </p>
        </div>

        <div className="ds-live-status">
          <span className="ds-live-dot" />
          <span>LIVE DATASET</span>
          <small>{mockMissionMeta.freshness} refresh</small>
        </div>
      </header>

      <section className="ds-snapshot" aria-label="Dataset snapshot">
        <div className="ds-snapshot-label">
          <span className="ds-eyebrow">DATASET SNAPSHOT</span>
          <strong>Current monitoring posture</strong>
        </div>

        <div className="ds-snapshot-metrics">
          <SnapshotMetric
            label="Objects monitored"
            value={OBJECT_COUNT}
            detail="current dataset"
          />
          <span className="ds-snapshot-divider" />
          <SnapshotMetric
            label="Active conjunctions"
            value={mockThreats.length}
            detail="screened events"
          />
          <span className="ds-snapshot-divider" />
          <SnapshotMetric
            label="Need attention"
            value={attentionCount}
            detail="high or critical"
            tone="attention"
          />
        </div>
      </section>

      <section className="ds-insight">
        <div className="ds-insight-icon">
          <Sparkles size={17} />
        </div>

        <div className="ds-insight-copy">
          <span className="ds-eyebrow">KEY INSIGHT</span>
          <h2>
            Most monitored objects remain nominal, while attention is concentrated
            in a small number of active conjunctions.
          </h2>
          <p>
            {nominalShare}% of the monitored population is currently outside
            the active high/critical threat set.
          </p>
        </div>

        <button
          type="button"
          className="ds-insight-action"
          onClick={() => setShowInsights((current) => !current)}
          aria-expanded={showInsights}
        >
          {showInsights ? 'Hide insights' : 'More insights'}
          <ArrowRight size={14} />
        </button>
      </section>

      {showInsights && (
        <section className="ds-extra-insights" aria-label="Additional insights">
          <InsightLine
            icon={<Target size={15} />}
            title="Closest encounter"
            value={`${highestRiskThreat.distance}`}
            detail={`${formatObject(highestRiskThreat.objectA)} × ${formatObject(highestRiskThreat.objectB)}`}
          />
          <InsightLine
            icon={<Zap size={15} />}
            title="Fastest encounter"
            value={highestRiskThreat.velocity}
            detail="relative velocity in current conjunction set"
          />
          <InsightLine
            icon={<ShieldAlert size={15} />}
            title="Highest severity"
            value={highestRiskThreat.level}
            detail={RISK_META[highestRiskThreat.level].label + ' monitoring priority'}
            tone={RISK_META[highestRiskThreat.level].tone}
          />
        </section>
      )}

      <nav className="ds-analysis-tabs" aria-label="Analysis views">
        {ANALYSIS_TABS.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => {
              setActiveTab(id)
              setSelectedThreatId(null)
            }}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <main className="ds-analysis-stage">
        {activeTab === 'overview' && (
          <OverviewView
            searchRef={searchRef}
            onSelectThreat={handleSelectThreat}
          />
        )}

        {activeTab === 'risk' && (
          <RiskView
            onSelectThreat={handleSelectThreat}
          />
        )}

        {activeTab === 'conjunctions' && (
          <ConjunctionView
            onSelectThreat={handleSelectThreat}
          />
        )}

        {activeTab === 'velocity' && (
          <VelocityView
            onSelectThreat={handleSelectThreat}
          />
        )}

        {activeTab === 'telemetry' && <TelemetryView />}
      </main>

      {selectedThreat && (
        <ThreatInsightDrawer
          threat={selectedThreat}
          onClose={() => setSelectedThreatId(null)}
        />
      )}
    </section>
  )
}

function SnapshotMetric({ label, value, detail, tone = '' }) {
  return (
    <div className={`ds-snapshot-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

function InsightLine({ icon, title, value, detail, tone = '' }) {
  return (
    <article className={`ds-insight-line ${tone}`}>
      <span className="ds-insight-line-icon">{icon}</span>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <small>{detail}</small>
    </article>
  )
}

function PanelHeading({ eyebrow, title, description, action }) {
  return (
    <header className="ds-panel-heading">
      <div>
        <span className="ds-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  )
}

function OverviewView({ onSelectThreat }) {
  return (
    <section className="ds-view-shell">
      <div className="ds-primary-grid">
        <article className="ds-analysis-panel ds-primary-panel">
          <PanelHeading
            eyebrow="PRIMARY ANALYSIS"
            title="Monitoring posture"
            description="Most monitored objects remain outside the active threat set."
          />
          <RiskDistribution />
        </article>

        <article className="ds-analysis-panel ds-focus-panel">
          <PanelHeading
            eyebrow="KEY PATTERN"
            title="Where attention is focused"
            description="A lightweight view of the current conjunction pressure."
          />
          <ConcentrationChart />
        </article>
      </div>

      <article className="ds-analysis-panel ds-conjunction-preview">
        <PanelHeading
          eyebrow="NEXT TO EXPLORE"
          title="Closest active approaches"
          description="Select an event to inspect its supporting data."
          action={
            <span className="ds-panel-count">
              {mockThreats.length} events
            </span>
          }
        />
        <ThreatPreviewList onSelectThreat={onSelectThreat} />
      </article>
    </section>
  )
}

function RiskView({ onSelectThreat }) {
  return (
    <section className="ds-view-shell">
      <article className="ds-analysis-panel ds-wide-panel">
        <PanelHeading
          eyebrow="RISK ANALYSIS"
          title="Risk distribution"
          description="See how the monitored population is distributed by current screening status."
        />
        <RiskDistribution detailed />
      </article>

      <div className="ds-secondary-grid">
        <article className="ds-analysis-panel">
          <PanelHeading
            eyebrow="ATTENTION"
            title="Priority objects"
            description="The smallest margin events in the current dataset."
          />
          <ThreatPreviewList onSelectThreat={onSelectThreat} compact />
        </article>

        <article className="ds-analysis-panel">
          <PanelHeading
            eyebrow="INTERPRETATION"
            title="Why the distribution matters"
            description="Keep the analytical result human-readable."
          />
          <div className="ds-explanation">
            <div className="ds-explanation-stat">
              <strong>{nominalShare}%</strong>
              <span>nominal population</span>
            </div>
            <p>
              The active high and critical set is a small subset of the monitored
              population. That makes targeted review more useful than treating
              every object as equally urgent.
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}

function ConjunctionView({ onSelectThreat }) {
  return (
    <section className="ds-view-shell">
      <article className="ds-analysis-panel ds-wide-panel">
        <PanelHeading
          eyebrow="CONJUNCTIONS"
          title="Closest approaches"
          description="Sort by predicted miss distance so the most important encounters rise to the top."
        />
        <div className="ds-conjunction-list">
          {sortedThreats.map((threat, index) => (
            <button
              type="button"
              key={threat.id}
              className="ds-conjunction-row"
              onClick={() => onSelectThreat(threat)}
            >
              <span className="ds-rank">{String(index + 1).padStart(2, '0')}</span>
              <span className={`ds-row-severity ${threat.level.toLowerCase()}`} />
              <span className="ds-conjunction-main">
                <strong>
                  {formatObject(threat.objectA)}
                  <span> × </span>
                  {formatObject(threat.objectB)}
                </strong>
                <small>{threat.window}</small>
              </span>
              <span className="ds-conjunction-stat">
                <small>Miss distance</small>
                <strong>{threat.distance}</strong>
              </span>
              <span className={`ds-small-status ${threat.level.toLowerCase()}`}>
                {severityLabel(threat.level)}
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </article>

      <article className="ds-analysis-panel ds-wide-panel ds-guidance-panel">
        <span className="ds-eyebrow">ANALYST GUIDANCE</span>
        <h2>Start with the smallest miss distance.</h2>
        <p>
          Use the closest-approach list as your first pass, then open an event
          to see its risk and timing context. The page avoids showing every
          technical parameter until you ask for it.
        </p>
      </article>
    </section>
  )
}

function VelocityView({ onSelectThreat }) {
  const maxVelocity = Math.max(...mockThreats.map((threat) => parseNumber(threat.velocity)), 1)
  const maxDistance = Math.max(...mockThreats.map((threat) => parseNumber(threat.distance)), 1)

  return (
    <section className="ds-view-shell">
      <article className="ds-analysis-panel ds-wide-panel">
        <PanelHeading
          eyebrow="VELOCITY ANALYSIS"
          title="Velocity vs miss distance"
          description="Higher velocity combined with a shorter miss distance can increase monitoring pressure."
        />

        <div className="ds-scatter-chart" role="img" aria-label="Velocity versus miss distance">
          <div className="ds-scatter-grid" />
          <span className="ds-chart-label ds-chart-y">RELATIVE VELOCITY</span>
          <span className="ds-chart-label ds-chart-x">MISS DISTANCE</span>

          {mockThreats.map((threat) => {
            const x = 14 + (parseNumber(threat.distance) / maxDistance) * 70
            const y = 16 + (parseNumber(threat.velocity) / maxVelocity) * 66

            return (
              <button
                type="button"
                key={threat.id}
                className={`ds-scatter-point ${threat.level.toLowerCase()}`}
                style={{ left: `${x}%`, bottom: `${y}%` }}
                onClick={() => onSelectThreat(threat)}
                aria-label={`${formatObject(threat.objectA)} by ${formatObject(threat.objectB)}, ${threat.distance} miss distance, ${threat.velocity} relative velocity`}
              />
            )
          })}

          <div className="ds-chart-legend">
            {['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((level) => (
              <span key={level}>
                <i className={level.toLowerCase()} />
                {severityLabel(level)}
              </span>
            ))}
          </div>
        </div>
      </article>
    </section>
  )
}

function TelemetryView() {
  return (
    <section className="ds-view-shell">
      <article className="ds-analysis-panel ds-telemetry-state">
        <div className="ds-telemetry-icon">
          <Gauge size={22} />
        </div>
        <span className="ds-eyebrow">TELEMETRY</span>
        <h2>Telemetry view is ready for live data.</h2>
        <p>
          The current frontend dataset exposes conjunction and orbital screening
          values, but it does not provide a live telemetry stream yet. Keeping
          this state explicit avoids presenting demo values as operational
          telemetry.
        </p>
        <div className="ds-telemetry-note">
          <Database size={14} />
          <span>Waiting for a connected telemetry source.</span>
        </div>
      </article>
    </section>
  )
}

function RiskDistribution({ detailed = false }) {
  const visibleLevels = detailed ? RISK_ORDER : ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'NORMAL']

  return (
    <div className={`ds-risk-distribution ${detailed ? 'detailed' : ''}`}>
      <div className="ds-donut-wrap">
        <div className="ds-donut">
          <div>
            <strong>{OBJECT_COUNT}</strong>
            <span>OBJECTS</span>
          </div>
        </div>
      </div>

      <div className="ds-risk-list">
        {visibleLevels.map((level) => {
          const count = threatCounts[level]
          const percentage = ((count / OBJECT_COUNT) * 100).toFixed(1)
          return (
            <div className="ds-risk-row" key={level}>
              <span className={`ds-risk-dot ${level.toLowerCase()}`} />
              <span className="ds-risk-name">{severityLabel(level)}</span>
              <span className="ds-risk-track">
                <i
                  className={level.toLowerCase()}
                  style={{ width: `${Math.max(Number(percentage), level === 'NORMAL' ? 7 : 0)}%` }}
                />
              </span>
              <strong>{count}</strong>
              <small>{percentage}%</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConcentrationChart() {
  const points = [
    { x: 72, y: 25, level: 'critical', label: 'AURORA-7 × DEBRIS-4812' },
    { x: 48, y: 38, level: 'high', label: 'NOVA-3 × OBJECT-9274' },
    { x: 35, y: 56, level: 'moderate', label: 'ORBITAL-12 × DEBRIS-3099' },
    { x: 20, y: 74, level: 'low', label: 'PIONEER-8 × OBJECT-1862' },
  ]

  return (
    <div className="ds-concentration-chart" role="img" aria-label="Conjunction concentration overview">
      <div className="ds-concentration-grid" />
      <span className="ds-concentration-axis y">HIGHER PRIORITY</span>
      <span className="ds-concentration-axis x">LOWER PRESSURE</span>

      {points.map((point) => (
        <span
          key={point.label}
          className={`ds-concentration-point ${point.level}`}
          style={{ left: `${point.x}%`, bottom: `${point.y}%` }}
          title={point.label}
        />
      ))}

      <div className="ds-concentration-callout">
        <span className="ds-eyebrow">HIGHEST PRIORITY</span>
        <strong>{formatObject(highestRiskThreat.objectA)} × {formatObject(highestRiskThreat.objectB)}</strong>
        <small>
          {highestRiskThreat.distance} · {highestRiskThreat.window}
        </small>
      </div>
    </div>
  )
}

function ThreatPreviewList({ onSelectThreat, compact = false }) {
  const threats = compact ? sortedThreats.slice(0, 3) : sortedThreats

  return (
    <div className={`ds-threat-preview-list ${compact ? 'compact' : ''}`}>
      {threats.map((threat) => (
        <button
          type="button"
          className="ds-threat-preview"
          key={threat.id}
          onClick={() => onSelectThreat(threat)}
        >
          <span className={`ds-row-severity ${threat.level.toLowerCase()}`} />
          <span className="ds-threat-preview-main">
            <strong>
              {formatObject(threat.objectA)}
              <span> × </span>
              {formatObject(threat.objectB)}
            </strong>
            <small>{threat.window}</small>
          </span>
          <span className={`ds-small-status ${threat.level.toLowerCase()}`}>
            {severityLabel(threat.level)}
          </span>
          <span className="ds-threat-preview-distance">{threat.distance}</span>
          <ArrowRight size={15} />
        </button>
      ))}
    </div>
  )
}

function ThreatInsightDrawer({ threat, onClose }) {
  return (
    <div className="ds-detail-layer">
      <button
        type="button"
        className="ds-detail-backdrop"
        aria-label="Close data insight"
        onClick={onClose}
      />

      <aside className="ds-detail-drawer" aria-label="Selected analytical item">
        <header className="ds-detail-header">
          <div>
            <span className="ds-eyebrow">SELECTED ANALYSIS</span>
            <p>Conjunction detail</p>
          </div>

          <button
            type="button"
            className="ds-detail-close"
            onClick={onClose}
            aria-label="Close selected analysis"
          >
            <X size={18} />
          </button>
        </header>

        <div className="ds-detail-title">
          <span className={`ds-detail-icon ${threat.level.toLowerCase()}`}>
            <BarChart3 size={18} />
          </span>

          <div>
            <span className={`ds-detail-level ${threat.level.toLowerCase()}`}>
              {severityLabel(threat.level)}
            </span>
            <h2>
              {formatObject(threat.objectA)}
              <span> × </span>
              {formatObject(threat.objectB)}
            </h2>
            <p>
              Supporting analytical context for the selected conjunction.
            </p>
          </div>
        </div>

        <div className="ds-detail-summary">
          <div>
            <span>Miss distance</span>
            <strong>{threat.distance}</strong>
          </div>
          <div>
            <span>Relative velocity</span>
            <strong>{threat.velocity}</strong>
          </div>
          <div>
            <span>Time to TCA</span>
            <strong>{threat.window.replace('TCA ', '')}</strong>
          </div>
        </div>

        <div className="ds-detail-note">
          <Sparkles size={14} />
          <p>
            This analytical view summarizes the current demo dataset. It does
            not represent a live operational telemetry stream.
          </p>
        </div>

        <div className="ds-detail-actions">
          <Link to="/track" className="ds-detail-action primary">
            <Database size={14} />
            View object
            <ArrowRight size={14} />
          </Link>
          <Link to="/risk" className="ds-detail-action">
            <ShieldAlert size={14} />
            View threat
            <ArrowRight size={14} />
          </Link>
          <Link to="/" className="ds-detail-action">
            <Radar size={14} />
            View dashboard
            <ArrowRight size={14} />
          </Link>
        </div>
      </aside>
    </div>
  )
}
