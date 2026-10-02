import { useState, useEffect } from 'react'
import AdminNav from '../components/AdminNav'
import { epic3Service } from '../services/epic3Service'
import { triggerAdminBadgeRefresh } from '../hooks/useAdminPendingCounts'
import './ModuleStyles.css'

export default function AdminAdmissionRequestsPage() {
  const [requests, setRequests] = useState([])
  const [availableCages, setAvailableCages] = useState([])
  const [allCages, setAllCages] = useState([])
  const [loading, setLoading] = useState(false)

  // Process Admission modal state
  const [selectedAdmission, setSelectedAdmission] = useState(null)
  const [selectedCageId, setSelectedCageId] = useState('')
  const [processing, setProcessing] = useState(false)

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionError, setRejectionError] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const [toast, setToast] = useState({ message: '', type: '' })

  useEffect(() => {
    loadRequests()
    loadCages()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await epic3Service.getAdmissions('REQUESTED')
      setRequests(data)
    } catch (err) {
      setToast({ message: err.message || 'Failed to load admission requests', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadCages = async () => {
    try {
      const [available, all] = await Promise.all([
        epic3Service.getAvailableCages(),
        epic3Service.getCages(),
      ])
      setAvailableCages(available)
      setAllCages(all)
      if (available.length > 0) {
        setSelectedCageId(available[0].id)
      } else {
        setSelectedCageId('')
      }
    } catch (err) {
      console.error('Failed to load cage data', err)
    }
  }

  // ── Capacity helpers ───────────────────────────────────────────────────
  const getCapacitySummary = () => {
    const total = allCages.length
    const available = availableCages.length
    const occupied = total - available
    const stdAvail = availableCages.filter(c => c.type === 'STANDARD_PET').length
    const icuAvail = availableCages.filter(c => c.type === 'ICU').length
    const isoAvail = availableCages.filter(c => c.type === 'ISOLATION').length
    return { total, available, occupied, stdAvail, icuAvail, isoAvail }
  }

  // ── Process Admission ──────────────────────────────────────────────────
  const handleOpenProcessModal = async (admission) => {
    setSelectedAdmission(admission)
    await loadCages()
  }

  const handleConfirmProcess = async (e) => {
    e.preventDefault()
    if (!selectedCageId) {
      setToast({ message: 'Please select an available cage/ward.', type: 'error' })
      return
    }

    setProcessing(true)
    setToast({ message: '', type: '' })
    try {
      await epic3Service.processAdmission(selectedAdmission.id, selectedCageId)
      setToast({ message: 'Admission processed! Pet admitted to cage ward successfully.', type: 'success' })
      setSelectedAdmission(null)
      loadRequests()
      loadCages()
      triggerAdminBadgeRefresh()
    } catch (err) {
      setToast({ message: err.message || 'Failed to process admission', type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  // ── Reject Admission ───────────────────────────────────────────────────
  const handleOpenRejectModal = (admission) => {
    setRejectTarget(admission)
    setRejectionReason('')
    setRejectionError('')
  }

  const handleCloseRejectModal = () => {
    setRejectTarget(null)
    setRejectionReason('')
    setRejectionError('')
  }

  const handleConfirmReject = async (e) => {
    e.preventDefault()
    const trimmed = rejectionReason.trim()
    if (!trimmed) {
      setRejectionError('Rejection reason is required. Please provide a reason before confirming.')
      return
    }

    setRejecting(true)
    setRejectionError('')
    setToast({ message: '', type: '' })
    try {
      await epic3Service.rejectAdmission(rejectTarget.id, trimmed)
      setToast({ message: `Admission request for ${rejectTarget.petName || 'pet'} has been rejected.`, type: 'success' })
      handleCloseRejectModal()
      loadRequests()
      triggerAdminBadgeRefresh()
    } catch (err) {
      setRejectionError(err.message || 'Failed to reject admission request. Please try again.')
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div className="module-page-container">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admission Requests</h1>
            <p className="page-subtitle">Process incoming pet admission requests submitted by pet owners and allocate accommodation.</p>
          </div>
          <button className="btn-refresh" onClick={() => { loadRequests(); loadCages() }} disabled={loading}>
            {loading ? 'Refreshing...' : '\u21bb Refresh'}
          </button>
        </div>

        {toast.message && (
          <div className={`alert-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ message: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="content-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Pending Admission Requests</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading admission requests...</p>
          ) : requests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No pending admission requests to process.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Requested Date</th>
                    <th>Pet</th>
                    <th>Pet Owner</th>
                    <th>Doctor</th>
                    <th>Recommendation Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => (
                    <tr key={item.id}>
                      <td>{item.requestedAt ? new Date(item.requestedAt).toLocaleString() : 'N/A'}</td>
                      <td>
                        <strong>{item.petName || 'Pet'}</strong>
                        <br />
                        <small style={{ color: 'var(--text-muted)' }}>{item.petSpecies}</small>
                      </td>
                      <td>{item.ownerName || 'Owner'}</td>
                      <td>{item.doctorName || 'Doctor'}</td>
                      <td>{item.recommendationReason}</td>
                      <td>
                        <span className="status-badge badge-requested">REQUESTED</span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-action process"
                          onClick={() => handleOpenProcessModal(item)}
                        >
                          Process Admission
                        </button>
                        <button
                          className="btn-action reject"
                          onClick={() => handleOpenRejectModal(item)}
                        >
                          Reject Request
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Process Admission Modal ─────────────────────────────────── */}
        {selectedAdmission && (() => {
          const cap = getCapacitySummary()
          const noAvailability = availableCages.length === 0
          return (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h3 className="modal-title">Process Admission &amp; Assign Accommodation</h3>
                  <button className="close-btn" onClick={() => setSelectedAdmission(null)}>✕</button>
                </div>

                {/* Pet summary */}
                <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.9rem' }}>
                  <p><strong>Pet:</strong> {selectedAdmission.petName} ({selectedAdmission.petSpecies})</p>
                  <p><strong>Owner:</strong> {selectedAdmission.ownerName}</p>
                  <p><strong>Reason:</strong> {selectedAdmission.recommendationReason}</p>
                </div>

                {/* Capacity summary */}
                <div className="capacity-summary-box">
                  <div className="capacity-summary-title">🏥 Accommodation Availability</div>
                  <div className="capacity-summary-row">
                    <div className="capacity-stat">
                      <span className="capacity-label">Total</span>
                      <span className="capacity-value">{cap.total}</span>
                    </div>
                    <div className="capacity-stat">
                      <span className="capacity-label">Available</span>
                      <span className="capacity-value available">{cap.available}</span>
                    </div>
                    <div className="capacity-stat">
                      <span className="capacity-label">Occupied</span>
                      <span className="capacity-value occupied">{cap.occupied}</span>
                    </div>
                  </div>
                  <div className="capacity-category-row">
                    <span>Standard Pet Cages:</span>
                    <span className={cap.stdAvail > 0 ? 'cap-avail' : 'cap-full'}>{cap.stdAvail} / 7 available</span>
                    <span style={{ marginLeft: '1rem' }}>ICU:</span>
                    <span className={cap.icuAvail > 0 ? 'cap-avail' : 'cap-full'}>{cap.icuAvail} / 2 available</span>
                    <span style={{ marginLeft: '1rem' }}>Isolation:</span>
                    <span className={cap.isoAvail > 0 ? 'cap-avail' : 'cap-full'}>{cap.isoAvail} / 1 available</span>
                  </div>
                </div>

                <form onSubmit={handleConfirmProcess}>
                  <div className="form-group">
                    <label>Select Available Cage / Ward</label>
                    {noAvailability ? (
                      <div className="no-capacity-notice">
                        <span style={{ fontSize: '1.1rem' }}>🚫</span>
                        <span>No accommodation currently available. All 10 units are occupied.</span>
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={selectedCageId}
                        onChange={(e) => setSelectedCageId(e.target.value)}
                        required
                      >
                        {availableCages.map((cage) => (
                          <option key={cage.id} value={cage.id}>
                            {cage.code} — {cage.type.replace('_', ' ')} ({cage.notes || 'Available'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn-secondary" onClick={() => setSelectedAdmission(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={processing || noAvailability}>
                      {processing ? 'Processing...' : 'Confirm & Admit Pet'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        })()}

        {/* ── Rejection Modal ─────────────────────────────────────────── */}
        {rejectTarget && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3 className="modal-title">Reject Admission Request</h3>
                <button className="close-btn" onClick={handleCloseRejectModal}>✕</button>
              </div>

              <div className="reject-context-box">
                <p><strong>Pet:</strong> {rejectTarget.petName} ({rejectTarget.petSpecies})</p>
                <p><strong>Owner:</strong> {rejectTarget.ownerName}</p>
                <p><strong>Doctor Recommendation:</strong> {rejectTarget.recommendationReason}</p>
              </div>

              <form onSubmit={handleConfirmReject}>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="rejectionReasonInput">
                    Rejection Reason <span style={{ color: 'var(--danger-color)' }}>*</span>
                  </label>
                  <textarea
                    id="rejectionReasonInput"
                    className="form-textarea"
                    rows="3"
                    placeholder="Provide a clear reason for rejecting this admission request..."
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value)
                      if (rejectionError) setRejectionError('')
                    }}
                  />
                  {rejectionError && (
                    <span className="field-error-text">{rejectionError}</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={handleCloseRejectModal} disabled={rejecting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-danger-solid" disabled={rejecting}>
                    {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
