import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './LoginPage.css'

const petEmojis = ['🐕','🐈','🐇','🦜','🐠','🐹','🐾','🦮','🐈‍⬛','🦔']

export default function LoginPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('owner')
  const [ownerMode, setOwnerMode] = useState('signin')
  const [toast, setToast] = useState({ message: '', type: '', show: false })

  // Form states
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPass, setOwnerPass] = useState('')
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')
  const [docId, setDocId] = useState('')
  const [docPass, setDocPass] = useState('')
  const [adminId, setAdminId] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [adminPin, setAdminPin] = useState('')

  // Password visibility
  const [showPass, setShowPass] = useState({})

  const togglePass = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
  }

  const tabPositions = { owner: '4px', doctor: 'calc(33.33% + 2px)', admin: 'calc(66.66% + 0px)' }

  // Floating pets
  const spawnPet = useCallback(() => {
    const container = document.getElementById('floating-pets')
    if (!container) return
    const pet = document.createElement('div')
    pet.className = 'floating-pet'
    pet.textContent = petEmojis[Math.floor(Math.random() * petEmojis.length)]
    pet.style.left = Math.random() * 100 + '%'
    const dur = 14 + Math.random() * 16
    pet.style.animationDuration = dur + 's'
    pet.style.animationDelay = (Math.random() * 3) + 's'
    pet.style.fontSize = (1.2 + Math.random() * 1.2) + 'rem'
    container.appendChild(pet)
    setTimeout(() => { if (pet.parentNode) pet.parentNode.removeChild(pet) }, (dur + 4) * 1000)
  }, [])

  useEffect(() => {
    const timeouts = []
    for (let i = 0; i < 5; i++) timeouts.push(setTimeout(spawnPet, i * 800))
    const interval = setInterval(spawnPet, 3500)
    return () => { timeouts.forEach(clearTimeout); clearInterval(interval) }
  }, [spawnPet])

  // Form handlers
  const handleOwnerLogin = (e) => {
    e.preventDefault()
    if (!ownerEmail || !ownerPass) { showToast('Please fill in all fields.', 'error'); return }
    showToast('🐾 Welcome back! Redirecting to Pet Owner Dashboard...', 'success')
    setTimeout(() => navigate('/'), 2000)
  }

  const handleOwnerRegister = (e) => {
    e.preventDefault()
    if (!regName || !regPhone || !regEmail || !regAddress || !regPass || !regPassConfirm) {
      showToast('Please fill in all required fields.', 'error'); return
    }
    if (regPass.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return }
    if (regPass !== regPassConfirm) { showToast('Passwords do not match. Please try again.', 'error'); return }
    showToast('Account created! Welcome, ' + regName + '! Redirecting...', 'success')
    setTimeout(() => navigate('/'), 2500)
  }

  const handleDoctorLogin = (e) => {
    e.preventDefault()
    if (!docId || !docPass) { showToast('Please fill in all fields.', 'error'); return }
    showToast('Welcome, Doctor! Redirecting to your portal...', 'info')
    setTimeout(() => navigate('/'), 2000)
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (!adminId || !adminPass || !adminPin) { showToast('Please fill in all fields.', 'error'); return }
    if (!/^\d{6}$/.test(adminPin)) { showToast('Security PIN must be 6 digits.', 'error'); return }
    showToast('🔐 Admin authenticated. Redirecting to Admin Portal...', 'info')
    setTimeout(() => navigate('/'), 2000)
  }

  return (
    <>
      <div className="bg-gradient" aria-hidden="true"></div>
      <div className="bg-paws" aria-hidden="true"></div>
      <div className="floating-pets" id="floating-pets" aria-hidden="true"></div>

      <Link to="/" className="back-home">&#8592; Back to Home</Link>

      <main className="login-main">
        <div className="login-card" id="login-card">

          <div className="login-brand">
            <div className="brand-icon">&#9729;</div>
            <div className="brand-text">
              <strong>Sri Jayawardanapura</strong>
              <span>Animal Hospital</span>
            </div>
          </div>

          <div className="role-tabs" role="tablist">
            <button className={`role-tab${role === 'owner' ? ' active' : ''}`} id="tab-owner" onClick={() => setRole('owner')}>&#128062; Pet Owner</button>
            <button className={`role-tab${role === 'doctor' ? ' active' : ''}`} id="tab-doctor" onClick={() => setRole('doctor')}>&#9877; Doctor</button>
            <button className={`role-tab${role === 'admin' ? ' active' : ''}`} id="tab-admin" onClick={() => setRole('admin')}>&#9881; Admin</button>
            <div className="tab-slider" id="tab-slider" style={{ left: tabPositions[role] }}></div>
          </div>

          {/* PET OWNER PANEL */}
          {role === 'owner' && (
            <div className="role-panel active" id="panel-owner">
              <div className="owner-toggle">
                <button className={`toggle-btn${ownerMode === 'signin' ? ' active' : ''}`} id="btn-signin" onClick={() => setOwnerMode('signin')}>Sign In</button>
                <button className={`toggle-btn${ownerMode === 'register' ? ' active' : ''}`} id="btn-register" onClick={() => setOwnerMode('register')}>New? Register</button>
              </div>

              {ownerMode === 'signin' ? (
                <form className="auth-form" id="form-owner-login" onSubmit={handleOwnerLogin} noValidate>
                  <h2 className="form-title">Welcome Back!</h2>
                  <p className="form-subtitle">Sign in to manage your pet's health journey.</p>
                  <div className="input-group">
                    <label htmlFor="owner-email">Email Address</label>
                    <div className="input-wrap">
                      <input type="email" id="owner-email" placeholder="yourname@email.com" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="owner-pass">Password</label>
                    <div className="input-wrap">
                      <input type={showPass['owner-pass'] ? 'text' : 'password'} id="owner-pass" placeholder="Enter your password" required value={ownerPass} onChange={(e) => setOwnerPass(e.target.value)} />
                      <button type="button" className="eye-btn" onClick={() => togglePass('owner-pass')}>{showPass['owner-pass'] ? '🙈' : '👁'}</button>
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="checkbox-label"><input type="checkbox" /> Remember me</label>
                    <a href="#" className="forgot-link">Forgot password?</a>
                  </div>
                  <button type="submit" className="submit-btn btn-owner">Sign In</button>
                  <p className="form-switch">No account? <button type="button" className="link-btn" onClick={() => setOwnerMode('register')}>Register your pet &rarr;</button></p>
                </form>
              ) : (
                <form className="auth-form" id="form-owner-register" onSubmit={handleOwnerRegister} noValidate>
                  <h2 className="form-title">Create Account</h2>
                  <p className="form-subtitle">Register as a pet owner to get started.</p>
                  <div className="form-grid">
                    <div className="input-group">
                      <label htmlFor="reg-name">Full Name</label>
                      <div className="input-wrap"><input type="text" id="reg-name" placeholder="e.g. Kasun Perera" required value={regName} onChange={(e) => setRegName(e.target.value)} /></div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="reg-phone">Phone Number</label>
                      <div className="input-wrap"><input type="tel" id="reg-phone" placeholder="07X XXX XXXX" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} /></div>
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-email">Email Address</label>
                    <div className="input-wrap"><input type="email" id="reg-email" placeholder="yourname@email.com" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-address">Address</label>
                    <div className="input-wrap"><textarea id="reg-address" placeholder="No. 12, Main Street, Colombo" rows="2" required value={regAddress} onChange={(e) => setRegAddress(e.target.value)}></textarea></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-pass">Create Password</label>
                    <div className="input-wrap"><input type={showPass['reg-pass'] ? 'text' : 'password'} id="reg-pass" placeholder="Min. 8 characters" required value={regPass} onChange={(e) => setRegPass(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('reg-pass')}>{showPass['reg-pass'] ? '🙈' : '👁'}</button></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-pass-confirm">Confirm Password</label>
                    <div className="input-wrap"><input type={showPass['reg-pass-confirm'] ? 'text' : 'password'} id="reg-pass-confirm" placeholder="Re-enter your password" required value={regPassConfirm} onChange={(e) => setRegPassConfirm(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('reg-pass-confirm')}>{showPass['reg-pass-confirm'] ? '🙈' : '👁'}</button></div>
                  </div>
                  <button type="submit" className="submit-btn btn-owner">Create Account</button>
                  <p className="form-switch">Already have an account? <button type="button" className="link-btn" onClick={() => setOwnerMode('signin')}>Sign in &rarr;</button></p>
                </form>
              )}
            </div>
          )}

          {/* DOCTOR PANEL */}
          {role === 'doctor' && (
            <div className="role-panel active" id="panel-doctor">
              <div className="notice-badge notice-blue">
                <span>&#127973;</span>
                <div><strong>Staff Accounts Only</strong><p>Doctor accounts are issued by Hospital HR. Contact administration for account creation.</p></div>
              </div>
              <form className="auth-form" id="form-doctor" onSubmit={handleDoctorLogin} noValidate>
                <h2 className="form-title">Doctor Login</h2>
                <p className="form-subtitle">Access your veterinary professional portal.</p>
                <div className="input-group">
                  <label htmlFor="doc-id">Staff ID or Email</label>
                  <div className="input-wrap"><input type="text" id="doc-id" placeholder="e.g. SJAH-DOC-0042" required value={docId} onChange={(e) => setDocId(e.target.value)} /></div>
                </div>
                <div className="input-group">
                  <label htmlFor="doc-pass">Password</label>
                  <div className="input-wrap"><input type={showPass['doc-pass'] ? 'text' : 'password'} id="doc-pass" placeholder="Enter your password" required value={docPass} onChange={(e) => setDocPass(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('doc-pass')}>{showPass['doc-pass'] ? '🙈' : '👁'}</button></div>
                </div>
                <button type="submit" className="submit-btn btn-doctor">Access Doctor Portal</button>
              </form>
            </div>
          )}

          {/* ADMIN PANEL */}
          {role === 'admin' && (
            <div className="role-panel active" id="panel-admin">
              <div className="notice-badge notice-red">
                <span>&#128274;</span>
                <div><strong>Restricted Access</strong><p>Administrator access is restricted to authorized hospital management personnel only.</p></div>
              </div>
              <form className="auth-form" id="form-admin" onSubmit={handleAdminLogin} noValidate>
                <h2 className="form-title">Administrator Login</h2>
                <p className="form-subtitle">Secure access to hospital management system.</p>
                <div className="input-group">
                  <label htmlFor="admin-id">Admin ID</label>
                  <div className="input-wrap"><input type="text" id="admin-id" placeholder="e.g. SJAH-ADMIN-001" required value={adminId} onChange={(e) => setAdminId(e.target.value)} /></div>
                </div>
                <div className="input-group">
                  <label htmlFor="admin-pass">Password</label>
                  <div className="input-wrap"><input type={showPass['admin-pass'] ? 'text' : 'password'} id="admin-pass" placeholder="Enter your password" required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('admin-pass')}>{showPass['admin-pass'] ? '🙈' : '👁'}</button></div>
                </div>
                <div className="input-group">
                  <label htmlFor="admin-pin">Security PIN / 2FA Code</label>
                  <div className="input-wrap"><input type="text" id="admin-pin" placeholder="6-digit security code" maxLength="6" required value={adminPin} onChange={(e) => setAdminPin(e.target.value)} /></div>
                </div>
                <button type="submit" className="submit-btn btn-admin">Access Admin Portal</button>
              </form>
            </div>
          )}

        </div>
        <p className="login-footer">&copy; 2025 Sri Jayawardanapura Animal Hospital &nbsp;|&nbsp; 0112 888 291</p>
      </main>

      <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`} id="toast" role="alert" aria-live="polite">{toast.message}</div>
    </>
  )
}
