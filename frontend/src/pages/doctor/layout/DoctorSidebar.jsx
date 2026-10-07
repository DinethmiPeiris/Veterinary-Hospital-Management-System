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
                <Link to="/doctor/dashboard" className={`nav-item ${location.pathname.includes('/dashboard') ? 'active' : ''}`}>
                    📊 Dashboard
                </Link>
                <Link to="/doctor/booking-requests" className={`nav-item ${location.pathname.includes('/booking-requests') ? 'active' : ''}`}>
                    🔔 Booking Requests
                </Link>
                <Link to="/doctor/appointments" className={`nav-item ${location.pathname.includes('/appointments') ? 'active' : ''}`}>
                    📅 Appointments
                </Link>
                <Link to="/doctor/agenda" className={`nav-item ${location.pathname.includes('/agenda') ? 'active' : ''}`}>
                    📋 Today's Agenda
                </Link>
                <Link to="/doctor/workload" className={`nav-item ${location.pathname.includes('/workload') ? 'active' : ''}`}>
                    📊 Workload Analytics
                </Link>
                <Link to="/doctor/recommend-admission" className={`nav-item ${location.pathname.includes('/recommend-admission') ? 'active' : ''}`}>
                    🏥 Recommend Admission
                </Link>
                <Link to="/doctor/hospitalized-pets" className={`nav-item ${location.pathname.includes('/hospitalized-pets') ? 'active' : ''}`}>
                    🩺 Hospitalized Pets
                </Link>
                <Link to="/doctor/profile" className={`nav-item ${location.pathname.includes('/profile') ? 'active' : ''}`}>
                    👨‍⚕️ My Profile
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
