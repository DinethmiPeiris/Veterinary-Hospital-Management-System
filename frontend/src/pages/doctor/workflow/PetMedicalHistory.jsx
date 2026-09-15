import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import StatusBadge from '../../shared/StatusBadge'
import { getMedicalRecordByPetId, updatePetWeight } from '../../../utils/appointmentStore'
import './PetMedicalHistory.css'

const PetMedicalHistory = () => {
  const { petId } = useParams()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const [weightMessage, setWeightMessage] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError('')
      try {
        const id = petId || 'PET-101'
        const data = await getMedicalRecordByPetId(id)
        setRecord(data)
        setWeightInput(data.weight != null ? String(data.weight) : '')
      } catch (err) {
        console.error('Error fetching medical history', err)
        setError(err.message || 'Unable to load medical history from MongoDB.')
        setRecord(null)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [petId])

  const saveCurrentWeight = async (e) => {
    e.preventDefault()
    const nextWeight = Number(weightInput)
    if (!Number.isFinite(nextWeight) || nextWeight <= 0) {
      setWeightMessage('Enter a realistic weight in kg (for example 30.5).')
      return
    }
    setSavingWeight(true)
    setWeightMessage('')
    try {
      const updated = await updatePetWeight(record.petId, nextWeight)
      setRecord(updated)
      setWeightInput(updated.weight != null ? String(updated.weight) : String(nextWeight))
      setWeightMessage('Current weight saved to the medical record.')
    } catch (err) {
      setWeightMessage(err.message || 'Could not update weight.')
    } finally {
      setSavingWeight(false)
    }
  }

  if (loading) {
    return <div className="loading-state">Loading medical history...</div>
  }

  if (error || !record) {
    return (
      <div className="pet-medical-history">
        <header className="page-header">
          <Link to="/doctor/appointments" className="back-link">← Back to Appointments</Link>
          <h1>Medical History</h1>
          <p className="subtitle">{error || 'No medical history found for this pet.'}</p>
        </header>
      </div>
    )
  }

  return (
    <div className="pet-medical-history">
      <header className="page-header">
        <Link to="/doctor/appointments" className="back-link">
          ← Back to Appointments
        </Link>
        <h1>Electronic Medical Record: {record.petName}</h1>
        <p className="subtitle">Owner: {record.ownerName} · Pet ID: {record.petId}</p>
        {appointmentId && (
          <Link to={`/doctor/consultation/${appointmentId}`} className="back-link" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
            Continue to Consultation →
          </Link>
        )}
      </header>

      <div className="history-grid">
        <div className="pet-info-card">
          <div className="card-header">
            <span className="card-icon">🐾</span>
            <h2>Pet Information</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="label">Species:</span>
              <span className="value">{record.species}</span>
            </div>
            <div className="info-row">
              <span className="label">Breed:</span>
              <span className="value">{record.breed || '—'}</span>
            </div>
            <div className="info-row">
              <span className="label">Age:</span>
              <span className="value">{record.age != null ? `${record.age} years` : '—'}</span>
            </div>
            <div className="info-row">
              <span className="label">Weight:</span>
              <span className="value">{record.weight != null ? `${record.weight} kg` : '—'}</span>
            </div>
            <form className="weight-update" onSubmit={saveCurrentWeight}>
              <label htmlFor="current-weight">Update current weight (kg)</label>
              <div className="weight-row">
                <input
                  id="current-weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="e.g. 30.5"
                />
                <button type="submit" disabled={savingWeight}>
                  {savingWeight ? 'Saving...' : 'Save weight'}
                </button>
              </div>
              {weightMessage && <p className="weight-message">{weightMessage}</p>}
            </form>
          </div>
        </div>

        <div className="past-consultations-card">
          <div className="card-header">
            <span className="card-icon">📋</span>
            <h2>Past Consultations</h2>
          </div>
          <div className="card-body">
            {record.pastConsultations && record.pastConsultations.length > 0 ? (
              <ul className="consultation-list">
                {record.pastConsultations.map((consultation) => (
                  <li key={consultation.id} className="consultation-item">
                    <div className="consultation-header">
                      <h4>
                        {consultation.consultationDate
                          ? new Date(consultation.consultationDate).toLocaleDateString()
                          : 'Unknown date'}{' '}
                        with {consultation.doctorName || 'Doctor'}
                      </h4>
                      <StatusBadge status={consultation.status} />
                    </div>
                    {consultation.symptoms && (
                      <p><strong>Symptoms:</strong> {consultation.symptoms}</p>
                    )}
                    {consultation.observations && (
                      <p><strong>Observations:</strong> {consultation.observations}</p>
                    )}
                    <p className="diagnosis"><strong>Diagnosis:</strong> {consultation.diagnosis || 'None'}</p>
                    <p className="treatment"><strong>Treatment:</strong> {consultation.treatmentPlan || 'None'}</p>
                    {consultation.prescriptions?.length > 0 && (
                      <p>
                        <strong>Prescriptions:</strong>{' '}
                        {consultation.prescriptions
                          .map((p) => p.medicationName || p.instructions)
                          .filter(Boolean)
                          .join('; ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No past consultations found. Complete a consultation to build this EMR history.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PetMedicalHistory
