import { Link, useNavigate } from 'react-router-dom'

export default function PetOwnerNav() {
  const navigate = useNavigate()

  return (
    <header className="role-navbar owner-navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">🐾</span>
          <div>
            <strong>Sri Jayawardanapura Animal Hospital</strong>
            <span className="portal-badge owner-badge">Pet Owner Portal</span>
          </div>
        </div>
        <nav className="nav-links">
          <Link to="/pet-owner/admissions" className="active">Pet Admission</Link>
        </nav>
        <div className="nav-actions">
          <button className="btn-logout" onClick={() => navigate('/login')}>Logout</button>
        </div>
      </div>
    </header>
  )
}
