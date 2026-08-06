import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar" role="navigation" aria-label="Main navigation">
        <div className="container">
          <div className="nav-inner">
            <a className="nav-logo" id="nav-logo-link" aria-label="Home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="nav-logo-icon">🐾</div>
              <div className="nav-logo-text">
                <strong>Sri Jayawardanapura</strong>
                <span>Animal Hospital</span>
              </div>
            </a>
            <div className="nav-links" role="menubar">
              <a onClick={() => scrollTo('about')}>About</a>
              <a onClick={() => scrollTo('services')}>Services</a>
              <a onClick={() => scrollTo('why')}>Why Us</a>
              <a onClick={() => scrollTo('contact')}>Contact</a>
            </div>
            <div className="nav-cta">
              <button className="btn btn-secondary" id="nav-login-btn" onClick={() => navigate('/login')}>Login</button>
            </div>
            <button className="hamburger" id="hamburger" aria-label="Open menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`} id="mobile-menu" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false) }}>
        <button className="mobile-menu-close" id="mobile-menu-close" aria-label="Close" onClick={() => setMobileOpen(false)}>&#x2715;</button>
        <a onClick={() => scrollTo('about')}>About</a>
        <a onClick={() => scrollTo('services')}>Services</a>
        <a onClick={() => scrollTo('why')}>Why Us</a>
        <a onClick={() => scrollTo('contact')}>Contact</a>
        <div className="mobile-menu-cta">
          <button className="btn btn-secondary" id="mobile-login-btn" onClick={() => { setMobileOpen(false); navigate('/login') }}>Login</button>
        </div>
      </div>
    </>
  )
}
