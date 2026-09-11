import {
  AlertTriangle,
  BarChart3,
  Database,
  Gauge,
  Orbit,
  Settings2,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const nav = [
  ['/', 'Dashboard', Gauge],
  ['track', 'Satellites', Orbit],
  ['risk', 'Collision Risk', AlertTriangle],
  ['simulation', 'Simulation', BarChart3],
  ['data-science', 'Analytics', Database],
  ['preferences', 'Settings', Settings2],
]

export default function NavigationRail({ isOpen, onNavigate }) {
  return (
    <>
      <button
        type="button"
        className={`nav-scrim ${isOpen ? 'is-open' : ''}`}
        onClick={onNavigate}
        aria-label="Close navigation"
      />

      <aside className={`navigation-rail ${isOpen ? 'is-open' : ''}`}>
        <div className="nav-identity">
          <span>◉</span>

          <div>
            <strong>SPACEGUARD</strong>
            <small>ORBITING A SAFER TOMORROW</small>
          </div>

          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav>
          {nav.map(([path, text, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `rail-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={19} strokeWidth={1.55} />
              <span>{text}</span>
            </NavLink>
          ))}
        </nav>

        <div className="rail-footer">
          <i />
          <span>All Systems Nominal</span>
          <small>Live orbital workspace</small>
        </div>
      </aside>
    </>
  )
}
