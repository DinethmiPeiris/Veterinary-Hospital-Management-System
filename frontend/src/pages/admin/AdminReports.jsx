import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl, ADMIN_AUTH_HEADER } from '../../config/api';
import './AdminReports.css';

const AdminReports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(apiUrl('/api/v1/admin/stats'), {
                headers: ADMIN_AUTH_HEADER,
            });
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-state">Generating reports...</div>;
    }

    return (
        <div className="admin-reports-container">
            <header className="page-header">
                <div>
                    <h1>Hospital Analytics & Reports</h1>
                    <p>Overview of key performance indicators and medical trends.</p>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon consultations-icon">🏥</div>
                    <div className="stat-info">
                        <h3>Total Consultations</h3>
                        <p className="stat-value">{stats?.totalConsultations || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon completed-icon">✅</div>
                    <div className="stat-info">
                        <h3>Completed</h3>
                        <p className="stat-value">{stats?.completedConsultations || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pending-icon">⏳</div>
                    <div className="stat-info">
                        <h3>Pending / Draft</h3>
                        <p className="stat-value">
                            {(stats?.totalConsultations || 0) - (stats?.completedConsultations || 0)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-card">
                    <h3>Top Diagnoses</h3>
                    {stats?.topDiagnoses && Object.keys(stats.topDiagnoses).length > 0 ? (
                        <ul className="diagnosis-list">
                            {Object.entries(stats.topDiagnoses).map(([diagnosis, count]) => (
                                <li key={diagnosis} className="diagnosis-item">
                                    <span className="diagnosis-name">{diagnosis}</span>
                                    <span className="diagnosis-count">{count} cases</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-data">No diagnosis data available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
