import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl, ADMIN_AUTH_HEADER } from '../../config/api';
import './AdminConsultationList.css';

const AdminConsultationList = () => {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            const response = await axios.get(apiUrl('/api/v1/admin/consultations'), {
                headers: ADMIN_AUTH_HEADER,
            });
            setConsultations(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching consultations', error);
            setLoading(false);
        }
    };

    const filteredConsultations = consultations.filter(c => 
        c.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-consultations-container">
            <header className="page-header">
                <div>
                    <h1>Hospital Consultations</h1>
                    <p>Overview of all consultations across the veterinary hospital.</p>
                </div>
                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="Search by pet, owner, or doctor..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Loading consultation records...</div>
            ) : (
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Pet Name</th>
                                <th>Owner</th>
                                <th>Doctor</th>
                                <th>Status</th>
                                <th>Diagnosis</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredConsultations.map(consult => (
                                <tr key={consult.id}>
                                    <td>{new Date(consult.consultationDate).toLocaleDateString()}</td>
                                    <td><strong>{consult.petName}</strong></td>
                                    <td>{consult.ownerName}</td>
                                    <td>{consult.doctorName}</td>
                                    <td>
                                        <span className={`status-badge ${consult.status.toLowerCase()}`}>
                                            {consult.status}
                                        </span>
                                    </td>
                                    <td className="truncate-text" title={consult.diagnosis}>
                                        {consult.diagnosis || 'N/A'}
                                    </td>
                                    <td>
                                        <button className="action-btn view">View Details</button>
                                        <button className="action-btn delete">Remove Docs</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredConsultations.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="no-data">No consultations found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminConsultationList;
