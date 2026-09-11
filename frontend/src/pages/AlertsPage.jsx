import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Info,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { mockTimeline } from '../data/mockMissionData'
import '../styles/alerts.css'

// Mock alert events for the prototype.
const alertEvents = [
  {
    id: 'alert-1',
    time: '14:08',
    level: 'CRITICAL',
    title: 'Critical conjunction promoted',
    detail: 'AURORA-7 / DEBRIS-4812',
    description:
      'Conjunction risk exceeded the critical monitoring threshold.',
    source: 'RISK MONITOR',
  },
  {
    id: 'alert-2',
    time: '13:52',
    level: 'HIGH',
    title: 'High-risk threshold crossed',
    detail: 'NOVA-3 / OBJECT-9274',
    description:
      'Predicted conjunction requires increased monitoring.',
    source: 'RISK MONITOR',
  },
  {
    id: 'alert-3',
    time: '13:56',
    level: 'INFO',
    title: 'TLE snapshot refreshed',
    detail: 'Mock orbital feed',
    description:
      'Latest orbital tracking data has been loaded.',
    source: 'TRACKING SYSTEM',
  },
  {
    id: 'alert-4',
    time: '14:14',
    level: 'INFO',
    title: 'Screening cycle completed',
    detail: '142 monitored objects scanned',
    description:
      'Routine conjunction screening cycle completed successfully.',
    source: 'SCREENING ENGINE',
  },
]

const filters = ['ALL', 'CRITICAL', 'HIGH', 'INFO']

export default function AlertsPage() {
  const [filter, setFilter] = useState('ALL')
  const [selectedAlert, setSelectedAlert] = useState(
    alertEvents[0],
  )
  const [acknowledged, setAcknowledged] = useState([])

  // Apply the selected alert filter.
  const filteredAlerts = useMemo(() => {
    if (filter === 'ALL') {
      return alertEvents
    }

    return alertEvents.filter(
      (alert) => alert.level === filter,
    )
  }, [filter])

  // Count alerts that still need attention.
  const activeCount = alertEvents.filter(
    (alert) => !acknowledged.includes(alert.id),
  ).length

  // Acknowledge the selected alert.
  const acknowledgeAlert = () => {
    if (!acknowledged.includes(selectedAlert.id)) {
      setAcknowledged((current) => [
        ...current,
        selectedAlert.id,
      ])
    }
  }

  // Acknowledge every alert at once.
  const acknowledgeAll = () => {
    setAcknowledged(
      alertEvents.map((alert) => alert.id),
    )
  }

  return (
    <section className="alerts-page">

      {/* Page header */}
      <div className="alerts-header">
        <div>
          <span className="eyebrow">
            ALERT MANAGEMENT
          </span>

          <h1>Alert Center</h1>

          <p>
            Review system notifications, mission events,
            and alerts requiring operator attention.
          </p>
        </div>

        <div className="alerts-status">
          <Bell size={15} />
          {activeCount} ACTIVE ALERTS
        </div>
      </div>

      {/* Alert command console */}
      <div className="alerts-console">

        {/* Filters and bulk actions */}
        <div className="alerts-toolbar">

          <div className="alert-filters">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  filter === item ? 'active' : ''
                }
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ack-all-button"
            onClick={acknowledgeAll}
          >
            <Check size={14} />
            ACKNOWLEDGE ALL
          </button>

        </div>

        {/* Main alert queue */}
        <div className="alert-queue">

          <div className="alert-queue-header">
            <div>
              <span className="eyebrow">
                ALERT QUEUE
              </span>

              <h2>Operational notifications</h2>
            </div>

            <span>
              {filteredAlerts.length} EVENTS
            </span>
          </div>

          {filteredAlerts.map((alert) => {
            const isAcknowledged =
              acknowledged.includes(alert.id)

            const isSelected =
              selectedAlert.id === alert.id

            return (
              <button
                key={alert.id}
                type="button"
                className={`alert-event ${
                  alert.level.toLowerCase()
                } ${
                  isSelected ? 'selected' : ''
                } ${
                  isAcknowledged
                    ? 'acknowledged'
                    : ''
                }`}
                onClick={() => {
                  setSelectedAlert(alert)
                }}
              >

                {/* Severity icon */}
                <span className="event-severity">
                  {alert.level === 'INFO' ? (
                    <Info size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                </span>

                {/* Timestamp */}
                <span className="event-time">
                  {alert.time}
                </span>

                {/* Alert information */}
                <span className="event-content">
                  <strong>
                    {alert.title}
                  </strong>

                  <small>
                    {alert.detail}
                  </small>

                  <span>
                    {alert.description}
                  </span>
                </span>

                {/* Alert source */}
                <span className="event-source">
                  {alert.source}
                </span>

                {/* Alert state */}
                <span className="event-status">
                  {isAcknowledged ? (
                    <>
                      <Check size={13} />
                      ACK
                    </>
                  ) : (
                    'NEW'
                  )}
                </span>

                <ChevronRight size={16} />

              </button>
            )
          })}
        </div>
      </div>

      {/* Selected alert action strip */}
      <div
        className={`selected-alert-bar ${
          selectedAlert.level.toLowerCase()
        }`}
      >
        <div className="selected-alert-indicator">
          {selectedAlert.level === 'INFO' ? (
            <Info size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
        </div>

        <div className="selected-alert-content">
          <span className="eyebrow">
            SELECTED ALERT
          </span>

          <strong>
            {selectedAlert.title}
          </strong>

          <small>
            {selectedAlert.detail}
            {' • '}
            {selectedAlert.source}
          </small>
        </div>

        <div className="selected-alert-meta">
          <span>
            {selectedAlert.time}
          </span>

          <span
            className={`alert-level ${
              selectedAlert.level.toLowerCase()
            }`}
          >
            {selectedAlert.level}
          </span>
        </div>

        <button
          type="button"
          className="acknowledge-button"
          disabled={acknowledged.includes(
            selectedAlert.id,
          )}
          onClick={acknowledgeAlert}
        >
          <Check size={14} />

          {acknowledged.includes(
            selectedAlert.id,
          )
            ? 'ACKNOWLEDGED'
            : 'ACKNOWLEDGE'}
        </button>
      </div>

      {/* Mission event history */}
      <div className="alerts-timeline">

        <div className="alerts-section-header">
          <div>
            <span className="eyebrow">
              MISSION ACTIVITY
            </span>

            <h2>System event timeline</h2>
          </div>

          <Clock3 size={17} />
        </div>

        <div className="timeline-list">
          {mockTimeline.map((event) => (
            <div
              className="alert-timeline-event"
              key={event.time}
            >
              <span
                className={`timeline-dot ${event.tone}`}
              />

              <time>
                {event.time}
              </time>

              <div>
                <strong>
                  {event.title}
                </strong>

                <small>
                  {event.detail}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}