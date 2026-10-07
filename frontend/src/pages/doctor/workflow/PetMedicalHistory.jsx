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
  const [viewerDocument, setViewerDocument] = useState(null)

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
          <Link to="/doctor/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1>Medical History</h1>
          <p className="subtitle">{error || 'No medical history found for this pet.'}</p>
        </header>
      </div>
    )
  }

  return (
    <div className="pet-medical-history">
      <header className="page-header">
        <Link to="/doctor/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
        <h1>Electronic Medical Record: {record.petName}</h1>
        <p className="subtitle">Owner: {record.ownerName} · Pet ID: {record.petId}</p>
        {appointmentId && (
          <Link to="/doctor/dashboard" className="back-link" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
            Resume Consultation from Dashboard →
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

        <div className="vaccinations-card">
          <div className="card-header">
            <span className="card-icon">💉</span>
            <h2>Vaccination Records</h2>
          </div>
          <div className="card-body">
            {record.vaccinations && record.vaccinations.length > 0 ? (
              <ul className="vaccination-list">
                {record.vaccinations.map((vac, idx) => (
                  <li key={idx} className="vaccination-item">
                    <div className="vaccination-header flex-between">
                      <h4>{vac.vaccineName}</h4>
                    </div>
                    <p><strong>Administered:</strong> {new Date(vac.dateAdministered).toLocaleDateString()}</p>
                    {vac.nextDueDate && <p><strong>Next Due:</strong> {new Date(vac.nextDueDate).toLocaleDateString()}</p>}
                    {vac.administeredBy && <p><strong>Administered By:</strong> {vac.administeredBy}</p>}
                    {vac.notes && <p><strong>Notes:</strong> {vac.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No vaccination records found.</p>
            )}
          </div>
        </div>

        <div className="documents-card">
          <div className="card-header">
            <span className="card-icon">📁</span>
            <h2>Attachments & Documents</h2>
          </div>
          <div className="card-body">
            {record.documents && record.documents.length > 0 ? (
              <ul className="document-list">
                {record.documents.map((doc, idx) => (
                  <li key={idx} className="document-item">
                    <div className="document-header flex-between">
                      <h4 onClick={() => setViewerDocument(doc)} style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}>
                        {doc.fileName}
                      </h4>
                      <a href={doc.base64Data} download={doc.fileName} className="btn btn-sm">Download</a>
                    </div>
                    <p><strong>Type:</strong> {doc.fileType}</p>
                    <p><strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    {doc.description && <p><strong>Description:</strong> {doc.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No documents attached.</p>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewerDocument && (
        <div className="modal-overlay" onClick={() => setViewerDocument(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="document-modal" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '20px', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>{viewerDocument.fileName}</h3>
              <button onClick={() => setViewerDocument(null)} className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
              {(viewerDocument.fileType?.includes('pdf') || viewerDocument.base64Data?.includes('application/pdf')) ? (
                <iframe src={viewerDocument.base64Data} width="100%" height="600px" style={{ border: 'none' }} title={viewerDocument.fileName} />
              ) : (
                <img src={viewerDocument.base64Data} alt={viewerDocument.fileName} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PetMedicalHistory
