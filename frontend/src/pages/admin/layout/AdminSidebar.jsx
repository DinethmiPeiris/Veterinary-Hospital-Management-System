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
                <Link 
                    to="/admin/dashboard" 
                    className={`nav-item ${location.pathname.includes('/dashboard') ? 'active' : ''}`}
                >
                    📊 Dashboard
                </Link>
                <Link 
                    to="/admin/consultations" 
                    className={`nav-item ${location.pathname.includes('/consultations') ? 'active' : ''}`}
                >
                    🏥 All Consultations
                </Link>
                <Link 
                    to="/admin/reports" 
                    className={`nav-item ${location.pathname.includes('/reports') ? 'active' : ''}`}
                >
                    📈 Reports
                </Link>
                <Link 
                    to="/admin/services" 
                    className={`nav-item ${location.pathname.includes('/services') ? 'active' : ''}`}
                >
                    🛎️ Services
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
