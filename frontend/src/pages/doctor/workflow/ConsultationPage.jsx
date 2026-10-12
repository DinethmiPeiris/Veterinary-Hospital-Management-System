import React, { useState, useEffect, useRef, useCallback } from 'react'
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

const SERVICES_MAP = {
  CONSULTATION: ['General Consultation', 'Specialist Consultation', 'Follow-up Checkup'],
  PROCEDURE: ['Wound Cleaning', 'Nail Trimming', 'Dental Cleaning', 'Ear Cleaning', 'Dressing / Bandaging'],
  MEDICATION: ['Antibiotics', 'Painkiller', 'Deworming Tablet', 'Flea/Tick Treatment', 'Vitamins / Supplements'],
  SURGERY: ['Spaying', 'Neutering', 'Tumor Removal', 'Orthopedic Surgery'],
  VACCINATION: ['Rabies Vaccine', 'DHLPP Vaccine', 'FVRCP Vaccine', 'Bordetella Vaccine']
};

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

  const [chargeItems, setChargeItems] = useState([])

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

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState('') // '' | 'saving' | 'saved'
  const autoSaveTimer = useRef(null)
  const isLoadedRef = useRef(false) // prevent auto-save firing during initial load

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

        let savedServices = appt.treatmentServices;
        if (!savedServices || savedServices.length === 0) {
          try {
            const localList = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
            const localMatch = localList.find((l) => l.id === appt.id || l.appointmentNumber === appt.appointmentNumber);
            if (localMatch && localMatch.treatmentServices && localMatch.treatmentServices.length > 0) {
              savedServices = localMatch.treatmentServices;
            }
          } catch (e) {}
        }
        if (!savedServices || savedServices.length === 0) {
          try {
            const localInvoices = JSON.parse(localStorage.getItem('vhms_epic4_invoices') || '[]');
            const invMatch = localInvoices.find((i) => i.appointmentId === appt.id || i.appointmentNumber === appt.appointmentNumber);
            if (invMatch && invMatch.items && invMatch.items.length > 0) {
              savedServices = invMatch.items.map((it) => ({
                description: it.description,
                itemType: it.itemType || 'PROCEDURE',
                quantity: it.quantity || 1
              }));
            }
          } catch (e) {}
        }

        setChargeItems(
          // Restore from auto-save draft (chargeItems), or appointment's saved services, or default
          (form.chargeItems && form.chargeItems.length > 0)
            ? form.chargeItems
            : savedServices && savedServices.length > 0
            ? savedServices
            : [
                { description: SERVICES_MAP['CONSULTATION'][0], itemType: 'CONSULTATION', quantity: 1 },
              ]
        );

        setFormData({
          symptoms: form.symptoms || '',
          clinicalObservations: form.clinicalObservations || '',
          diagnosis: form.diagnosis || '',
          treatmentPlan: form.treatmentPlan || '',
          currentWeight: form.currentWeight || appt.weight || '',
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

  // Mark form as loaded after initial data is set, so auto-save doesn't fire on mount
  useEffect(() => {
    if (!loading && appointment) {
      isLoadedRef.current = true
    }
  }, [loading, appointment])

  // Auto-save draft to localStorage whenever formData or chargeItems changes (debounced 2s)
  const performAutoSave = useCallback(() => {
    if (!appointmentId || isCompleted) return
    setAutoSaveStatus('saving')
    try {
      // Save form data to localStorage under draft key
      const draftKey = `vhms_consultation_draft_${appointmentId}`
      localStorage.setItem(draftKey, JSON.stringify({
        ...formData,
        chargeItems,
        autoSavedAt: new Date().toISOString(),
      }))
      setAutoSaveStatus('saved')
    } catch (e) {
      setAutoSaveStatus('')
    }
  }, [appointmentId, formData, chargeItems, isCompleted])

  useEffect(() => {
    if (!isLoadedRef.current || isCompleted) return
    // Clear any pending timer
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setAutoSaveStatus('saving')
    // Debounce: save 2 seconds after last change
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave()
    }, 2000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [formData, chargeItems]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save on unmount so navigating away never loses data
  useEffect(() => {
    return () => {
      if (appointmentId && !isCompleted && isLoadedRef.current) {
        try {
          const draftKey = `vhms_consultation_draft_${appointmentId}`
          const current = JSON.parse(localStorage.getItem(draftKey) || '{}')
          localStorage.setItem(draftKey, JSON.stringify({
            ...current,
            autoSavedAt: new Date().toISOString(),
          }))
        } catch (e) {}
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const addChargeRow = () => {
    setChargeItems([...chargeItems, { description: SERVICES_MAP['PROCEDURE'][0], itemType: 'PROCEDURE', quantity: 1 }]);
  };

  const removeChargeRow = (index) => {
    setChargeItems(chargeItems.filter((_, i) => i !== index));
  };

  const updateChargeItem = (index, field, value) => {
    const updated = [...chargeItems];
    updated[index][field] = value;
    if (field === 'itemType') {
      updated[index]['description'] = SERVICES_MAP[value][0];
    }
    setChargeItems(updated);
  };

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
    setSaving(true)
    setAutoSaveStatus('saving')
    try {
      // Save to the auto-save draft key immediately
      const draftKey = `vhms_consultation_draft_${appointmentId}`
      localStorage.setItem(draftKey, JSON.stringify({
        ...formData,
        chargeItems,
        autoSavedAt: new Date().toISOString(),
      }))
      // Also try to persist to backend/legacy store (non-blocking)
      saveConsultationDraft(appointmentId, formData).catch(() => {})
      setAutoSaveStatus('saved')
    } catch (error) {
      console.error('Failed to save draft:', error)
      setAutoSaveStatus('')
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

      // Save treatment services on the appointment in local storage & update status
      try {
        const list = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
        let appt = list.find((a) => a.id === appointment.id || a.appointmentNumber === appointment.appointmentNumber);
        if (!appt) {
          appt = { id: appointment.id, appointmentNumber: appointment.appointmentNumber };
          list.push(appt);
        }
        appt.treatmentServices = chargeItems;
        appt.servicesSubmittedAt = new Date().toISOString();
        appt.hasPendingInvoice = true;
        localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));

        // Add notification for Admin to price and generate invoice
        const notifs = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
        notifs.unshift({
          id: 'notif-adm-' + Date.now(),
          recipientId: 'ADMIN-001',
          title: '📋 Treatment Services Submitted for Pricing & Invoicing',
          message: `${appointment.doctorName || 'Doctor'} recorded ${chargeItems.length} service(s) for ${appointment.petName} (${appointment.appointmentNumber || appointmentId}). Please price and issue the official invoice.`,
          read: false,
          sentAt: new Date().toISOString(),
        });
        localStorage.setItem('vhms_epic4_notifications', JSON.stringify(notifs));

        // Add notification for Pet Owner
        const ownerId = appointment.ownerId || appointment.petOwnerId || appointment.pet?.ownerId;
        const ownerKey = ownerId || appointment.ownerEmail;
        if (ownerKey) {
          const newNotif = {
            id: 'notif-owner-comp-' + Date.now(),
            recipientId: ownerKey,
            type: 'APPOINTMENT',
            title: '✅ Consultation Completed',
            message: `The consultation for ${appointment.petName} with ${appointment.doctorName || 'your doctor'} has been completed.`,
            read: false,
            timestamp: new Date().toISOString(),
            sentAt: new Date().toISOString(),
          };
          notifs.unshift(newNotif);
          localStorage.setItem('vhms_epic4_notifications', JSON.stringify(notifs));
          
          try {
            const legacyKey = `vhms_notifications_${ownerKey}`;
            const legacyNotifs = JSON.parse(localStorage.getItem(legacyKey) || '[]');
            legacyNotifs.unshift({ ...newNotif, timestamp: 'Just now' });
            localStorage.setItem(legacyKey, JSON.stringify(legacyNotifs));
          } catch(e) {}
          
          // Emit custom event so NotificationBell updates immediately
          window.dispatchEvent(new Event('vhms_notifications_changed'));
        }

        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Failed to update local storage for invoicing', e)
      }

      alert('Consultation Completed Successfully & Invoicing requested!')
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          {/* Auto-save status indicator */}
          {!isCompleted && autoSaveStatus && (
            <div style={{
              fontSize: '0.78rem',
              color: autoSaveStatus === 'saved' ? '#16a34a' : '#64748b',
              background: autoSaveStatus === 'saved' ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${autoSaveStatus === 'saved' ? '#bbf7d0' : '#e2e8f0'}`,
              borderRadius: '20px',
              padding: '0.25rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.3s ease',
            }}>
              {autoSaveStatus === 'saving' ? (
                <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span> Auto-saving...</>
              ) : (
                <>✅ Auto-saved</>
              )}
            </div>
          )}
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={handleExit}>
              ✕ Exit
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
        </div>
      </header>

      <div className="consultation-workspace">
        <div className="clinical-notes-section">
          <h2>🩺 Clinical Notes</h2>

          <div style={{ background: '#ffffff', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>👤</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>Pet Owner Information</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Name:</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>{appointment?.petOwnerName || appointment?.ownerName || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Phone:</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>{appointment?.petOwnerPhone || appointment?.ownerPhone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Email:</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>{appointment?.petOwnerEmail || appointment?.ownerEmail || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🐾</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>Pet Information</h3>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Species:</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>{medicalRecord?.species || appointment?.petSpecies || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Breed:</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>{medicalRecord?.breed || appointment?.breed || 'Not Specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Age:</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>{medicalRecord?.age ? `${medicalRecord.age} years` : (appointment?.age ? `${appointment.age} years` : '0 years')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Weight:</span>
                <span style={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>{formData.currentWeight || medicalRecord?.weight || appointment?.weight || 0} kg</span>
              </div>

              <div>
                <label htmlFor="currentWeight" style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Update current weight (kg)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    id="currentWeight"
                    name="currentWeight"
                    value={formData.currentWeight || ''}
                    onChange={handleInputChange}
                    placeholder="0"
                    disabled={isCompleted}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); performAutoSave(); }}
                    disabled={isCompleted}
                    style={{
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0 20px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: isCompleted ? 'not-allowed' : 'pointer',
                      opacity: isCompleted ? 0.6 : 1,
                    }}
                  >
                    Save weight
                  </button>
                </div>
              </div>
            </div>
          </div>

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
        {/* Treatment Services - for Invoicing */}
        <div className="clinical-notes-section" style={{ marginTop: '20px' }}>
          <h2>📋 Treatment Services (for Invoicing)</h2>
          <div className="card-body">
            <p className="subtitle" style={{marginBottom: '1rem'}}>
              Enter the medical services, medications, or procedures performed. Upon completion, these will be sent to the Admin for pricing and invoicing.
            </p>
            <div className="services-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 80px 40px', gap: '10px', fontWeight: '600', fontSize: '0.85rem', color: '#475569' }}>
                <span>Category</span>
                <span>Service / Medication Name</span>
                <span>Qty</span>
                <span></span>
              </div>
              {chargeItems.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 80px 40px', gap: '10px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={item.itemType}
                    onChange={(e) => updateChargeItem(index, 'itemType', e.target.value)}
                    disabled={isCompleted}
                    style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                  >
                    {Object.keys(SERVICES_MAP).map(type => (
                      <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}</option>
                    ))}
                  </select>
                  <select
                    className="form-input"
                    value={item.description}
                    onChange={(e) => updateChargeItem(index, 'description', e.target.value)}
                    disabled={isCompleted}
                    style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                  >
                    {SERVICES_MAP[item.itemType] && SERVICES_MAP[item.itemType].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {item.description && (!SERVICES_MAP[item.itemType] || !SERVICES_MAP[item.itemType].includes(item.description)) && (
                      <option value={item.description}>{item.description}</option>
                    )}
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => updateChargeItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    disabled={isCompleted}
                    style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                  />
                  {!isCompleted && chargeItems.length > 1 && (
                    <button type="button" className="btn-sm-action" style={{ background: '#fee2e2', color: '#ef4444', padding: '0.4rem', width: '100%' }} onClick={() => removeChargeRow(index)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            {!isCompleted && (
              <button type="button" className="btn btn-secondary mt-3" onClick={addChargeRow} style={{ width: '100%', padding: '0.6rem', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                + Add Another Service / Item
              </button>
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

