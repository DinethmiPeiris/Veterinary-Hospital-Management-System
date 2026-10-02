import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function DoctorNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="role-navbar doctor-navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🐾</span>
          <div>
            <strong>Sri Jayawardanapura Animal Hospital</strong>
            <span className="portal-badge doctor-badge">Doctor Portal</span>
          </div>
        </div>
        <nav className="nav-links">
          <Link
            to="/doctor/recommend-admission"
            className={location.pathname === '/doctor/recommend-admission' ? 'active' : ''}
          >
            Hospitalization Recommendation
          </Link>
          <Link
            to="/doctor/hospitalized-pets"
            className={location.pathname === '/doctor/hospitalized-pets' ? 'active' : ''}
          >
            Hospitalized Pets
          </Link>
        </nav>
        <div className="nav-actions">
          <button className="btn-logout" onClick={() => navigate('/login')}>Logout</button>
        </div>
      </div>
    </header>
  )
}
