import { useState, useEffect, useCallback } from 'react'
import { epic3Service } from '../services/epic3Service'

const ADMIN_ACTION_EVENT = 'epic3:admin-action'

/**
 * Dispatch helper to trigger immediate badge count refresh across the Admin portal
 * after an admin processes/rejects an admission, issues/marks-unavailable medicine,
 * or confirms a final discharge.
 */
export function triggerAdminBadgeRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_ACTION_EVENT))
  }
}

/**
 * Lightweight hook that fetches real pending action counts from existing Epic 3 APIs:
 * - Admission Requests badge      : count ONLY PetAdmission records where status = REQUESTED
 * - Medicine Requests badge       : count ONLY MedicineRequest records where status = PENDING
 * - Hospitalized Pets badge       : count ONLY Hospitalization records where status = DISCHARGE_RECOMMENDED
 *
 * Refresh triggers:
 * 1. Initial fetch on AdminNav mount
 * 2. Window/tab regains focus or visibility (visibilitychange)
 * 3. Immediate custom event ('epic3:admin-action') after Admin actions
 * 4. Lightweight polling interval (approx. 10–15 seconds, default 12s) for cross-tab sync
 *
 * Badges do NOT clear on page navigation/click — only when the requests are actually handled.
 *
 * @param {number} refreshInterval - ms between auto-refreshes (default: 12000 = 12 sec).
 */
export function useAdminPendingCounts(refreshInterval = 12000) {
  const [admissionPendingCount, setAdmissionPendingCount] = useState(0)
  const [medicinePendingCount, setMedicinePendingCount] = useState(0)
  const [dischargeRecommendationCount, setDischargeRecommendationCount] = useState(0)

  const fetchCounts = useCallback(async () => {
    try {
      const [admissions, medicineRequests, activeHospitalizations] = await Promise.all([
        epic3Service.getAdmissions('REQUESTED'),
        epic3Service.getMedicineRequests('PENDING'),
        epic3Service.getActiveHospitalizations(),
      ])

      // Strictly count only REQUESTED admissions
      const reqCount = Array.isArray(admissions)
        ? admissions.filter((a) => a && a.status === 'REQUESTED').length
        : 0

      // Strictly count only PENDING medicine requests
      const medCount = Array.isArray(medicineRequests)
        ? medicineRequests.filter((m) => m && m.status === 'PENDING').length
        : 0

      // Count only DISCHARGE_RECOMMENDED hospitalizations (Doctor recommended, Admin yet to confirm)
      const dischargeCount = Array.isArray(activeHospitalizations)
        ? activeHospitalizations.filter((h) => h && h.status === 'DISCHARGE_RECOMMENDED').length
        : 0

      setAdmissionPendingCount(reqCount)
      setMedicinePendingCount(medCount)
      setDischargeRecommendationCount(dischargeCount)
    } catch {
      // Silently keep previous counts on temporary network hiccups
    }
  }, [])

  useEffect(() => {
    // 1. Initial fetch on mount
    fetchCounts()

    // 2. Tab focus & visibility change listeners
    const handleFocus = () => {
      fetchCounts()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCounts()
      }
    }

    // 3. Immediate refresh after admin actions
    const handleAdminAction = () => {
      fetchCounts()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener(ADMIN_ACTION_EVENT, handleAdminAction)

    // 4. Lightweight polling interval for requests arriving in another tab
    let intervalId = null
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchCounts, refreshInterval)
    }

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener(ADMIN_ACTION_EVENT, handleAdminAction)
      if (intervalId) clearInterval(intervalId)
    }
  }, [fetchCounts, refreshInterval])

  return { admissionPendingCount, medicinePendingCount, dischargeRecommendationCount, refreshCounts: fetchCounts }
}
