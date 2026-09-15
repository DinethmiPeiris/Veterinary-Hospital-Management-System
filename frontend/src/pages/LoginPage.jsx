import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginDoctor, registerDoctor, formatDoctorDisplayName, requestPasswordReset, resetDoctorPassword } from '../utils/doctorAuth'
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

  const [docMode, setDocMode] = useState('signin')
  const [docRegName, setDocRegName] = useState('')
  const [docRegUsername, setDocRegUsername] = useState('')
  const [docRegEmail, setDocRegEmail] = useState('')
  const [docRegSpecialty, setDocRegSpecialty] = useState('')
  const [docRegPass, setDocRegPass] = useState('')
  const [docRegPassConfirm, setDocRegPassConfirm] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetNewPass, setResetNewPass] = useState('')
  const [resetConfirmPass, setResetConfirmPass] = useState('')
  const [issuedResetCode, setIssuedResetCode] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  const handleDoctorLogin = async (e) => {
    e.preventDefault()
    if (!docId || !docPass) { showToast('Please fill in all fields.', 'error'); return }
    setAuthBusy(true)
    try {
      const session = await loginDoctor({ identifier: docId, password: docPass })
      showToast(`Welcome, ${formatDoctorDisplayName(session.name)}! Redirecting...`, 'info')
      setTimeout(() => navigate('/doctor/dashboard'), 1200)
    } catch (err) {
      showToast(err.message || 'Invalid username or Staff ID / password.', 'error')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleDoctorRegister = async (e) => {
    e.preventDefault()
    if (!docRegName || !docRegUsername || !docRegEmail || !docRegSpecialty || !docRegPass || !docRegPassConfirm) {
      showToast('Please fill in all required fields.', 'error'); return
    }
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(docRegUsername)) {
      showToast('Username must be 3-30 characters (letters, numbers, . _ -).', 'error'); return
    }
    if (docRegPass.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return }
    if (docRegPass !== docRegPassConfirm) { showToast('Passwords do not match.', 'error'); return }
    setAuthBusy(true)
    try {
      const session = await registerDoctor({
        name: docRegName,
        username: docRegUsername,
        email: docRegEmail,
        specialty: docRegSpecialty,
        password: docRegPass,
      })
      showToast(
        `Account created. Username: ${session.username} · Staff ID: ${session.staffId}. Redirecting...`,
        'success'
      )
      setTimeout(() => navigate('/doctor/dashboard'), 1500)
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail) { showToast('Enter your registered email.', 'error'); return }
    setAuthBusy(true)
    try {
      const result = await requestPasswordReset(forgotEmail)
      setIssuedResetCode(result.resetToken || '')
      showToast('Reset code generated. Enter it below with your new password.', 'info')
      setDocMode('reset')
    } catch (err) {
      showToast(err.message || 'Unable to start password reset.', 'error')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail || !resetCode || !resetNewPass || !resetConfirmPass) {
      showToast('Please fill in all reset fields.', 'error'); return
    }
    if (resetNewPass.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return }
    if (resetNewPass !== resetConfirmPass) { showToast('Passwords do not match.', 'error'); return }
    setAuthBusy(true)
    try {
      await resetDoctorPassword({
        email: forgotEmail,
        resetToken: resetCode,
        newPassword: resetNewPass,
      })
      showToast('Password updated. Please sign in with your new password.', 'success')
      setDocMode('signin')
      setDocId(forgotEmail)
      setDocPass('')
      setResetCode('')
      setResetNewPass('')
      setResetConfirmPass('')
      setIssuedResetCode('')
    } catch (err) {
      showToast(err.message || 'Password reset failed.', 'error')
    } finally {
      setAuthBusy(false)
    }
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
              <div className="owner-toggle" style={{marginBottom: '1rem'}}>
                <button className={`toggle-btn${docMode === 'signin' ? ' active' : ''}`} onClick={() => setDocMode('signin')}>Sign In</button>
                <button className={`toggle-btn${docMode === 'register' ? ' active' : ''}`} onClick={() => setDocMode('register')}>New Doctor? Register</button>
              </div>

              {docMode === 'signin' && (
                <form className="auth-form" id="form-doctor" onSubmit={handleDoctorLogin} noValidate>
                  <h2 className="form-title">Doctor Login</h2>
                  <p className="form-subtitle">Sign in with your unique username or Staff ID.</p>
                  <div className="input-group">
                    <label htmlFor="doc-id">Username or Staff ID</label>
                    <div className="input-wrap"><input type="text" id="doc-id" placeholder="e.g. natasha.fdo or SJAH-DOC-001" required value={docId} onChange={(e) => setDocId(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="doc-pass">Password</label>
                    <div className="input-wrap"><input type={showPass['doc-pass'] ? 'text' : 'password'} id="doc-pass" placeholder="Enter your password" required value={docPass} onChange={(e) => setDocPass(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('doc-pass')}>{showPass['doc-pass'] ? '🙈' : '👁'}</button></div>
                  </div>
                  <div className="form-row" style={{ justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button type="button" className="forgot-link link-btn" onClick={() => { setForgotEmail(docId.includes('@') ? docId : ''); setDocMode('forgot') }}>Forgot password?</button>
                  </div>
                  <button type="submit" className="submit-btn btn-doctor" disabled={authBusy}>{authBusy ? 'Signing in...' : 'Access Doctor Portal'}</button>
                </form>
              )}

              {docMode === 'register' && (
                <form className="auth-form" id="form-doctor-register" onSubmit={handleDoctorRegister} noValidate>
                  <h2 className="form-title">Doctor Registration</h2>
                  <p className="form-subtitle">Create a unique username. You will log in with username or Staff ID — not your name.</p>
                  
                  <div className="input-group">
                    <label htmlFor="doc-reg-name">Full Name</label>
                    <div className="input-wrap"><input type="text" id="doc-reg-name" placeholder="Dr. Name" required value={docRegName} onChange={(e) => setDocRegName(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="doc-reg-username">Username</label>
                    <div className="input-wrap"><input type="text" id="doc-reg-username" placeholder="e.g. natasha.fdo" required value={docRegUsername} onChange={(e) => setDocRegUsername(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="doc-reg-email">Email</label>
                    <div className="input-wrap"><input type="email" id="doc-reg-email" placeholder="doctor@hospital.com" required value={docRegEmail} onChange={(e) => setDocRegEmail(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="doc-reg-specialty">Specialty</label>
                    <div className="input-wrap"><input type="text" id="doc-reg-specialty" placeholder="e.g. Surgery, General" required value={docRegSpecialty} onChange={(e) => setDocRegSpecialty(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="doc-reg-pass">Password</label>
                    <div className="input-wrap"><input type={showPass['doc-reg-pass'] ? 'text' : 'password'} id="doc-reg-pass" placeholder="Min. 8 characters" required value={docRegPass} onChange={(e) => setDocRegPass(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('doc-reg-pass')}>{showPass['doc-reg-pass'] ? '🙈' : '👁'}</button></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="doc-reg-pass-confirm">Confirm Password</label>
                    <div className="input-wrap"><input type={showPass['doc-reg-pass-confirm'] ? 'text' : 'password'} id="doc-reg-pass-confirm" placeholder="Re-enter password" required value={docRegPassConfirm} onChange={(e) => setDocRegPassConfirm(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('doc-reg-pass-confirm')}>{showPass['doc-reg-pass-confirm'] ? '🙈' : '👁'}</button></div>
                  </div>
                  
                  <button type="submit" className="submit-btn btn-doctor" disabled={authBusy}>{authBusy ? 'Creating account...' : 'Register as Doctor'}</button>
                </form>
              )}

              {docMode === 'forgot' && (
                <form className="auth-form" onSubmit={handleForgotPassword} noValidate>
                  <h2 className="form-title">Forgot Password</h2>
                  <p className="form-subtitle">Enter the email used during doctor registration.</p>
                  <div className="input-group">
                    <label htmlFor="forgot-email">Registered Email</label>
                    <div className="input-wrap"><input type="email" id="forgot-email" placeholder="doctor@hospital.com" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
                  </div>
                  <button type="submit" className="submit-btn btn-doctor" disabled={authBusy}>{authBusy ? 'Sending...' : 'Get Reset Code'}</button>
                  <p className="form-switch"><button type="button" className="link-btn" onClick={() => setDocMode('signin')}>Back to Sign In</button></p>
                </form>
              )}

              {docMode === 'reset' && (
                <form className="auth-form" onSubmit={handleResetPassword} noValidate>
                  <h2 className="form-title">Reset Password</h2>
                  <p className="form-subtitle">Enter the reset code and choose a new password.</p>
                  {issuedResetCode && (
                    <div className="notice-badge" style={{ marginBottom: '1rem' }}>
                      <div>
                        <strong>Your reset code</strong>
                        <p style={{ margin: '0.25rem 0 0' }}>{issuedResetCode}</p>
                      </div>
                    </div>
                  )}
                  <div className="input-group">
                    <label htmlFor="reset-email">Email</label>
                    <div className="input-wrap"><input type="email" id="reset-email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reset-code">Reset Code</label>
                    <div className="input-wrap"><input type="text" id="reset-code" placeholder="6-digit code" required value={resetCode} onChange={(e) => setResetCode(e.target.value)} /></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reset-new-pass">New Password</label>
                    <div className="input-wrap"><input type={showPass['reset-new-pass'] ? 'text' : 'password'} id="reset-new-pass" placeholder="Min. 8 characters" required value={resetNewPass} onChange={(e) => setResetNewPass(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('reset-new-pass')}>{showPass['reset-new-pass'] ? '🙈' : '👁'}</button></div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reset-confirm-pass">Confirm New Password</label>
                    <div className="input-wrap"><input type={showPass['reset-confirm-pass'] ? 'text' : 'password'} id="reset-confirm-pass" placeholder="Re-enter password" required value={resetConfirmPass} onChange={(e) => setResetConfirmPass(e.target.value)} /><button type="button" className="eye-btn" onClick={() => togglePass('reset-confirm-pass')}>{showPass['reset-confirm-pass'] ? '🙈' : '👁'}</button></div>
                  </div>
                  <button type="submit" className="submit-btn btn-doctor" disabled={authBusy}>{authBusy ? 'Updating...' : 'Update Password'}</button>
                  <p className="form-switch"><button type="button" className="link-btn" onClick={() => setDocMode('signin')}>Back to Sign In</button></p>
                </form>
              )}
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
