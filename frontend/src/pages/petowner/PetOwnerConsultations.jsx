import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../config/api';
import './PetOwnerConsultations.css';

const PetOwnerConsultations = () => {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPet, setSelectedPet] = useState('PET-101'); // Mock logged-in pet owner's pet

    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                setLoading(true);
                const response = await fetch(apiUrl(`/api/v1/consultations/pet/${selectedPet}`));
                if (!response.ok) {
                    throw new Error('Failed to fetch consultations');
                }
                const data = await response.json();
                setConsultations(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching consultations:', err);
                setError('Failed to load consultation history.');
            } finally {
                setLoading(false);
            }
        };

        fetchConsultations();
    }, [selectedPet]);

    const handleDownloadReport = (consultation) => {
        const printWindow = window.open('', '_blank');
        const html = `
            <html>
            <head>
                <title>Medical Report - ${consultation.petName || 'Pet'}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #0f172a; margin: 0 0 10px 0; }
                    .header p { color: #64748b; margin: 0; }
                    .section { margin-bottom: 30px; }
                    .section h2 { color: #38bdf8; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                    .row { margin-bottom: 10px; }
                    .label { font-weight: bold; color: #475569; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Veterinary Hospital Management System</h1>
                    <p>Official Medical Consultation Report</p>
                </div>
                
                <div class="section">
                    <h2>Consultation Details</h2>
                    <div class="row"><span class="label">Date:</span> ${new Date(consultation.consultationDate).toLocaleString()}</div>
                    <div class="row"><span class="label">Doctor:</span> Dr. ${consultation.doctorName}</div>
                    <div class="row"><span class="label">Status:</span> ${consultation.status}</div>
                </div>

                <div class="section">
                    <h2>Diagnosis</h2>
                    <p>${consultation.diagnosis || 'None recorded'} ${consultation.diagnosisSeverity ? `(${consultation.diagnosisSeverity})` : ''}</p>
                </div>

                <div class="section">
                    <h2>Treatment Plan</h2>
                    <p>${consultation.treatmentPlan || 'None recorded'}</p>
                </div>

                <div class="section">
                    <h2>Prescriptions</h2>
                    <ul>
                        ${consultation.prescriptions?.map(rx => `
                            <li><strong>${rx.medicationName}</strong>: ${rx.dosage} for ${rx.duration}. ${rx.instructions || ''}</li>
                        `).join('') || '<li>No prescriptions</li>'}
                    </ul>
                </div>
                
                <div class="section">
                    <h2>Doctor Notes</h2>
                    <p>${consultation.notes || 'None recorded'}</p>
                </div>
                
                <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 0.9em;">
                    <p>This is a computer-generated document. No signature is required.</p>
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    // US-E2-18: Check for newly completed consultations to show notification
    const newlyCompleted = consultations.filter(c => c.status === 'COMPLETED');

    return (
        <div className="pet-owner-consultations">
            {/* US-E2-18: In-app notification for completed consultations */}
            {newlyCompleted.length > 0 && (
                <div className="completion-notification" role="alert">
                    <span className="notif-icon">🔔</span>
                    <span>
                        <strong>{newlyCompleted.length} consultation{newlyCompleted.length > 1 ? 's' : ''} completed.</strong>
                        {' '}Your pet's medical record has been updated by the attending doctor.
                    </span>
                </div>
            )}

            <header className="page-header">
                <div>
                    <h1>Consultation History</h1>
                    <p>View past and ongoing consultations for your pet</p>
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
                <div className="loading-state">Loading consultation history...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : consultations.length === 0 ? (
                <div className="empty-state">
                    <h3>No consultations found</h3>
                    <p>Your pet hasn't had any consultations yet.</p>
                </div>
            ) : (
                <div className="consultations-list">
                    {consultations.map(consultation => (
                        <div key={consultation.id} className="consultation-card">
                            <div className="consultation-card-header">
                                <div>
                                    <h3>{new Date(consultation.consultationDate).toLocaleDateString()} - {new Date(consultation.consultationDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h3>
                                    <p className="doctor-name">Dr. {consultation.doctorName}</p>
                                </div>
                                <span className={`status-badge ${consultation.status?.toLowerCase()}`}>
                                    {consultation.status}
                                </span>
                            </div>
                            
                            <div className="consultation-card-body">
                                {consultation.diagnosis && (
                                    <div className="detail-section">
                                        <h4>Diagnosis</h4>
                                        <p>{consultation.diagnosis} {consultation.diagnosisSeverity && `(${consultation.diagnosisSeverity})`}</p>
                                    </div>
                                )}
                                
                                {consultation.treatmentPlan && (
                                    <div className="detail-section">
                                        <h4>Treatment Plan</h4>
                                        <p>{consultation.treatmentPlan}</p>
                                    </div>
                                )}
                                
                                {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                                    <div className="detail-section">
                                        <h4>Prescriptions</h4>
                                        <ul className="prescription-list">
                                            {consultation.prescriptions.map((rx, idx) => (
                                                <li key={idx}>
                                                    <strong>{rx.medicationName}</strong>: {rx.dosage} for {rx.duration}
                                                    {rx.instructions && <span className="rx-instructions"> - {rx.instructions}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* US-E2-19: Doctor recommendations / notes */}
                                {consultation.notes && (
                                    <div className="detail-section doctor-notes">
                                        <h4>📋 Doctor's Notes &amp; Recommendations</h4>
                                        <p className="notes-text">{consultation.notes}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="consultation-card-footer">
                                <button className="btn-secondary" onClick={() => handleDownloadReport(consultation)}>
                                    📄 Download Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PetOwnerConsultations;
