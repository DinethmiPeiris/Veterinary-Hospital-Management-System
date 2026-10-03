import { useState, useEffect } from 'react'
import { epic3Service } from '../services/epic3Service'
import { triggerAdminBadgeRefresh } from '../hooks/useAdminPendingCounts'
import './ModuleStyles.css'

export default function AdminHospitalizedPetsPage() {
  const [hospitalizations, setHospitalizations] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: '' })

  // Discharge Modal State
  const [dischargeTarget, setDischargeTarget] = useState(null)
  const [dischargeNotes, setDischargeNotes] = useState('')
  const [confirmingDischarge, setConfirmingDischarge] = useState(false)

  useEffect(() => {
    loadHospitalizations()
  }, [])

  const loadHospitalizations = async () => {
    setLoading(true)
    try {
      const data = await epic3Service.getActiveHospitalizations()
      setHospitalizations(data)
    } catch (err) {
      setToast({ message: err.message || 'Failed to load hospitalized pets', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDischargeModal = (item) => {
    setDischargeTarget(item)
    // Removed "Accommodation freed." — that is an internal operational detail not shown to owners
    setDischargeNotes('Patient discharged in stable condition.')
  }

  const handleConfirmDischarge = async (e) => {
    e.preventDefault()
    setConfirmingDischarge(true)
    setToast({ message: '', type: '' })
    try {
      await epic3Service.confirmDischarge(dischargeTarget.id, {
        dischargeNotes: dischargeNotes.trim(),
        adminId: 'ADMIN-01'
      })
      setToast({
        message: `Pet "${dischargeTarget.petName}" successfully discharged! Cage/Ward ${dischargeTarget.cageCode || ''} has been released and is now AVAILABLE for new admissions.`,
        type: 'success'
      })
      setDischargeTarget(null)
      loadHospitalizations()
      // Immediately refresh Admin nav badges so the Hospitalized Pets badge decreases
      triggerAdminBadgeRefresh()
    } catch (err) {
      setToast({ message: err.message || 'Failed to confirm discharge', type: 'error' })
    } finally {
      setConfirmingDischarge(false)
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
            <p className="page-subtitle">Track and monitor pets currently admitted in hospital cages and wards. Process discharges upon Doctor recommendation.</p>
          </div>
          <button className="btn-refresh" onClick={loadHospitalizations} disabled={loading}>
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
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active Hospitalizations ({hospitalizations.length})</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading active hospitalizations...</p>
          ) : hospitalizations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No pets currently hospitalized.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admitted Date &amp; Time</th>
                    <th>Pet Name</th>
                    <th>Pet Owner</th>
                    <th>Doctor</th>
                    <th>Assigned Cage / Ward</th>
                    <th>Recovery Status</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitalizations.map((item) => {
                    const isDischargeReady = item.status === 'DISCHARGE_RECOMMENDED' || item.dischargeRecommended

                    return (
                      <tr key={item.id}>
                        <td>{item.admittedAt ? new Date(item.admittedAt).toLocaleString() : 'N/A'}</td>
                        <td>
                          <strong>{item.petName || 'Pet'}</strong>
                          <br />
                          <small style={{ color: 'var(--text-muted)' }}>{item.petSpecies}</small>
                        </td>
                        <td>{item.ownerName || 'Owner'}</td>
                        <td>{item.doctorName || 'Doctor'}</td>
                        <td>
                          <strong>{item.cageCode || 'Assigned Cage'}</strong>
                        </td>
                        <td>
                          <span className={`status-badge ${getRecoveryBadgeClass(item.recoveryStatus || 'STABLE')}`}>
                            {item.recoveryStatus || 'STABLE'}
                          </span>
                        </td>
                        <td>
                          {isDischargeReady ? (
                            <div>
                              <span className="status-badge badge-discharge-rec">Discharge Recommended</span>
                              {item.dischargeRecommendationReason && (
                                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                  Reason: {item.dischargeRecommendationReason}
                                </small>
                              )}
                            </div>
                          ) : (
                            <span className="status-badge badge-active">ACTIVE</span>
                          )}
                        </td>
                        <td>
                          {isDischargeReady ? (
                            <button
                              className="btn-action process"
                              onClick={() => handleOpenDischargeModal(item)}
                            >
                              Confirm Discharge
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>In Care</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Confirm Discharge Modal ── */}
        {dischargeTarget && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3 className="modal-title">Confirm Pet Discharge</h3>
                <button className="close-btn" onClick={() => setDischargeTarget(null)}>✕</button>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <p><strong>Pet:</strong> {dischargeTarget.petName} ({dischargeTarget.petSpecies})</p>
                <p><strong>Assigned Cage/Ward:</strong> {dischargeTarget.cageCode} <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>&rarr; Will be released to AVAILABLE</span></p>
                <p><strong>Doctor Recommendation:</strong> {dischargeTarget.dischargeRecommendationReason || 'Recommended by doctor'}</p>
              </div>

              <form onSubmit={handleConfirmDischarge}>
                <div className="form-group">
                  <label>Discharge Notes / Summary</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={dischargeNotes}
                    onChange={(e) => setDischargeNotes(e.target.value)}
                    placeholder="Enter discharge instructions or notes..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setDischargeTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={confirmingDischarge}>
                    {confirmingDischarge ? 'Processing Discharge...' : 'Confirm Discharge & Release Cage'}
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
