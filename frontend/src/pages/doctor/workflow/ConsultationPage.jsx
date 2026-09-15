import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import './ConsultationPage.css'
import {
  completeConsultation,
  getAppointmentById,
  loadConsultationForm,
  saveConsultationDraft,
  startAppointmentConsultation,
} from '../../../utils/appointmentStore'

const ConsultationPage = () => {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [appointment, setAppointment] = useState(null)

  const [formData, setFormData] = useState({
    symptoms: '',
    clinicalObservations: '',
    diagnosis: '',
    treatmentPlan: '',
    prescription: '',
    status: 'IN_PROGRESS',
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        let appt = await getAppointmentById(appointmentId)
        if (appt.status !== 'COMPLETED') {
          await startAppointmentConsultation(appointmentId)
          appt = await getAppointmentById(appointmentId)
        }

        const form = await loadConsultationForm(appointmentId)
        if (cancelled) return

        setAppointment(appt)
        setFormData({
          symptoms: form.symptoms || '',
          clinicalObservations: form.clinicalObservations || '',
          diagnosis: form.diagnosis || '',
          treatmentPlan: form.treatmentPlan || '',
          prescription: form.prescription || '',
          status: appt.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        })
        setIsCompleted(appt.status === 'COMPLETED')
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load consultation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [appointmentId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveDraft = async () => {
    if (isCompleted) return
    setSaving(true)
    try {
      await saveConsultationDraft(appointmentId, formData)
      alert('Draft saved to MongoDB. Appointment status is In Progress.')
      navigate('/doctor/appointments')
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert(error.message || 'Failed to save draft.')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    if (isCompleted) {
      navigate('/doctor/appointments')
      return
    }

    if (!formData.diagnosis || !formData.treatmentPlan) {
      alert('Please provide at least a diagnosis and treatment plan to complete the consultation.')
      return
    }

    setSaving(true)
    try {
      await completeConsultation(appointmentId, formData)
      alert('Consultation completed and saved to MongoDB.')
      navigate('/doctor/appointments')
    } catch (error) {
      console.error('Failed to complete consultation:', error)
      alert(error.message || 'Failed to complete consultation.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-state">Initializing Consultation Workspace...</div>

  if (loadError) {
    return (
      <div className="consultation-page">
        <header className="page-header">
          <h1>Consultation unavailable</h1>
          <p className="subtitle">{loadError}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/doctor/appointments')}>
            Back to Appointments
          </button>
        </header>
      </div>
    )
  }

  return (
    <div className="consultation-page">
      <header className="page-header flex-between">
        <div>
          <h1>🩺 Active Consultation</h1>
          <p className="subtitle">
            Appointment: {appointmentId}
            {appointment ? ` · ${appointment.patient} (${appointment.species}${appointment.breed ? ` · ${appointment.breed}` : ''})` : ''}
          </p>
          {appointment?.petId && (
            <Link
              to={`/doctor/pet/${appointment.petId}/history?appointmentId=${appointmentId}`}
              className="subtitle"
              style={{ display: 'inline-block', marginTop: '0.35rem', color: '#0f766e' }}
            >
              Review past medical history / EMR before consulting →
            </Link>
          )}
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={() => navigate('/doctor/appointments')}>
            ✕ Cancel
          </button>
          {!isCompleted && (
            <button className="btn btn-primary" onClick={handleSaveDraft} disabled={saving}>
              💾 {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button className="btn btn-success" onClick={handleComplete} disabled={saving}>
            {isCompleted ? '← Back' : '✓ Complete'}
          </button>
        </div>
      </header>

      <div className="consultation-workspace">
        <div className="clinical-notes-section">
          <h2>🩺 Clinical Notes</h2>

          <div className="form-group">
            <label htmlFor="symptoms">Reported Symptoms</label>
            <textarea
              id="symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={handleInputChange}
              placeholder="Describe the symptoms reported by the owner..."
              rows={4}
              disabled={isCompleted}
            />
          </div>

          <div className="form-group">
            <label htmlFor="clinicalObservations">Clinical Observations</label>
            <textarea
              id="clinicalObservations"
              name="clinicalObservations"
              value={formData.clinicalObservations}
              onChange={handleInputChange}
              placeholder="Record your physical examination findings..."
              rows={4}
              disabled={isCompleted}
            />
          </div>
        </div>

        <div className="diagnosis-treatment-section">
          <h2>Diagnosis & Treatment</h2>

          <div className="form-group">
            <label htmlFor="diagnosis">
              Diagnosis <span className="required">*</span>
            </label>
            <input
              type="text"
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              placeholder="Primary diagnosis..."
              className="form-input"
              disabled={isCompleted}
            />
          </div>

          <div className="form-group">
            <label htmlFor="treatmentPlan">
              Treatment Plan <span className="required">*</span>
            </label>
            <textarea
              id="treatmentPlan"
              name="treatmentPlan"
              value={formData.treatmentPlan}
              onChange={handleInputChange}
              placeholder="Detail the recommended treatment..."
              rows={4}
              disabled={isCompleted}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prescription">Digital Prescription (Optional)</label>
            <textarea
              id="prescription"
              name="prescription"
              value={formData.prescription}
              onChange={handleInputChange}
              placeholder="Medication name, dosage, frequency, duration..."
              rows={3}
              disabled={isCompleted}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultationPage
