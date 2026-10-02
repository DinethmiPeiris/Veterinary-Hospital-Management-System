import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminPendingCounts } from '../hooks/useAdminPendingCounts'

/**
 * Admin portal navigation bar.
 *
 * Navigation order:
 *  1. Admission Requests  (badge: count of REQUESTED admissions)
 *  2. Cage Occupancy      (no badge — monitoring + maintenance management)
 *  3. Hospitalized Pets   (badge: count of DISCHARGE_RECOMMENDED hospitalizations)
 *  4. Medicine Requests   (badge: count of PENDING medicine requests)
 *  5. Inventory Management
 *
 * Badges represent items that REQUIRE ADMIN ACTION.
 * They do NOT disappear when the user navigates to the page —
 * they decrease only when requests are actually processed/rejected/issued/discharged.
 */
export default function AdminNav() {
  const navigate = useNavigate()
  const location = useLocation()

  // Polling interval of 12 seconds (within recommended 10-15s range)
  const { admissionPendingCount, medicinePendingCount, dischargeRecommendationCount, refreshCounts } =
    useAdminPendingCounts(12000)

  // Refresh counts when Admin navigates between Admin pages
  useEffect(() => {
    refreshCounts()
  }, [location.pathname, refreshCounts])

  const formatBadge = (count) => (count > 9 ? '9+' : String(count))

  return (
    <header className="role-navbar admin-navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🐾</span>
          <div>
            <strong>Sri Jayawardanapura Animal Hospital</strong>
            <span className="portal-badge admin-badge">Admin Portal</span>
          </div>
        </div>
        <nav className="nav-links">
          {/* 1. Admission Requests */}
          <Link
            to="/admin/admission-requests"
            className={location.pathname === '/admin/admission-requests' ? 'active' : ''}
          >
            Admission Requests
            {admissionPendingCount > 0 && (
              <span className="nav-action-badge" aria-label={`${admissionPendingCount} pending admission requests`}>
                {formatBadge(admissionPendingCount)}
              </span>
            )}
          </Link>

          {/* 2. Cage Occupancy — no action badge; monitoring + maintenance management */}
          <Link
            to="/admin/cage-occupancy"
            className={location.pathname === '/admin/cage-occupancy' ? 'active' : ''}
          >
            Cage Occupancy
          </Link>

          {/* 3. Hospitalized Pets */}
          <Link
            to="/admin/hospitalized-pets"
            className={location.pathname === '/admin/hospitalized-pets' ? 'active' : ''}
          >
            Hospitalized Pets
            {dischargeRecommendationCount > 0 && (
              <span
                className="nav-action-badge"
                aria-label={`${dischargeRecommendationCount} pets awaiting final discharge confirmation`}
              >
                {formatBadge(dischargeRecommendationCount)}
              </span>
            )}
          </Link>

          {/* 4. Medicine Requests */}
          <Link
            to="/admin/medicine-requests"
            className={location.pathname === '/admin/medicine-requests' ? 'active' : ''}
          >
            Medicine Requests
            {medicinePendingCount > 0 && (
              <span className="nav-action-badge" aria-label={`${medicinePendingCount} pending medicine requests`}>
                {formatBadge(medicinePendingCount)}
              </span>
            )}
          </Link>

          {/* 5. Inventory Management */}
          <Link
            to="/admin/inventory"
            className={location.pathname === '/admin/inventory' ? 'active' : ''}
          >
            Inventory Management
          </Link>
        </nav>
        <div className="nav-actions">
          <button className="btn-logout" onClick={() => navigate('/login')}>Logout</button>
        </div>
      </div>
    </header>
  )
}
