import React, { useEffect, useMemo, useState } from 'react'
import './DoctorDashboard.css'
import { Link } from 'react-router-dom'
import { formatDoctorDisplayName, getDoctorSession } from '../../utils/doctorAuth'
import { getAppointments } from '../../utils/appointmentStore'

const DoctorDashboard = () => {
  const session = getDoctorSession()
  const displayName = formatDoctorDisplayName(session?.name)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getAppointments()
        if (!cancelled) setAppointments(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const todayStr = useMemo(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  }, []);

  const todayAppointments = useMemo(() => {
    return appointments.filter(a => (a.date || todayStr) === todayStr)
  }, [appointments, todayStr])

  const stats = useMemo(() => {
    const total = todayAppointments.length
    const waiting = todayAppointments.filter((a) => a.status === 'WAITING' || a.status === 'SCHEDULED').length
    const inProgress = todayAppointments.filter((a) => a.status === 'IN_PROGRESS').length
    const completed = todayAppointments.filter((a) => a.status === 'COMPLETED').length
    return { total, waiting, inProgress, completed }
  }, [todayAppointments])

  const nextAppointment = useMemo(() => {
    const open = todayAppointments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
    const priority = { IN_PROGRESS: 0, WAITING: 1, SCHEDULED: 2 }
    
    const parseDateTime = (dateStr, timeStr) => {
      try {
        const dStr = dateStr || todayStr
        const [time, modifier] = (timeStr || '12:00 AM').split(' ')
        let [hours, minutes] = time.split(':')
        if (hours === '12') hours = '00'
        if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString()
        return new Date(`${dStr}T${hours.toString().padStart(2, '0')}:${minutes}:00`).getTime()
      } catch {
        return 0
      }
    }

    return [...open].sort((a, b) => {
      const pa = priority[a.status] ?? 9
      const pb = priority[b.status] ?? 9
      if (pa !== pb) return pa - pb
      
      const timeA = parseDateTime(a.date, a.time)
      const timeB = parseDateTime(b.date, b.time)
      return timeA - timeB
    })[0] || null
  }, [todayAppointments, todayStr])

  return (
    <div className="doctor-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {displayName}</h1>
          <p className="subtitle">Here's an overview of your day</p>
        </div>
      </header>

      {error && <p className="subtitle" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon scheduled">📅</div>
          <div className="stat-info">
            <h3>{loading ? '—' : stats.total}</h3>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon waiting">⏳</div>
          <div className="stat-info">
            <h3>{loading ? '—' : stats.waiting}</h3>
            <p>Waiting / Scheduled</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon in-progress">👨‍⚕️</div>
          <div className="stat-info">
            <h3>{loading ? '—' : stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-info">
            <h3>{loading ? '—' : stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <div className="section-header">
            <h2>Up Next</h2>
            <Link to="/doctor/appointments" className="view-all-link">View All</Link>
          </div>

          {!loading && !nextAppointment && (
            <p className="subtitle">No open appointments right now.</p>
          )}

          {nextAppointment && (
            <div className="next-appointment-card">
              <div className="time-col">
                <h4>{nextAppointment.time}</h4>
                <span>{nextAppointment.status.replace('_', ' ')}</span>
              </div>
              <div className="patient-col">
                <h4>{nextAppointment.patient} ({nextAppointment.species}{nextAppointment.breed ? ` · ${nextAppointment.breed}` : ''})</h4>
                <p>Owner: {nextAppointment.owner}</p>
                <span className="reason">Reason: {nextAppointment.reason}</span>
              </div>
              <div className="action-col">
                <Link
                  to={`/doctor/consultation/${nextAppointment.id}`}
                  className="btn-primary"
                >
                  Open Consultation
                </Link>
                {nextAppointment.petId && (
                  <Link
                    to={`/doctor/pet/${nextAppointment.petId}/history`}
                    className="btn-primary"
                    style={{ marginTop: '0.5rem', background: '#64748b' }}
                  >
                    View EMR
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
