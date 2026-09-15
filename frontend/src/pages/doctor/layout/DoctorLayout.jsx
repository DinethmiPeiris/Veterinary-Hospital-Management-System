import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';
import './DoctorLayout.css';

const DoctorLayout = () => {
    return (
        <div className="doctor-layout">
            <DoctorSidebar />
            <main className="doctor-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default DoctorLayout;
