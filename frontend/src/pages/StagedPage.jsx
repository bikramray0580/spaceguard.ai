import { Construction, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
export default function StagedPage({ title, subtitle }) { return <section className="staged-page"><div><span className="eyebrow">MISSION MODULE</span><Construction size={34} /><h1>{title}</h1><p>{subtitle} is staged for the prototype. The dashboard remains the active review surface.</p><Link to="/"><LayoutDashboard size={16} /> RETURN TO DASHBOARD</Link></div></section> }
