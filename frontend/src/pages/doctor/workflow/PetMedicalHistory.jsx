import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import StatusBadge from '../../shared/StatusBadge'
import { getMedicalRecordByPetId, updatePetWeight, addVaccination, addDocument } from '../../../utils/appointmentStore'
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

  const [vaccineForm, setVaccineForm] = useState({ vaccineName: '', dateAdministered: '', nextDueDate: '', administeredBy: '', notes: '' })
  const [savingVaccine, setSavingVaccine] = useState(false)
  const [vaccineMessage, setVaccineMessage] = useState('')

  const [documentForm, setDocumentForm] = useState({ fileName: '', fileType: '', base64Data: '', description: '' })
  const [savingDocument, setSavingDocument] = useState(false)
  const [documentMessage, setDocumentMessage] = useState('')

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

  const handleAddVaccination = async (e) => {
    e.preventDefault()
    if (!vaccineForm.vaccineName.trim() || !vaccineForm.dateAdministered) {
      setVaccineMessage('Vaccine name and date are required.')
      return
    }
    setSavingVaccine(true)
    setVaccineMessage('')
    try {
      const updated = await addVaccination(record.petId, vaccineForm)
      setRecord(updated)
      setVaccineForm({ vaccineName: '', dateAdministered: '', nextDueDate: '', administeredBy: '', notes: '' })
      setVaccineMessage('Vaccination added successfully.')
    } catch (err) {
      setVaccineMessage(err.message || 'Could not add vaccination.')
    } finally {
      setSavingVaccine(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocumentForm(prev => ({
          ...prev,
          fileName: file.name,
          fileType: file.type,
          base64Data: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddDocument = async (e) => {
    e.preventDefault()
    if (!documentForm.base64Data) {
      setDocumentMessage('Please select a file to upload.')
      return
    }
    setSavingDocument(true)
    setDocumentMessage('')
    try {
      const updated = await addDocument(record.petId, documentForm)
      setRecord(updated)
      setDocumentForm({ fileName: '', fileType: '', base64Data: '', description: '' })
      setDocumentMessage('Document uploaded successfully.')
      // Reset file input
      if (document.getElementById('document-file')) {
        document.getElementById('document-file').value = ''
      }
    } catch (err) {
      setDocumentMessage(err.message || 'Could not upload document.')
    } finally {
      setSavingDocument(false)
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

            <form className="vaccination-form mt-4" onSubmit={handleAddVaccination}>
              <h4 className="mb-2">Add Vaccination</h4>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Vaccine Name *"
                  className="form-input"
                  value={vaccineForm.vaccineName}
                  onChange={e => setVaccineForm({...vaccineForm, vaccineName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group grid-2">
                <div>
                  <label>Date Administered *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={vaccineForm.dateAdministered}
                    onChange={e => setVaccineForm({...vaccineForm, dateAdministered: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label>Next Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={vaccineForm.nextDueDate}
                    onChange={e => setVaccineForm({...vaccineForm, nextDueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Administered By (Doctor/Staff)"
                  className="form-input"
                  value={vaccineForm.administeredBy}
                  onChange={e => setVaccineForm({...vaccineForm, administeredBy: e.target.value})}
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Additional Notes"
                  className="form-input"
                  rows="2"
                  value={vaccineForm.notes}
                  onChange={e => setVaccineForm({...vaccineForm, notes: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingVaccine}>
                {savingVaccine ? 'Adding...' : '+ Add Record'}
              </button>
              {vaccineMessage && <p className="vaccine-message mt-2">{vaccineMessage}</p>}
            </form>
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
                      <h4>{doc.fileName}</h4>
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

            <form className="document-form mt-4" onSubmit={handleAddDocument}>
              <h4 className="mb-2">Upload Document</h4>
              <div className="form-group">
                <input
                  type="file"
                  id="document-file"
                  className="form-input"
                  onChange={handleFileChange}
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Document Description"
                  className="form-input"
                  rows="2"
                  value={documentForm.description}
                  onChange={e => setDocumentForm({...documentForm, description: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingDocument || !documentForm.base64Data}>
                {savingDocument ? 'Uploading...' : 'Upload Document'}
              </button>
              {documentMessage && <p className="document-message mt-2">{documentMessage}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PetMedicalHistory
