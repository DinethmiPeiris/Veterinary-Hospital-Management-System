import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import './PetOwnerMedicalHistory.css';

const PetOwnerMedicalHistory = () => {
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPet, setSelectedPet] = useState('PET-101'); // Mock logged-in pet owner's pet

    useEffect(() => {
        const fetchMedicalRecord = async () => {
            try {
                setLoading(true);
                const response = await fetch(apiUrl(`/api/v1/medical-records/pet/${selectedPet}`));
                if (!response.ok) {
                    throw new Error('Failed to fetch medical record');
                }
                const data = await response.json();
                setRecord(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching medical record:', err);
                setError('Failed to load medical history.');
            } finally {
                setLoading(false);
            }
        };

        fetchMedicalRecord();
    }, [selectedPet]);

    const handleDownloadDocument = (doc) => {
        if (doc.fileData) {
            const link = document.createElement('a');
            link.href = doc.fileData;
            link.download = doc.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('Document data is missing.');
        }
    };

    return (
        <div className="pet-owner-medical-history">
            <header className="page-header">
                <div>
                    <h1>Medical History & Documents</h1>
                    <p>View your pet's health metrics, vaccinations, and documents</p>
                </div>
                <div className="pet-selector">
                    <label>Select Pet: </label>
                    <select value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)}>
                        <option value="PET-101">Buddy (Dog)</option>
                        <option value="PET-102">Luna (Cat)</option>
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Loading medical record...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : !record ? (
                <div className="empty-state">
                    <h3>No medical record found</h3>
                    <p>Your pet doesn't have an electronic medical record yet.</p>
                </div>
            ) : (
                <div className="medical-record-content">
                    <div className="metrics-summary">
                        <div className="metric-card">
                            <span className="metric-icon">🐾</span>
                            <div className="metric-info">
                                <h5>Species & Breed</h5>
                                <p>{record.species} - {record.breed || 'Unknown'}</p>
                            </div>
                        </div>
                        <div className="metric-card">
                            <span className="metric-icon">🎂</span>
                            <div className="metric-info">
                                <h5>Age</h5>
                                <p>{record.age} Years</p>
                            </div>
                        </div>
                        <div className="metric-card">
                            <span className="metric-icon">⚖️</span>
                            <div className="metric-info">
                                <h5>Weight</h5>
                                <p>{record.weight} kg</p>
                            </div>
                        </div>
                    </div>

                    <div className="record-sections">
                        <div className="record-section">
                            <h3>Vaccinations</h3>
                            {record.vaccinations && record.vaccinations.length > 0 ? (
                                <ul className="vaccination-list">
                                    {record.vaccinations.map((vac, index) => (
                                        <li key={index} className="vaccination-item">
                                            <div className="vac-info">
                                                <strong>{vac.vaccineName}</strong>
                                                <span className="vac-date">Administered: {new Date(vac.dateAdministered).toLocaleDateString()}</span>
                                            </div>
                                            <div className="vac-next-due">
                                                Next Due: {new Date(vac.nextDueDate).toLocaleDateString()}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-data">No vaccinations recorded.</p>
                            )}
                        </div>

                        <div className="record-section">
                            <h3>Attached Documents</h3>
                            {record.documents && record.documents.length > 0 ? (
                                <ul className="document-list">
                                    {record.documents.map((doc, index) => (
                                        <li key={index} className="document-item">
                                            <div className="doc-info">
                                                <strong>{doc.fileName}</strong>
                                                <span className="doc-date">Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                                                <span className="doc-type">{doc.documentType}</span>
                                            </div>
                                            <button 
                                                className="btn-download"
                                                onClick={() => handleDownloadDocument(doc)}
                                            >
                                                📥 Download
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-data">No documents attached.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PetOwnerMedicalHistory;
