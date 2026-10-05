import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { loginDoctor, registerDoctor, formatDoctorDisplayName, requestPasswordReset, resetDoctorPassword } from '../utils/doctorAuth'
import './LoginPage.css'

const petEmojis = ['🐕', '🐈', '🐇', '🦜', '🐠', '🐹', '🐾', '🦮', '🐈‍⬛', '🦔']

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [role, setRole] = useState('owner') // 'owner', 'doctor', 'admin'
  const [ownerMode, setOwnerMode] = useState(location.state?.mode || 'signin') // 'signin' or 'register'
  const [docMode, setDocMode] = useState('signin')

  const [toast, setToast] = useState({ message: '', type: '', show: false })

  // Owner states
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPass, setOwnerPass] = useState('')

  // Owner Register states
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')
  const [regErrors, setRegErrors] = useState({})

  // Doctor states
  const [docId, setDocId] = useState('')
  const [docPass, setDocPass] = useState('')
  
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
  
  // Admin states
  const [adminId, setAdminId] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [adminPin, setAdminPin] = useState('')

  const [authBusy, setAuthBusy] = useState(false)
  const [showPass, setShowPass] = useState({})

  const togglePass = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
  }

  const tabPositions = { owner: '4px', doctor: 'calc(33.33% + 2px)', admin: 'calc(66.66% + 0px)' }

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
        showToast(`Welcome, ${formatDoctorDisplayName(docSession.name)}! Redirecting...`, 'info')
        setTimeout(() => navigate('/doctor/dashboard'), 1200)
        return true
      } catch { }

      try {
        const customDocs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]')
        const customPasswords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}')
        const firstLoginMap = JSON.parse(localStorage.getItem('vhms_first_login_doctors') || '{}')
        const matchedDoc = customDocs.find(d => (d.email && d.email.toLowerCase() === cleanId) || (d.name && d.name.toLowerCase() === cleanId))
        if (matchedDoc) {
          if (matchedDoc.status === 'DEACTIVATED' || matchedDoc.status === 'INACTIVE') {
            showToast('❌ Your account has been deactivated. Please contact the hospital administrator.', 'error')
            return true
          }
          const storedPassword = customPasswords[loginId] || customPasswords[matchedDoc.email] || customPasswords[matchedDoc.name] || 'Doctor@123'
          if (loginPass !== storedPassword) {
            showToast('❌ Incorrect password. Please check your credentials.', 'error')
            return true
          }
          const check1 = firstLoginMap[loginId]
          const check2 = matchedDoc.email ? firstLoginMap[matchedDoc.email] : undefined
          const check3 = matchedDoc.name ? firstLoginMap[matchedDoc.name] : undefined
          const isFirstTime = (check1 === true || check2 === true || check3 === true) && check1 !== false && check2 !== false && check3 !== false
          const session = { ...matchedDoc, success: true, role: 'DOCTOR', isFirstTimeLogin: isFirstTime }
          localStorage.setItem('vhms_user', JSON.stringify(session))
          localStorage.setItem('vhms_doctor_view', 'OVERVIEW')
          showToast(`🏥 Welcome, ${matchedDoc.name}! Redirecting to Doctor Portal...`, 'info')
          setTimeout(() => navigate('/doctor-portal'), 400)
          return true
        }
      } catch { }
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
        if (response.role === 'ADMIN') {
          showToast(`🔐 Welcome, Admin ${response.name}! Redirecting to Admin Dashboard...`, 'info')
          setTimeout(() => navigate('/admin-portal'), 300)
        } else if (response.role === 'DOCTOR') {
          localStorage.setItem('vhms_doctor_view', 'OVERVIEW')
          showToast(`🏥 Welcome, ${response.name}! Redirecting to Doctor Portal...`, 'info')
          setTimeout(() => navigate('/doctor-portal'), 400)
        } else {
          localStorage.setItem('vhms_pet_view', 'OVERVIEW')
          showToast(`🐾 Welcome back, ${response.name || 'Pet Owner'}! Redirecting to Pet Owner Dashboard...`, 'success')
          setTimeout(() => navigate('/pets'), 300)
        }
        return true
      }
    } catch (err) { }
    
    if (expectedRole === 'PET_OWNER' || expectedRole === 'ANY') {
      const ownerName = loginId.includes('@') ? loginId.split('@')[0].replace(/[^a-zA-Z]/g, ' ') : loginId
      const formattedName = ownerName ? ownerName.charAt(0).toUpperCase() + ownerName.slice(1) : 'Pet Owner'
      // Stable ID per email so pets registered under this login are still found next time (was time-based => changed every login)
      const stableKey = (loginId.includes('@') ? loginId : `${loginId}@gmail.com`).trim().toLowerCase()
      let stableHash = 0
      for (let i = 0; i < stableKey.length; i++) stableHash = (stableHash * 31 + stableKey.charCodeAt(i)) % 10000
      const ownerSession = { success: true, id: `PO-${String(stableHash).padStart(4, '0')}`, name: formattedName, email: loginId.includes('@') ? loginId : `${loginId}@gmail.com`, phone: '0771234567', role: 'PET_OWNER', status: 'ACTIVE' }
      localStorage.setItem('vhms_user', JSON.stringify(ownerSession))
      localStorage.setItem('vhms_pet_view', 'OVERVIEW')
      showToast(`🐾 Welcome back, ${formattedName}! Redirecting to Pet Owner Dashboard...`, 'success')
      setTimeout(() => navigate('/pets'), 300)
      return true
    }
    
    return false
  }

  const handleOwnerLogin = async (e) => {
    e.preventDefault()
    if (!ownerEmail || !ownerPass) { showToast('Please fill in all fields.', 'error'); return }
    const success = await performLogin(ownerEmail, ownerPass, 'PET_OWNER')
    if (!success) {
      showToast('❌ Invalid credentials for Pet Owner.', 'error')
    }
  }

  const handleDoctorLogin = async (e) => {
    e.preventDefault()
    if (!docId || !docPass) { showToast('Please fill in all fields.', 'error'); return }
    setAuthBusy(true)
    const success = await performLogin(docId, docPass, 'DOCTOR')
    if (!success) {
      showToast('❌ Invalid credentials for Doctor.', 'error')
    }
    setAuthBusy(false)
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    if (!adminId || !adminPass) { showToast('Please fill in Admin ID and Password.', 'error'); return }
    const success = await performLogin(adminId, adminPass, 'ADMIN')
    if (!success) {
      showToast('❌ Invalid credentials for Admin.', 'error')
    }
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
    setOwnerMode('signin')
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
      setTimeout(() => navigate('/doctor/dashboard'), 1500)
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
      setDocMode('reset')
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
      setDocMode('signin'); setDocId(forgotEmail); setDocPass(''); setResetCode(''); setResetNewPass(''); setResetConfirmPass('')
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

          <div className="role-tabs" role="tablist">
            <button className={`role-tab${role === 'owner' ? ' active' : ''}`} id="tab-owner" onClick={() => setRole('owner')}>&#128062; Pet Owner</button>
            <button className={`role-tab${role === 'doctor' ? ' active' : ''}`} id="tab-doctor" onClick={() => setRole('doctor')}>&#9877; Doctor</button>
            <button className={`role-tab${role === 'admin' ? ' active' : ''}`} id="tab-admin" onClick={() => setRole('admin')}>&#9881; Admin</button>
            <div className="tab-slider" id="tab-slider" style={{ left: tabPositions[role] }}></div>
          </div>

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
                      <div className="input-wrap"><input type="text" id="reg-name" className={regErrors.regName ? 'input-invalid' : ''} placeholder="e.g. Kasun Perera" required value={regName} onChange={(e) => { setRegName(e.target.value); if(regErrors.regName) setRegErrors(p=>({...p, regName:null}))}} /></div>
                      {regErrors.regName && <span className="field-error-text">⚠️ {regErrors.regName}</span>}
                    </div>
                    <div className="input-group">
                      <label htmlFor="reg-phone">Phone Number</label>
                      <div className="input-wrap"><input type="tel" id="reg-phone" className={regErrors.regPhone ? 'input-invalid' : ''} placeholder="0771234567" maxLength={10} required value={regPhone} onChange={(e) => { setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if(regErrors.regPhone) setRegErrors(p=>({...p, regPhone:null}))}} /></div>
                      {regErrors.regPhone && <span className="field-error-text">⚠️ {regErrors.regPhone}</span>}
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-email">Email Address</label>
                    <div className="input-wrap"><input type="email" id="reg-email" className={regErrors.regEmail ? 'input-invalid' : ''} placeholder="yourname@email.com" required value={regEmail} onChange={(e) => { setRegEmail(e.target.value); if(regErrors.regEmail) setRegErrors(p=>({...p, regEmail:null}))}} /></div>
                    {regErrors.regEmail && <span className="field-error-text">⚠️ {regErrors.regEmail}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-address">Address</label>
                    <div className="input-wrap"><textarea id="reg-address" className={regErrors.regAddress ? 'input-invalid' : ''} placeholder="No. 12, Main Street, Colombo" rows="2" required value={regAddress} onChange={(e) => { setRegAddress(e.target.value); if(regErrors.regAddress) setRegErrors(p=>({...p, regAddress:null}))}}></textarea></div>
                    {regErrors.regAddress && <span className="field-error-text">⚠️ {regErrors.regAddress}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="reg-pass">Create Password</label>
                    <div className="input-wrap"><input type={showPass['reg-pass'] ? 'text' : 'password'} id="reg-pass" className={regErrors.regPass ? 'input-invalid' : ''} placeholder="Create a strong password" required value={regPass} onChange={(e) => { setRegPass(e.target.value); if(regErrors.regPass) setRegErrors(p=>({...p, regPass:null}))}} /><button type="button" className="eye-btn" onClick={() => togglePass('reg-pass')}>{showPass['reg-pass'] ? '🙈' : '👁'}</button></div>
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
                    <div className="input-wrap"><input type={showPass['reg-pass-confirm'] ? 'text' : 'password'} id="reg-pass-confirm" className={regErrors.regPassConfirm ? 'input-invalid' : ''} placeholder="Re-enter your password" required value={regPassConfirm} onChange={(e) => { setRegPassConfirm(e.target.value); if(regErrors.regPassConfirm) setRegErrors(p=>({...p, regPassConfirm:null}))}} /><button type="button" className="eye-btn" onClick={() => togglePass('reg-pass-confirm')}>{showPass['reg-pass-confirm'] ? '🙈' : '👁'}</button></div>
                    {regErrors.regPassConfirm && <span className="field-error-text">⚠️ {regErrors.regPassConfirm}</span>}
                  </div>
                  <button type="submit" className="submit-btn btn-owner">Create Account</button>
                  <p className="form-switch">Already have an account? <button type="button" className="link-btn" onClick={() => setOwnerMode('signin')}>Sign in &rarr;</button></p>
                </form>
              )}
            </div>
          )}

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
                  <p className="form-subtitle">Create a unique username.</p>
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
                  <p className="form-switch"><button type="button" className="link-btn" onClick={() => setDocMode('signin')}>Back to Sign In</button></p>
                </form>
              )}
            </div>
          )}

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
                  <label htmlFor="admin-pin">Security PIN / 2FA Code (Optional)</label>
                  <div className="input-wrap"><input type="text" id="admin-pin" placeholder="6-digit security code" maxLength="6" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} /></div>
                </div>
                <button type="submit" className="submit-btn btn-admin">Access Admin Portal</button>
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
