import { useEffect, useState } from 'react'

const currentDate = () => new Date()

export default function ClockStatus() {
  const [date, setDate] = useState(currentDate)
  useEffect(() => { const timer = window.setInterval(() => setDate(currentDate()), 1000); return () => window.clearInterval(timer) }, [])
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(date)
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
  return <aside className="clock-status" aria-label="Mission time"><time>{time}</time><span>{day}</span><p>REAL-TIME AWARENESS<br/>FOR A SAFER TOMORROW</p></aside>
}
