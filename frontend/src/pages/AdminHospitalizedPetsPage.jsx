import { useState, useEffect } from 'react'
import { epic3Service } from '../services/epic3Service'
import { triggerAdminBadgeRefresh } from '../hooks/useAdminPendingCounts'
import './ModuleStyles.css'

export default function AdminHospitalizedPetsPage({ hideHeader = false }) {
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
    <div style={{ width: '100%' }}>
      <section className="modern-section">
        <div className="section-title-row flex-wrap">
          <div>
            {!hideHeader ? (
              <>
                <h2 className="section-heading">Hospitalized Pets</h2>
                <p className="section-sub">Track and monitor pets currently admitted in hospital cages and wards. Process discharges upon Doctor recommendation.</p>
              </>
            ) : (
              <h2 className="section-heading">Active Hospitalizations ({hospitalizations.length})</h2>
            )}
          </div>

          <div className="filter-group">
            <button
              onClick={loadHospitalizations} disabled={loading}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0 1rem', cursor: 'pointer', fontWeight: 600, color: '#475569', height: '40px', display: 'flex', alignItems: 'center' }}>
              {loading ? '...' : '\u21bb Refresh'}
            </button>
          </div>
        </div>

        {toast.message && (
          <div className={`alert-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ message: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="table-glass-wrapper" style={{ marginTop: '20px' }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', padding: '1.5rem' }}>Loading active hospitalizations...</p>
          ) : hospitalizations.length === 0 ? (
            <table className="modern-table">
              <tbody>
                <tr><td className="table-empty">No pets currently hospitalized.</td></tr>
              </tbody>
            </table>
          ) : (
            <table className="modern-table">
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
                    <tr key={item.id} className="table-row-hover">
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                          {item.admittedAt ? new Date(item.admittedAt).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-chip" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                            {String(item.petSpecies).toLowerCase().includes('cat') ? '🐱' :
                              String(item.petSpecies).toLowerCase().includes('dog') ? '🐶' : '🐾'}
                          </div>
                          <div>
                            <strong className="user-name-text" style={{ display: 'block', fontSize: '0.95rem' }}>{item.petName || 'Pet'}</strong>
                            <small style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.petSpecies}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{item.ownerName || 'Owner'}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>{item.doctorName || 'Doctor'}</span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: '#334155' }}>{item.cageCode || 'Assigned Cage'}</strong>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                          background: item.recoveryStatus === 'CRITICAL' ? '#fef2f2' :
                            item.recoveryStatus === 'IMPROVING' ? '#e0e7ff' : '#dcfce7',
                          color: item.recoveryStatus === 'CRITICAL' ? '#dc2626' :
                            item.recoveryStatus === 'IMPROVING' ? '#4f46e5' : '#15803d',
                          border: `1px solid ${item.recoveryStatus === 'CRITICAL' ? '#fecaca' :
                            item.recoveryStatus === 'IMPROVING' ? '#c7d2fe' : '#bbf7d0'}`
                        }}>
                          {item.recoveryStatus || 'STABLE'}
                        </span>
                      </td>
                      <td>
                        {isDischargeReady ? (
                          <div>
                            <span style={{
                              display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                              background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a'
                            }}>
                              Discharge Recommended
                            </span>
                            {item.dischargeRecommendationReason && (
                              <small style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                                Reason: {item.dischargeRecommendationReason}
                              </small>
                            )}
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                            background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0'
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td>
                        {isDischargeReady ? (
                          <button
                            onClick={() => handleOpenDischargeModal(item)}
                            style={{ padding: '6px 14px', borderRadius: '10px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#bbf7d0'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#dcfce7'; }}
                          >
                            Confirm Discharge
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>In Care</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Confirm Discharge Modal ── */}
        {dischargeTarget && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ fontSize: '1.25rem', color: '#0f172a' }}>Confirm Pet Discharge</h3>
                <button className="close-btn" onClick={() => setDischargeTarget(null)}>✕</button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#334155' }}><strong style={{ color: '#0f172a' }}>Pet:</strong> {dischargeTarget.petName} ({dischargeTarget.petSpecies})</p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#334155' }}><strong style={{ color: '#0f172a' }}>Assigned Cage/Ward:</strong> {dischargeTarget.cageCode} <br /><span style={{ color: '#059669', fontWeight: 600, fontSize: '0.85rem' }}>&rarr; Will be released to AVAILABLE</span></p>
                <p style={{ margin: '0', color: '#334155' }}><strong style={{ color: '#0f172a' }}>Doctor Recommendation:</strong> {dischargeTarget.dischargeRecommendationReason || 'Recommended by doctor'}</p>
              </div>

              <form onSubmit={handleConfirmDischarge}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Discharge Notes / Summary</label>
                  <textarea
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' }}
                    rows="3"
                    value={dischargeNotes}
                    onChange={(e) => setDischargeNotes(e.target.value)}
                    placeholder="Enter discharge instructions or notes..."
                    onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button"
                    onClick={() => setDischargeTarget(null)}
                    style={{ background: '#f1f5f9', color: '#475569', padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
                    onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
                  >
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={confirmingDischarge}
                    style={{ background: '#0d9488', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.style.background = '#0f766e'}
                    onMouseOut={(e) => e.target.style.background = '#0d9488'}
                  >
                    {confirmingDischarge ? 'Processing...' : 'Confirm & Release Cage'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
