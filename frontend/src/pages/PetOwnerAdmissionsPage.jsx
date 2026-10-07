import { useState, useEffect, useRef, useCallback } from 'react'
import { epic3Service } from '../services/epic3Service'
import { getEpic3Session } from '../services/demoConfig'
import './ModuleStyles.css'

// Session-storage key for tracking which update IDs have been viewed
const VIEWED_UPDATES_KEY = 'epic3_viewed_update_ids'

function getViewedIds() {
  try {
    return JSON.parse(sessionStorage.getItem(VIEWED_UPDATES_KEY) || '[]')
  } catch {
    return []
  }
}

function markAllViewed(ids) {
  try {
    sessionStorage.setItem(VIEWED_UPDATES_KEY, JSON.stringify(ids))
  } catch {
    // sessionStorage not available — degrade gracefully
  }
}

/**
 * Strip only the automatically generated internal operational phrase from discharge notes
 * for owner-facing display. Does NOT modify backend data.
 * The actual cage-release business logic is entirely in the backend.
 */
function stripInternalDischargePhrase(notes) {
  if (!notes) return notes
  return notes
    .replace(' Accommodation freed.', '')
    .replace('Accommodation freed.', '')
    .trim()
}

/** Map recovery status to its badge CSS class */
function getRecoveryBadgeClass(status) {
  switch (status) {
    case 'CRITICAL':  return 'badge-critical'
    case 'POOR':      return 'badge-poor'
    case 'STABLE':    return 'badge-stable'
    case 'IMPROVING': return 'badge-improving'
    case 'RECOVERED': return 'badge-recovered'
    default:          return 'badge-stable'
  }
}

export default function PetOwnerAdmissionsPage({ hideHeader = false }) {
  const [admissions, setAdmissions] = useState([])
  const [hospitalizationsMap, setHospitalizationsMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [toast, setToast] = useState({ message: '', type: '' })
  const [error, setError] = useState('')

  // Notification panel state
  const [notifOpen, setNotifOpen] = useState(false)
  const [viewedIds, setViewedIds] = useState(() => getViewedIds())
  const notifPanelRef = useRef(null)
  const notifBtnRef = useRef(null)

  // Treatment & Recovery Modal State
  const [activeClinicalRecord, setActiveClinicalRecord] = useState(null)
  const [clinicalLoading, setClinicalLoading] = useState(false)

  // TODO [EPIC 1 INTEGRATION]: Replace with current logged-in Pet Owner's ID
  // from authentication context (e.g., useAuth() hook or JWT decoded payload).
  const currentPetOwnerId = getEpic3Session().ownerId

  useEffect(() => {
    loadAdmissions()
  }, [])

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(e.target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target)
      ) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadAdmissions = async () => {
    setLoading(true)
    setError('')
    try {
      // Filter by petOwnerId so Pet Owner only sees THEIR recommendations
      const data = await epic3Service.getAdmissionsByOwner(currentPetOwnerId)
      setAdmissions(data)

      // Fetch corresponding hospitalization records for inpatient & discharged pets
      const hospMap = {}
      await Promise.allSettled(
        data
          .filter((item) => item.status === 'ADMITTED' || item.status === 'DISCHARGED')
          .map(async (item) => {
            try {
              const hosp = await epic3Service.getHospitalizationByAdmissionId(item.id)
              if (hosp) {
                hospMap[item.id] = hosp
              }
            } catch {
              // Ignore if hospitalization record is not created yet
            }
          })
      )
      setHospitalizationsMap(hospMap)
    } catch (err) {
      const msg = err.message || 'Failed to load pet admissions. Please try again.'
      setError(msg)
      setToast({ message: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // TODO [EPIC 1 INTEGRATION]: Connect status-derived Pet Owner updates to Epic 1's shared Notification Center when that module is merged.
  const getRecentUpdates = useCallback(() => {
    if (!admissions || admissions.length === 0) return []

    const updates = admissions.map((item) => {
      const hosp = hospitalizationsMap[item.id]
      const petName = item.petName || 'your pet'
      const doctorName = item.doctorName || 'Dr. Nimal Fernando'

      // 1. DISCHARGE_RECOMMENDED (Doctor recommended discharge; awaiting Admin confirmation)
      if (hosp && (hosp.status === 'DISCHARGE_RECOMMENDED' || hosp.dischargeRecommended) && item.status !== 'DISCHARGED') {
        return {
          id: `update-disrec-${item.id}`,
          type: 'DISCHARGE_RECOMMENDED',
          icon: '🩺',
          statusBadge: 'Discharge Recommended',
          badgeClass: 'badge-discharge-rec',
          cardClass: 'update-discharge_recommended',
          message: `The doctor has recommended discharge for ${petName}. Final confirmation is pending.`,
          detail: hosp.dischargeRecommendationReason ? `Reason: ${hosp.dischargeRecommendationReason}` : null,
          timestamp: hosp.dischargeRecommendedAt || item.admittedAt || item.recommendedAt,
          petName
        }
      }

      // 2. DISCHARGED (Admin confirmed final discharge)
      if (item.status === 'DISCHARGED') {
        return {
          id: `update-dis-${item.id}`,
          type: 'DISCHARGED',
          icon: '✅',
          statusBadge: 'Discharged',
          badgeClass: 'badge-recovered',
          cardClass: 'update-discharged',
          message: `${petName} has been discharged from the hospital.`,
          detail: hosp?.dischargeNotes
            ? `Discharge Instructions: ${stripInternalDischargePhrase(hosp.dischargeNotes)}`
            : 'Discharge information and treatment history are available.',
          timestamp: hosp?.dischargedAt || item.dischargedAt || item.admittedAt || item.recommendedAt,
          petName
        }
      }

      // 3. ADMITTED (Admin approved and assigned cage/ward)
      if (item.status === 'ADMITTED') {
        const cageInfo = item.cageCode || hosp?.cageCode
        return {
          id: `update-adm-${item.id}`,
          type: 'ADMITTED',
          icon: '🏥',
          statusBadge: 'Admitted',
          badgeClass: 'badge-admitted',
          cardClass: 'update-admitted',
          message: `${petName} has been admitted to the hospital.`,
          detail: cageInfo ? `Assigned Accommodation: ${cageInfo}` : null,
          timestamp: item.admittedAt || item.requestedAt || item.recommendedAt,
          petName
        }
      }

      // 4. REQUESTED (Pet Owner submitted admission request)
      if (item.status === 'REQUESTED') {
        return {
          id: `update-req-${item.id}`,
          type: 'REQUESTED',
          icon: '⏳',
          statusBadge: 'Pending Approval',
          badgeClass: 'badge-requested',
          cardClass: 'update-requested',
          message: `Your admission request for ${petName} has been submitted and is awaiting hospital approval.`,
          detail: null,
          timestamp: item.requestedAt || item.recommendedAt,
          petName
        }
      }

      // 5. REJECTED (Admin did not approve admission request)
      if (item.status === 'REJECTED') {
        return {
          id: `update-rej-${item.id}`,
          type: 'REJECTED',
          icon: '❌',
          statusBadge: 'Request Rejected',
          badgeClass: 'badge-rejected',
          cardClass: 'update-rejected',
          message: `${petName}'s admission request was not approved.`,
          detail: item.rejectionReason ? `Reason: ${item.rejectionReason}` : null,
          timestamp: item.rejectedAt || item.requestedAt || item.recommendedAt,
          petName
        }
      }

      // 6. RECOMMENDED (Doctor recommended hospitalization)
      return {
        id: `update-rec-${item.id}`,
        type: 'RECOMMENDED',
        icon: '📋',
        statusBadge: 'Recommendation',
        badgeClass: 'badge-recommended',
        cardClass: 'update-recommended',
        message: `${doctorName} has recommended hospitalization for ${petName}.`,
        detail: item.recommendationReason ? `Reason: ${item.recommendationReason}` : null,
        timestamp: item.recommendedAt,
        petName
      }
    })

    // Sort newest update first by timestamp
    return updates.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return timeB - timeA
    })
  }, [admissions, hospitalizationsMap])

  const recentUpdates = getRecentUpdates()
  const unreadUpdates = recentUpdates.filter((u) => !viewedIds.includes(u.id))
  const unreadCount = unreadUpdates.length

  const handleToggleNotifPanel = () => {
    setNotifOpen((prev) => {
      const opening = !prev
      if (opening && unreadCount > 0) {
        // Mark all currently visible updates as viewed in this session
        const allIds = recentUpdates.map((u) => u.id)
        markAllViewed(allIds)
        setViewedIds(allIds)
      }
      return opening
    })
  }

  const handleRequestAdmission = async (id) => {
    setActionId(id)
    setToast({ message: '', type: '' })
    try {
      await epic3Service.requestAdmission(id)
      setToast({ message: 'Admission request submitted successfully! The admin team will process your request and assign accommodation.', type: 'success' })
      loadAdmissions()
    } catch (err) {
      setToast({ message: err.message || 'Failed to submit admission request', type: 'error' })
    } finally {
      setActionId(null)
    }
  }

  const handleOpenClinicalDetails = async (admission) => {
    setClinicalLoading(true)
    setActiveClinicalRecord({ admission })
    try {
      const hosp = await epic3Service.getHospitalizationByAdmissionId(admission.id)
      setActiveClinicalRecord({ admission, hospitalization: hosp })
    } catch {
      setActiveClinicalRecord({ admission, hospitalization: null })
    } finally {
      setClinicalLoading(false)
    }
  }

  return (
    <div className="module-page-container">
      <main className="page-content">

        {/* ── Page Header with Notification Bell ── */}
        {!hideHeader && (
        <div className="page-header">
          <div>
            <h1 className="page-title">Pet Admission &amp; Hospitalization</h1>
            <p className="page-subtitle">Review doctor hospitalization recommendations, request inpatient admission, and monitor treatment &amp; recovery progress.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', position: 'relative' }}>

            {/* 🔔 Notification Bell Button */}
            <div style={{ position: 'relative' }}>
              <button
                ref={notifBtnRef}
                className={`notif-bell-btn${notifOpen ? ' notif-bell-open' : ''}`}
                onClick={handleToggleNotifPanel}
                title="Hospitalization Notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <span className="notif-bell-icon">🔔</span>
                <span className="notif-bell-label">Notifications</span>
                {unreadCount > 0 && (
                  <span className="notif-badge" aria-live="polite">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {notifOpen && (
                <div className="notif-panel" ref={notifPanelRef} role="dialog" aria-label="Hospitalization notifications">
                  <div className="notif-panel-header">
                    <span className="notif-panel-title">🔔 Recent Updates</span>
                    <button
                      className="notif-panel-close"
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close notifications"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="notif-panel-body">
                    {loading ? (
                      <div className="notif-empty-state">
                        <span style={{ fontSize: '1.5rem' }}>⏳</span>
                        <p>Checking for updates…</p>
                      </div>
                    ) : recentUpdates.length === 0 ? (
                      <div className="notif-empty-state">
                        <span style={{ fontSize: '2rem' }}>📭</span>
                        <p>No new hospitalization updates.</p>
                      </div>
                    ) : (
                      <ul className="notif-list">
                        {recentUpdates.map((update) => (
                          <li key={update.id} className={`notif-item ${update.cardClass}`}>
                            <div className="notif-item-icon">{update.icon}</div>
                            <div className="notif-item-body">
                              <div className="notif-item-top">
                                <span className={`status-badge ${update.badgeClass}`}>
                                  {update.statusBadge}
                                </span>
                                {update.timestamp && (
                                  <span className="notif-item-time">
                                    {new Date(update.timestamp).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <p className="notif-item-message">{update.message}</p>
                              {update.detail && (
                                <div className="notif-item-detail">{update.detail}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="notif-panel-footer">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {recentUpdates.length} update{recentUpdates.length !== 1 ? 's' : ''} · Live from hospital records
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button className="btn-refresh" onClick={loadAdmissions} disabled={loading}>
              {loading ? 'Refreshing...' : '\u21bb Refresh'}
            </button>
          </div>
        </div>
        )}

        {toast.message && (
          <div className={`alert-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ message: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* ── My Pet Hospitalization Records ── */}
        <div className="content-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>My Pet Hospitalization Records</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading admission records...</p>
          ) : error ? (
            <div style={{ color: 'var(--danger-color)', padding: '1rem', background: '#fee2e2', borderRadius: '0.375rem' }}>
              <strong>Could not load records:</strong> {error}
            </div>
          ) : admissions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hospitalization recommendations or admission requests found for your account.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pet</th>
                    <th>Attending Doctor</th>
                    <th>Recommendation Reason</th>
                    <th>Recommended Date</th>
                    <th>Current Status</th>
                    <th>Action / Details</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.petName || 'Pet'}</strong>
                        <br />
                        <small style={{ color: 'var(--text-muted)' }}>{item.petSpecies}</small>
                      </td>
                      <td>{item.doctorName || 'Doctor'}</td>
                      <td>{item.recommendationReason}</td>
                      <td>{item.recommendedAt ? new Date(item.recommendedAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`status-badge badge-${item.status ? item.status.toLowerCase() : 'recommended'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.status === 'RECOMMENDED' ? (
                          <button
                            className="btn-action request"
                            onClick={() => handleRequestAdmission(item.id)}
                            disabled={actionId === item.id}
                          >
                            {actionId === item.id ? 'Requesting...' : 'Request Admission'}
                          </button>
                        ) : item.status === 'REQUESTED' ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Admin Processing</span>
                        ) : item.status === 'ADMITTED' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--success-color)', fontWeight: 600 }}>
                              Admitted ({item.cageCode || 'Assigned Cage'})
                            </span>
                            <button
                              className="btn-action request"
                              onClick={() => handleOpenClinicalDetails(item)}
                            >
                              View Treatment &amp; Recovery
                            </button>
                          </div>
                        ) : item.status === 'DISCHARGED' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--primary-teal)', fontWeight: 600 }}>
                              Discharged
                            </span>
                            <button
                              className="btn-action request"
                              onClick={() => handleOpenClinicalDetails(item)}
                            >
                              View Treatment Summary
                            </button>
                          </div>
                        ) : item.status === 'REJECTED' ? (
                          <div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: 600, display: 'block' }}>
                              Request Rejected
                            </span>
                            {item.rejectionReason && (
                              <span className="rejection-reason-text">
                                Reason: {item.rejectionReason}
                              </span>
                            )}
                            {item.rejectedAt && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                                {new Date(item.rejectedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pet Owner Treatment & Recovery Modal ── */}
        {activeClinicalRecord && (
          <div className="modal-overlay">
            <div className="modal-card modal-large">
              <div className="modal-header">
                <h3 className="modal-title">
                  Inpatient Treatment &amp; Recovery Progress — {activeClinicalRecord.admission.petName}
                </h3>
                <button className="close-btn" onClick={() => setActiveClinicalRecord(null)}>✕</button>
              </div>

              {clinicalLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading clinical updates...</p>
              ) : !activeClinicalRecord.hospitalization ? (
                <p style={{ color: 'var(--text-muted)' }}>No hospitalization clinical record available yet.</p>
              ) : (
                <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {/* ── Summary Box ── */}
                  <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div className="form-grid-2">
                      <div>
                        <p style={{ margin: '0.2rem 0' }}>
                          <strong>Pet:</strong> {activeClinicalRecord.admission.petName} ({activeClinicalRecord.admission.petSpecies})
                        </p>
                        {/* Change C: label changes to "Cage/Ward During Stay" after discharge */}
                        <p style={{ margin: '0.2rem 0' }}>
                          <strong>
                            {activeClinicalRecord.hospitalization.status === 'DISCHARGED'
                              ? 'Cage/Ward During Stay:'
                              : 'Assigned Cage/Ward:'}
                          </strong>{' '}
                          {activeClinicalRecord.hospitalization.cageCode || activeClinicalRecord.admission.cageCode || 'Inpatient Accommodation'}
                        </p>
                        <p style={{ margin: '0.2rem 0' }}>
                          <strong>Attending Doctor:</strong> {activeClinicalRecord.admission.doctorName}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0.2rem 0' }}>
                          <strong>Current Recovery Status: </strong>
                          <span className={`status-badge ${getRecoveryBadgeClass(activeClinicalRecord.hospitalization.recoveryStatus || 'STABLE')}`}>
                            {activeClinicalRecord.hospitalization.recoveryStatus || 'STABLE'}
                          </span>
                        </p>
                        {activeClinicalRecord.hospitalization.recoveryNote && (
                          <p style={{ margin: '0.2rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            <strong>Doctor Assessment:</strong> {activeClinicalRecord.hospitalization.recoveryNote}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ── Change A: Doctor's Discharge Recommendation (separate card) ── */}
                    {activeClinicalRecord.hospitalization.dischargeRecommendationReason && (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.75rem 1rem',
                        background: '#fefce8',
                        borderRadius: '0.375rem',
                        borderLeft: '4px solid #d97706'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#92400e' }}>
                            🩺 Doctor's Discharge Recommendation
                          </strong>
                          {activeClinicalRecord.hospitalization.status === 'DISCHARGE_RECOMMENDED' && (
                            <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, background: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                              Final confirmation pending
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                          <strong>Reason: </strong>
                          <em>"{activeClinicalRecord.hospitalization.dischargeRecommendationReason}"</em>
                        </p>
                        {activeClinicalRecord.hospitalization.status === 'DISCHARGE_RECOMMENDED' && (
                          <p style={{ margin: '0.25rem 0 0.35rem', fontSize: '0.8rem', color: '#b45309', fontStyle: 'italic' }}>
                            The doctor has recommended discharge. Final confirmation is pending.
                          </p>
                        )}
                        {(activeClinicalRecord.hospitalization.dischargeRecommendedByDoctorName || activeClinicalRecord.hospitalization.dischargeRecommendedAt) && (
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {activeClinicalRecord.hospitalization.dischargeRecommendedByDoctorName && (
                              <span>Recommended by: {activeClinicalRecord.hospitalization.dischargeRecommendedByDoctorName}</span>
                            )}
                            {activeClinicalRecord.hospitalization.dischargeRecommendedByDoctorName && activeClinicalRecord.hospitalization.dischargeRecommendedAt && (
                              <span> · </span>
                            )}
                            {activeClinicalRecord.hospitalization.dischargeRecommendedAt && (
                              <span>Recommended at: {new Date(activeClinicalRecord.hospitalization.dischargeRecommendedAt).toLocaleString()}</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── Change A: Admin Final Discharge Information (separate card, visible only after DISCHARGED) ── */}
                    {activeClinicalRecord.hospitalization.status === 'DISCHARGED' && (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.75rem 1rem',
                        background: '#ecfdf5',
                        borderRadius: '0.375rem',
                        borderLeft: '4px solid var(--success-color)'
                      }}>
                        <strong style={{ fontSize: '0.9rem', color: '#065f46', display: 'block', marginBottom: '0.35rem' }}>
                          ✅ Final Discharge Information
                        </strong>
                        <p style={{ margin: '0.2rem 0', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                          <strong>Discharged: </strong>
                          {activeClinicalRecord.hospitalization.dischargedAt
                            ? new Date(activeClinicalRecord.hospitalization.dischargedAt).toLocaleString()
                            : 'Completed'}
                        </p>
                        {/* Change B: Strip "Accommodation freed." from owner-facing display */}
                        {activeClinicalRecord.hospitalization.dischargeNotes && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            <strong>Discharge Instructions: </strong>
                            {stripInternalDischargePhrase(activeClinicalRecord.hospitalization.dischargeNotes)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Change D: Recovery Progress History (new section, oldest → newest) ── */}
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                    📈 Recovery Progress History
                  </h4>
                  {(!activeClinicalRecord.hospitalization.recoveryHistory ||
                    activeClinicalRecord.hospitalization.recoveryHistory.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                      No recovery progress updates have been recorded yet.
                    </p>
                  ) : (
                    <div className="notes-timeline" style={{ marginBottom: '1.5rem' }}>
                      {/* Display oldest first → newest last */}
                      {[...activeClinicalRecord.hospitalization.recoveryHistory]
                        .sort((a, b) => {
                          const tA = a.recordedAt ? new Date(a.recordedAt).getTime() : 0
                          const tB = b.recordedAt ? new Date(b.recordedAt).getTime() : 0
                          return tA - tB
                        })
                        .map((entry, idx) => (
                          <div key={entry.id || idx} className="timeline-item">
                            <div className="timeline-header">
                              <span className={`status-badge ${getRecoveryBadgeClass(entry.recoveryStatus)}`}>
                                {entry.recoveryStatus || 'STABLE'}
                              </span>
                              {entry.recordedAt && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {new Date(entry.recordedAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {entry.recoveryNote && (
                              <p style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.875rem', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '0.25rem' }}>
                                "{entry.recoveryNote}"
                              </p>
                            )}
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Updated by {entry.doctorName || 'Doctor'}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* ── Change E: Renamed from "Daily Treatment Updates" → "Treatment History" ── */}
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                    Treatment History
                  </h4>
                  {(!activeClinicalRecord.hospitalization.treatmentNotes ||
                    activeClinicalRecord.hospitalization.treatmentNotes.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>No treatment history recorded yet.</p>
                  ) : (
                    <div className="notes-timeline" style={{ marginBottom: '1.5rem' }}>
                      {activeClinicalRecord.hospitalization.treatmentNotes.slice().reverse().map((note) => (
                        <div key={note.id} className="timeline-item">
                          <div className="timeline-header">
                            <strong>{note.doctorName || 'Doctor'}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                          {note.observation && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                              <strong>Observation:</strong> {note.observation}
                            </p>
                          )}
                          {note.treatmentGiven && (
                            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                              <strong>Treatment Given:</strong> {note.treatmentGiven}
                            </p>
                          )}
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.375rem' }}>
                            {note.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Change F: Medication Guidelines — preserved as separate clinical section ── */}
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                    Medication Guidelines
                  </h4>
                  {(!activeClinicalRecord.hospitalization.medicationInstructions ||
                    activeClinicalRecord.hospitalization.medicationInstructions.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No medication guidelines recorded.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeClinicalRecord.hospitalization.medicationInstructions.map((inst) => (
                            <tr key={inst.id}>
                              <td><strong>{inst.medicineName}</strong></td>
                              <td>{inst.dosage || 'Standard'}</td>
                              <td>{inst.frequency || 'As directed'}</td>
                              <td>{inst.administrationInstructions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button className="btn-secondary" onClick={() => setActiveClinicalRecord(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
