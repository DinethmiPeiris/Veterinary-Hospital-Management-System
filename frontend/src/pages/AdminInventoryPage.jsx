import { useState, useEffect } from 'react'
import { epic3Service } from '../services/epic3Service'
import { Search as IconSearch } from 'lucide-react'
import './ModuleStyles.css'

export default function AdminInventoryPage({ hideHeader = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState({ message: '', type: '' })

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    category: 'MEDICINE',
    quantity: 0,
    unit: 'Tablets',
    minimumStockLevel: 10
  })

  useEffect(() => {
    loadInventory()
  }, [categoryFilter, searchQuery])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const data = await epic3Service.getInventoryItems(categoryFilter, searchQuery)
      setItems(data)
    } catch (err) {
      setToast({ message: err.message || 'Failed to load inventory', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormData({
      itemCode: '',
      itemName: '',
      category: 'MEDICINE',
      quantity: 50,
      unit: 'Tablets',
      minimumStockLevel: 10
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      category: item.category || 'MEDICINE',
      quantity: item.quantity !== undefined ? item.quantity : 0,
      unit: item.unit || 'Units',
      minimumStockLevel: item.minimumStockLevel !== undefined ? item.minimumStockLevel : 10
    })
    setIsModalOpen(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()

    if (formData.quantity < 0) {
      setToast({ message: 'Quantity cannot be negative.', type: 'error' })
      return
    }

    if (formData.minimumStockLevel < 0) {
      setToast({ message: 'Minimum stock level cannot be negative.', type: 'error' })
      return
    }

    setSaving(true)
    setToast({ message: '', type: '' })

    try {
      if (editingItem) {
        await epic3Service.updateInventoryItem(editingItem.id, {
          itemName: formData.itemName,
          category: formData.category,
          quantity: parseInt(formData.quantity, 10),
          unit: formData.unit,
          minimumStockLevel: parseInt(formData.minimumStockLevel, 10)
        })
        setToast({ message: `Inventory item "${formData.itemName}" updated successfully!`, type: 'success' })
      } else {
        await epic3Service.createInventoryItem({
          itemCode: formData.itemCode,
          itemName: formData.itemName,
          category: formData.category,
          quantity: parseInt(formData.quantity, 10),
          unit: formData.unit,
          minimumStockLevel: parseInt(formData.minimumStockLevel, 10)
        })
        setToast({ message: `Inventory item "${formData.itemName}" added successfully!`, type: 'success' })
      }

      setIsModalOpen(false)
      loadInventory()
    } catch (err) {
      setToast({ message: err.message || 'Failed to save inventory item', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (item) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.itemName}" (${item.itemCode})?`)
    if (!confirmDelete) return

    setToast({ message: '', type: '' })
    try {
      await epic3Service.deleteInventoryItem(item.id)
      setToast({ message: `Item "${item.itemName}" removed from inventory.`, type: 'success' })
      loadInventory()
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete inventory item', type: 'error' })
    }
  }

  const getStockStatus = (item) => {
    const qty = item.quantity !== undefined ? item.quantity : 0
    const minLevel = item.minimumStockLevel !== undefined ? item.minimumStockLevel : 10

    if (qty === 0) return { label: 'OUT OF STOCK', className: 'badge-outstock' }
    if (qty <= minLevel) return { label: 'LOW STOCK', className: 'badge-lowstock' }
    return { label: 'IN STOCK', className: 'badge-instock' }
  }

  return (
    <div style={{ wwidth: '100%' }}>
      <section className="modern-section">
        <div className="section-title-row flex-wrap">
          <div>
            <h2 className="section-heading">Inventory Management</h2>
            <p className="section-sub">Manage hospital medicines and medical supplies stock levels.</p>
          </div>

          <div className="filter-group">
            <div className="search-box">
              <span className="search-icon"><IconSearch size={18} /></span>
              <input
                type="text"
                placeholder="Search by item name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-modern"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select-modern"
            >
              <option value="ALL">All Categories</option>
              <option value="MEDICINE">Medicines</option>
              <option value="MEDICAL_SUPPLY">Medical Supplies</option>
            </select>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <button
                onClick={loadInventory} disabled={loading}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0 1rem', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                {loading ? '...' : '\u21bb'}
              </button>
              <button
                onClick={handleOpenAddModal}
                style={{ background: '#0d9488', border: 'none', borderRadius: '10px', padding: '0.6rem 1.25rem', color: '#fff', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                + Add Item
              </button>
            </div>
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
            <p style={{ color: 'var(--text-muted)', padding: '1.5rem' }}>Loading inventory items...</p>
          ) : items.length === 0 ? (
            <table className="modern-table">
              <tbody>
                <tr><td className="table-empty">No inventory items found.</td></tr>
              </tbody>
            </table>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Current Quantity</th>
                  <th>Unit</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const qty = item.quantity !== undefined ? item.quantity : 0;
                  const minLevel = item.minimumStockLevel !== undefined ? item.minimumStockLevel : 10;
                  const isOutOfStock = qty === 0;
                  const isLowStock = !isOutOfStock && qty <= minLevel;
                  const isHealthy = !isOutOfStock && !isLowStock;

                  return (
                    <tr key={item.id} className="table-row-hover">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-chip" style={{ background: item.category === 'MEDICINE' ? '#e0e7ff' : '#fce7f3', color: item.category === 'MEDICINE' ? '#4f46e5' : '#db2777' }}>
                            {item.category === 'MEDICINE' ? 'M' : 'S'}
                          </div>
                          <strong className="user-name-text">{item.itemCode}</strong>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>{item.itemName}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                          {item.category === 'MEDICINE' ? 'Medicine' : 'Medical Supply'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '1.05rem', color: isOutOfStock ? '#ef4444' : isLowStock ? '#d97706' : '#0f172a' }}>
                          {item.quantity}
                        </strong>
                      </td>
                      <td><span style={{ color: '#475569', fontSize: '0.85rem' }}>{item.unit}</span></td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                          background: isOutOfStock ? '#fef2f2' : isLowStock ? '#fef3c7' : '#dcfce7',
                          color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#15803d',
                          border: `1px solid ${isOutOfStock ? '#fecaca' : isLowStock ? '#fde68a' : '#bbf7d0'}`
                        }}>
                          {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            style={{ padding: '6px 14px', borderRadius: '10px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            style={{ padding: '6px 14px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#ffe4e6'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for Add / Edit */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3 className="modal-title">{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveItem}>
                {!editingItem && (
                  <div className="form-group">
                    <label>Item Code (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MED-001 or SUP-001 (auto-generated if left blank)"
                      value={formData.itemCode}
                      onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Amoxicillin 500mg"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="MEDICINE">Medicine</option>
                      <option value="MEDICAL_SUPPLY">Medical Supply</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Unit</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tablets, Vials, Boxes"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Minimum Stock Level</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.minimumStockLevel}
                      onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
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
