import { useState, useEffect, useCallback } from 'react'
import AdminNav from '../components/AdminNav'
import { epic3Service } from '../services/epic3Service'
import './ModuleStyles.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert internal cage type to a user-friendly display label */
function formatCageType(type) {
  if (!type) return 'Unknown'
  if (type === 'STANDARD_PET') return 'Standard Pet'
  if (type === 'ICU') return 'ICU'
  if (type === 'ISOLATION') return 'Isolation'
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Returns the CSS class for a cage status badge */
function cageStatusBadgeClass(status) {
  switch (status) {
    case 'AVAILABLE':   return 'cage-status-available'
    case 'OCCUPIED':    return 'cage-status-occupied'
    case 'MAINTENANCE': return 'cage-status-maintenance'
    default:            return 'cage-status-available'
  }
}

/** Returns the CSS class for the cage card border accent */
function cageCardAccentClass(status) {
  switch (status) {
    case 'AVAILABLE':   return 'cage-card-available'
    case 'OCCUPIED':    return 'cage-card-occupied'
    case 'MAINTENANCE': return 'cage-card-maintenance'
    default:            return ''
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminCageOccupancyPage() {
  const [cages, setCages] = useState([])
  const [hospitalizations, setHospitalizations] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [error, setError] = useState('')

  // Filters
  const [filterType, setFilterType] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchCode, setSearchCode] = useState('')

  // Maintenance modal state
  const [maintenanceModal, setMaintenanceModal] = useState(null) // { cage, targetStatus }
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceError, setMaintenanceError] = useState('')

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [cageData, hospData] = await Promise.all([
        epic3Service.getCages(),
        epic3Service.getActiveHospitalizations(),
      ])
      setCages(Array.isArray(cageData) ? cageData : [])
      // Only ACTIVE and DISCHARGE_RECOMMENDED hospitalizations count as occupying a cage
      setHospitalizations(
        Array.isArray(hospData)
          ? hospData.filter((h) => h && (h.status === 'ACTIVE' || h.status === 'DISCHARGE_RECOMMENDED'))
          : []
      )
      setLastRefreshed(new Date())
    } catch (err) {
      setError(err.message || 'Failed to load cage occupancy data.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // 12-second polling (same interval as Admin badge polling)
  useEffect(() => {
    const intervalId = setInterval(loadData, 12000)
    return () => clearInterval(intervalId)
  }, [loadData])

  // Refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => loadData()
    const handleVisibility = () => { if (document.visibilityState === 'visible') loadData() }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadData])

  // ── Maintenance Status Change ─────────────────────────────────────────────

  const handleOpenMaintenanceModal = (cage, targetStatus) => {
    setMaintenanceModal({ cage, targetStatus })
    setMaintenanceError('')
  }

  const handleCloseMaintenanceModal = () => {
    if (maintenanceLoading) return
    setMaintenanceModal(null)
    setMaintenanceError('')
  }

  const handleConfirmStatusChange = async () => {
    if (!maintenanceModal || maintenanceLoading) return
    setMaintenanceLoading(true)
    setMaintenanceError('')
    try {
      await epic3Service.updateCageStatus(maintenanceModal.cage.id, maintenanceModal.targetStatus)
      setMaintenanceModal(null)
      // Re-fetch all cage data so counts and cards update immediately
      await loadData()
    } catch (err) {
      setMaintenanceError(err.message || 'Failed to update cage status. Please try again.')
    } finally {
      setMaintenanceLoading(false)
    }
  }

  // ── Derived Data ──────────────────────────────────────────────────────────

  /** Build a map: cageId → current hospitalization (ACTIVE or DISCHARGE_RECOMMENDED) */
  const hospByCageId = {}
  hospitalizations.forEach((h) => {
    if (h.cageWardId) {
      hospByCageId[h.cageWardId] = h
    }
  })

  // Summary counts — derived from live cage data
  const totalCount       = cages.length
  const availableCount   = cages.filter((c) => c.status === 'AVAILABLE').length
  const occupiedCount    = cages.filter((c) => c.status === 'OCCUPIED').length
  const maintenanceCount = cages.filter((c) => c.status === 'MAINTENANCE').length

  // Per-type counts
  // "free" = strictly AVAILABLE (MAINTENANCE units are NOT free/available for admission)
  const stdTotal    = cages.filter((c) => c.type === 'STANDARD_PET').length
  const icuTotal    = cages.filter((c) => c.type === 'ICU').length
  const isoTotal    = cages.filter((c) => c.type === 'ISOLATION').length
  const stdOccupied = cages.filter((c) => c.type === 'STANDARD_PET' && c.status === 'OCCUPIED').length
  const icuOccupied = cages.filter((c) => c.type === 'ICU' && c.status === 'OCCUPIED').length
  const isoOccupied = cages.filter((c) => c.type === 'ISOLATION' && c.status === 'OCCUPIED').length
  const stdFree     = cages.filter((c) => c.type === 'STANDARD_PET' && c.status === 'AVAILABLE').length
  const icuFree     = cages.filter((c) => c.type === 'ICU' && c.status === 'AVAILABLE').length
  const isoFree     = cages.filter((c) => c.type === 'ISOLATION' && c.status === 'AVAILABLE').length

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filteredCages = cages.filter((cage) => {
    const typeMatch =
      filterType === 'ALL' ||
      cage.type === filterType

    const statusMatch =
      filterStatus === 'ALL' || cage.status === filterStatus

    const searchMatch =
      !searchCode.trim() ||
      (cage.code && cage.code.toLowerCase().includes(searchCode.trim().toLowerCase()))

    return typeMatch && statusMatch && searchMatch
  })

  // Sort: by cage code alphabetically
  const sortedCages = [...filteredCages].sort((a, b) => {
    if (a.code && b.code) return a.code.localeCompare(b.code)
    return 0
  })

  // ── Maintenance modal copy helpers ────────────────────────────────────────

  const getModalTitle = () => {
    if (!maintenanceModal) return ''
    return maintenanceModal.targetStatus === 'MAINTENANCE'
      ? `Mark ${maintenanceModal.cage.code} as under maintenance?`
      : `Mark ${maintenanceModal.cage.code} as available again?`
  }

  const getModalBody = () => {
    if (!maintenanceModal) return ''
    return maintenanceModal.targetStatus === 'MAINTENANCE'
      ? 'This cage will temporarily become unavailable for new admissions until it is marked available again.'
      : 'This cage will become available for new admissions.'
  }

  const getModalConfirmLabel = () => {
    if (!maintenanceModal) return ''
    return maintenanceModal.targetStatus === 'MAINTENANCE' ? 'Confirm Maintenance' : 'Confirm Available'
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="module-page-container">
      <AdminNav />
      <main className="page-content">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Cage &amp; Ward Occupancy</h1>
            {/* Change 2: description updated — no longer calls itself read-only */}
            <p className="page-subtitle">
              Live operational overview of all hospital accommodation units.
              Monitor occupancy and manage cage availability for maintenance.
              Cage assignment for admitted pets remains in the{' '}
              <a href="/admin/admission-requests" style={{ color: 'var(--primary-teal)', textDecoration: 'none', fontWeight: 600 }}>
                Admission Requests
              </a>{' '}
              workflow.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            <button className="btn-refresh" onClick={loadData} disabled={loading}>
              {loading ? 'Refreshing...' : '\u21bb Refresh'}
            </button>
            {lastRefreshed && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Updated: {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* ── Page-level Error ── */}
        {error && (
          <div className="alert-toast error" style={{ marginBottom: '1.5rem' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="occupancy-summary-cards">
          <div className="occupancy-stat-card occupancy-stat-total">
            <span className="occupancy-stat-value">{totalCount}</span>
            <span className="occupancy-stat-label">Total Units</span>
          </div>
          <div className="occupancy-stat-card occupancy-stat-available">
            <span className="occupancy-stat-value">{availableCount}</span>
            <span className="occupancy-stat-label">Available</span>
          </div>
          <div className="occupancy-stat-card occupancy-stat-occupied">
            <span className="occupancy-stat-value">{occupiedCount}</span>
            <span className="occupancy-stat-label">Occupied</span>
          </div>
          <div className="occupancy-stat-card occupancy-stat-maintenance">
            <span className="occupancy-stat-value">{maintenanceCount}</span>
            <span className="occupancy-stat-label">Maintenance</span>
          </div>
        </div>

        {/* ── Type Breakdown ── */}
        {/* "free" uses AVAILABLE-only count; MAINTENANCE units are NOT counted as free */}
        <div className="content-card" style={{ marginBottom: '1.5rem', padding: '1.1rem 1.75rem' }}>
          <div className="occupancy-type-breakdown">
            <div className="occupancy-type-item">
              <span className="occupancy-type-icon">🏠</span>
              <div>
                <span className="occupancy-type-name">Standard Pet</span>
                <span className="occupancy-type-detail">{stdOccupied} / {stdTotal} occupied</span>
              </div>
              <span
                className={`status-badge ${stdFree === 0 ? 'badge-critical' : stdOccupied > 0 ? 'badge-poor' : 'badge-active'}`}
                style={{ marginLeft: 'auto' }}
              >
                {stdFree} available
              </span>
            </div>
            <div className="occupancy-type-divider" />
            <div className="occupancy-type-item">
              <span className="occupancy-type-icon">🏥</span>
              <div>
                <span className="occupancy-type-name">ICU</span>
                <span className="occupancy-type-detail">{icuOccupied} / {icuTotal} occupied</span>
              </div>
              <span
                className={`status-badge ${icuFree === 0 ? 'badge-critical' : icuOccupied > 0 ? 'badge-poor' : 'badge-active'}`}
                style={{ marginLeft: 'auto' }}
              >
                {icuFree} available
              </span>
            </div>
            <div className="occupancy-type-divider" />
            <div className="occupancy-type-item">
              <span className="occupancy-type-icon">⚠️</span>
              <div>
                <span className="occupancy-type-name">Isolation</span>
                <span className="occupancy-type-detail">{isoOccupied} / {isoTotal} occupied</span>
              </div>
              <span
                className={`status-badge ${isoFree === 0 ? 'badge-critical' : isoOccupied > 0 ? 'badge-poor' : 'badge-active'}`}
                style={{ marginLeft: 'auto' }}
              >
                {isoFree} available
              </span>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="cage-filter-bar">
          {/* Type filter */}
          <div className="cage-filter-group">
            <span className="cage-filter-label">Type:</span>
            {['ALL', 'STANDARD_PET', 'ICU', 'ISOLATION'].map((t) => (
              <button
                key={t}
                className={`tab-btn${filterType === t ? ' active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                {t === 'ALL' ? 'All Types' : formatCageType(t)}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="cage-filter-group">
            <span className="cage-filter-label">Status:</span>
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].map((s) => (
              <button
                key={s}
                className={`tab-btn${filterStatus === s ? ' active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'ALL' ? 'All Statuses' : s}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="cage-filter-group">
            <span className="cage-filter-label">Search:</span>
            <input
              type="text"
              className="form-input search-input"
              style={{ maxWidth: '160px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
              placeholder="e.g. CW-104"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
            {searchCode && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}
                onClick={() => setSearchCode('')}
                title="Clear search"
              >✕</button>
            )}
          </div>
        </div>

        {/* ── Cage Grid ── */}
        {loading && cages.length === 0 ? (
          <div className="content-card empty-state-card">
            <p style={{ color: 'var(--text-muted)' }}>Loading cage data...</p>
          </div>
        ) : sortedCages.length === 0 ? (
          <div className="content-card empty-state-card">
            <span style={{ fontSize: '2rem' }}>🏠</span>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              {cages.length === 0
                ? 'No cage/ward records found. Ensure the backend has initialized cage data.'
                : 'No units match the selected filters.'}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Showing {sortedCages.length} of {totalCount} unit{totalCount !== 1 ? 's' : ''}
            </p>
            <div className="cage-grid">
              {sortedCages.map((cage) => {
                const occupant = hospByCageId[cage.id]
                const isDischargeRec = occupant && occupant.status === 'DISCHARGE_RECOMMENDED'

                return (
                  <div key={cage.id} className={`cage-card ${cageCardAccentClass(cage.status)}`}>
                    {/* Card Header */}
                    <div className="cage-card-header">
                      <div>
                        <span className="cage-card-code">{cage.code || 'Unknown'}</span>
                        <span className="cage-card-type">{formatCageType(cage.type)}</span>
                      </div>
                      <span className={`cage-status-badge ${cageStatusBadgeClass(cage.status)}`}>
                        {cage.status || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Discharge Recommended Banner */}
                    {isDischargeRec && (
                      <div className="cage-discharge-rec-banner">
                        🩺 Discharge Recommended — awaiting Admin confirmation
                      </div>
                    )}

                    {/* ── Status-specific body ── */}
                    {cage.status === 'OCCUPIED' ? (
                      /* OCCUPIED: show occupant info; no manual status actions */
                      <>
                        {occupant ? (
                          <div className="cage-occupant-info">
                            <div className="cage-occupant-row">
                              <span className="cage-occupant-label">Pet</span>
                              <span className="cage-occupant-value">
                                <strong>{occupant.petName || 'N/A'}</strong>
                                {occupant.petSpecies && (
                                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {occupant.petSpecies}</span>
                                )}
                              </span>
                            </div>
                            {occupant.doctorName && (
                              <div className="cage-occupant-row">
                                <span className="cage-occupant-label">Doctor</span>
                                <span className="cage-occupant-value">{occupant.doctorName}</span>
                              </div>
                            )}
                            {occupant.admittedAt && (
                              <div className="cage-occupant-row">
                                <span className="cage-occupant-label">Admitted</span>
                                <span className="cage-occupant-value">
                                  {new Date(occupant.admittedAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="cage-occupant-info" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                            Occupied — hospitalization data loading
                          </div>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem', fontStyle: 'italic' }}>
                          Status managed by hospitalization lifecycle
                        </p>
                      </>
                    ) : cage.status === 'AVAILABLE' ? (
                      /* AVAILABLE: show ready state + "Mark as Maintenance" button */
                      <>
                        <div className="cage-available-info">
                          <span>✓ Ready for admission</span>
                        </div>
                        <button
                          className="btn-cage-action btn-cage-maintenance"
                          onClick={() => handleOpenMaintenanceModal(cage, 'MAINTENANCE')}
                          title={`Mark ${cage.code} as under maintenance`}
                        >
                          🔧 Mark as Maintenance
                        </button>
                      </>
                    ) : cage.status === 'MAINTENANCE' ? (
                      /* MAINTENANCE: show maintenance state + "Mark as Available" button */
                      <>
                        <div className="cage-maintenance-info">
                          <span>🔧 Under maintenance</span>
                          {cage.notes && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cage.notes}</span>
                          )}
                        </div>
                        <button
                          className="btn-cage-action btn-cage-available"
                          onClick={() => handleOpenMaintenanceModal(cage, 'AVAILABLE')}
                          title={`Mark ${cage.code} as available`}
                        >
                          ✓ Mark as Available
                        </button>
                      </>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Maintenance / Availability Confirmation Modal ── */}
        {maintenanceModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3 className="modal-title">{getModalTitle()}</h3>
                <button className="close-btn" onClick={handleCloseMaintenanceModal} disabled={maintenanceLoading}>✕</button>
              </div>

              <p style={{ fontSize: '0.925rem', color: 'var(--text-main)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                {getModalBody()}
              </p>

              {/* Cage detail summary */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '0.375rem', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                <p style={{ margin: '0.2rem 0' }}><strong>Cage:</strong> {maintenanceModal.cage.code}</p>
                <p style={{ margin: '0.2rem 0' }}><strong>Type:</strong> {formatCageType(maintenanceModal.cage.type)}</p>
                <p style={{ margin: '0.2rem 0' }}>
                  <strong>Current status:</strong>{' '}
                  <span className={`cage-status-badge ${cageStatusBadgeClass(maintenanceModal.cage.status)}`}>
                    {maintenanceModal.cage.status}
                  </span>
                  {' '}→{' '}
                  <span className={`cage-status-badge ${cageStatusBadgeClass(maintenanceModal.targetStatus)}`}>
                    {maintenanceModal.targetStatus}
                  </span>
                </p>
              </div>

              {maintenanceError && (
                <div className="alert-toast error" style={{ marginBottom: '1rem' }}>
                  <span>{maintenanceError}</span>
                  <button onClick={() => setMaintenanceError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseMaintenanceModal}
                  disabled={maintenanceLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={maintenanceModal.targetStatus === 'MAINTENANCE' ? 'btn-primary' : 'btn-primary'}
                  style={maintenanceModal.targetStatus === 'MAINTENANCE'
                    ? { background: '#d97706', borderColor: '#d97706' }
                    : { background: 'var(--success-color)' }}
                  onClick={handleConfirmStatusChange}
                  disabled={maintenanceLoading}
                >
                  {maintenanceLoading ? 'Updating...' : getModalConfirmLabel()}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
