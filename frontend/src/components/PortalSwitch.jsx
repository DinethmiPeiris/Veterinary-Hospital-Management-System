import { Link } from 'react-router-dom'
import './PortalSwitch.css'

/**
 * Small floating shortcut that links the booking/approval portals (pet owner, doctor, admin
 * management pages) with the consultation / reporting portals so users can move between them.
 */
export default function PortalSwitch({ to, label, icon = '🔀' }) {
  return (
    <Link to={to} className="portal-switch" id="portal-switch-link" aria-label={label}>
      <span className="portal-switch-icon" aria-hidden="true">{icon}</span>
      <span className="portal-switch-label">{label}</span>
    </Link>
  )
}
