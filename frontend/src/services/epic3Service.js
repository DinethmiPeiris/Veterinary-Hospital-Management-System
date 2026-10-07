import { API_BASE_URL as BACKEND_URL } from '../config/api'

const API_BASE_URL = `${BACKEND_URL}/api/v1`

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`
    try {
      const data = await response.json()
      if (data.message) {
        errorMsg = data.message
      } else if (data.details) {
        errorMsg = Object.values(data.details).join(', ')
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMsg)
  }
  if (response.status === 204) return null
  return await response.json()
}

export const epic3Service = {
  // ── Admissions ─────────────────────────────────────────────────────────────
  // Doctor Recommend
  async recommendAdmission(data) {
    const res = await fetch(`${API_BASE_URL}/admissions/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  // Pet Owner Request
  async requestAdmission(admissionId) {
    const res = await fetch(`${API_BASE_URL}/admissions/${admissionId}/request`, {
      method: 'PATCH',
    })
    return handleResponse(res)
  },

  // Admissions list
  async getAdmissions(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await fetch(`${API_BASE_URL}/admissions${query}`)
    return handleResponse(res)
  },

  // Admissions for a specific Pet Owner
  // TODO [EPIC 1 INTEGRATION]: Replace petOwnerId with value from auth context/JWT
  async getAdmissionsByOwner(petOwnerId, status = '') {
    const params = new URLSearchParams()
    if (petOwnerId) params.append('petOwnerId', petOwnerId)
    if (status) params.append('status', status)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`${API_BASE_URL}/admissions${queryString}`)
    return handleResponse(res)
  },

  // Process Admission (Admin)
  async processAdmission(admissionId, cageWardId) {
    const res = await fetch(`${API_BASE_URL}/admissions/${admissionId}/process`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cageWardId }),
    })
    return handleResponse(res)
  },

  // Reject Admission (Admin)
  async rejectAdmission(admissionId, rejectionReason) {
    const res = await fetch(`${API_BASE_URL}/admissions/${admissionId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason }),
    })
    return handleResponse(res)
  },

  // ── Cages & Wards ──────────────────────────────────────────────────────────
  async getCages() {
    const res = await fetch(`${API_BASE_URL}/cages`)
    return handleResponse(res)
  },

  async getAvailableCages() {
    const res = await fetch(`${API_BASE_URL}/cages/available`)
    return handleResponse(res)
  },

  async updateCageStatus(cageId, status) {
    const res = await fetch(`${API_BASE_URL}/cages/${cageId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return handleResponse(res)
  },

  // ── Hospitalizations ───────────────────────────────────────────────────────
  async getAllHospitalizations() {
    const res = await fetch(`${API_BASE_URL}/hospitalizations`)
    return handleResponse(res)
  },

  async getActiveHospitalizations() {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitalizations/active`)
      return await handleResponse(res)
    } catch {
      return []
    }
  },

  async getHospitalizationById(id) {
    const res = await fetch(`${API_BASE_URL}/hospitalizations/${id}`)
    return handleResponse(res)
  },

  async getHospitalizationByAdmissionId(admissionId) {
    const res = await fetch(`${API_BASE_URL}/hospitalizations/admission/${admissionId}`)
    return handleResponse(res)
  },

  // Daily Treatment Notes
  async addTreatmentNote(hospitalizationId, data) {
    const res = await fetch(`${API_BASE_URL}/hospitalizations/${hospitalizationId}/treatment-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  // Recovery Progress
  async updateRecoveryProgress(hospitalizationId, data) {
    const res = await fetch(`${API_BASE_URL}/hospitalizations/${hospitalizationId}/recovery`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  // Medication Instructions
  async addMedicationInstruction(hospitalizationId, data) {
    const res = await fetch(`${API_BASE_URL}/hospitalizations/${hospitalizationId}/medication-instructions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  // Discharge Recommendation (Doctor)
  async recommendDischarge(hospitalizationId, data) {
    const res = await fetch(`${API_BASE_URL}/hospitalizations/${hospitalizationId}/recommend-discharge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  // Confirm Discharge (Admin)
  async confirmDischarge(hospitalizationId, data = {}) {
    const res = await fetch(`${API_BASE_URL}/hospitalizations/${hospitalizationId}/confirm-discharge`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  // ── Medicine & Supply Requests ─────────────────────────────────────────────
  async createMedicineRequest(data) {
    const res = await fetch(`${API_BASE_URL}/medicine-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  async getMedicineRequests(status = '') {
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : ''
    const res = await fetch(`${API_BASE_URL}/medicine-requests${query}`)
    return handleResponse(res)
  },

  async getMedicineRequestsByHospitalization(hospitalizationId) {
    const res = await fetch(`${API_BASE_URL}/medicine-requests/hospitalization/${hospitalizationId}`)
    return handleResponse(res)
  },

  async issueMedicineRequest(id, adminId = 'ADMIN-01') {
    const query = adminId ? `?adminId=${encodeURIComponent(adminId)}` : ''
    const res = await fetch(`${API_BASE_URL}/medicine-requests/${id}/issue${query}`, {
      method: 'PATCH',
    })
    return handleResponse(res)
  },

  async markMedicineRequestUnavailable(id, data = {}) {
    const res = await fetch(`${API_BASE_URL}/medicine-requests/${id}/unavailable`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  async getInventoryItems(category = 'ALL', search = '') {
    try {
      const params = new URLSearchParams()
      if (category && category !== 'ALL') params.append('category', category)
      if (search) params.append('search', search)
      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`${API_BASE_URL}/inventory${queryString}`)
      return await handleResponse(res)
    } catch {
      const mockItems = [
        { id: '1', itemCode: 'MED-001', itemName: 'Amoxicillin 500mg', category: 'MEDICINE', quantity: 250, unit: 'Tablets', minimumStockLevel: 50 },
        { id: '2', itemCode: 'SUP-005', itemName: 'IV Normal Saline 500ml', category: 'MEDICAL_SUPPLY', quantity: 120, unit: 'Bags', minimumStockLevel: 20 },
        { id: '3', itemCode: 'MED-012', itemName: 'Meloxicam Injection', category: 'MEDICINE', quantity: 45, unit: 'Vials', minimumStockLevel: 15 },
        { id: '4', itemCode: 'SUP-020', itemName: 'Gauze Swabs Sterile', category: 'MEDICAL_SUPPLY', quantity: 600, unit: 'Packs', minimumStockLevel: 100 },
        { id: '5', itemCode: 'MED-044', itemName: 'Flea & Tick Prevention Spot-on', category: 'MEDICINE', quantity: 5, unit: 'Doses', minimumStockLevel: 10 }
      ];
      return mockItems.filter(item =>
        (category === 'ALL' || item.category === category) &&
        (search === '' || item.itemName.toLowerCase().includes(search.toLowerCase()) || item.itemCode.toLowerCase().includes(search.toLowerCase()))
      );
    }
  },

  async getInventoryItemById(id) {
    const res = await fetch(`${API_BASE_URL}/inventory/${id}`)
    return handleResponse(res)
  },

  async createInventoryItem(data) {
    const res = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  async updateInventoryItem(id, data) {
    const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(res)
  },

  async deleteInventoryItem(id) {
    const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
    })
    return handleResponse(res)
  },
}
