import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './layouts/AppShell'

import DashboardPage from './pages/DashboardPage'
import TrackPage from './pages/TrackPage'
import RiskPage from './pages/RiskPage'
import AlertsPage from './pages/AlertsPage'
import SimulationPage from './pages/SimulationPage'
import DataSciencePage from './pages/DataSciencePage'
import PreferencesPage from './pages/PreferencesPage'
import RenderErrorBoundary from './components/RenderErrorBoundary'

export default function App() {
  return (
    <RenderErrorBoundary>
      <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="risk" element={<RiskPage />} />
        <Route path="simulation" element={<SimulationPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="data-science" element={<DataSciencePage />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </RenderErrorBoundary>
  )
}
