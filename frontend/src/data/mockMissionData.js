export const mockMissionMeta = { monitoredObjects: 142, conjunctions: 7, highRisk: 2, freshness: '04s', exposure: 'ELEVATED' }
export const mockThreats = [
  { id: 'evt-1042', objectA: 'AURORA-7', objectB: 'DEBRIS-4812', distance: '0.84 km', velocity: '12.8 km/s', level: 'CRITICAL', window: 'TCA + 18m' },
  { id: 'evt-1037', objectA: 'NOVA-3', objectB: 'OBJECT-9274', distance: '2.31 km', velocity: '9.2 km/s', level: 'HIGH', window: 'TCA + 52m' },
  { id: 'evt-1028', objectA: 'ORBITAL-12', objectB: 'DEBRIS-3099', distance: '8.76 km', velocity: '6.1 km/s', level: 'MODERATE', window: 'TCA + 1h 57m' },
  { id: 'evt-1015', objectA: 'PIONEER-8', objectB: 'OBJECT-1862', distance: '19.40 km', velocity: '4.7 km/s', level: 'LOW', window: 'TCA + 4h 33m' },
]
export const mockTimeline = [
  { time: '14:14', title: 'Screening cycle completed', detail: '142 monitored objects scanned', tone: 'mint' },
  { time: '14:08', title: 'Critical conjunction promoted', detail: 'AURORA-7 / DEBRIS-4812', tone: 'red' },
  { time: '13:56', title: 'TLE snapshot refreshed', detail: 'Mock feed · review build', tone: 'cyan' },
]
