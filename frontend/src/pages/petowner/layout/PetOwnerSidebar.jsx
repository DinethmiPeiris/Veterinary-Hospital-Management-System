import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './PetOwnerSidebar.css';

const PetOwnerSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear any pet owner session here (mock for now)
        navigate('/login');
    };

    return (
        <aside className="pet-owner-sidebar">
            <div className="sidebar-header">
                <h2>VHMS</h2>
                <p>Pet Owner Portal</p>
            </div>
            <nav className="sidebar-nav">
                <Link 
                    to="/pet-owner/dashboard" 
                    className={`nav-item ${location.pathname.includes('/dashboard') ? 'active' : ''}`}
                >
                    🐾 Dashboard
                </Link>
                <Link 
                    to="/pet-owner/consultations" 
                    className={`nav-item ${location.pathname.includes('/consultations') ? 'active' : ''}`}
                >
                    📋 Consultations
                </Link>
                <Link 
                    to="/pet-owner/medical-history" 
                    className={`nav-item ${location.pathname.includes('/medical-history') ? 'active' : ''}`}
                >
                    ❤️ Medical History
                </Link>
                <Link
                    to="/pet-owner/admissions"
                    className={`nav-item ${location.pathname.includes('/admissions') ? 'active' : ''}`}
                >
                    🏥 Admissions
                </Link>
                <Link 
                    to="/pets" 
                    className="nav-item"
                >
                    🐶 My Pets & Bookings
                </Link>
            </nav>
            <div className="sidebar-footer">
                <div className="user-info">
                    <span className="avatar-icon">👤</span>
                    <div className="info-text">
                        <span className="name">Pet Owner</span>
                    </div>
                </div>
                <button type="button" className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
};

export default PetOwnerSidebar;
