import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear any admin session here (mock for now)
        navigate('/login');
    };

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <h2>VHMS</h2>
                <p>Admin Portal</p>
            </div>
            <nav className="sidebar-nav">
                <Link to="/admin/dashboard" className={`nav-item ${location.pathname.includes('/dashboard') ? 'active' : ''}`}>
                    📊 Dashboard
                </Link>
                <Link to="/admin/pending-registrations" className={`nav-item ${location.pathname.includes('/pending-registrations') ? 'active' : ''}`}>
                    👤 Pending Registrations
                </Link>
                <Link to="/admin/pet-owners" className={`nav-item ${location.pathname.includes('/pet-owners') ? 'active' : ''}`}>
                    📁 Pet Owner Directory
                </Link>
                <Link to="/admin/pets" className={`nav-item ${location.pathname.includes('/pets') && !location.pathname.includes('/hospitalized') ? 'active' : ''}`}>
                    🐾 Pets Directory
                </Link>
                <Link to="/admin/doctors" className={`nav-item ${location.pathname.includes('/doctors') ? 'active' : ''}`}>
                    👨‍⚕️ Doctor Directory
                </Link>
                <Link to="/admin/register-doctor" className={`nav-item ${location.pathname.includes('/register-doctor') ? 'active' : ''}`}>
                    ➕ Register New Doctor
                </Link>
                <Link to="/admin/appointments" className={`nav-item ${location.pathname.includes('/appointments') ? 'active' : ''}`}>
                    📅 Appointment Approvals
                </Link>
                <Link to="/admin/schedules" className={`nav-item ${location.pathname.includes('/schedules') ? 'active' : ''}`}>
                    📆 Schedule Management
                </Link>
                <Link to="/admin/consultations" className={`nav-item ${location.pathname.includes('/consultations') ? 'active' : ''}`}>
                    🏥 All Consultations
                </Link>
                <Link to="/admin/services" className={`nav-item ${location.pathname.includes('/services') ? 'active' : ''}`}>
                    🛎️ Services
                </Link>
                <Link to="/admin/invoicing" className={`nav-item ${location.pathname.includes('/invoicing') ? 'active' : ''}`}>
                    💳 Invoices & Payments
                </Link>
                <Link to="/admin/financial-reports" className={`nav-item ${location.pathname.includes('/financial-reports') || location.pathname === '/admin/reports' ? 'active' : ''}`}>
                    📈 Financial Reports
                </Link>
                <Link to="/admin/admission-requests" className={`nav-item ${location.pathname.includes('/admission-requests') ? 'active' : ''}`}>
                    📥 Admission Requests
                </Link>
                <Link to="/admin/hospitalized-pets" className={`nav-item ${location.pathname.includes('/hospitalized-pets') ? 'active' : ''}`}>
                    🏥 Hospitalized Pets
                </Link>
                <Link to="/admin/medicine-requests" className={`nav-item ${location.pathname.includes('/medicine-requests') ? 'active' : ''}`}>
                    💊 Medicine Requests
                </Link>
                <Link to="/admin/inventory" className={`nav-item ${location.pathname.includes('/inventory') ? 'active' : ''}`}>
                    📦 Inventory
                </Link>
                <Link to="/admin/cage-occupancy" className={`nav-item ${location.pathname.includes('/cage-occupancy') ? 'active' : ''}`}>
                    🛏️ Cage Occupancy
                </Link>
                <Link to="/admin/feedback" className={`nav-item ${location.pathname.includes('/feedback') ? 'active' : ''}`}>
                    ⭐ Customer Feedback
                </Link>
                <Link to="/admin/profile" className={`nav-item ${location.pathname.includes('/profile') ? 'active' : ''}`}>
                    👑 My Profile
                </Link>
            </nav>
            <div className="sidebar-footer">
                <div className="user-info">
                    <span className="avatar-icon">👑</span>
                    <div className="info-text">
                        <span className="name">Hospital Admin</span>
                    </div>
                </div>
                <button type="button" className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
