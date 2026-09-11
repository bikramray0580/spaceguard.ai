import {
  ChevronRight,
  Clock3,
  Filter,
  ListFilter,} from 'lucide-react'
import { mockTimeline } from '../data/mockMissionData'

export default function MonitoringConsole({
  threats,
  selectedThreat,
  onSelect,
}) {
  return (
    <section className="monitoring-console">
      <div className="console-header">
        <div>
          <span className="eyebrow">RISK MONITOR</span>
          <h2>Upcoming conjunction windows</h2>
        </div>

        <div className="console-actions">
          <button>
            <Filter size={15} />
            ALL LEVELS
          </button>

          <button>
            <ListFilter size={15} />
            SORT: TCA
          </button>
        </div>
      </div>

      <div className="console-body">
        <div className="threat-table">
          <div className="table-heading">
            <span>THREAT / OBJECT PAIR</span>
            <span>TIME TO TCA</span>
            <span>MISS DISTANCE</span>
            <span>RISK</span>
          </div>

          {threats.map((threat) => (
            <button
              key={threat.id}
              type="button"
              onClick={() => onSelect(threat)}
              className={`table-row threat-row ${
                selectedThreat.id === threat.id ? 'selected' : ''
              }`}
            >
              <span className="object-pair">
                <i className={`severity-dot ${threat.level.toLowerCase()}`} />
                <b>{threat.objectA}</b>
                <span>×</span>
                <b>{threat.objectB}</b>
              </span>

              <span>{threat.window}</span>

              <span>{threat.distance}</span>

              <span>
                <span className={`risk-pill ${threat.level.toLowerCase()}`}>
                  {threat.level}
                </span>
              </span>

              <ChevronRight size={17} />
            </button>
          ))}
        </div>

        <div className="event-timeline">
          <span className="eyebrow">EVENT TIMELINE</span>

          {mockTimeline.map((event) => (
            <div className="timeline-event" key={event.time}>
              <span className={`timeline-pin ${event.tone}`} />

              <time>{event.time}</time>

              <strong>{event.title}</strong>

              <small>{event.detail}</small>
            </div>
          ))}

          <button className="timeline-button">
            <Clock3 size={15} />
            VIEW FULL LOG
          </button>
        </div>
      </div>
    </section>
  )
}