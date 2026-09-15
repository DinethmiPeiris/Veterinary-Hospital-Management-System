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

export async function getAppointments() {
  return apiRequest('/api/v1/appointments')
}

export async function getAppointmentById(id) {
  return apiRequest(`/api/v1/appointments/${id}`)
}

export async function updateAppointmentStatus(id, status) {
  return apiRequest(`/api/v1/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
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

export async function getConsultationByAppointmentId(appointmentId) {
  return apiRequest(`/api/v1/consultations/by-appointment/${encodeURIComponent(appointmentId)}`)
}

export async function startAppointmentConsultation(id) {
  const session = getDoctorSession()
  const doctorId = session?.staffId || session?.id || 'DOC-001'

  const consultation = await apiRequest(
    `/api/v1/consultations/start?appointmentId=${encodeURIComponent(id)}&doctorId=${encodeURIComponent(doctorId)}`,
    { method: 'POST' }
  )

  const ids = readJson(CONSULTATION_IDS_KEY, {})
  ids[id] = consultation.id
  localStorage.setItem(CONSULTATION_IDS_KEY, JSON.stringify(ids))

  saveConsultationData(id, {
    symptoms: consultation.symptoms || '',
    clinicalObservations: consultation.observations || '',
    diagnosis: consultation.diagnosis || '',
    treatmentPlan: consultation.treatmentPlan || '',
    prescription: formatPrescriptions(consultation.prescriptions),
    status: consultation.status || 'IN_PROGRESS',
  })

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
      prescription: '',
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
      prescription: formatPrescriptions(consultation.prescriptions) || consultation.notes || '',
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

  const prescriptions = formData.prescription?.trim()
    ? [{
        medicationName: formData.prescription.trim(),
        dosage: '',
        frequency: '',
        duration: '',
        instructions: formData.prescription.trim(),
      }]
    : []

  await apiRequest(`/api/v1/consultations/${consultationId}`, {
    method: 'PUT',
    body: JSON.stringify({
      symptoms: formData.symptoms,
      observations: formData.clinicalObservations,
      diagnosis: formData.diagnosis,
      treatmentPlan: formData.treatmentPlan,
      prescriptions,
      notes: formData.prescription,
      draft: isDraft,
      isDraft,
    }),
  })

  saveConsultationData(appointmentId, {
    ...formData,
    status: isDraft ? 'IN_PROGRESS' : 'COMPLETED',
  })

  return getAppointmentById(appointmentId)
}

export async function saveConsultationDraft(appointmentId, formData) {
  return persistConsultation(appointmentId, formData, true)
}

export async function completeConsultation(appointmentId, formData) {
  return persistConsultation(appointmentId, formData, false)
}
