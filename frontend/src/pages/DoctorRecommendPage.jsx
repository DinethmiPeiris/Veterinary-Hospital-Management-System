import { useState, useEffect } from 'react'
import { epic3Service } from '../services/epic3Service'
import { getEpic3Session } from '../services/demoConfig'
import { API_BASE_URL } from '../config/api'
import './ModuleStyles.css'

export default function DoctorRecommendPage() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ message: '', type: '' })

  const [pets, setPets] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [form, setForm] = useState({
    petName: getEpic3Session().petName,
    petSpecies: getEpic3Session().petSpecies,
    ownerName: getEpic3Session().ownerName,
    doctorName: getEpic3Session().doctorName,
    recommendationReason: 'Severe dehydration and gastrointestinal monitoring required after surgery.'
  })

  useEffect(() => {
    loadRecommendations()
    fetch(`${API_BASE_URL}/api/pets`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPets(Array.isArray(data) ? data : []))
      .catch(() => setPets([]))
  }, [])

  const handlePetSelect = (petId) => {
    const pet = pets.find((p) => p.id === petId) || null
    setSelectedPet(pet)
    if (pet) {
      setForm((f) => ({
        ...f,
        petName: pet.name || f.petName,
        petSpecies: [pet.species, pet.breed].filter(Boolean).join(' / ') || f.petSpecies,
        ownerName: pet.ownerName || f.ownerName
      }))
    }
  }

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const data = await epic3Service.getAdmissions()
      setRecommendations(data)
    } catch (err) {
      setToast({ message: err.message || 'Failed to load recommendations', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.recommendationReason.trim()) {
      setToast({ message: 'Please provide a valid recommendation reason.', type: 'error' })
      return
    }

    setSubmitting(true)
    setToast({ message: '', type: '' })
    try {
      await epic3Service.recommendAdmission({
        petId: selectedPet?.id || getEpic3Session().petId,
        petOwnerId: selectedPet?.ownerId || getEpic3Session().ownerId,
        doctorId: getEpic3Session().doctorId,
        consultationId: null,
        recommendationReason: form.recommendationReason,
        petName: form.petName,
        petSpecies: form.petSpecies,
        ownerName: form.ownerName,
        doctorName: form.doctorName
      })
      setToast({ message: 'Hospitalization recommendation submitted successfully! The pet owner will be notified.', type: 'success' })
      setForm({
        petName: getEpic3Session().petName,
        petSpecies: getEpic3Session().petSpecies,
        ownerName: getEpic3Session().ownerName,
        doctorName: getEpic3Session().doctorName,
        recommendationReason: ''
      })
      loadRecommendations()
    } catch (err) {
      setToast({ message: err.message || 'Failed to create recommendation', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="module-page-container">
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Hospitalization Recommendation</h1>
            <p className="page-subtitle">Recommend pet admission based on clinical diagnosis for Pet Owner review.</p>
          </div>
          <button className="btn-refresh" onClick={loadRecommendations} disabled={loading}>
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {toast.message && (
          <div className={`alert-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ message: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="content-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Create Recommendation</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Select Registered Pet</label>
              <select className="form-select" value={selectedPet?.id || ''} onChange={(e) => handlePetSelect(e.target.value)}>
                <option value="">— Enter details manually —</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.species || 'Pet'})</option>
                ))}
              </select>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Pet Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.petName}
                  onChange={(e) => setForm({ ...form, petName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pet Species / Breed</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.petSpecies}
                  onChange={(e) => setForm({ ...form, petSpecies: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pet Owner Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Attending Doctor</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.doctorName}
                  onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Recommendation Reason & Clinical Notes</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={form.recommendationReason}
                onChange={(e) => setForm({ ...form, recommendationReason: e.target.value })}
                placeholder="Explain why hospitalization is recommended..."
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Hospitalization Recommendation'}
            </button>
          </form>
        </div>

        <div className="content-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Hospitalization Recommendations History</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading recommendations...</p>
          ) : recommendations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hospitalization recommendations recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Pet</th>
                    <th>Owner</th>
                    <th>Doctor</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.recommendedAt ? new Date(item.recommendedAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <strong>{item.petName || 'Pet'}</strong>
                        <br />
                        <small style={{ color: 'var(--text-muted)' }}>{item.petSpecies}</small>
                      </td>
                      <td>{item.ownerName || 'Owner'}</td>
                      <td>{item.doctorName || 'Doctor'}</td>
                      <td>{item.recommendationReason}</td>
                      <td>
                        <span className={`status-badge badge-${item.status ? item.status.toLowerCase() : 'recommended'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
