import React from 'react';
import { Outlet } from 'react-router-dom';
import PetOwnerSidebar from './PetOwnerSidebar';
import './PetOwnerLayout.css';

const PetOwnerLayout = () => {
    return (
        <div className="pet-owner-layout">
            <PetOwnerSidebar />
            <main className="pet-owner-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default PetOwnerLayout;
