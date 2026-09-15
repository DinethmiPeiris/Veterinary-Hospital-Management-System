import React from 'react';
import { NavLink } from 'react-router-dom';
import './DoctorSidebar.css';

const DoctorSidebar = () => {
    return (
        <div className="doctor-sidebar">
            <div className="sidebar-header">
                <span className="logo-icon">🐾</span>
                <h2>VHMS</h2>
            </div>
            
            <div className="doctor-profile">
                <div className="avatar">👨‍⚕️</div>
                <div className="info">
                    <h3>Dr. Smith</h3>
                    <p>General Practice</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/doctor/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    📊 <span>My Dashboard</span>
                </NavLink>
                <NavLink to="/doctor/appointments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    📅 <span>Appointments</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn">
                    🚪 <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default DoctorSidebar;
