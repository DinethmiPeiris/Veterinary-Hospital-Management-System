import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearDoctorSession, getDoctorSession } from '../../../utils/doctorAuth';
import './DoctorSidebar.css';

const DoctorSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const session = getDoctorSession();
    const staffId = session?.staffId || 'Staff';
    const username = session?.username || 'doctor';
    const specialty = session?.specialty || 'Veterinarian';

    const handleLogout = () => {
        clearDoctorSession();
        navigate('/login');
    };

    return (
        <aside className="doctor-sidebar">
            <div className="sidebar-header">
                <h2>VHMS</h2>
                <p>Doctor Portal</p>
            </div>
            <nav className="sidebar-nav">
                <Link 
                    to="/doctor/dashboard" 
                    className={`nav-item ${location.pathname.includes('/dashboard') ? 'active' : ''}`}
                >
                    📊 Dashboard
                </Link>
                <Link 
                    to="/doctor/appointments" 
                    className={`nav-item ${location.pathname.includes('/appointments') ? 'active' : ''}`}
                >
                    📅 Appointments
                </Link>
            </nav>
            <div className="sidebar-footer">
                <div className="doctor-info">
                    <span className="avatar-icon">👨‍⚕️</span>
                    <div className="info-text">
                        <span className="name">{username}</span>
                        <span className="role">{staffId} · {specialty}</span>
                    </div>
                </div>
                <button type="button" className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
};

export default DoctorSidebar;
