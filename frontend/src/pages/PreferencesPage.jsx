import {
  Bell,
  Check,
  CircleUserRound,
  Database,
  Gauge,
  Grid3X3,
  Info,
  Monitor,
  Radio,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import '../styles/preferences.css'

const CATEGORIES = [
  {
    id: 'display',
    label: 'Display',
    number: '01',
    icon: Monitor,
    description: 'Control how information appears across the mission workspace.',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    number: '02',
    icon: Bell,
    description: 'Choose which events should require operator attention.',
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    number: '03',
    icon: Radio,
    description: 'Set the default screening and monitoring behavior.',
  },
  {
    id: 'operator',
    label: 'Operator',
    number: '04',
    icon: CircleUserRound,
    description: 'Review workstation identity and session information.',
  },
  {
    id: 'system',
    label: 'System',
    number: '05',
    icon: Settings2,
    description: 'Review environment, performance, and lower-priority system options.',
  },
]

export default function PreferencesPage() {
  const [activeCategory, setActiveCategory] = useState('display')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [savedPulse, setSavedPulse] = useState(false)

  const [settings, setSettings] = useState({
    compactMode: true,
    orbitalVisualization: true,
    animations: true,
    gridOverlay: true,
    criticalAlerts: true,
    highAlerts: true,
    systemAlerts: true,
    soundAlerts: false,
  })

  const [monitoring, setMonitoring] = useState({
    riskFilter: 'ALL LEVELS',
    refreshInterval: '30 SECONDS',
    conjunctionThreshold: '10 KM',
    defaultWorkspace: 'MISSION DASHBOARD',
  })

  const activeMeta = useMemo(
    () =>
      CATEGORIES.find((category) => category.id === activeCategory) ??
      CATEGORIES[0],
    [activeCategory],
  )

  const updateSetting = (key) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }))
    showSavedPulse()
  }

  const updateMonitoring = (key, value) => {
    setMonitoring((current) => ({
      ...current,
      [key]: value,
    }))
    showSavedPulse()
  }

  const showSavedPulse = () => {
    setSavedPulse(true)
    window.clearTimeout(window.__spaceguardPreferencesSavedTimer)
    window.__spaceguardPreferencesSavedTimer = window.setTimeout(
      () => setSavedPulse(false),
      1400,
    )
  }

  const resetSettings = () => {
    setSettings({
      compactMode: true,
      orbitalVisualization: true,
      animations: true,
      gridOverlay: true,
      criticalAlerts: true,
      highAlerts: true,
      systemAlerts: true,
      soundAlerts: false,
    })

    setMonitoring({
      riskFilter: 'ALL LEVELS',
      refreshInterval: '30 SECONDS',
      conjunctionThreshold: '10 KM',
      defaultWorkspace: 'MISSION DASHBOARD',
    })

    showSavedPulse()
  }

  return (
    <section className="preferences-page">
      <header className="preferences-header">
        <div className="preferences-heading-copy">
          <span className="eyebrow">WORKSPACE CONFIGURATION</span>
          <h1>Settings</h1>
          <p>
            Configure how SpaceGuard presents information, monitoring behavior,
            and operator preferences.
          </p>
        </div>

        <div className="preferences-status-stack">
          <span className="preferences-status">
            <i />
            CONFIGURATION OK
          </span>

          {savedPulse && (
            <span className="preferences-save-state" role="status">
              <Check size={12} />
              SAVED
            </span>
          )}
        </div>
      </header>

      <section className="preferences-summary" aria-label="Workspace status">
        <div className="preferences-summary-lead">
          <span className="eyebrow">WORKSPACE STATUS</span>
          <strong>Mission workstation configured</strong>
        </div>

        <div className="preferences-summary-items">
          <SummaryItem
            label="Display"
            value={settings.compactMode ? 'Compact' : 'Standard'}
          />
          <span className="preferences-summary-divider" />
          <SummaryItem
            label="Monitoring"
            value={monitoring.refreshInterval.replace('SECONDS', 'sec')}
          />
          <span className="preferences-summary-divider" />
          <SummaryItem
            label="Alerts"
            value={
              settings.criticalAlerts || settings.highAlerts
                ? 'Enabled'
                : 'Quiet'
            }
          />
          <span className="preferences-summary-divider" />
          <SummaryItem label="Session" value="Active" />
        </div>
      </section>

      <section className="preferences-workspace">
        <nav
          className="preferences-categories"
          aria-label="Settings categories"
        >
          <div className="preferences-categories-label">
            <span className="eyebrow">CONFIGURE</span>
            <small>Select a category</small>
          </div>

          <div className="preferences-category-list">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              const active = category.id === activeCategory

              return (
                <button
                  type="button"
                  key={category.id}
                  className={`preferences-category ${
                    active ? 'active' : ''
                  }`}
                  onClick={() => {
                    setActiveCategory(category.id)
                    setAdvancedOpen(false)
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="preferences-category-index">
                    {category.number}
                  </span>

                  <span className="preferences-category-icon">
                    <Icon size={15} />
                  </span>

                  <span className="preferences-category-copy">
                    <strong>{category.label}</strong>
                    <small>{category.description}</small>
                  </span>

                  <span
                    className="preferences-category-state"
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>

          <div className="preferences-category-footer">
            <Info size={13} />
            <span>
              Settings apply to this workstation session in the current
              prototype environment.
            </span>
          </div>
        </nav>

        <main className="preferences-content">
          <header className="preferences-content-header">
            <div className="preferences-content-title">
              <span className="preferences-content-icon">
                <activeMeta.icon size={17} />
              </span>

              <div>
                <span className="eyebrow">
                  {activeMeta.number} / {activeMeta.label.toUpperCase()}
                </span>
                <h2>{activeMeta.label}</h2>
                <p>{activeMeta.description}</p>
              </div>
            </div>

            <span className="preferences-content-mode">
              <SlidersHorizontal size={13} />
              FOCUSED VIEW
            </span>
          </header>

          <div className="preferences-content-body">
            {activeCategory === 'display' && (
              <DisplaySettings
                settings={settings}
                onToggle={updateSetting}
                advancedOpen={advancedOpen}
                onAdvancedToggle={() => setAdvancedOpen((value) => !value)}
              />
            )}

            {activeCategory === 'alerts' && (
              <AlertSettings
                settings={settings}
                onToggle={updateSetting}
                advancedOpen={advancedOpen}
                onAdvancedToggle={() => setAdvancedOpen((value) => !value)}
              />
            )}

            {activeCategory === 'monitoring' && (
              <MonitoringSettings
                monitoring={monitoring}
                onChange={updateMonitoring}
                advancedOpen={advancedOpen}
                onAdvancedToggle={() => setAdvancedOpen((value) => !value)}
              />
            )}

            {activeCategory === 'operator' && <OperatorSettings />}

            {activeCategory === 'system' && (
              <SystemSettings
                advancedOpen={advancedOpen}
                onAdvancedToggle={() => setAdvancedOpen((value) => !value)}
                onReset={resetSettings}
              />
            )}
          </div>
        </main>
      </section>

      <section className="preferences-footer-note">
        <div className="preferences-footer-icon">
          <Check size={15} />
        </div>

        <div>
          <span className="eyebrow">SYSTEM CONFIGURATION</span>
          <strong>SpaceGuard prototype environment</strong>
          <p>
            Preferences are currently applied to this workstation session.
            Persistent storage will be connected during backend integration.
          </p>
        </div>

        <span className="preferences-footer-state">CONFIGURATION READY</span>
      </section>
    </section>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div className="preferences-summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DisplaySettings({
  settings,
  onToggle,
  advancedOpen,
  onAdvancedToggle,
}) {
  return (
    <SettingGroup
      title="Workspace appearance"
      description="Keep the visual workspace clean while preserving the controls you use most."
    >
      <ToggleSetting
        icon={<Gauge size={15} />}
        label="Interface density"
        description="Use compact spacing across monitoring panels."
        value={settings.compactMode}
        onChange={() => onToggle('compactMode')}
      />

      <ToggleSetting
        icon={<Radio size={15} />}
        label="Orbital visualization"
        description="Show orbital objects in the mission viewport."
        value={settings.orbitalVisualization}
        onChange={() => onToggle('orbitalVisualization')}
      />

      <ToggleSetting
        icon={<RotateCcw size={15} />}
        label="Animation intensity"
        description="Allow motion effects and simulation transitions."
        value={settings.animations}
        onChange={() => onToggle('animations')}
      />

      <ToggleSetting
        icon={<Grid3X3 size={15} />}
        label="Grid overlay"
        description="Display spatial grid references in visualizations."
        value={settings.gridOverlay}
        onChange={() => onToggle('gridOverlay')}
      />

      <AdvancedSettings
        open={advancedOpen}
        onToggle={onAdvancedToggle}
      >
        <AdvancedRow
          label="Reduced motion support"
          description="Honor system-level motion preferences."
          value={settings.animations ? 'Automatic' : 'Minimized'}
        />
        <AdvancedRow
          label="Visualization detail"
          description="Use the standard mission-view rendering profile."
          value="Standard"
        />
      </AdvancedSettings>
    </SettingGroup>
  )
}

function AlertSettings({
  settings,
  onToggle,
  advancedOpen,
  onAdvancedToggle,
}) {
  return (
    <SettingGroup
      title="Alert behavior"
      description="Choose which events should interrupt the operator's attention."
    >
      <ToggleSetting
        icon={<ShieldCheck size={15} />}
        label="Critical alerts"
        description="Immediate notifications for critical conjunctions."
        value={settings.criticalAlerts}
        onChange={() => onToggle('criticalAlerts')}
        tone="critical"
      />

      <ToggleSetting
        icon={<Bell size={15} />}
        label="High-risk alerts"
        description="Notifications for elevated conjunction risk."
        value={settings.highAlerts}
        onChange={() => onToggle('highAlerts')}
        tone="high"
      />

      <ToggleSetting
        icon={<Radio size={15} />}
        label="System alerts"
        description="Operational and tracking system notifications."
        value={settings.systemAlerts}
        onChange={() => onToggle('systemAlerts')}
      />

      <ToggleSetting
        icon={<Volume2 size={15} />}
        label="Sound notifications"
        description="Play an audio cue when an alert is received."
        value={settings.soundAlerts}
        onChange={() => onToggle('soundAlerts')}
      />

      <AdvancedSettings
        open={advancedOpen}
        onToggle={onAdvancedToggle}
      >
        <AdvancedRow
          label="Alert batching"
          description="Future backend-connected alert grouping preference."
          value="Not connected"
        />
        <AdvancedRow
          label="Quiet hours"
          description="Reserved for future notification scheduling."
          value="Not configured"
        />
      </AdvancedSettings>
    </SettingGroup>
  )
}

function MonitoringSettings({
  monitoring,
  onChange,
  advancedOpen,
  onAdvancedToggle,
}) {
  return (
    <SettingGroup
      title="Monitoring behavior"
      description="Set the default screening parameters used across the workspace."
    >
      <SelectSetting
        label="Default risk filter"
        description="Choose the severity level shown first in monitoring views."
        value={monitoring.riskFilter}
        options={['ALL LEVELS', 'CRITICAL', 'HIGH', 'MODERATE']}
        onChange={(value) => onChange('riskFilter', value)}
      />

      <SelectSetting
        label="Refresh interval"
        description="Control how frequently the monitoring views refresh."
        value={monitoring.refreshInterval}
        options={['10 SECONDS', '30 SECONDS', '60 SECONDS']}
        onChange={(value) => onChange('refreshInterval', value)}
      />

      <SelectSetting
        label="Conjunction threshold"
        description="Set the default screening distance used by the workspace."
        value={monitoring.conjunctionThreshold}
        options={['5 KM', '10 KM', '25 KM', '50 KM']}
        onChange={(value) => onChange('conjunctionThreshold', value)}
      />

      <SelectSetting
        label="Default workspace"
        description="Choose the page opened as the primary operating workspace."
        value={monitoring.defaultWorkspace}
        options={[
          'MISSION DASHBOARD',
          'TRACK OBJECTS',
          'RISK ASSESSMENT',
          'DATA SCIENCE',
        ]}
        onChange={(value) => onChange('defaultWorkspace', value)}
      />

      <AdvancedSettings
        open={advancedOpen}
        onToggle={onAdvancedToggle}
      >
        <AdvancedRow
          label="Screening cadence"
          description="Detailed engine scheduling becomes configurable with backend integration."
          value="Prototype"
        />
        <AdvancedRow
          label="Data source"
          description="Current monitoring views use the local prototype dataset."
          value="Mock dataset"
        />
      </AdvancedSettings>
    </SettingGroup>
  )
}

function OperatorSettings() {
  return (
    <SettingGroup
      title="Operator profile"
      description="Review the identity and access context attached to this workstation."
    >
      <div className="operator-profile">
        <div className="operator-profile-main">
          <div className="operator-avatar">
            <CircleUserRound size={22} />
          </div>

          <div>
            <span className="eyebrow">OPERATOR ID</span>
            <strong>OPERATOR-01</strong>
            <small>MISSION CONTROL</small>
          </div>

          <span className="operator-active">
            <i />
            ACTIVE
          </span>
        </div>

        <div className="operator-details">
          <ProfileValue label="Role" value="Mission Analyst" />
          <ProfileValue label="Clearance" value="Level 03" />
          <ProfileValue label="Session" value="Active" />
          <ProfileValue label="Environment" value="Prototype" />
        </div>
      </div>

      <div className="settings-callout">
        <CircleUserRound size={15} />
        <div>
          <strong>Operator profile is read-only</strong>
          <p>
            Identity editing will become available when the connected
            authentication layer is enabled.
          </p>
        </div>
      </div>
    </SettingGroup>
  )
}

function SystemSettings({ advancedOpen, onAdvancedToggle, onReset }) {
  return (
    <SettingGroup
      title="System"
      description="Keep lower-priority environment and performance information out of the main workflow."
    >
      <InfoRow
        icon={<Database size={15} />}
        label="Data source"
        description="Current analytical and monitoring views."
        value="Prototype dataset"
      />

      <InfoRow
        icon={<Radio size={15} />}
        label="Refresh state"
        description="Current workspace refresh state."
        value="Active"
      />

      <InfoRow
        icon={<Settings2 size={15} />}
        label="Application version"
        description="Current SpaceGuard frontend environment."
        value="Prototype"
      />

      <InfoRow
        icon={<Monitor size={15} />}
        label="Performance profile"
        description="Rendering profile used by this workstation."
        value="Balanced"
      />

      <AdvancedSettings
        open={advancedOpen}
        onToggle={onAdvancedToggle}
      >
        <AdvancedRow
          label="Experimental features"
          description="Reserved for future development toggles."
          value="Disabled"
        />
        <AdvancedRow
          label="Diagnostics"
          description="Developer diagnostics are not exposed in the operator workflow."
          value="Hidden"
        />
      </AdvancedSettings>

      <div className="danger-zone">
        <div>
          <span className="eyebrow">SECONDARY ACTION</span>
          <strong>Restore defaults</strong>
          <p>Return local preference state to the SpaceGuard prototype defaults.</p>
        </div>

        <button type="button" onClick={onReset}>
          Reset to defaults
        </button>
      </div>
    </SettingGroup>
  )
}

function SettingGroup({ title, description, children }) {
  return (
    <section className="setting-group">
      <header className="setting-group-header">
        <div>
          <span className="eyebrow">CURRENT CATEGORY</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>

      <div className="settings-list">{children}</div>
    </section>
  )
}

function ToggleSetting({
  icon,
  label,
  description,
  value,
  onChange,
  tone = '',
}) {
  return (
    <div className="setting-row">
      <div className={`setting-icon ${tone}`}>{icon}</div>

      <div className="setting-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        className={`setting-toggle ${value ? 'active' : ''}`}
        onClick={onChange}
        aria-label={`Toggle ${label}`}
        aria-pressed={value}
      >
        <span />
      </button>
    </div>
  )
}

function SelectSetting({
  label,
  description,
  value,
  options,
  onChange,
}) {
  return (
    <label className="select-setting">
      <span className="select-setting-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>

      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function AdvancedSettings({ open, onToggle, children }) {
  return (
    <div className={`advanced-settings ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="advanced-trigger"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>
          <SlidersHorizontal size={14} />
          ADVANCED SETTINGS
        </span>

        <span className="advanced-trigger-action">
          {open ? 'Hide' : 'Show'}
          <span className="advanced-chevron">→</span>
        </span>
      </button>

      {open && <div className="advanced-content">{children}</div>}
    </div>
  )
}

function AdvancedRow({ label, description, value }) {
  return (
    <div className="advanced-row">
      <div>
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      <span>{value}</span>
    </div>
  )
}

function InfoRow({ icon, label, description, value }) {
  return (
    <div className="info-row">
      <span className="info-row-icon">{icon}</span>
      <div>
        <strong>{label}</strong>
        <small>{description}</small>
      </div>
      <span className="info-row-value">{value}</span>
    </div>
  )
}

function ProfileValue({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
