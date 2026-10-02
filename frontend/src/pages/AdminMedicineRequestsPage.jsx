import { useState, useEffect } from 'react'
import AdminNav from '../components/AdminNav'
import { epic3Service } from '../services/epic3Service'
import { triggerAdminBadgeRefresh } from '../hooks/useAdminPendingCounts'
import './ModuleStyles.css'

export default function AdminMedicineRequestsPage() {
  const [requests, setRequests] = useState([])
  const [inventoryMap, setInventoryMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionId, setActionId] = useState(null)
  const [toast, setToast] = useState({ message: '', type: '' })

  // Unavailable Modal State
  const [unavailableTarget, setUnavailableTarget] = useState(null)
  const [unavailableReason, setUnavailableReason] = useState('')
  const [submittingUnavailable, setSubmittingUnavailable] = useState(false)

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reqData, invData] = await Promise.all([
        epic3Service.getMedicineRequests(statusFilter),
        epic3Service.getInventoryItems('ALL')
      ])
      setRequests(reqData)

      const map = {}
      invData.forEach((item) => {
        map[item.id] = item
      })
      setInventoryMap(map)
    } catch (err) {
      setToast({ message: err.message || 'Failed to load medicine requests', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ── Issue Medicine Request ─────────────────────────────────────────────────
  const handleIssueRequest = async (request) => {
    const item = inventoryMap[request.inventoryItemId]
    const availableStock = item ? item.quantity : 0

    if (availableStock < request.requestedQuantity) {
      setToast({
        message: `Insufficient stock available. Required: ${request.requestedQuantity}, Current Stock: ${availableStock}.`,
        type: 'error'
      })
      return
    }

    setActionId(request.id)
    setToast({ message: '', type: '' })
    try {
      await epic3Service.issueMedicineRequest(request.id, 'ADMIN-01')
      setToast({
        message: `Successfully issued ${request.requestedQuantity} ${request.unit || 'units'} of "${request.itemName}" for ${request.petName}. Inventory stock updated.`,
        type: 'success'
      })
      loadData()
      triggerAdminBadgeRefresh()
    } catch (err) {
      setToast({ message: err.message || 'Failed to issue medicine request', type: 'error' })
    } finally {
      setActionId(null)
    }
  }

  // ── Mark Unavailable ───────────────────────────────────────────────────────
  const handleOpenUnavailableModal = (request) => {
    setUnavailableTarget(request)
    setUnavailableReason('Item currently out of stock or unavailable.')
  }

  const handleConfirmUnavailable = async (e) => {
    e.preventDefault()
    setSubmittingUnavailable(true)
    setToast({ message: '', type: '' })
    try {
      await epic3Service.markMedicineRequestUnavailable(unavailableTarget.id, {
        reason: unavailableReason.trim()
      })
      setToast({ message: `Request for "${unavailableTarget.itemName}" marked as unavailable.`, type: 'success' })
      setUnavailableTarget(null)
      loadData()
      triggerAdminBadgeRefresh()
    } catch (err) {
      setToast({ message: err.message || 'Failed to update request', type: 'error' })
    } finally {
      setSubmittingUnavailable(false)
    }
  }

  return (
    <div className="module-page-container">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Medicine &amp; Supply Requests</h1>
            <p className="page-subtitle">
              Review medicine and supply requests submitted by attending doctors and issue stock from inventory.
            </p>
          </div>
          <button className="btn-refresh" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing...' : '\u21bb Refresh'}
          </button>
        </div>

        {toast.message && (
          <div className={`alert-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ message: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="filter-bar">
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Request Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="ISSUED">Issued</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>

        <div className="content-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Medicine Requests</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading medicine requests...</p>
          ) : requests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No medicine or supply requests found.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Requested Date</th>
                    <th>Pet Name</th>
                    <th>Doctor</th>
                    <th>Item Requested</th>
                    <th>Requested Qty</th>
                    <th>Available Stock</th>
                    <th>Instructions / Notes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => {
                    const invItem = inventoryMap[item.inventoryItemId]
                    const currentStock = invItem ? invItem.quantity : '—'
                    const hasEnoughStock = invItem && invItem.quantity >= item.requestedQuantity

                    return (
                      <tr key={item.id}>
                        <td>{item.requestedAt ? new Date(item.requestedAt).toLocaleString() : 'N/A'}</td>
                        <td><strong>{item.petName || 'Pet'}</strong></td>
                        <td>{item.doctorName || 'Doctor'}</td>
                        <td>
                          <strong>{item.itemName}</strong>
                          <br />
                          <small style={{ color: 'var(--text-muted)' }}>{item.itemCode}</small>
                        </td>
                        <td><strong>{item.requestedQuantity}</strong> {item.unit}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: hasEnoughStock ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            {currentStock} {invItem?.unit || ''}
                          </span>
                        </td>
                        <td>{item.instructions || '—'}</td>
                        <td>
                          <span className={`status-badge badge-${item.status ? item.status.toLowerCase() : 'pending'}`}>
                            {item.status}
                          </span>
                          {item.status === 'ISSUED' && item.issuedAt && (
                            <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              Issued: {new Date(item.issuedAt).toLocaleDateString()}
                            </small>
                          )}
                          {item.status === 'UNAVAILABLE' && item.unavailableReason && (
                            <small style={{ display: 'block', color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              {item.unavailableReason}
                            </small>
                          )}
                        </td>
                        <td>
                          {item.status === 'PENDING' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn-action process"
                                onClick={() => handleIssueRequest(item)}
                                disabled={actionId === item.id}
                              >
                                {actionId === item.id ? 'Issuing...' : 'Issue Stock'}
                              </button>
                              <button
                                className="btn-action reject"
                                onClick={() => handleOpenUnavailableModal(item)}
                              >
                                Mark Unavailable
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Completed</span>
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

        {/* ── Mark Unavailable Modal ── */}
        {unavailableTarget && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3 className="modal-title">Mark Medicine Request Unavailable</h3>
                <button className="close-btn" onClick={() => setUnavailableTarget(null)}>✕</button>
              </div>

              <form onSubmit={handleConfirmUnavailable}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Marking request for <strong>{unavailableTarget.itemName}</strong> (Pet: {unavailableTarget.petName}) as unavailable.
                </p>

                <div className="form-group">
                  <label>Reason / Stock Note</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={unavailableReason}
                    onChange={(e) => setUnavailableReason(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setUnavailableTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-danger-solid" disabled={submittingUnavailable}>
                    {submittingUnavailable ? 'Updating...' : 'Confirm Unavailable'}
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
