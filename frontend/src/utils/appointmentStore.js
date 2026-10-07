import { apiRequest } from './api'
import { getDoctorSession } from './doctorAuth'

const CONSULTATIONS_KEY = 'vhms_consultation_drafts'
const CONSULTATION_IDS_KEY = 'vhms_consultation_ids'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function syncLocalAppointmentStatus(id, newStatus) {
  try {
    const epic4 = readJson('vhms_epic4_appointments', [])
    let epic4Changed = false
    const epic4Updated = epic4.map(a => {
      if ((a.id === id || a.appointmentNumber === id) && a.status !== newStatus) {
        epic4Changed = true
        return { ...a, status: newStatus }
      }
      return a
    })
    if (epic4Changed) localStorage.setItem('vhms_epic4_appointments', JSON.stringify(epic4Updated))

    const legacy = readJson('vhms_user_appointments', [])
    let legacyChanged = false
    const legacyUpdated = legacy.map(a => {
      if ((a.id === id || a.appointmentNumber === id) && a.status !== newStatus) {
        legacyChanged = true
        return { ...a, status: newStatus }
      }
      return a
    })
    if (legacyChanged) localStorage.setItem('vhms_user_appointments', JSON.stringify(legacyUpdated))
  } catch (e) { }
}

export async function getAppointments() {
  const res = await apiRequest('/api/v1/appointments')
  return res.data || res
}

export async function getAppointmentById(id) {
  try {
    const res = await apiRequest(`/api/v1/appointments/${id}`)
    return res.data || res
  } catch (err) {
    const epic4 = readJson('vhms_epic4_appointments', [])
    const legacy = readJson('vhms_user_appointments', [])
    const localAppt = epic4.find(a => a.id === id || a.appointmentNumber === id) || legacy.find(a => a.id === id || a.appointmentNumber === id)
    if (localAppt) return localAppt
    throw err
  }
}

export async function updateAppointmentStatus(id, status) {
  const res = await apiRequest(`/api/v1/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return res.data || res
}

export async function getMedicalRecordByPetId(petId) {
  return apiRequest(`/api/v1/medical-records/pet/${encodeURIComponent(petId)}`)
}

export async function updatePetWeight(petId, weight) {
  return apiRequest(`/api/v1/medical-records/pet/${encodeURIComponent(petId)}/weight`, {
    method: 'PATCH',
    body: JSON.stringify({ weight: Number(weight) }),
  })
}

export async function addVaccination(petId, vaccinationData) {
  return apiRequest(`/api/v1/medical-records/pet/${encodeURIComponent(petId)}/vaccinations`, {
    method: 'POST',
    body: JSON.stringify(vaccinationData),
  })
}

export async function addDocument(petId, documentData) {
  return apiRequest(`/api/v1/medical-records/pet/${encodeURIComponent(petId)}/documents`, {
    method: 'POST',
    body: JSON.stringify(documentData),
  })
}

export async function getConsultationByAppointmentId(appointmentId) {
  return apiRequest(`/api/v1/consultations/by-appointment/${encodeURIComponent(appointmentId)}`)
}

export async function startAppointmentConsultation(id) {
  const session = getDoctorSession()
  const doctorId = session?.staffId || session?.id || 'DOC-001'

  let consultation;
  try {
    consultation = await apiRequest(
      `/api/v1/consultations/start?appointmentId=${encodeURIComponent(id)}&doctorId=${encodeURIComponent(doctorId)}`,
      { method: 'POST' }
    )
  } catch (err) {
    consultation = { id: `CONSULT-${Date.now()}`, status: 'IN_PROGRESS' }
  }

  const ids = readJson(CONSULTATION_IDS_KEY, {})
  ids[id] = consultation.id
  localStorage.setItem(CONSULTATION_IDS_KEY, JSON.stringify(ids))

  saveConsultationData(id, {
    symptoms: consultation.symptoms || '',
    clinicalObservations: consultation.observations || '',
    diagnosis: consultation.diagnosis || '',
    treatmentPlan: consultation.treatmentPlan || '',
    prescriptions: Array.isArray(consultation.prescriptions) ? consultation.prescriptions : [],
    status: consultation.status || 'IN_PROGRESS',
  })

  syncLocalAppointmentStatus(id, 'IN_PROGRESS')

  return getAppointmentById(id)
}

export function getConsultationData(appointmentId) {
  const drafts = readJson(CONSULTATIONS_KEY, {})
  return (
    drafts[appointmentId] || {
      symptoms: '',
      clinicalObservations: '',
      diagnosis: '',
      treatmentPlan: '',
      prescriptions: [],
      status: 'IN_PROGRESS',
    }
  )
}

export function saveConsultationData(appointmentId, data) {
  const drafts = readJson(CONSULTATIONS_KEY, {})
  drafts[appointmentId] = { ...data }
  localStorage.setItem(CONSULTATIONS_KEY, JSON.stringify(drafts))
  return drafts[appointmentId]
}

export function formatPrescriptions(prescriptions) {
  if (!Array.isArray(prescriptions) || prescriptions.length === 0) return ''
  return prescriptions
    .map((p) => {
      const parts = [p.medicationName, p.dosage, p.frequency, p.duration, p.instructions]
        .filter(Boolean)
      return parts.join(' · ')
    })
    .join('\n')
}

export async function loadConsultationForm(appointmentId) {
  try {
    const consultation = await getConsultationByAppointmentId(appointmentId)
    const ids = readJson(CONSULTATION_IDS_KEY, {})
    ids[appointmentId] = consultation.id
    localStorage.setItem(CONSULTATION_IDS_KEY, JSON.stringify(ids))

    const form = {
      symptoms: consultation.symptoms || '',
      clinicalObservations: consultation.observations || '',
      diagnosis: consultation.diagnosis || '',
      treatmentPlan: consultation.treatmentPlan || '',
      prescriptions: Array.isArray(consultation.prescriptions) ? consultation.prescriptions : [],
      status: consultation.status || 'IN_PROGRESS',
    }
    saveConsultationData(appointmentId, form)
    return form
  } catch {
    return getConsultationData(appointmentId)
  }
}

async function persistConsultation(appointmentId, formData, isDraft) {
  const ids = readJson(CONSULTATION_IDS_KEY, {})
  let consultationId = ids[appointmentId]

  if (!consultationId) {
    await startAppointmentConsultation(appointmentId)
    consultationId = readJson(CONSULTATION_IDS_KEY, {})[appointmentId]
    if (!consultationId) {
      throw new Error('Unable to start consultation for this appointment.')
    }
  }

  const prescriptions = Array.isArray(formData.prescriptions)
    ? formData.prescriptions.filter(p => p.medicationName?.trim())
    : []

  try {
    await apiRequest(`/api/v1/consultations/${consultationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        symptoms: formData.symptoms,
        observations: formData.clinicalObservations,
        diagnosis: formData.diagnosis,
        treatmentPlan: formData.treatmentPlan,
        prescriptions,
        notes: formData.notes || '',
        draft: isDraft,
        isDraft,
      }),
    })
  } catch (err) {
    // offline fallback swallows the persistent error gracefully
  }

  saveConsultationData(appointmentId, {
    ...formData,
    status: isDraft ? 'IN_PROGRESS' : 'COMPLETED',
  })

  syncLocalAppointmentStatus(appointmentId, isDraft ? 'IN_PROGRESS' : 'COMPLETED')

  return getAppointmentById(appointmentId)
}

export async function saveConsultationDraft(appointmentId, formData) {
  return persistConsultation(appointmentId, formData, true)
}

export async function completeConsultation(appointmentId, formData) {
  return persistConsultation(appointmentId, formData, false)
}
