import { useState, useEffect } from 'react'
import { epic3Service } from '../services/epic3Service'
import { getEpic3Session } from '../services/demoConfig'
import './ModuleStyles.css'

export default function DoctorHospitalizedPetsPage() {
  const [hospitalizations, setHospitalizations] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [activeTab, setActiveTab] = useState('treatment') // 'treatment' | 'recovery' | 'medication' | 'supply' | 'discharge'
  const [inventoryItems, setInventoryItems] = useState([])
  const [medicineRequests, setMedicineRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: '' })

  // Forms State
  const [treatmentForm, setTreatmentForm] = useState({
    note: '',
    observation: '',
    treatmentGiven: ''
  })

  const [recoveryForm, setRecoveryForm] = useState({
    recoveryStatus: 'STABLE',
    recoveryNote: ''
  })

  const [medicationForm, setMedicationForm] = useState({
    medicineName: '',
    dosage: '',
    frequency: '',
    administrationInstructions: '',
    notes: ''
  })

  const [supplyForm, setSupplyForm] = useState({
    inventoryItemId: '',
    requestedQuantity: 1,
    instructions: ''
  })

  const [dischargeForm, setDischargeForm] = useState({
    recommendationReason: ''
  })

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadHospitalizations()
    loadInventory()
  }, [])

  const loadHospitalizations = async () => {
    setLoading(true)
    try {
      const data = await epic3Service.getActiveHospitalizations()
      setHospitalizations(data)
      if (selectedPet) {
        const refreshed = data.find((h) => h.id === selectedPet.id)
        if (refreshed) {
          setSelectedPet(refreshed)
          loadPetMedicineRequests(refreshed.id)
        }
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load hospitalized pets', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      const items = await epic3Service.getInventoryItems('ALL')
      setInventoryItems(items)
      if (items.length > 0 && !supplyForm.inventoryItemId) {
        setSupplyForm((prev) => ({ ...prev, inventoryItemId: items[0].id }))
      }
    } catch (err) {
      console.error('Failed to load inventory for medicine requests', err)
    }
  }

  const loadPetMedicineRequests = async (hospitalizationId) => {
    try {
      const requests = await epic3Service.getMedicineRequestsByHospitalization(hospitalizationId)
      setMedicineRequests(requests)
    } catch (err) {
      console.error('Failed to load medicine requests', err)
    }
  }

  const handleSelectPet = async (pet) => {
    setSelectedPet(pet)
    setDetailsLoading(true)
    setToast({ message: '', type: '' })
    try {
      const latest = await epic3Service.getHospitalizationById(pet.id)
      setSelectedPet(latest)
      if (latest.recoveryStatus) {
        setRecoveryForm({
          recoveryStatus: latest.recoveryStatus,
          recoveryNote: latest.recoveryNote || ''
        })
      }
      await loadPetMedicineRequests(pet.id)
    } catch (err) {
      setToast({ message: err.message || 'Failed to load pet details', type: 'error' })
    } finally {
      setDetailsLoading(false)
    }
  }

  // ── 1. Add Daily Treatment Note ────────────────────────────────────────────
  const handleAddTreatmentNote = async (e) => {
    e.preventDefault()
    if (!treatmentForm.note.trim()) {
      setToast({ message: 'Please enter a clinical treatment note.', type: 'error' })
      return
    }

    setSubmitting(true)
    setToast({ message: '', type: '' })
    try {
      const updated = await epic3Service.addTreatmentNote(selectedPet.id, {
        note: treatmentForm.note.trim(),
        observation: treatmentForm.observation.trim(),
        treatmentGiven: treatmentForm.treatmentGiven.trim(),
        doctorId: getEpic3Session().doctorId,
        doctorName: getEpic3Session().doctorName
      })
      setSelectedPet(updated)
      setTreatmentForm({ note: '', observation: '', treatmentGiven: '' })
      setToast({ message: 'Daily treatment note recorded successfully.', type: 'success' })
      loadHospitalizations()
    } catch (err) {
      setToast({ message: err.message || 'Failed to add treatment note', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── 2. Update Recovery Progress ────────────────────────────────────────────
  const handleUpdateRecovery = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setToast({ message: '', type: '' })
    try {
      const updated = await epic3Service.updateRecoveryProgress(selectedPet.id, {
        recoveryStatus: recoveryForm.recoveryStatus,
        recoveryNote: recoveryForm.recoveryNote.trim(),
        doctorId: getEpic3Session().doctorId,
        doctorName: getEpic3Session().doctorName
      })
      setSelectedPet(updated)
      setToast({ message: `Recovery status updated to ${recoveryForm.recoveryStatus}.`, type: 'success' })
      loadHospitalizations()
    } catch (err) {
      setToast({ message: err.message || 'Failed to update recovery progress', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── 3. Add Inpatient Medication Instruction ────────────────────────────────
  const handleAddMedication = async (e) => {
    e.preventDefault()
    if (!medicationForm.medicineName.trim() || !medicationForm.administrationInstructions.trim()) {
      setToast({ message: 'Medicine name and administration instructions are required.', type: 'error' })
      return
    }

    setSubmitting(true)
    setToast({ message: '', type: '' })
    try {
      const updated = await epic3Service.addMedicationInstruction(selectedPet.id, {
        medicineName: medicationForm.medicineName.trim(),
        dosage: medicationForm.dosage.trim(),
        frequency: medicationForm.frequency.trim(),
        administrationInstructions: medicationForm.administrationInstructions.trim(),
        notes: medicationForm.notes.trim(),
        doctorId: getEpic3Session().doctorId,
        doctorName: getEpic3Session().doctorName
      })
      setSelectedPet(updated)
      setMedicationForm({ medicineName: '', dosage: '', frequency: '', administrationInstructions: '', notes: '' })
      setToast({ message: 'Medication instruction saved successfully.', type: 'success' })
      loadHospitalizations()
    } catch (err) {
      setToast({ message: err.message || 'Failed to add medication instruction', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── 4. Request Medicine / Supply from Inventory ────────────────────────────
  const handleRequestSupply = async (e) => {
    e.preventDefault()
    if (!supplyForm.inventoryItemId) {
      setToast({ message: 'Please select an item from inventory.', type: 'error' })
      return
    }
    if (supplyForm.requestedQuantity <= 0) {
      setToast({ message: 'Requested quantity must be greater than 0.', type: 'error' })
      return
    }

    setSubmitting(true)
    setToast({ message: '', type: '' })
    try {
      await epic3Service.createMedicineRequest({
        hospitalizationId: selectedPet.id,
        inventoryItemId: supplyForm.inventoryItemId,
        requestedQuantity: parseInt(supplyForm.requestedQuantity, 10),
        instructions: supplyForm.instructions.trim(),
        doctorId: getEpic3Session().doctorId,
        doctorName: getEpic3Session().doctorName
      })
      setToast({ message: 'Medicine request submitted. Request is now pending Admin issuance.', type: 'success' })
      setSupplyForm((prev) => ({ ...prev, instructions: '', requestedQuantity: 1 }))
      loadPetMedicineRequests(selectedPet.id)
    } catch (err) {
      setToast({ message: err.message || 'Failed to submit medicine request', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── 5. Recommend Discharge ─────────────────────────────────────────────────
  const handleRecommendDischarge = async (e) => {
    e.preventDefault()
    if (!dischargeForm.recommendationReason.trim()) {
      setToast({ message: 'Please provide a clear discharge recommendation reason.', type: 'error' })
      return
    }

    setSubmitting(true)
    setToast({ message: '', type: '' })
    try {
      const updated = await epic3Service.recommendDischarge(selectedPet.id, {
        recommendationReason: dischargeForm.recommendationReason.trim(),
        doctorId: getEpic3Session().doctorId,
        doctorName: getEpic3Session().doctorName
      })
      setSelectedPet(updated)
      setToast({ message: 'Discharge recommendation submitted! Admin has been notified for discharge processing.', type: 'success' })
      loadHospitalizations()
    } catch (err) {
      setToast({ message: err.message || 'Failed to recommend discharge', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const getRecoveryBadgeClass = (status) => {
    switch (status) {
      case 'CRITICAL': return 'badge-critical'
      case 'POOR': return 'badge-poor'
      case 'STABLE': return 'badge-stable'
      case 'IMPROVING': return 'badge-improving'
      case 'RECOVERED': return 'badge-recovered'
      default: return 'badge-stable'
    }
  }

  return (
    <div className="module-page-container">
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Hospitalized Pets</h1>
            <p className="page-subtitle">
              Monitor active inpatient pets, record daily treatment notes, track recovery, prescribe medications, and manage discharge.
            </p>
          </div>
          <button
            className="btn-refresh"
            onClick={() => {
              loadHospitalizations()
              loadInventory()
            }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '\u21bb Refresh'}
          </button>
        </div>

        {toast.message && (
          <div className={`alert-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ message: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="two-column-workspace">
          {/* ── Left Column: Active Hospitalized Pets List ── */}
          <div className="workspace-sidebar">
            <div className="content-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Inpatient Pets ({hospitalizations.length})</h2>
              </div>

              {loading && !selectedPet ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading inpatient pets...</p>
              ) : hospitalizations.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No pets currently hospitalized.</p>
              ) : (
                <div className="pet-selection-list">
                  {hospitalizations.map((item) => {
                    const isSelected = selectedPet && selectedPet.id === item.id
                    return (
                      <div
                        key={item.id}
                        className={`pet-list-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPet(item)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{item.petName || 'Pet'}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                              {item.petSpecies}
                            </span>
                          </div>
                          <span className="cage-badge">{item.cageCode || 'Cage'}</span>
                        </div>

                        <div style={{ marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Owner: {item.ownerName}</span>
                          {item.recoveryStatus && (
                            <span className={`status-badge ${getRecoveryBadgeClass(item.recoveryStatus)}`}>
                              {item.recoveryStatus}
                            </span>
                          )}
                        </div>

                        {item.status === 'DISCHARGE_RECOMMENDED' && (
                          <div style={{ marginTop: '0.4rem' }}>
                            <span className="status-badge badge-discharge-rec">Discharge Recommended</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Selected Pet Details & Actions ── */}
          <div className="workspace-main">
            {!selectedPet ? (
              <div className="content-card empty-state-card">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🩺</div>
                <h3>Select a Hospitalized Pet</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Click on any inpatient pet from the list on the left to record treatment notes, track recovery, request supplies, or recommend discharge.
                </p>
              </div>
            ) : detailsLoading ? (
              <div className="content-card">
                <p style={{ color: 'var(--text-muted)' }}>Loading pet clinical records...</p>
              </div>
            ) : (
              <div>
                {/* Pet Overview Header Card */}
                <div className="content-card pet-overview-card">
                  <div className="pet-overview-grid">
                    <div>
                      <span className="meta-label">Pet Name</span>
                      <h2 style={{ fontSize: '1.35rem', margin: '0.15rem 0' }}>{selectedPet.petName}</h2>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{selectedPet.petSpecies}</span>
                    </div>
                    <div>
                      <span className="meta-label">Accommodation</span>
                      <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: '0.15rem 0' }}>{selectedPet.cageCode || 'Assigned Cage'}</p>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Admitted: {selectedPet.admittedAt ? new Date(selectedPet.admittedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Pet Owner</span>
                      <p style={{ fontWeight: 600, margin: '0.15rem 0' }}>{selectedPet.ownerName}</p>
                      <span className="meta-label">Attending Doctor</span>
                      <p style={{ margin: '0.15rem 0', fontSize: '0.875rem' }}>{selectedPet.doctorName}</p>
                    </div>
                    <div>
                      <span className="meta-label">Recovery Status</span>
                      <div style={{ marginTop: '0.25rem' }}>
                        <span className={`status-badge ${getRecoveryBadgeClass(selectedPet.recoveryStatus || 'STABLE')}`}>
                          {selectedPet.recoveryStatus || 'STABLE'}
                        </span>
                      </div>
                      {selectedPet.status === 'DISCHARGE_RECOMMENDED' && (
                        <div style={{ marginTop: '0.35rem' }}>
                          <span className="status-badge badge-discharge-rec">Discharge Recommended</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clinical Tabs Navigation */}
                <div className="tabs-bar">
                  <button
                    className={`tab-btn ${activeTab === 'treatment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('treatment')}
                  >
                    📝 Daily Treatment Notes ({selectedPet.treatmentNotes?.length || 0})
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'recovery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recovery')}
                  >
                    📈 Recovery Progress
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'medication' ? 'active' : ''}`}
                    onClick={() => setActiveTab('medication')}
                  >
                    💊 Medication Instructions ({selectedPet.medicationInstructions?.length || 0})
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'supply' ? 'active' : ''}`}
                    onClick={() => setActiveTab('supply')}
                  >
                    📦 Medicine Requests ({medicineRequests.length})
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'discharge' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discharge')}
                  >
                    🚪 Discharge Recommendation
                  </button>
                </div>

                {/* ── TAB 1: Daily Treatment Notes ── */}
                {activeTab === 'treatment' && (
                  <div className="content-card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Record Daily Treatment Note</h3>
                    <form onSubmit={handleAddTreatmentNote} style={{ marginBottom: '2rem' }}>
                      <div className="form-group">
                        <label>Clinical Observation</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Temperature 38.5°C, alert and responsive, eating well..."
                          value={treatmentForm.observation}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, observation: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Treatment Given / Procedures</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Wound dressing cleaned, IV fluids continued at 50ml/hr..."
                          value={treatmentForm.treatmentGiven}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, treatmentGiven: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Daily Treatment Note <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          placeholder="Detailed doctor treatment notes and clinical progress..."
                          value={treatmentForm.note}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, note: e.target.value })}
                          required
                        />
                      </div>
                      <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Saving Note...' : 'Add Treatment Note'}
                      </button>
                    </form>

                    <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      Treatment Notes History
                    </h4>
                    {(!selectedPet.treatmentNotes || selectedPet.treatmentNotes.length === 0) ? (
                      <p style={{ color: 'var(--text-muted)' }}>No treatment notes recorded yet for this hospitalization.</p>
                    ) : (
                      <div className="notes-timeline">
                        {selectedPet.treatmentNotes.slice().reverse().map((note) => (
                          <div key={note.id} className="timeline-item">
                            <div className="timeline-header">
                              <strong>{note.doctorName || 'Attending Doctor'}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                              </span>
                            </div>
                            {note.observation && (
                              <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                                <strong>Observation:</strong> {note.observation}
                              </p>
                            )}
                            {note.treatmentGiven && (
                              <p style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                                <strong>Treatment Given:</strong> {note.treatmentGiven}
                              </p>
                            )}
                            <p style={{ margin: '0.4rem 0 0 0', color: '#334155', background: '#f8fafc', padding: '0.6rem', borderRadius: '0.375rem', fontSize: '0.9rem' }}>
                              {note.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 2: Recovery Progress ── */}
                {activeTab === 'recovery' && (
                  <div className="content-card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Update Recovery Progress</h3>
                    <form onSubmit={handleUpdateRecovery} style={{ marginBottom: '2rem' }}>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Current Recovery Assessment</label>
                          <select
                            className="form-select"
                            value={recoveryForm.recoveryStatus}
                            onChange={(e) => setRecoveryForm({ ...recoveryForm, recoveryStatus: e.target.value })}
                            required
                          >
                            <option value="CRITICAL">CRITICAL</option>
                            <option value="POOR">POOR</option>
                            <option value="STABLE">STABLE</option>
                            <option value="IMPROVING">IMPROVING</option>
                            <option value="RECOVERED">RECOVERED</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Progress Notes</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Clinical justification for recovery update..."
                            value={recoveryForm.recoveryNote}
                            onChange={(e) => setRecoveryForm({ ...recoveryForm, recoveryNote: e.target.value })}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Updating...' : 'Update Recovery Assessment'}
                      </button>
                    </form>

                    <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      Recovery Progress Timeline
                    </h4>
                    {(!selectedPet.recoveryHistory || selectedPet.recoveryHistory.length === 0) ? (
                      <p style={{ color: 'var(--text-muted)' }}>No recovery assessment updates recorded yet.</p>
                    ) : (
                      <div className="notes-timeline">
                        {selectedPet.recoveryHistory.slice().reverse().map((entry) => (
                          <div key={entry.id} className="timeline-item">
                            <div className="timeline-header">
                              <span className={`status-badge ${getRecoveryBadgeClass(entry.recoveryStatus)}`}>
                                {entry.recoveryStatus}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {entry.recordedAt ? new Date(entry.recordedAt).toLocaleString() : ''} by {entry.doctorName || 'Doctor'}
                              </span>
                            </div>
                            {entry.recoveryNote && (
                              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: '#334155' }}>
                                {entry.recoveryNote}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 3: Medication Instructions ── */}
                {activeTab === 'medication' && (
                  <div className="content-card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Add Inpatient Medication Instruction</h3>
                    <form onSubmit={handleAddMedication} style={{ marginBottom: '2rem' }}>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Medicine / Supply Name <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Amoxicillin 250mg"
                            value={medicationForm.medicineName}
                            onChange={(e) => setMedicationForm({ ...medicationForm, medicineName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Dosage</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 1 Tablet / 5ml"
                            value={medicationForm.dosage}
                            onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Frequency</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Twice daily after meals (BID)"
                            value={medicationForm.frequency}
                            onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Administration Instructions <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Oral administration with wet food"
                            value={medicationForm.administrationInstructions}
                            onChange={(e) => setMedicationForm({ ...medicationForm, administrationInstructions: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Additional Clinical Notes (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Monitor for allergic reaction or vomiting"
                          value={medicationForm.notes}
                          onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Add Medication Instruction'}
                      </button>
                    </form>

                    <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      Current Inpatient Medication Instructions
                    </h4>
                    {(!selectedPet.medicationInstructions || selectedPet.medicationInstructions.length === 0) ? (
                      <p style={{ color: 'var(--text-muted)' }}>No inpatient medication instructions added yet.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Medicine Name</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Administration Guidelines</th>
                              <th>Doctor Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPet.medicationInstructions.map((inst) => (
                              <tr key={inst.id}>
                                <td><strong>{inst.medicineName}</strong></td>
                                <td>{inst.dosage || 'Standard'}</td>
                                <td>{inst.frequency || 'As directed'}</td>
                                <td>{inst.administrationInstructions}</td>
                                <td><small style={{ color: 'var(--text-muted)' }}>{inst.notes || '—'}</small></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 4: Medicine & Supply Requests ── */}
                {activeTab === 'supply' && (
                  <div className="content-card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Request Medicine / Supplies from Inventory</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      Select items from hospital inventory for this inpatient pet. Submitted requests will be pending until Admin verifies stock and issues items.
                    </p>

                    <form onSubmit={handleRequestSupply} style={{ marginBottom: '2rem' }}>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Inventory Item <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                          {inventoryItems.length === 0 ? (
                            <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>No inventory items found.</p>
                          ) : (
                            <select
                              className="form-select"
                              value={supplyForm.inventoryItemId}
                              onChange={(e) => setSupplyForm({ ...supplyForm, inventoryItemId: e.target.value })}
                              required
                            >
                              {inventoryItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.itemName} ({item.itemCode}) — Stock: {item.quantity} {item.unit}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Requested Quantity <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            value={supplyForm.requestedQuantity}
                            onChange={(e) => setSupplyForm({ ...supplyForm, requestedQuantity: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Treatment Instructions / Request Note</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 5 doses for 2-day postoperative recovery course"
                          value={supplyForm.instructions}
                          onChange={(e) => setSupplyForm({ ...supplyForm, instructions: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn-primary" disabled={submitting || inventoryItems.length === 0}>
                        {submitting ? 'Submitting Request...' : 'Submit Medicine Request'}
                      </button>
                    </form>

                    <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      Requests History for this Hospitalization
                    </h4>
                    {medicineRequests.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No medicine or supply requests submitted for this pet yet.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Requested Date</th>
                              <th>Item Name</th>
                              <th>Requested Qty</th>
                              <th>Instructions</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {medicineRequests.map((req) => (
                              <tr key={req.id}>
                                <td>{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : 'N/A'}</td>
                                <td><strong>{req.itemName}</strong> <small style={{ color: 'var(--text-muted)' }}>({req.itemCode})</small></td>
                                <td>{req.requestedQuantity} {req.unit}</td>
                                <td>{req.instructions || '—'}</td>
                                <td>
                                  <span className={`status-badge badge-${req.status ? req.status.toLowerCase() : 'pending'}`}>
                                    {req.status}
                                  </span>
                                  {req.status === 'ISSUED' && req.issuedAt && (
                                    <small style={{ display: 'block', color: 'var(--success-color)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                      Issued {new Date(req.issuedAt).toLocaleDateString()}
                                    </small>
                                  )}
                                  {req.status === 'UNAVAILABLE' && req.unavailableReason && (
                                    <small style={{ display: 'block', color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                      {req.unavailableReason}
                                    </small>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 5: Discharge Recommendation ── */}
                {activeTab === 'discharge' && (
                  <div className="content-card">
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Discharge Recommendation</h3>

                    {selectedPet.status === 'DISCHARGE_RECOMMENDED' || selectedPet.dischargeRecommended ? (
                      <div className="discharge-status-banner">
                        <div style={{ fontSize: '2rem' }}>✅</div>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', color: '#065f46' }}>Discharge Recommended by Doctor</h4>
                          <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>
                            <strong>Recommendation Reason:</strong> {selectedPet.dischargeRecommendationReason}
                          </p>
                          <small style={{ color: 'var(--text-muted)' }}>
                            Recommended on {selectedPet.dischargeRecommendedAt ? new Date(selectedPet.dischargeRecommendedAt).toLocaleString() : 'N/A'} by {selectedPet.dischargeRecommendedByDoctorName || 'Doctor'}
                          </small>
                          <p style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: '#0f766e', fontWeight: 600 }}>
                            Awaiting Admin confirmation to finalize discharge and release cage/ward accommodation.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                          When a hospitalized pet has sufficiently recovered and vitals are stable, recommend the pet for discharge.
                          Admin will confirm discharge and release the assigned accommodation.
                        </p>
                        <form onSubmit={handleRecommendDischarge}>
                          <div className="form-group">
                            <label>Discharge Recommendation Reason &amp; Home Care Advice <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <textarea
                              className="form-textarea"
                              rows="3"
                              placeholder="e.g. Pet is stable, vital signs normal, incision healed. Can continue oral antibiotics at home with follow-up in 7 days."
                              value={dischargeForm.recommendationReason}
                              onChange={(e) => setDischargeForm({ ...dischargeForm, recommendationReason: e.target.value })}
                              required
                            />
                          </div>
                          <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Recommend Discharge'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
