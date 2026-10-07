import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import './ConsultationPage.css'
import {
  completeConsultation,
  getAppointmentById,
  loadConsultationForm,
  saveConsultationDraft,
  startAppointmentConsultation,
  addVaccination,
  addDocument,
  getMedicalRecordByPetId,
} from '../../../utils/appointmentStore'
import { epic3Service } from '../../../services/epic3Service'

const ConsultationPage = ({ appointmentId: appointmentIdProp, onExit }) => {
  const params = useParams()
  const appointmentId = params.appointmentId || appointmentIdProp
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [appointment, setAppointment] = useState(null)
  const [medicalRecord, setMedicalRecord] = useState(null)

  const [formData, setFormData] = useState({
    symptoms: '',
    clinicalObservations: '',
    diagnosis: '',
    treatmentPlan: '',
    prescriptions: [],
    status: 'IN_PROGRESS',
  })

  // Vaccination form state
  const [vaccineForm, setVaccineForm] = useState({ vaccineName: '', dateAdministered: '', nextDueDate: '', administeredBy: '', notes: '' })
  const [savingVaccine, setSavingVaccine] = useState(false)
  const [vaccineMessage, setVaccineMessage] = useState('')

  // Document form state
  const [documentForm, setDocumentForm] = useState({ fileName: '', fileType: '', base64Data: '', description: '' })
  const [savingDocument, setSavingDocument] = useState(false)
  const [documentMessage, setDocumentMessage] = useState('')
  const [viewerDocument, setViewerDocument] = useState(null)

  const [recommendHospitalization, setRecommendHospitalization] = useState(false)
  const [hospitalizationReason, setHospitalizationReason] = useState('')
  const [hospitalizationMessage, setHospitalizationMessage] = useState('')
  const [savingHospitalization, setSavingHospitalization] = useState(false)
  const [showPostConsultationModal, setShowPostConsultationModal] = useState(false)

  const handleExit = () => {
    if (onExit) {
      onExit()
    } else {
      navigate('/doctor/appointments')
    }
  }

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
          prescriptions: Array.isArray(form.prescriptions) ? form.prescriptions : [],
          status: appt.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        })
        setIsCompleted(appt.status === 'COMPLETED')

        // Load medical record for vaccination/document sections
        if (appt.petId) {
          try {
            const record = await getMedicalRecordByPetId(appt.petId)
            if (!cancelled) setMedicalRecord(record)
          } catch (err) {
            console.error('Could not load medical record:', err)
          }
        }
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

  const handleAddPrescription = () => {
    setFormData(prev => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        { medicationName: '', dosage: '', frequency: '', duration: '', route: '', instructions: '' }
      ]
    }))
  }

  const handleUpdatePrescription = (index, field, value) => {
    setFormData(prev => {
      const newPrescriptions = [...prev.prescriptions]
      newPrescriptions[index] = { ...newPrescriptions[index], [field]: value }
      return { ...prev, prescriptions: newPrescriptions }
    })
  }

  const handleRemovePrescription = (index) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }))
  }

  const handleAddVaccination = async (e) => {
    e.preventDefault()
    if (!vaccineForm.vaccineName.trim() || !vaccineForm.dateAdministered) {
      setVaccineMessage('Vaccine name and date are required.')
      return
    }
    if (!appointment?.petId) {
      setVaccineMessage('Pet ID not available.')
      return
    }
    setSavingVaccine(true)
    setVaccineMessage('')
    try {
      const updated = await addVaccination(appointment.petId, vaccineForm)
      setMedicalRecord(updated)
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
    if (!appointment?.petId) {
      setDocumentMessage('Pet ID not available.')
      return
    }
    setSavingDocument(true)
    setDocumentMessage('')
    try {
      const updated = await addDocument(appointment.petId, documentForm)
      setMedicalRecord(updated)
      setDocumentForm({ fileName: '', fileType: '', base64Data: '', description: '' })
      setDocumentMessage('Document uploaded successfully.')
      const fileInput = window.document.getElementById('consultation-document-file')
      if (fileInput) fileInput.value = ''
    } catch (err) {
      setDocumentMessage(err.message || 'Could not upload document.')
    } finally {
      setSavingDocument(false)
    }
  }

  const handleSaveDraft = async () => {
    if (isCompleted) return

    if (!formData.diagnosis?.trim()) {
      alert('Please provide a diagnosis before saving the draft.')
      return
    }

    setSaving(true)
    try {
      await saveConsultationDraft(appointmentId, formData)
      alert('Draft saved to MongoDB. Appointment status is In Progress.')
      handleExit()
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert(error.message || 'Failed to save draft.')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    if (isCompleted) {
      handleExit()
      return
    }

    if (!formData.symptoms?.trim() || !formData.clinicalObservations?.trim()) {
      alert('Please provide Reported Symptoms and Clinical Observations to complete the consultation.')
      return
    }

    if (!formData.diagnosis?.trim() || !formData.treatmentPlan?.trim()) {
      alert('Please provide a diagnosis and treatment plan to complete the consultation.')
      return
    }

    for (let i = 0; i < formData.prescriptions.length; i++) {
      const p = formData.prescriptions[i]
      if (!p.medicationName?.trim() || !p.dosage?.trim() || !p.frequency?.trim() || !p.duration?.trim()) {
        alert(`Please fill all required fields (Medication Name, Dosage, Frequency, Duration) for Medication #${i + 1}.`)
        return
      }
    }

    setSaving(true)
    try {
      await completeConsultation(appointmentId, formData)
      setIsCompleted(true)
      alert('Consultation Completed Successfully!')
      handleExit()
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
          <button className="btn btn-secondary" onClick={handleExit}>
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
          <button className="btn btn-secondary" onClick={handleExit}>
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
            <label htmlFor="symptoms">Reported Symptoms <span className="required">*</span></label>
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
            <label htmlFor="clinicalObservations">Clinical Observations <span className="required">*</span></label>
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

          <div className="form-group prescriptions-section">
            <div className="flex-between">
              <label>Digital Prescriptions</label>
              {!isCompleted && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddPrescription}>
                  + Add Medication
                </button>
              )}
            </div>
            
            {formData.prescriptions.length === 0 ? (
              <p className="empty-state-text">No prescriptions added.</p>
            ) : (
              <div className="prescriptions-list">
                {formData.prescriptions.map((prescription, index) => (
                  <div key={index} className="prescription-card">
                    <div className="prescription-header flex-between">
                      <h4>Medication #{index + 1}</h4>
                      {!isCompleted && (
                        <button 
                          type="button" 
                          className="btn-text text-danger" 
                          onClick={() => handleRemovePrescription(index)}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <div className="prescription-grid">
                      <input
                        type="text"
                        placeholder="Medication Name *"
                        value={prescription.medicationName}
                        onChange={(e) => handleUpdatePrescription(index, 'medicationName', e.target.value)}
                        disabled={isCompleted}
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 250mg) *"
                        value={prescription.dosage}
                        onChange={(e) => handleUpdatePrescription(index, 'dosage', e.target.value)}
                        disabled={isCompleted}
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. Twice a day) *"
                        value={prescription.frequency}
                        onChange={(e) => handleUpdatePrescription(index, 'frequency', e.target.value)}
                        disabled={isCompleted}
                        className="form-input"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 5 days) *"
                        value={prescription.duration}
                        onChange={(e) => handleUpdatePrescription(index, 'duration', e.target.value)}
                        disabled={isCompleted}
                        className="form-input"
                      />
                    </div>
                    <textarea
                      placeholder="Additional instructions (e.g. Take with food)..."
                      value={prescription.instructions}
                      onChange={(e) => handleUpdatePrescription(index, 'instructions', e.target.value)}
                      disabled={isCompleted}
                      rows={2}
                      className="form-input mt-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>



        {/* Vaccination Records - editable during active consultation */}
        <div className="vaccinations-section">
          <h2>💉 Vaccination Records</h2>
          <div className="card-body">
            {medicalRecord?.vaccinations && medicalRecord.vaccinations.length > 0 ? (
              <ul className="vaccination-list">
                {medicalRecord.vaccinations.map((vac, idx) => (
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
              <p className="empty-state-text">No vaccination records found.</p>
            )}

            {!isCompleted && (
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
            )}
          </div>
        </div>

        {/* Attachments & Documents - editable during active consultation */}
        <div className="documents-section">
          <h2>📁 Attachments & Documents</h2>
          <div className="card-body">
            {medicalRecord?.documents && medicalRecord.documents.length > 0 ? (
              <ul className="document-list">
                {medicalRecord.documents.map((doc, idx) => (
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
              <p className="empty-state-text">No documents attached.</p>
            )}

            {!isCompleted && (
              <form className="document-form mt-4" onSubmit={handleAddDocument}>
                <h4 className="mb-2">Upload Document</h4>
                <div className="form-group">
                  <input
                    type="file"
                    id="consultation-document-file"
                    className="form-input"
                    accept="image/*,application/pdf"
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

export default ConsultationPage

