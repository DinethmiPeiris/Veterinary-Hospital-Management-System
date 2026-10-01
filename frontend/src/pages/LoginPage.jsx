import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import './LoginPage.css'

const petEmojis = ['🐕', '🐈', '🐇', '🦜', '🐠', '🐹', '🐾', '🦮', '🐈‍⬛', '🦔']

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authMode, setAuthMode] = useState(location.state?.mode || 'signin') // 'signin' or 'register'

  useEffect(() => {
    if (location.state?.mode) {
      setAuthMode(location.state.mode)
    }
  }, [location.state])
  const [toast, setToast] = useState({ message: '', type: '', show: false })

  // Sign In state
  const [loginId, setLoginId] = useState('')
  const [loginPass, setLoginPass] = useState('')

  // Register state
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')

  // Password visibility
  const [showPass, setShowPass] = useState({})

  const togglePass = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
  }

  // Floating pets animation
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

  // Unified Login submission
  const handleUnifiedLogin = async (e) => {
    e.preventDefault()
    if (!loginId || !loginPass) {
      showToast('Please fill in all required fields.', 'error')
      return
    }

    const cleanId = loginId.trim().toLowerCase()

    // Direct check for Admin credentials (instant redirection)
    if ((cleanId === 'admin@vhms.com' || cleanId === 'admin') && loginPass === 'admin123') {
      const adminSession = {
        success: true,
        id: 'SJAH-ADMIN-001',
        name: 'System Admin',
        email: 'admin@vhms.com',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
      localStorage.setItem('vhms_user', JSON.stringify(adminSession))
      showToast('🔐 Welcome, System Admin! Redirecting to Admin Dashboard...', 'info')
      setTimeout(() => navigate('/admin'), 300)
      return
    }

    // Check if this is a locally-registered doctor with a unique custom/temporary password
    try {
      const customDocs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]')
      const customPasswords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}')
      const firstLoginMap = JSON.parse(localStorage.getItem('vhms_first_login_doctors') || '{}')

      const matchedDoc = customDocs.find(d =>
        (d.email && d.email.toLowerCase() === loginId.toLowerCase()) ||
        (d.name && d.name.toLowerCase() === loginId.toLowerCase())
      )

      if (matchedDoc) {
        if (matchedDoc.status === 'DEACTIVATED' || matchedDoc.status === 'INACTIVE') {
          showToast('❌ Your account has been deactivated. Please contact the hospital administrator.', 'error')
          return
        }

        // Doctor found in local roster — validate against stored password (fallback to Doctor@123 for pre-existing system doctors)
        const storedPassword = customPasswords[loginId] || customPasswords[matchedDoc.email] || customPasswords[matchedDoc.name] || 'Doctor@123'

        if (loginPass !== storedPassword) {
          showToast('❌ Incorrect password. Please check your credentials.', 'error')
          return
        }

        const check1 = firstLoginMap[loginId]
        const check2 = matchedDoc.email ? firstLoginMap[matchedDoc.email] : undefined
        const check3 = matchedDoc.name ? firstLoginMap[matchedDoc.name] : undefined
        const isFirstTime = (check1 === true || check2 === true || check3 === true) && check1 !== false && check2 !== false && check3 !== false

        // Password correct — create local session
        const session = { ...matchedDoc, success: true, role: 'DOCTOR', isFirstTimeLogin: isFirstTime }
        localStorage.setItem('vhms_user', JSON.stringify(session))
        localStorage.setItem('vhms_doctor_view', 'OVERVIEW')
        showToast(`🏥 Welcome, ${matchedDoc.name}! Redirecting to Doctor Portal...`, 'info')
        setTimeout(() => navigate('/doctor'), 400)
        return
      }
    } catch { }

    // Check if user is registered in local storage or pending approval
    try {
      const localReg = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]')
      const localPending = JSON.parse(localStorage.getItem('vhms_pending_users') || '[]')

      const regUser = localReg.find(u =>
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.id && u.id.toLowerCase() === cleanId)
      ) || localPending.find(u =>
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.id && u.id.toLowerCase() === cleanId)
      )

      if (regUser) {
        if (regUser.password && regUser.password !== loginPass) {
          showToast('❌ Incorrect password. Please check your credentials.', 'error')
          return
        }

        if (regUser.status === 'PENDING' || regUser.status === 'PENDING_APPROVAL') {
          showToast('⏳ Your account is pending Admin approval. You cannot log in until an administrator approves your account.', 'error')
          return
        }

        if (regUser.status === 'REJECTED') {
          showToast('❌ Your account registration request was declined by the administrator.', 'error')
          return
        }

        // Account is approved and active! Log in:
        const ownerSession = {
          success: true,
          id: regUser.id,
          name: regUser.name,
          email: regUser.email,
          phone: regUser.phone || '0771234567',
          address: regUser.address || '',
          role: 'PET_OWNER',
          status: 'ACTIVE'
        }
        localStorage.setItem('vhms_user', JSON.stringify(ownerSession))
        localStorage.setItem('vhms_pet_view', 'OVERVIEW')
        showToast(`🐾 Welcome back, ${regUser.name}! Redirecting to Pet Owner Dashboard...`, 'success')
        setTimeout(() => navigate('/pets'), 300)
        return
      }
    } catch { }

    // Backend API login call with seamless Pet Owner fallback
    try {
      const response = await api.login({ identifier: loginId, password: loginPass })
      if (response && response.success) {
        if (response.role === 'PET_OWNER' && (response.status === 'PENDING' || response.status === 'PENDING_APPROVAL')) {
          showToast('⏳ Your account is pending Admin approval. You cannot log in until an administrator approves your account.', 'error')
          return
        }
        if (response.role === 'PET_OWNER' && response.status === 'REJECTED') {
          showToast('❌ Your account registration request was declined by the administrator.', 'error')
          return
        }

        localStorage.setItem('vhms_user', JSON.stringify(response))

        if (response.role === 'ADMIN') {
          showToast(`🔐 Welcome, Admin ${response.name}! Redirecting to Admin Dashboard...`, 'info')
          setTimeout(() => navigate('/admin'), 300)
        } else if (response.role === 'DOCTOR') {
          localStorage.setItem('vhms_doctor_view', 'OVERVIEW')
          showToast(`🏥 Welcome, ${response.name}! Redirecting to Doctor Portal...`, 'info')
          setTimeout(() => navigate('/doctor'), 400)
        } else {
          localStorage.setItem('vhms_pet_view', 'OVERVIEW')
          showToast(`🐾 Welcome back, ${response.name || 'Pet Owner'}! Redirecting to Pet Owner Dashboard...`, 'success')
          setTimeout(() => navigate('/pets'), 300)
        }
        return
      }
    } catch (err) {
      console.warn('API login call failed, falling back to local Pet Owner session:', err)
    }

    // Default Pet Owner Login session fallback
    const ownerName = loginId.includes('@') ? loginId.split('@')[0].replace(/[^a-zA-Z]/g, ' ') : loginId
    const formattedName = ownerName ? ownerName.charAt(0).toUpperCase() + ownerName.slice(1) : 'Pet Owner'
    const ownerSession = {
      success: true,
      id: `PO-${Date.now().toString().slice(-4)}`,
      name: formattedName,
      email: loginId.includes('@') ? loginId : `${loginId}@gmail.com`,
      phone: '0771234567',
      role: 'PET_OWNER',
      status: 'ACTIVE'
    }
    localStorage.setItem('vhms_user', JSON.stringify(ownerSession))
    localStorage.setItem('vhms_pet_view', 'OVERVIEW')
    showToast(`🐾 Welcome back, ${formattedName}! Redirecting to Pet Owner Dashboard...`, 'success')
    setTimeout(() => navigate('/pets'), 300)
  }

  // Field validation errors state
  const [regErrors, setRegErrors] = useState({})

  const validatePasswordComplexity = (password) => {
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters long.'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter (A-Z).'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter (a-z).'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number (0-9).'
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one special character (e.g. !@#$%^&*).'
    }
    return null
  }

  const validateRegisterForm = () => {
    const errs = {}

    // 1. Full Name Validation
    const nameTrim = regName.trim()
    if (!nameTrim) {
      errs.regName = 'Full Name is required.'
    } else if (nameTrim.length < 3) {
      errs.regName = 'Full Name must be at least 3 characters long.'
    } else if (!/^[a-zA-Z\s'.]+$/.test(nameTrim)) {
      errs.regName = 'Full Name should only contain letters and spaces.'
    }

    // 2. Phone Number Validation
    const cleanPhone = regPhone.replace(/\D/g, '')
    if (!regPhone) {
      errs.regPhone = 'Phone Number is required.'
    } else if (cleanPhone.length !== 10 || !/^0\d{9}$/.test(cleanPhone)) {
      errs.regPhone = 'Phone Number must be a valid 10-digit Sri Lankan phone number starting with 0 (e.g. 0771234567).'
    }

    // 3. Email Address Validation
    const emailTrim = regEmail.trim()
    if (!emailTrim) {
      errs.regEmail = 'Email Address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errs.regEmail = 'Please enter a valid email address (e.g. name@domain.com).'
    }

    // 4. Address Validation
    const addressTrim = regAddress.trim()
    if (!addressTrim) {
      errs.regAddress = 'Address is required.'
    } else if (addressTrim.length < 5) {
      errs.regAddress = 'Please enter a complete address (at least 5 characters).'
    }

    // 5. Password Validation
    if (!regPass) {
      errs.regPass = 'Password is required.'
    } else {
      const passErr = validatePasswordComplexity(regPass)
      if (passErr) errs.regPass = passErr
    }

    // 6. Confirm Password Validation
    if (!regPassConfirm) {
      errs.regPassConfirm = 'Please confirm your password.'
    } else if (regPass !== regPassConfirm) {
      errs.regPassConfirm = 'Passwords do not match.'
    }

    return errs
  }

  // Pet Owner Registration handler
  const handleOwnerRegister = async (e) => {
    e.preventDefault()
    const errs = validateRegisterForm()
    setRegErrors(errs)

    if (Object.keys(errs).length > 0) {
      const firstErrorKey = Object.keys(errs)[0]
      showToast(`❌ ${errs[firstErrorKey]}`, 'error')
      return
    }

    const newPendingUser = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone,
      address: regAddress,
      password: regPass,
      role: 'PET_OWNER',
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString()
    }

    try {
      const localPending = JSON.parse(localStorage.getItem('vhms_pending_users') || '[]')
      if (!localPending.some(u => u.email === newPendingUser.email)) {
        localPending.push(newPendingUser)
        localStorage.setItem('vhms_pending_users', JSON.stringify(localPending))
      }

      const localReg = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]')
      if (!localReg.some(u => u.email === newPendingUser.email)) {
        localReg.push(newPendingUser)
        localStorage.setItem('vhms_registered_users', JSON.stringify(localReg))
      }
    } catch { }

    try {
      await api.register({
        name: regName,
        phone: regPhone,
        email: regEmail,
        address: regAddress,
        password: regPass,
      })
    } catch (err) {
      console.warn('Backend registration warning:', err)
    }

    // Reset registration form fields & errors
    setRegName('')
    setRegPhone('')
    setRegEmail('')
    setRegAddress('')
    setRegPass('')
    setRegPassConfirm('')
    setRegErrors({})

    // Switch to Sign In mode with success toast informing that Admin approval is required
    showToast('🎉 Registration submitted! Your account is pending Admin approval before you can log in.', 'success')
    setAuthMode('signin')
  }

  return (
    <>
      <div className="bg-gradient" aria-hidden="true"></div>
      <div className="bg-paws" aria-hidden="true"></div>
      <div className="floating-pets" id="floating-pets" aria-hidden="true"></div>

      <Link to="/" className="back-home">&#8592; Back to Home</Link>

      <main className="login-main">
        <div className="login-card" id="login-card">

          {/* BRAND HEADER */}
          <div className="login-brand">
            <div className="brand-icon">&#9729;</div>
            <div className="brand-text">
              <strong>Sri Jayawardenapura</strong>
              <span>Animal Hospital</span>
            </div>
          </div>

          {/* UNIFIED SIGN IN FORM */}
          {authMode === 'signin' ? (
            <form className="auth-form" id="form-unified-login" onSubmit={handleUnifiedLogin} noValidate>
              <h2 className="form-title">Welcome Back!</h2>
              <p className="form-subtitle">Sign in to access your portal (Pet Owner, Doctor, or Admin).</p>

              <div className="input-group">
                <label htmlFor="login-id">Email or Account ID</label>
                <div className="input-wrap">
                  <input
                    type="text"
                    id="login-id"
                    placeholder="e.g. name@email.com or Staff/Admin ID"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="login-pass">Password</label>
                <div className="input-wrap">
                  <input
                    type={showPass['login-pass'] ? 'text' : 'password'}
                    id="login-pass"
                    placeholder="Enter your password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => togglePass('login-pass')}
                  >
                    {showPass['login-pass'] ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="submit-btn btn-owner">Sign In</button>

              <p className="form-switch">
                No account? <button type="button" className="link-btn" onClick={() => setAuthMode('register')}>Create a pet owner account &rarr;</button>
              </p>
            </form>
          ) : (
            /* PET OWNER REGISTRATION FORM */
            <form className="auth-form" id="form-owner-register" onSubmit={handleOwnerRegister} noValidate>
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Register as a pet owner to get started.</p>

              <div className="form-grid">
                <div className="input-group">
                  <label htmlFor="reg-name">Full Name</label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      id="reg-name"
                      className={regErrors.regName ? 'input-invalid' : ''}
                      placeholder="e.g. Kasun Perera"
                      required
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (regErrors.regName) setRegErrors(prev => ({ ...prev, regName: null }));
                      }}
                    />
                  </div>
                  {regErrors.regName && <span className="field-error-text">⚠️ {regErrors.regName}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="reg-phone">Phone Number</label>
                  <div className="input-wrap">
                    <input
                      type="tel"
                      id="reg-phone"
                      className={regErrors.regPhone ? 'input-invalid' : ''}
                      placeholder="0771234567"
                      required
                      maxLength={10}
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        if (regErrors.regPhone) setRegErrors(prev => ({ ...prev, regPhone: null }));
                      }}
                    />
                  </div>
                  {regErrors.regPhone && <span className="field-error-text">⚠️ {regErrors.regPhone}</span>}
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="reg-email">Email Address</label>
                <div className="input-wrap">
                  <input
                    type="email"
                    id="reg-email"
                    className={regErrors.regEmail ? 'input-invalid' : ''}
                    placeholder="yourname@email.com"
                    required
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (regErrors.regEmail) setRegErrors(prev => ({ ...prev, regEmail: null }));
                    }}
                  />
                </div>
                {regErrors.regEmail && <span className="field-error-text">⚠️ {regErrors.regEmail}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="reg-address">Address</label>
                <div className="input-wrap">
                  <textarea
                    id="reg-address"
                    className={regErrors.regAddress ? 'input-invalid' : ''}
                    placeholder="No. 12, Main Street, Colombo"
                    rows="2"
                    required
                    value={regAddress}
                    onChange={(e) => {
                      setRegAddress(e.target.value);
                      if (regErrors.regAddress) setRegErrors(prev => ({ ...prev, regAddress: null }));
                    }}
                  ></textarea>
                </div>
                {regErrors.regAddress && <span className="field-error-text">⚠️ {regErrors.regAddress}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="reg-pass">Create Password</label>
                <div className="input-wrap">
                  <input
                    type={showPass['reg-pass'] ? 'text' : 'password'}
                    id="reg-pass"
                    className={regErrors.regPass ? 'input-invalid' : ''}
                    placeholder="Create a strong password"
                    required
                    value={regPass}
                    onChange={(e) => {
                      setRegPass(e.target.value);
                      if (regErrors.regPass) setRegErrors(prev => ({ ...prev, regPass: null }));
                    }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => togglePass('reg-pass')}
                  >
                    {showPass['reg-pass'] ? '🙈' : '👁'}
                  </button>
                </div>
                {regErrors.regPass && <span className="field-error-text">⚠️ {regErrors.regPass}</span>}
                {regPass && (
                  <div style={{ marginTop: '8px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', color: '#475569' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>Password Requirements:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <span style={{ color: regPass.length >= 6 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {regPass.length >= 6 ? '✓' : '✗'} Min. 6 characters
                      </span>
                      <span style={{ color: /[A-Z]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {/[A-Z]/.test(regPass) ? '✓' : '✗'} Uppercase (A-Z)
                      </span>
                      <span style={{ color: /[a-z]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {/[a-z]/.test(regPass) ? '✓' : '✗'} Lowercase (a-z)
                      </span>
                      <span style={{ color: /[0-9]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {/[0-9]/.test(regPass) ? '✓' : '✗'} Number (0-9)
                      </span>
                      <span style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600, gridColumn: 'span 2' }}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPass) ? '✓' : '✗'} Special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="reg-pass-confirm">Confirm Password</label>
                <div className="input-wrap">
                  <input
                    type={showPass['reg-pass-confirm'] ? 'text' : 'password'}
                    id="reg-pass-confirm"
                    className={regErrors.regPassConfirm ? 'input-invalid' : ''}
                    placeholder="Re-enter your password"
                    required
                    value={regPassConfirm}
                    onChange={(e) => {
                      setRegPassConfirm(e.target.value);
                      if (regErrors.regPassConfirm) setRegErrors(prev => ({ ...prev, regPassConfirm: null }));
                    }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => togglePass('reg-pass-confirm')}
                  >
                    {showPass['reg-pass-confirm'] ? '🙈' : '👁'}
                  </button>
                </div>
                {regErrors.regPassConfirm && <span className="field-error-text">⚠️ {regErrors.regPassConfirm}</span>}
              </div>

              <button type="submit" className="submit-btn btn-owner">Create Account</button>

              <p className="form-switch">
                Already have an account? <button type="button" className="link-btn" onClick={() => setAuthMode('signin')}>Sign in &rarr;</button>
              </p>
            </form>
          )}

        </div>
        <p className="login-footer">&copy; 2025 Sri Jayawardenapura Animal Hospital &nbsp;|&nbsp; 0112 888 291</p>
      </main>

      <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`} id="toast" role="alert" aria-live="polite">{toast.message}</div>
    </>
  )
}
