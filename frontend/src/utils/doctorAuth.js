import { apiRequest } from './api'

const SESSION_KEY = 'vhms_doctor_session'

export function getDoctorSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setDoctorSession(doctor) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(doctor))
}

export function clearDoctorSession() {
  localStorage.removeItem(SESSION_KEY)
}

function toSession(data) {
  return {
    id: data.id,
    staffId: data.staffId,
    username: data.username,
    name: data.fullName,
    email: data.email,
    specialty: data.specialization,
    role: data.role,
  }
}

export async function registerDoctor({ name, username, email, specialty, password, phone }) {
  const data = await apiRequest('/api/v1/auth/doctor/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: name,
      username,
      email,
      specialization: specialty,
      password,
      phone: phone || null,
    }),
  })
  const session = toSession(data)
  setDoctorSession(session)
  return { ...session, message: data.message, staffId: data.staffId }
}

export async function loginDoctor({ identifier, password }) {
  const data = await apiRequest('/api/v1/auth/doctor/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
  const session = toSession(data)
  setDoctorSession(session)
  return session
}

export async function requestPasswordReset(email) {
  return apiRequest('/api/v1/auth/doctor/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetDoctorPassword({ email, resetToken, newPassword }) {
  return apiRequest('/api/v1/auth/doctor/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, resetToken, newPassword }),
  })
}

export function formatDoctorDisplayName(name) {
  if (!name) return 'Doctor'
  const trimmed = name.trim()
  if (/^dr\.?\s/i.test(trimmed)) return trimmed
  return `Dr. ${trimmed}`
}
