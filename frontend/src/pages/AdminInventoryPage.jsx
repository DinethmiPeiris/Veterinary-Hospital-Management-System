import { useState, useEffect } from 'react'
import AdminNav from '../components/AdminNav'
import { epic3Service } from '../services/epic3Service'
import './ModuleStyles.css'

export default function AdminInventoryPage() {
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
    <div className="module-page-container">
      <AdminNav />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Inventory Management</h1>
            <p className="page-subtitle">Manage hospital medicines and medical supplies stock levels.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn-refresh" onClick={loadInventory} disabled={loading}>
              {loading ? 'Refreshing...' : '\u21bb Refresh'}
            </button>
            <button className="btn-primary" onClick={handleOpenAddModal}>
              + Add Item
            </button>
          </div>
        </div>

        {toast.message && (
          <div className={`alert-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ message: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="filter-bar">
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by item name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="MEDICINE">Medicines</option>
            <option value="MEDICAL_SUPPLY">Medical Supplies</option>
          </select>
        </div>

        <div className="content-card">
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading inventory items...</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No inventory items found.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
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
                    const status = getStockStatus(item)
                    return (
                      <tr key={item.id}>
                        <td><strong>{item.itemCode}</strong></td>
                        <td>{item.itemName}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {item.category === 'MEDICINE' ? 'Medicine' : 'Medical Supply'}
                          </span>
                        </td>
                        <td><strong>{item.quantity}</strong></td>
                        <td>{item.unit}</td>
                        <td>
                          <span className={`status-badge ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-action request"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-action reject"
                            onClick={() => handleDeleteItem(item)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
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
      </main>
    </div>
  )
}
