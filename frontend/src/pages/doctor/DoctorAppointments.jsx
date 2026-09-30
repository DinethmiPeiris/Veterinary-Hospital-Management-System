import React, { useEffect, useMemo, useState } from 'react';
import './DoctorAppointments.css';
import StatusBadge from '../shared/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { getAppointments, startAppointmentConsultation } from '../../utils/appointmentStore';

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Waiting', value: 'WAITING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
]

const DoctorAppointments = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load appointments from MongoDB.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'ALL') return appointments
    return appointments.filter((app) => app.status === statusFilter)
  }, [appointments, statusFilter])

  const groupedAppointments = useMemo(() => {
    const groups = {}
    filteredAppointments.forEach((app) => {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const localTodayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];
      const date = app.date || localTodayStr;
      
      if (!groups[date]) groups[date] = []
      groups[date].push(app)
    })
    
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      try {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (hours === 12) hours = 0;
        if (modifier === 'PM') hours += 12;
        return hours * 60 + minutes;
      } catch {
        return 0;
      }
    };
    
    const entries = Object.entries(groups).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
    
    entries.forEach(([_, apps]) => {
      apps.sort((a, b) => parseTime(a.time) - parseTime(b.time));
    });
    
    return entries;
  }, [filteredAppointments])

  const openConsultation = async (appointmentId, status) => {
    try {
      if (status !== 'COMPLETED') {
        await startAppointmentConsultation(appointmentId)
        await loadAppointments()
      }
      navigate(`/doctor/consultation/${appointmentId}`)
    } catch (err) {
      alert(err.message || 'Unable to open consultation.')
    }
  }

  const actionLabel = (status) => {
    if (status === 'COMPLETED') return 'View'
    if (status === 'IN_PROGRESS') return 'Resume'
    return 'Start Consultation'
  }

  const actionClass = (status) => {
    if (status === 'COMPLETED') return 'btn-action view-btn'
    if (status === 'IN_PROGRESS') return 'btn-action resume-btn'
    return 'btn-action start-btn'
  }

  return (
    <div className="doctor-appointments">
      <header className="page-header">
        <div>
          <h1>Appointments</h1>
        </div>
      </header>

      <div className="appointments-card">
        <div className="appointments-toolbar">
          <div className="date-selector">
            <h3>Schedule Overview</h3>
          </div>
          <div className="filter-group">
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter appointments by status"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="appointments-table-container">
          {loading ? (
            <p className="empty-filter-row">Loading appointments from MongoDB...</p>
          ) : error ? (
            <p className="empty-filter-row">{error}</p>
          ) : groupedAppointments.length === 0 ? (
            <p className="empty-filter-row">No appointments match this filter.</p>
          ) : (
            groupedAppointments.map(([date, apps]) => (
              <div key={date} className="date-group" style={{ marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937', paddingLeft: '1rem', borderLeft: '4px solid #0f766e' }}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h4>
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Patient Info</th>
                      <th>Reason for Visit</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app.id}>
                        <td className="time-cell">
                          <strong>{app.time}</strong>
                        </td>
                        <td>
                          <div className="patient-info">
                            <h4>{app.patient}</h4>
                            <p>
                              {app.species}
                              {app.breed ? ` · ${app.breed}` : ''}
                            </p>
                            <span className="owner">Owner: {app.owner}</span>
                          </div>
                        </td>
                        <td>{app.reason}</td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td>
                          <div className="action-stack">
                            <button
                              type="button"
                              className={actionClass(app.status)}
                              onClick={() => openConsultation(app.id, app.status)}
                            >
                              {actionLabel(app.status)}
                            </button>
                            {app.petId && (
                              <button
                                type="button"
                                className="btn-action emr-btn"
                                onClick={() =>
                                  navigate(`/doctor/pet/${app.petId}/history?appointmentId=${app.id}`)
                                }
                              >
                                View EMR
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorAppointments
