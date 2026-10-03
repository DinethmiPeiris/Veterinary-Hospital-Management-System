import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl, ADMIN_AUTH_HEADER } from '../../config/api';
import './AdminServiceManagement.css';

const API_BASE = apiUrl('/api/v1/services');
const AUTH_HEADER = ADMIN_AUTH_HEADER;

const EMPTY_SERVICE = {
    name: '',
    category: 'Consultation',
    description: '',
    price: '',
    durationMinutes: '',
};

const CATEGORIES = ['Consultation', 'Surgery', 'Diagnostics', 'Vaccination', 'Grooming', 'Emergency', 'Other'];

const AdminServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState(EMPTY_SERVICE);
    const [saving, setSaving] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await axios.get(`${API_BASE}/all`, { headers: AUTH_HEADER });
            setServices(res.data);
        } catch (err) {
            console.error('Failed to load services', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateForm = () => {
        setEditingService(null);
        setFormData(EMPTY_SERVICE);
        setShowForm(true);
    };

    const openEditForm = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name || '',
            category: service.category || 'Consultation',
            description: service.description || '',
            price: service.price || '',
            durationMinutes: service.durationMinutes || '',
        });
        setShowForm(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                durationMinutes: parseInt(formData.durationMinutes) || 0,
                active: true,
            };
            if (editingService) {
                await axios.put(`${API_BASE}/${editingService.id}`, payload, { headers: AUTH_HEADER });
            } else {
                await axios.post(API_BASE, payload, { headers: AUTH_HEADER });
            }
            setShowForm(false);
            fetchServices();
        } catch (err) {
            console.error('Failed to save service', err);
            alert('Failed to save service. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (service) => {
        if (!window.confirm(`Deactivate "${service.name}"? It will no longer appear to users.`)) return;
        try {
            await axios.delete(`${API_BASE}/${service.id}`, { headers: AUTH_HEADER });
            fetchServices();
        } catch (err) {
            console.error('Failed to deactivate service', err);
        }
    };

    const handleReactivate = async (service) => {
        try {
            await axios.put(`${API_BASE}/${service.id}`, { ...service, active: true }, { headers: AUTH_HEADER });
            fetchServices();
        } catch (err) {
            console.error('Failed to reactivate service', err);
        }
    };

    const filtered = filterCategory === 'All'
        ? services
        : services.filter(s => s.category === filterCategory);

    return (
        <div className="service-mgmt-container">
            <header className="page-header">
                <div>
                    <h1>Veterinary Service Catalog</h1>
                    <p>Manage the services offered by the hospital — names, categories, pricing, and duration.</p>
                </div>
                <button className="btn-add-service" onClick={openCreateForm}>
                    + Add New Service
                </button>
            </header>

            {/* Category Filter */}
            <div className="category-filter">
                {['All', ...CATEGORIES].map(cat => (
                    <button
                        key={cat}
                        className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                        onClick={() => setFilterCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="service-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="svc-name">Service Name *</label>
                                    <input
                                        id="svc-name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. General Checkup"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="svc-category">Category</label>
                                    <select id="svc-category" name="category" value={formData.category} onChange={handleChange}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="svc-description">Description</label>
                                <textarea
                                    id="svc-description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Brief description of the service..."
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="svc-price">Price (LKR)</label>
                                    <input
                                        id="svc-price"
                                        name="price"
                                        type="number"
                                        min="0"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="e.g. 2500"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="svc-duration">Duration (minutes)</label>
                                    <input
                                        id="svc-duration"
                                        name="durationMinutes"
                                        type="number"
                                        min="0"
                                        value={formData.durationMinutes}
                                        onChange={handleChange}
                                        placeholder="e.g. 30"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={saving}>
                                    {saving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Service Grid */}
            {loading ? (
                <div className="loading-state">Loading service catalog...</div>
            ) : (
                <div className="services-grid">
                    {filtered.length === 0 && (
                        <p className="no-data">No services found in this category.</p>
                    )}
                    {filtered.map(service => (
                        <div key={service.id} className={`service-card ${!service.active ? 'inactive' : ''}`}>
                            <div className="service-card-header">
                                <span className={`category-badge cat-${service.category?.toLowerCase().replace(/\s/g, '-')}`}>
                                    {service.category}
                                </span>
                                {!service.active && <span className="inactive-badge">Inactive</span>}
                            </div>
                            <h3 className="service-name">{service.name}</h3>
                            <p className="service-description">{service.description || 'No description.'}</p>
                            <div className="service-meta">
                                <span className="price">
                                    {service.price ? `LKR ${service.price.toLocaleString()}` : 'Price TBD'}
                                </span>
                                <span className="duration">
                                    {service.durationMinutes ? `⏱ ${service.durationMinutes} min` : ''}
                                </span>
                            </div>
                            <div className="service-actions">
                                <button className="btn-edit" onClick={() => openEditForm(service)}>
                                    ✏️ Edit
                                </button>
                                {service.active ? (
                                    <button className="btn-deactivate" onClick={() => handleDeactivate(service)}>
                                        Deactivate
                                    </button>
                                ) : (
                                    <button className="btn-reactivate" onClick={() => handleReactivate(service)}>
                                        Reactivate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminServiceManagement;
