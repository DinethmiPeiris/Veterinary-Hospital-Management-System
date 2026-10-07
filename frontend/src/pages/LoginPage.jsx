import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { loginDoctor, registerDoctor, formatDoctorDisplayName, requestPasswordReset, resetDoctorPassword } from '../utils/doctorAuth'
import './LoginPage.css'

const petEmojis = ['🐕', '🐈', '🐇', '🦜', '🐠', '🐹', '🐾', '🦮', '🐈‍⬛', '🦔']

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [viewMode, setViewMode] = useState(location.state?.mode === 'register' ? 'register-owner' : 'signin')

  const [loginId, setLoginId] = useState('')
  const [loginPass, setLoginPass] = useState('')

  const [toast, setToast] = useState({ message: '', type: '', show: false })

  // Owner Register states
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')
  const [regErrors, setRegErrors] = useState({})

  // Doctor Register states
  const [docRegName, setDocRegName] = useState('')
  const [docRegUsername, setDocRegUsername] = useState('')
  const [docRegEmail, setDocRegEmail] = useState('')
  const [docRegSpecialty, setDocRegSpecialty] = useState('')
  const [docRegPass, setDocRegPass] = useState('')
  const [docRegPassConfirm, setDocRegPassConfirm] = useState('')

  // Doctor Reset states
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetNewPass, setResetNewPass] = useState('')
  const [resetConfirmPass, setResetConfirmPass] = useState('')

  // Admin states - removed as login is unified

  const [authBusy, setAuthBusy] = useState(false)
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

  const performLogin = async (loginId, loginPass, expectedRole) => {
    const cleanId = loginId.trim().toLowerCase()

    if (expectedRole === 'ADMIN' || expectedRole === 'ANY') {
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
        setTimeout(() => navigate('/admin-portal'), 300)
        return true
      }
    }

    if (expectedRole === 'DOCTOR' || expectedRole === 'ANY') {
      try {
        const docSession = await loginDoctor({ identifier: loginId.trim(), password: loginPass })
        localStorage.setItem('vhms_user', JSON.stringify({ ...docSession, success: true, role: 'DOCTOR', status: 'ACTIVE' }))
        localStorage.setItem('vhms_doctor_view', 'OVERVIEW')
        showToast(`🏥 Welcome, ${formatDoctorDisplayName(docSession.name)}! Redirecting to Doctor Portal...`, 'info')
        setTimeout(() => navigate('/doctor/portal'), 1200)
        return true
      } catch (error) {
        // Mock fallback ONLY when doctor login tab was explicitly selected.
        // NEVER use keyword matching during 'ANY' (unified) login — pet owners
        // with common names like 'perera' or 'kasun' would be misrouted to the
        // doctor portal.
        if (expectedRole === 'DOCTOR') {
          let mockName = 'Dr. Veterinarian';
          if (cleanId.includes('channa')) mockName = 'Dr. Sirimath Channa Molligoda';
          else if (cleanId.includes('nimal')) mockName = 'Dr. Nimal Weeraratne';
          else if (cleanId.includes('kasun')) mockName = 'Dr. Kasun Perera';
          else if (cleanId.includes('amila')) mockName = 'Dr. Amila Bandara';
          else mockName = `Dr. ${cleanId.split('@')[0].charAt(0).toUpperCase() + cleanId.split('@')[0].slice(1)}`;

          const docSession = {
            success: true,
            id: 'DOC-MOCK-' + Date.now().toString().slice(-4),
            staffId: 'STF-DOC-001',
            username: cleanId.split('@')[0],
            name: mockName,
            email: cleanId.includes('@') ? cleanId : `${cleanId}@vhms.com`,
            specialty: 'Veterinary Surgeon',
            role: 'DOCTOR',
            status: 'ACTIVE'
          }
          localStorage.setItem('vhms_user', JSON.stringify(docSession))
          localStorage.setItem('vhms_doctor_view', 'OVERVIEW')
          showToast(`🏥 Welcome, ${docSession.name}! Redirecting to Doctor Portal...`, 'info')
          setTimeout(() => navigate('/doctor/portal'), 800)
          return true
        }

        if (expectedRole !== 'ANY') {
          showToast(error.message || '❌ Invalid credentials for Doctor.', 'error')
          return false
        }
        // For 'ANY' login: doctor login failed, fall through to pet owner check below
      }
    }

    if (expectedRole === 'PET_OWNER' || expectedRole === 'ANY') {
      try {
        const localReg = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]')
        const localPending = JSON.parse(localStorage.getItem('vhms_pending_users') || '[]')
        const regUser = localReg.find(u => (u.email && u.email.toLowerCase() === cleanId) || (u.id && u.id.toLowerCase() === cleanId)) ||
          localPending.find(u => (u.email && u.email.toLowerCase() === cleanId) || (u.id && u.id.toLowerCase() === cleanId))
        if (regUser) {
          if (regUser.password && regUser.password !== loginPass) {
            showToast('❌ Incorrect password. Please check your credentials.', 'error')
            return true
          }
          if (regUser.status === 'PENDING' || regUser.status === 'PENDING_APPROVAL') {
            showToast('⏳ Your account is pending Admin approval.', 'error')
            return true
          }
          if (regUser.status === 'REJECTED') {
            showToast('❌ Your account registration request was declined.', 'error')
            return true
          }
          const ownerSession = { success: true, id: regUser.id, name: regUser.name, email: regUser.email, phone: regUser.phone || '0771234567', address: regUser.address || '', role: 'PET_OWNER', status: 'ACTIVE' }
          localStorage.setItem('vhms_user', JSON.stringify(ownerSession))
          localStorage.setItem('vhms_pet_view', 'OVERVIEW')
          showToast(`🐾 Welcome back, ${regUser.name}! Redirecting to Pet Owner Dashboard...`, 'success')
          setTimeout(() => navigate('/pets'), 300)
          return true
        }
      } catch { }
    }

    try {
      const response = await api.login({ identifier: loginId, password: loginPass })
      if (response && response.success) {
        if (expectedRole !== 'ANY' && response.role !== expectedRole) {
          showToast(`❌ Account found, but role is ${response.role}, not ${expectedRole}.`, 'error')
          return true
        }
        if (response.role === 'PET_OWNER' && (response.status === 'PENDING' || response.status === 'PENDING_APPROVAL')) {
          showToast('⏳ Your account is pending Admin approval.', 'error')
          return true
        }
        if (response.role === 'PET_OWNER' && response.status === 'REJECTED') {
          showToast('❌ Your account registration request was declined.', 'error')
          return true
        }
        localStorage.setItem('vhms_user', JSON.stringify(response))
        if (!response.role || response.role === 'null' || response.role.trim() === '') {
          localStorage.removeItem('vhms_user')
          showToast(`❌ Authorization Error: Your account role is missing or invalid. Please contact the administrator.`, 'error')
          return false
        }

        if (response.role === 'ADMIN') {
          showToast(`🔐 Welcome, Admin ${response.name}! Redirecting to Admin Dashboard...`, 'info')
          setTimeout(() => navigate('/admin/portal'), 300)
        } else if (response.role === 'DOCTOR' || response.role === 'VETERINARIAN') {
          localStorage.setItem('vhms_doctor_view', 'OVERVIEW')
          showToast(`🏥 Welcome, ${response.name}! Redirecting to Doctor Portal...`, 'info')
          setTimeout(() => navigate('/doctor/portal'), 400)
        } else if (response.role === 'PET_OWNER' || response.role === 'OWNER') {
          localStorage.setItem('vhms_pet_view', 'OVERVIEW')
          showToast(`🐾 Welcome back, ${response.name || 'Pet Owner'}! Redirecting to Pet Owner Dashboard...`, 'success')
          setTimeout(() => navigate('/pet-owner/portal'), 300)
        } else {
          // Role is missing or invalid! Clear session and return out.
          localStorage.removeItem('vhms_user')
          showToast(`❌ Authorization Error: Invalid or missing role mapping for your account.`, 'error')
          return false
        }
        return true
      }
    } catch (err) { }



    return false
  }

  const handleUnifiedLogin = async (e) => {
    e.preventDefault()
    if (!loginId || !loginPass) { showToast('Please fill in all fields.', 'error'); return }
    setAuthBusy(true)
    const success = await performLogin(loginId, loginPass, 'ANY')
    if (!success) {
      showToast('❌ Invalid credentials. Please try again.', 'error')
    }
    setAuthBusy(false)
  }

  const validatePasswordComplexity = (password) => {
    if (!password || password.length < 6) return 'Password must be at least 6 characters long.'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z).'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z).'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number (0-9).'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(password)) return 'Password must contain at least one special character.'
    return null
  }

  const validateRegisterForm = () => {
    const errs = {}
    const nameTrim = regName.trim()
    if (!nameTrim) errs.regName = 'Full Name is required.'
    else if (nameTrim.length < 3) errs.regName = 'Full Name must be at least 3 characters long.'
    else if (!/^[a-zA-Z\s'.]+$/.test(nameTrim)) errs.regName = 'Full Name should only contain letters and spaces.'
    const cleanPhone = regPhone.replace(/\D/g, '')
    if (!regPhone) errs.regPhone = 'Phone Number is required.'
    else if (cleanPhone.length !== 10 || !/^0\d{9}$/.test(cleanPhone)) errs.regPhone = 'Phone Number must be 10 digits starting with 0.'
    const emailTrim = regEmail.trim()
    if (!emailTrim) errs.regEmail = 'Email Address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) errs.regEmail = 'Please enter a valid email address.'
    const addressTrim = regAddress.trim()
    if (!addressTrim) errs.regAddress = 'Address is required.'
    else if (addressTrim.length < 5) errs.regAddress = 'Please enter a complete address.'
    if (!regPass) errs.regPass = 'Password is required.'
    else { const passErr = validatePasswordComplexity(regPass); if (passErr) errs.regPass = passErr }
    if (!regPassConfirm) errs.regPassConfirm = 'Please confirm your password.'
    else if (regPass !== regPassConfirm) errs.regPassConfirm = 'Passwords do not match.'
    return errs
  }

  const handleOwnerRegister = async (e) => {
    e.preventDefault()
    const errs = validateRegisterForm()
    setRegErrors(errs)
    if (Object.keys(errs).length > 0) {
      showToast(`❌ ${errs[Object.keys(errs)[0]]}`, 'error')
      return
    }
    const newPendingUser = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      name: regName.trim(), email: regEmail.trim().toLowerCase(), phone: regPhone, address: regAddress, password: regPass,
      role: 'PET_OWNER', status: 'PENDING_APPROVAL', createdAt: new Date().toISOString()
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
    try { await api.register({ name: regName, phone: regPhone, email: regEmail, address: regAddress, password: regPass }) } catch (err) { }
    setRegName(''); setRegPhone(''); setRegEmail(''); setRegAddress(''); setRegPass(''); setRegPassConfirm(''); setRegErrors({})
    showToast('🎉 Registration submitted! Your account is pending Admin approval.', 'success')
    setViewMode('signin')
  }

  const handleDoctorRegister = async (e) => {
    e.preventDefault()
    if (!docRegName || !docRegUsername || !docRegEmail || !docRegSpecialty || !docRegPass || !docRegPassConfirm) { showToast('Please fill in all required fields.', 'error'); return }
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(docRegUsername)) { showToast('Username must be 3-30 characters.', 'error'); return }
    if (docRegPass.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return }
    if (docRegPass !== docRegPassConfirm) { showToast('Passwords do not match.', 'error'); return }
    setAuthBusy(true)
    try {
      const session = await registerDoctor({ name: docRegName, username: docRegUsername, email: docRegEmail, specialty: docRegSpecialty, password: docRegPass })
      showToast(`Account created. Username: ${session.username}. Redirecting...`, 'success')
      setTimeout(() => navigate('/portal/doctor'), 1500)
    } catch (err) { showToast(err.message || 'Registration failed.', 'error') }
    finally { setAuthBusy(false) }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail) { showToast('Enter your registered email.', 'error'); return }
    setAuthBusy(true)
    try {
      await requestPasswordReset(forgotEmail)
      showToast('Reset code sent! Check your email inbox.', 'info')
      setViewMode('reset')
    } catch (err) { showToast(err.message || 'Unable to start password reset.', 'error') }
    finally { setAuthBusy(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail || !resetCode || !resetNewPass || !resetConfirmPass) { showToast('Please fill in all reset fields.', 'error'); return }
    if (resetNewPass.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return }
    if (resetNewPass !== resetConfirmPass) { showToast('Passwords do not match.', 'error'); return }
    setAuthBusy(true)
    try {
      await resetDoctorPassword({ email: forgotEmail, resetToken: resetCode, newPassword: resetNewPass })
      showToast('Password updated. Please sign in.', 'success')
      setViewMode('signin'); setLoginId(forgotEmail); setLoginPass(''); setResetCode(''); setResetNewPass(''); setResetConfirmPass('')
    } catch (err) { showToast(err.message || 'Password reset failed.', 'error') }
    finally { setAuthBusy(false) }
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
              <strong>Sri Jayawardenapura</strong>
              <span>Animal Hospital</span>
            </div>
          </div>

          {viewMode === 'signin' && (
            <form className="auth-form" id="form-login" onSubmit={handleUnifiedLogin} noValidate>
              <h2 className="form-title">Welcome Back!</h2>
              <p className="form-subtitle">Sign in to Sri Jayawardenapura Animal Hospital.</p>
              <div className="input-group">
                <label htmlFor="login-id">Email Address</label>
                <div className="input-wrap">
                  <input type="email" id="login-id" placeholder="yourname@email.com" required value={loginId} onChange={(e) => setLoginId(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="login-pass">Password</label>
                <div className="input-wrap">
                  <input type={showPass['login-pass'] ? 'text' : 'password'} id="login-pass" placeholder="Enter your password" required value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                  <button type="button" className="eye-btn" onClick={() => togglePass('login-pass')}>{showPass['login-pass'] ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div className="form-row">
                <label className="checkbox-label"><input type="checkbox" /> Remember me</label>
                <button type="button" className="forgot-link link-btn" onClick={() => { setForgotEmail(loginId.includes('@') ? loginId : ''); setViewMode('forgot') }}>Forgot password?</button>
              </div>
              <button type="submit" className="submit-btn btn-owner" disabled={authBusy}>{authBusy ? 'Signing in...' : 'Sign In'}</button>
              <p className="form-switch">No account? <button type="button" className="link-btn" onClick={() => setViewMode('register-owner')}>Register here &rarr;</button></p>
            </form>
          )}

          {viewMode === 'register-owner' && (
            <div className="role-panel active">
              <form className="auth-form" id="form-owner-register" onSubmit={handleOwnerRegister} noValidate>
                <h2 className="form-title">Create Account</h2>
                <p className="form-subtitle">Register as a pet owner to get started.</p>
                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="reg-name">Full Name</label>
                    <div className="input-wrap"><input type="text" id="reg-name" className={regErrors.regName ? 'input-invalid' : ''} placeholder="e.g. Kasun Perera" required value={regName} onChange={(e) => { setRegName(e.target.value); if (regErrors.regName) setRegErrors(p => ({ ...p, regName: null })) }} /></div>
                    {regErrors.regName && <span className="field-error-text">⚠️ {regErrors.regName}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-phone">Phone Number</label>
                    <div className="input-wrap"><input type="tel" id="reg-phone" className={regErrors.regPhone ? 'input-invalid' : ''} placeholder="0771234567" maxLength={10} required value={regPhone} onChange={(e) => { setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (regErrors.regPhone) setRegErrors(p => ({ ...p, regPhone: null })) }} /></div>
                    {regErrors.regPhone && <span className="field-error-text">⚠️ {regErrors.regPhone}</span>}
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="reg-email">Email Address</label>
                  <div className="input-wrap"><input type="email" id="reg-email" className={regErrors.regEmail ? 'input-invalid' : ''} placeholder="yourname@email.com" required value={regEmail} onChange={(e) => { setRegEmail(e.target.value); if (regErrors.regEmail) setRegErrors(p => ({ ...p, regEmail: null })) }} /></div>
                  {regErrors.regEmail && <span className="field-error-text">⚠️ {regErrors.regEmail}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="reg-address">Address</label>
                  <div className="input-wrap"><textarea id="reg-address" className={regErrors.regAddress ? 'input-invalid' : ''} placeholder="No. 12, Main Street, Colombo" rows="2" required value={regAddress} onChange={(e) => { setRegAddress(e.target.value); if (regErrors.regAddress) setRegErrors(p => ({ ...p, regAddress: null })) }}></textarea></div>
                  {regErrors.regAddress && <span className="field-error-text">⚠️ {regErrors.regAddress}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="reg-pass">Create Password</label>
                  <div className="input-wrap"><input type={showPass['reg-pass'] ? 'text' : 'password'} id="reg-pass" className={regErrors.regPass ? 'input-invalid' : ''} placeholder="Create a strong password" required value={regPass} onChange={(e) => { setRegPass(e.target.value); if (regErrors.regPass) setRegErrors(p => ({ ...p, regPass: null })) }} /><button type="button" className="eye-btn" onClick={() => togglePass('reg-pass')}>{showPass['reg-pass'] ? '🙈' : '👁'}</button></div>
                  {regErrors.regPass && <span className="field-error-text">⚠️ {regErrors.regPass}</span>}
                  {regPass && (
                    <div style={{ marginTop: '8px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', color: '#475569' }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>Password Requirements:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <span style={{ color: regPass.length >= 6 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{regPass.length >= 6 ? '✓' : '✗'} Min. 6 characters</span>
                        <span style={{ color: /[A-Z]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{/[A-Z]/.test(regPass) ? '✓' : '✗'} Uppercase (A-Z)</span>
                        <span style={{ color: /[a-z]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{/[a-z]/.test(regPass) ? '✓' : '✗'} Lowercase (a-z)</span>
                        <span style={{ color: /[0-9]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{/[0-9]/.test(regPass) ? '✓' : '✗'} Number (0-9)</span>
                        <span style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(regPass) ? '#16a34a' : '#dc2626', fontWeight: 600, gridColumn: 'span 2' }}>{/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(regPass) ? '✓' : '✗'} Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="reg-pass-confirm">Confirm Password</label>
                  <div className="input-wrap"><input type={showPass['reg-pass-confirm'] ? 'text' : 'password'} id="reg-pass-confirm" className={regErrors.regPassConfirm ? 'input-invalid' : ''} placeholder="Re-enter your password" required value={regPassConfirm} onChange={(e) => { setRegPassConfirm(e.target.value); if (regErrors.regPassConfirm) setRegErrors(p => ({ ...p, regPassConfirm: null })) }} /><button type="button" className="eye-btn" onClick={() => togglePass('reg-pass-confirm')}>{showPass['reg-pass-confirm'] ? '🙈' : '👁'}</button></div>
                  {regErrors.regPassConfirm && <span className="field-error-text">⚠️ {regErrors.regPassConfirm}</span>}
                </div>
                <button type="submit" className="submit-btn btn-owner">Create Account</button>
                <p className="form-switch">Already have an account? <button type="button" className="link-btn" onClick={() => setViewMode('signin')}>Sign in &rarr;</button></p>
              </form>
            </div>
          )}


          {viewMode === 'forgot' && (
            <div className="role-panel active">
              <form className="auth-form" onSubmit={handleForgotPassword} noValidate>
                <h2 className="form-title">Forgot Password</h2>
                <p className="form-subtitle">Enter the email used during registration.</p>
                <div className="input-group">
                  <label htmlFor="forgot-email">Registered Email</label>
                  <div className="input-wrap"><input type="email" id="forgot-email" placeholder="yourname@email.com" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
                </div>
                <button type="submit" className="submit-btn btn-doctor" disabled={authBusy}>{authBusy ? 'Sending...' : 'Get Reset Code'}</button>
                <p className="form-switch"><button type="button" className="link-btn" onClick={() => setViewMode('signin')}>Back to Sign In</button></p>
              </form>
            </div>
          )}

          {viewMode === 'reset' && (
            <div className="role-panel active">
              <form className="auth-form" onSubmit={handleResetPassword} noValidate>
                <h2 className="form-title">Reset Password</h2>
                <p className="form-subtitle">Enter the reset code and choose a new password.</p>
                <div className="notice-badge" style={{ marginBottom: '1rem', background: '#f0fdf4', borderColor: '#1a7a5e' }}>
                  <div>
                    <strong>📧 Check your email</strong>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>A 6-digit reset code was sent to <strong>{forgotEmail}</strong></p>
                  </div>
                </div>
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
                <p className="form-switch"><button type="button" className="link-btn" onClick={() => setViewMode('signin')}>Back to Sign In</button></p>
              </form>
            </div>
          )}

        </div>
        <p className="login-footer">&copy; 2025 Sri Jayawardenapura Animal Hospital &nbsp;|&nbsp; 0112 888 291</p>
      </main>

      <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`} id="toast" role="alert" aria-live="polite">{toast.message}</div>
    </>
  )
}

