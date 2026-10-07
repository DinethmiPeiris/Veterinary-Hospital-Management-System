import { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { billingService } from '../../services/billingService';
import { feedbackService } from '../../services/feedbackService';
import { PetAvatar, SpeciesPill, PetCell } from '../../utils/petBadgeHelper';
import NotificationBell from './NotificationBell';
import './Epic4.css';

const SERVICES_MAP = {
  CONSULTATION: ['General Consultation', 'Specialist Consultation', 'Follow-up Checkup'],
  PROCEDURE: ['Wound Cleaning', 'Nail Trimming', 'Dental Cleaning', 'Ear Cleaning', 'Dressing / Bandaging'],
  MEDICATION: ['Antibiotics', 'Painkiller', 'Deworming Tablet', 'Flea/Tick Treatment', 'Vitamins / Supplements'],
  SURGERY: ['Spaying', 'Neutering', 'Tumor Removal', 'Orthopedic Surgery'],
  VACCINATION: ['Rabies Vaccine', 'DHLPP Vaccine', 'FVRCP Vaccine', 'Bordetella Vaccine']
};

export default function DoctorPortal({ initialView = null, hideHeader = false, onStartConsultation = null }) {
  const doctorsList = [
    { id: 'DOC-2001', name: 'Dr. Natasha Silva', spec: 'Small Animal Specialist' },
    { id: 'DOC-2002', name: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon' },
    { id: 'DOC-2003', name: 'Dr. Sanduni Perera', spec: 'Feline & Canine Medicine' },
  ];

  // Normalize raw species values: "Feline" → "Cat", "Canine" → "Dog"
  const normalizeSpecies = (species) => {
    if (!species) return 'Pet';
    const s = species.toLowerCase();
    if (s === 'feline' || s === 'cat' || s.includes('feline')) return 'Cat';
    if (s === 'canine' || s === 'dog' || s.includes('canine')) return 'Dog';
    if (s === 'avian' || s === 'bird' || s.includes('avian')) return 'Bird';
    if (s.includes('rabbit')) return 'Rabbit';
    return species.charAt(0).toUpperCase() + species.slice(1);
  };

  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('vhms_user'));
      if (user && user.id) return user.id;
    } catch(e) {}
    return 'DOC-2001';
  });

  const doctorName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('vhms_user'));
      if (user && user.name) return user.name;
    } catch(e) {}
    return 'Dr. Kasun Perera';
  })();

  const doctorId = selectedDoctorId;
  const specialization = 'Veterinary Surgeon';

  const [activeTab, setActiveTab] = useState(initialView || 'new');

  useEffect(() => {
    if (initialView) {
      setActiveTab(initialView);
    }
  }, [initialView]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [agenda, setAgenda] = useState([]);
  const [allAssigned, setAllAssigned] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // Complete modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Add Treatment Charges modal state (US 4.33)
  const [showChargesModal, setShowChargesModal] = useState(false);
  const [chargeAppt, setChargeAppt] = useState(null);
  const [chargeItems, setChargeItems] = useState([
    { description: 'Veterinary Consultation Fee', itemType: 'CONSULTATION', quantity: 1 },
  ]);

  // Patient Reviews Modal state
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [doctorReviews, setDoctorReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const handleOpenReviewsModal = async () => {
    setShowReviewsModal(true);
    setLoadingReviews(true);
    try {
      const res = await feedbackService.getFeedbackByDoctor(doctorId).catch(() => ({ success: false, data: [] }));
      const backendReviews = (res && res.success && res.data) || [];

      const localFeedback = (() => {
        try {
          return JSON.parse(localStorage.getItem('vhms_epic4_feedback') || '[]');
        } catch {
          return [];
        }
      })();

      const matchedLocal = localFeedback.filter(
        (f) =>
          (String(f.doctorId) === String(doctorId) ||
          (doctorName && f.doctorName && f.doctorName.toLowerCase().trim() === doctorName.toLowerCase().trim())) && f.published !== false
      );

      const map = new Map();
      backendReviews.forEach((r) => map.set(r.id || r.appointmentId, r));
      matchedLocal.forEach((r) => map.set(r.id || r.appointmentId, r));

      const merged = Array.from(map.values());
      merged.sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0));
      setDoctorReviews(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
    const interval = setInterval(loadDoctorData, 3000);
    const handleStorage = () => {
      loadDoctorData();
      try {
        const notifs = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
        const latest = notifs[0];
        if (latest && !latest.read && (latest.recipientId === doctorId || latest.recipientId === 'ALL')) {
          showNotification(`🔔 ${latest.title} — ${latest.message}`, 'success');
        }
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [selectedDoctorId, selectedDate, doctorId]);

  const showNotification = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [agendaRes, allRes, workloadRes] = await Promise.all([
        appointmentService.getDoctorDailyAgenda(doctorId, selectedDate),
        appointmentService.getAppointmentsByDoctor(doctorId),
        billingService.getDoctorWorkload(doctorId, doctorName, specialization),
      ]);

      const localList = (() => {
        try { return JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]'); } catch { return []; }
      })();
      const localInvoices = (() => {
        try { return JSON.parse(localStorage.getItem('vhms_epic4_invoices') || '[]'); } catch { return []; }
      })();

      const attachServices = (list) => {
        return list.map((a) => {
          const localMatch = localList.find((l) => l.id === a.id || l.appointmentNumber === a.appointmentNumber);
          const invMatch = localInvoices.find((i) => i.appointmentId === a.id || i.appointmentNumber === a.appointmentNumber);
          const services = (localMatch && localMatch.treatmentServices && localMatch.treatmentServices.length > 0)
            ? localMatch.treatmentServices
            : (invMatch && invMatch.items && invMatch.items.length > 0)
              ? invMatch.items
              : a.treatmentServices || [];
          return {
            ...a,
            treatmentServices: services,
            hasPendingInvoice: localMatch?.hasPendingInvoice || Boolean(services && services.length > 0),
          };
        });
      };

      if (agendaRes && agendaRes.success) {
        setAgenda(attachServices(agendaRes.data || []).map(a => {
          let s = a.status ? a.status.toUpperCase() : 'REQUESTED';
          if (['PENDING', 'WAITING'].includes(s)) s = 'REQUESTED';
          if (['APPROVED', 'ACCEPTED', 'SCHEDULED'].includes(s)) s = 'CONFIRMED';
          if (['DONE'].includes(s)) s = 'COMPLETED';
          return { ...a, status: s };
        }));
      }
      if (allRes && allRes.success) {
        setAllAssigned(attachServices(allRes.data || []).map(a => {
          let s = a.status ? a.status.toUpperCase() : 'REQUESTED';
          if (['PENDING', 'WAITING'].includes(s)) s = 'REQUESTED';
          if (['APPROVED', 'ACCEPTED', 'SCHEDULED'].includes(s)) s = 'CONFIRMED';
          if (['DONE'].includes(s)) s = 'COMPLETED';
          return { ...a, status: s };
        }));
      }
      if (workloadRes && workloadRes.success) setWorkload(workloadRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isFutureDate = (dateStr) => {
    return dateStr && dateStr > todayStr;
  };
  const isPastDate = (dateStr) => {
    return dateStr && dateStr < todayStr;
  };

  const handleMarkExpired = async (appt) => {
    if (window.confirm(`Mark appointment #${appt.appointmentNumber} for ${appt.petName} as EXPIRED?\n\nThis will record that the patient did not attend on ${appt.appointmentDate}.`)) {
      try {
        const res = await appointmentService.markExpired(appt.id);
        if (res && res.success) {
          showNotification(`Appointment #${appt.appointmentNumber} marked as EXPIRED.`, 'success');
          loadDoctorData();
        }
      } catch (err) {
        showNotification('Error marking appointment as expired.', 'error');
      }
    }
  };

  const openCompleteModal = (appt) => {
    if (isFutureDate(appt.appointmentDate)) {
      showNotification(`🔒 Cannot complete consultation before appointment date (${appt.appointmentDate}). Visit is scheduled for the future.`, 'error');
      return;
    }
    if (isPastDate(appt.appointmentDate)) {
      showNotification(`⚠️ Appointment date (${appt.appointmentDate}) has passed. Please mark as Expired (No-Show).`, 'error');
      return;
    }
    setSelectedAppt(appt);
    setDoctorNotes(appt.doctorNotes || '');
    setShowCompleteModal(true);
  };

  // US 4.32: Mark Appointment as Completed
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      const res = await appointmentService.completeAppointment(selectedAppt.id, doctorNotes);
      if (res && res.success) {
        showNotification('Appointment marked as COMPLETED! 🎉', 'success');
        setShowCompleteModal(false);
        setDoctorNotes('');
        loadDoctorData();
      }
    } catch (e) {
      showNotification('Error completing appointment.', 'error');
    }
  };

  // US 4.33: Add Treatment Services (Doctor enters service names & quantities without price -> sends to Admin)
  const openChargesModal = (appt) => {
    if (appt.status !== 'COMPLETED' && isFutureDate(appt.appointmentDate)) {
      showNotification(`🔒 Cannot record treatment services before appointment date (${appt.appointmentDate}). Patient has not arrived yet.`, 'error');
      return;
    }
    if (appt.status !== 'COMPLETED' && isPastDate(appt.appointmentDate)) {
      showNotification(`⚠️ Appointment date (${appt.appointmentDate}) has passed. Please mark as Expired (No-Show).`, 'error');
      return;
    }

    // Retrieve saved services from appointment, local storage or invoice
    let savedServices = appt.treatmentServices;
    if (!savedServices || savedServices.length === 0) {
      try {
        const localList = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
        const localMatch = localList.find((l) => l.id === appt.id || l.appointmentNumber === appt.appointmentNumber);
        if (localMatch && localMatch.treatmentServices && localMatch.treatmentServices.length > 0) {
          savedServices = localMatch.treatmentServices;
        }
      } catch (e) {}
    }
    if (!savedServices || savedServices.length === 0) {
      try {
        const localInvoices = JSON.parse(localStorage.getItem('vhms_epic4_invoices') || '[]');
        const invMatch = localInvoices.find((i) => i.appointmentId === appt.id || i.appointmentNumber === appt.appointmentNumber);
        if (invMatch && invMatch.items && invMatch.items.length > 0) {
          savedServices = invMatch.items.map((it) => ({
            description: it.description,
            itemType: it.itemType || 'PROCEDURE',
            quantity: it.quantity || 1
          }));
        }
      } catch (e) {}
    }

    setChargeAppt(appt);
    setChargeItems(
      savedServices && savedServices.length > 0
        ? savedServices
        : [
            { description: SERVICES_MAP['CONSULTATION'][0], itemType: 'CONSULTATION', quantity: 1 },
          ]
    );
    setShowChargesModal(true);
  };

  const addChargeRow = () => {
    setChargeItems([...chargeItems, { description: SERVICES_MAP['PROCEDURE'][0], itemType: 'PROCEDURE', quantity: 1 }]);
  };

  const removeChargeRow = (index) => {
    setChargeItems(chargeItems.filter((_, i) => i !== index));
  };

  const updateChargeItem = (index, field, value) => {
    const updated = [...chargeItems];
    updated[index][field] = value;
    if (field === 'itemType') {
      updated[index]['description'] = SERVICES_MAP[value][0];
    }
    setChargeItems(updated);
  };

  const handleSaveDoctorCharges = async (e) => {
    e.preventDefault();
    if (chargeAppt && (chargeAppt.status === 'COMPLETED' || chargeAppt.isBilled || chargeAppt.invoiceId)) {
      setShowChargesModal(false);
      return;
    }
    try {
      // Save treatment services on the appointment in local storage & update status
      const list = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
      let appt = list.find((a) => a.id === chargeAppt.id || a.appointmentNumber === chargeAppt.appointmentNumber);
      if (!appt) {
        appt = { id: chargeAppt.id, appointmentNumber: chargeAppt.appointmentNumber };
        list.push(appt);
      }
      appt.treatmentServices = chargeItems;
      appt.servicesSubmittedAt = new Date().toISOString();
      appt.hasPendingInvoice = true;
      localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));

      // Add notification for Admin to price and generate invoice
      const notifs = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
      notifs.unshift({
        id: 'notif-adm-' + Date.now(),
        recipientId: 'ADMIN-001',
        title: '📋 Treatment Services Submitted for Pricing & Invoicing',
        message: `${doctorName} recorded ${chargeItems.length} service(s) for ${chargeAppt.petName} (${chargeAppt.appointmentNumber}). Please price and issue the official invoice.`,
        read: false,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem('vhms_epic4_notifications', JSON.stringify(notifs));
      window.dispatchEvent(new Event('storage'));

      showNotification(`📋 ${chargeItems.length} service(s) sent to Admin for pricing & invoicing!`, 'success');
      setShowChargesModal(false);
      loadDoctorData();
    } catch (err) {
      showNotification('Error recording services.', 'error');
    }
  };

  return (
    <div className="epic-container" style={hideHeader ? { padding: 0, minHeight: 'auto', background: 'transparent' } : {}}>
      {/* Toast Alert */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            padding: '0.85rem 1.5rem',
            borderRadius: '10px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
            zIndex: 9999,
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      {!hideHeader && (
      <div className="epic-header">
        <div className="epic-title-group">
          <h1>🩺 Veterinarian Portal</h1>
          <p>{doctorName} &mdash; {specialization} | Daily agenda, consultations, and workload stats.</p>
        </div>
        <div className="epic-actions-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>👨‍⚕️ Active Doctor:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              style={{
                padding: '0.4rem 0.7rem',
                borderRadius: '6px',
                border: '1px solid #94a3b8',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {doctorsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.spec})
                </option>
              ))}
            </select>
          </div>
          <NotificationBell recipientId={doctorId} />
        </div>
      </div>
      )}


      {/* Stats Cards (US 4.34 Workload) */}
      {!hideHeader && workload && (
        <div className="epic-stats-grid">
          <div className="epic-stat-card">
            <div className="stat-icon blue">📋</div>
            <div className="stat-content">
              <h3>Total Assigned</h3>
              <div className="stat-value">{workload.totalAssignedAppointments}</div>
            </div>
          </div>
          <div className="epic-stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Completed</h3>
              <div className="stat-value">{workload.completedAppointments}</div>
            </div>
          </div>
          <div className="epic-stat-card">
            <div className="stat-icon yellow">⏳</div>
            <div className="stat-content">
              <h3>Pending / Today</h3>
              <div className="stat-value">{workload.pendingTodayAppointments ?? workload.pendingAppointments ?? 0}</div>
            </div>
          </div>
          <div
            className="epic-stat-card"
            onClick={handleOpenReviewsModal}
            title="Click to view patient reviews & feedback"
            style={{
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="stat-icon purple">⭐</div>
            <div className="stat-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Avg Rating</h3>
                <span style={{ fontSize: '0.7rem', color: '#7c3aed', background: '#ede9fe', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                  Reviews ↗
                </span>
              </div>
              {workload.averageRating !== null && workload.averageRating !== undefined ? (
                <div className="stat-value">
                  {workload.averageRating} / 5.0
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500', marginTop: '0.15rem' }}>
                    from {workload.totalReviewsCount} review{workload.totalReviewsCount !== 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="stat-value" style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
                  N/A
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '500', marginTop: '0.15rem' }}>
                    No reviews yet
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="epic-tabs">
        <button
          className={`epic-tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
          style={{ position: 'relative' }}
        >
          🔔 New / Upcoming Appointments ({allAssigned.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING').length})
          {allAssigned.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING').length > 0 && (
            <span style={{
              marginLeft: '0.45rem',
              background: '#2563eb',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: '800',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
            }}>
              Active
            </span>
          )}
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'agenda' ? 'active' : ''}`}
          onClick={() => setActiveTab('agenda')}
        >
          📅 Daily Schedule & Agenda ({agenda.length})
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📋 Full Consultation History ({allAssigned.length})
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'workload' ? 'active' : ''}`}
          onClick={() => setActiveTab('workload')}
        >
          📊 Workload Report
        </button>
      </div>

      {/* TAB 0: NEW & UPCOMING APPOINTMENTS */}
      {activeTab === 'new' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <div>
              <h2>🔔 Newly Assigned & Upcoming Consultations</h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                All active appointments confirmed by administration, sorted for your upcoming schedule.
              </p>
            </div>
            <span style={{ fontSize: '0.85rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: '600' }}>
              {allAssigned.filter((a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED' || a.status === 'IN_PROGRESS').length} Active Appointments
            </span>
          </div>

          {allAssigned.filter((a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED' || a.status === 'IN_PROGRESS').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '1rem', color: '#475569' }}>No pending or newly assigned appointments.</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>When Admin approves appointments assigned to you, they will appear here instantly.</p>
            </div>
          ) : (
            <div className="epic-table-wrapper">
              <table className="epic-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Patient / Pet</th>
                    <th>Owner Contact</th>
                    <th>Date & Time Slot</th>
                    <th>Reason / Symptoms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allAssigned
                    .filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING')
                    .sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''))
                    .map((a) => (
                      <tr key={a.id} style={{ background: a.appointmentDate === todayStr ? '#f0fdf4' : 'inherit' }}>
                        <td>
                          <strong>{a.appointmentNumber}</strong>
                          {a.appointmentDate === todayStr && (
                            <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '800' }}>TODAY'S VISIT</div>
                          )}
                        </td>
                        <td>
                          <PetCell petName={a.petName} species={a.petSpecies} />
                        </td>
                        <td>
                          <div>{a.ownerName}</div>
                          <small style={{ color: '#64748b' }}>📞 {a.ownerPhone}</small>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>📅 {a.appointmentDate}</div>
                          <small style={{ color: '#0284c7', fontWeight: '600' }}>⏰ {a.timeSlot}</small>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{a.appointmentType?.replace('_', ' ')}</div>
                          <small style={{ color: '#64748b' }}>{a.reasonForVisit || a.symptoms || 'General Checkup'}</small>
                        </td>
                        <td>
                          <span className={`status-pill ${a.status?.toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          {a.status === 'CANCELLED' || a.status === 'REJECTED' ? (
                            <span style={{
                              color: '#dc2626',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#fef2f2',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              whiteSpace: 'nowrap',
                            }}>
                              🚫 {a.status === 'CANCELLED' ? 'Cancelled' : 'Declined'}
                            </span>
                          ) : a.status === 'EXPIRED' || a.status === 'NO_SHOW' ? (
                            <span style={{
                              color: '#dc2626',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#fef2f2',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              whiteSpace: 'nowrap',
                            }}>
                              ⌛ Expired (No-Show)
                            </span>
                          ) : a.status !== 'COMPLETED' ? (
                            isFutureDate(a.appointmentDate) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <button
                                  type="button"
                                  disabled
                                  className="btn-sm-action"
                                  style={{
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    border: '1px solid #cbd5e1',
                                    cursor: 'not-allowed',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={`Treatments open on ${a.appointmentDate}`}
                                >
                                  🔒 Scheduled ({a.appointmentDate})
                                </button>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                  Treatments open on visit day
                                </span>
                              </div>
                            ) : isPastDate(a.appointmentDate) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <button
                                  className="btn-sm-action"
                                  style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontSize: '0.78rem', fontWeight: '700' }}
                                  onClick={() => handleMarkExpired(a)}
                                  title="Mark appointment as expired because the scheduled date has passed"
                                >
                                  ⌛ Mark Expired
                                </button>
                                <span style={{ fontSize: '0.7rem', color: '#e11d48', fontStyle: 'italic' }}>
                                  ⚠️ Visit date has passed
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                                <button
                                  className="btn-sm-action btn-reassign"
                                  style={{ background: '#0284c7', color: '#fff' }}
                                  onClick={() => openChargesModal(a)}
                                >
                                  🩺 + Treatment Services
                                </button>
                                <button
                                  className="btn-sm-action btn-approve"
                                  onClick={() => {
                                      if (onStartConsultation) {
                                          onStartConsultation(a.id || a.appointmentId || a.appointmentNumber);
                                      } else {
                                          openCompleteModal(a);
                                      }
                                  }}
                                >
                                  {a.status === 'IN_PROGRESS' ? '▶ Resume Consultation' : '▶ Start Consultation'}
                                </button>
                              </div>
                            )
                          ) : (
                            <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                              <span style={{
                                color: '#059669',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.3rem',
                                background: '#ecfdf5',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #a7f3d0',
                                whiteSpace: 'nowrap',
                              }}>
                                ✓ Finished
                              </span>
                              <button
                                className="btn-sm-action btn-reassign"
                                style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}
                                onClick={() => openChargesModal(a)}
                              >
                                👁️ View Services
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: DAILY AGENDA (US 4.28, US 4.29) */}
      {activeTab === 'agenda' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>📅 Workday Schedule</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Select Date:</label>
              <input
                type="date"
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #3b82f6',
                  background: selectedDate === new Date().toISOString().split('T')[0] ? '#3b82f6' : '#eff6ff',
                  color: selectedDate === new Date().toISOString().split('T')[0] ? '#fff' : '#3b82f6',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                📅 Today
              </button>
            </div>
          </div>

          {agenda.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: '#64748b' }}>
                No appointments scheduled for this day
              </p>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                {selectedDate}
              </p>
              {allAssigned.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && a.status !== 'EXPIRED' && a.appointmentDate !== selectedDate).length > 0 && (
                <div style={{ marginTop: '1.25rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '1rem', display: 'inline-block' }}>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.65rem', fontWeight: '500' }}>
                    💡 You have confirmed consultations scheduled on other dates:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {Array.from(new Set(allAssigned.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && a.status !== 'EXPIRED' && a.appointmentDate !== selectedDate).map((a) => a.appointmentDate))).map((date) => {
                      const count = allAssigned.filter((a) => a.appointmentDate === date && a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && a.status !== 'EXPIRED').length;
                      return (
                        <button
                          key={date}
                          type="button"
                          className="btn-sm-action btn-reassign"
                          style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', cursor: 'pointer', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px' }}
                          onClick={() => setSelectedDate(date)}
                        >
                          📅 View {date} ({count} consultation{count > 1 ? 's' : ''})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="epic-table-wrapper">
              <table className="epic-table">
                <thead>
                  <tr>
                    <th>Time Slot</th>
                    <th>Ref #</th>
                    <th>Patient / Pet</th>
                    <th>Owner Contact</th>
                    <th>Type / Symptoms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agenda.map((a) => (
                    <tr key={a.id}>
                      <td><strong>⏰ {a.timeSlot}</strong></td>
                      <td><strong>{a.appointmentNumber}</strong></td>
                      <td>
                        <PetCell petName={a.petName} species={a.petSpecies} />
                      </td>
                      <td>
                        <div>{a.ownerName}</div>
                        <small style={{ color: '#64748b' }}>{a.ownerPhone}</small>
                      </td>
                      <td>
                        <div>{a.appointmentType?.replace('_', ' ')}</div>
                        <small style={{ color: '#64748b' }}>{a.reasonForVisit || a.symptoms || 'General'}</small>
                      </td>
                      <td>
                        <span className={`status-pill ${a.status?.toLowerCase()}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        {a.status === 'CANCELLED' || a.status === 'REJECTED' ? (
                          <span style={{
                            color: '#dc2626',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fef2f2',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            whiteSpace: 'nowrap',
                          }}>
                            🚫 {a.status === 'CANCELLED' ? 'Cancelled' : 'Declined'}
                          </span>
                        ) : a.status === 'EXPIRED' || a.status === 'NO_SHOW' ? (
                          <span style={{
                            color: '#dc2626',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fef2f2',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            whiteSpace: 'nowrap',
                          }}>
                            ⌛ Expired (No-Show)
                          </span>
                        ) : a.status !== 'COMPLETED' ? (
                          isFutureDate(a.appointmentDate) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span style={{
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                color: '#475569',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                padding: '0.3rem 0.55rem',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                whiteSpace: 'nowrap'
                              }}>
                                🔒 Future Date
                              </span>
                              <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                Unlocks on {a.appointmentDate}
                              </small>
                            </div>
                          ) : isPastDate(a.appointmentDate) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <button
                                className="btn-sm-action"
                                style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontSize: '0.78rem', fontWeight: '700' }}
                                onClick={() => handleMarkExpired(a)}
                                title="Mark appointment as expired because the scheduled date has passed"
                              >
                                ⌛ Mark Expired
                              </button>
                              <span style={{ fontSize: '0.7rem', color: '#e11d48', fontStyle: 'italic' }}>
                                ⚠️ Visit date has passed
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                              <button
                                className="btn-sm-action btn-reassign"
                                style={{ background: '#0284c7', color: '#fff' }}
                                onClick={() => openChargesModal(a)}
                              >
                                🩺 + Treatment Services
                              </button>
                              <button
                                className="btn-sm-action btn-approve"
                                onClick={() => openCompleteModal(a)}
                              >
                                ✓ Complete Consultation
                              </button>
                            </div>
                          )
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                            <span style={{
                              color: '#059669',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.3rem',
                              background: '#ecfdf5',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #a7f3d0',
                              whiteSpace: 'nowrap',
                            }}>
                              ✓ Finished
                            </span>
                            <button
                              className="btn-sm-action btn-reassign"
                              style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}
                              onClick={() => openChargesModal(a)}
                            >
                              👁️ View Services
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL ASSIGNED (US 4.28) */}
      {activeTab === 'all' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>📋 Full Patient Consultation History</h2>
          </div>

          <div className="epic-table-wrapper">
            <table className="epic-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Patient</th>
                  <th>Owner</th>
                  <th>Date & Slot</th>
                  <th>Status</th>
                  <th>Doctor Clinical Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allAssigned.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.appointmentNumber}</strong></td>
                    <td>
                      <PetCell petName={a.petName} species={a.petSpecies} />
                    </td>
                    <td>{a.ownerName}</td>
                    <td>
                      <strong>{a.appointmentDate}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.timeSlot}</div>
                    </td>
                    <td>
                      <span className={`status-pill ${a.status?.toLowerCase()}`}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <small style={{ color: (a.status === 'EXPIRED' || a.status === 'NO_SHOW') ? '#dc2626' : '#475569' }}>
                        {a.doctorNotes || ((a.status === 'EXPIRED' || a.status === 'NO_SHOW') ? 'Patient did not attend on scheduled date' : 'No notes added')}
                      </small>
                    </td>
                    <td>
                      {a.status === 'CANCELLED' || a.status === 'REJECTED' ? (
                        <span style={{
                          color: '#dc2626',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          whiteSpace: 'nowrap',
                        }}>
                          🚫 {a.status === 'CANCELLED' ? 'Cancelled' : 'Declined'}
                        </span>
                      ) : a.status === 'EXPIRED' || a.status === 'NO_SHOW' ? (
                        <span style={{
                          color: '#dc2626',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          whiteSpace: 'nowrap',
                        }}>
                          ⌛ Expired
                        </span>
                      ) : a.status !== 'COMPLETED' ? (
                        isFutureDate(a.appointmentDate) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              color: '#475569',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              padding: '0.3rem 0.55rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              whiteSpace: 'nowrap'
                            }}>
                              🔒 Scheduled ({a.appointmentDate})
                            </span>
                            <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Treatments open on visit day
                            </small>
                          </div>
                        ) : isPastDate(a.appointmentDate) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <button
                              className="btn-sm-action"
                              style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontSize: '0.78rem', fontWeight: '700' }}
                              onClick={() => handleMarkExpired(a)}
                              title="Mark appointment as expired because the scheduled date has passed"
                            >
                              ⌛ Mark Expired
                            </button>
                            <span style={{ fontSize: '0.7rem', color: '#e11d48', fontStyle: 'italic' }}>
                              ⚠️ Visit date has passed
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                            <button
                              className="btn-sm-action btn-reassign"
                              style={{ background: '#0284c7', color: '#fff', fontSize: '0.8rem' }}
                              onClick={() => openChargesModal(a)}
                            >
                              🩺 Add Treatment
                            </button>
                            <button
                              className="btn-sm-action btn-approve"
                              style={{ fontSize: '0.8rem' }}
                              onClick={() => openCompleteModal(a)}
                            >
                              ✓ Mark Complete
                            </button>
                          </div>
                        )
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                          <span style={{
                            color: '#059669',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ecfdf5',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #a7f3d0',
                            whiteSpace: 'nowrap',
                          }}>
                            ✓ Finished
                          </span>
                          <button
                            className="btn-sm-action btn-reassign"
                            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            onClick={() => openChargesModal(a)}
                          >
                            👁️ View Services
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WORKLOAD REPORT (US 4.34) */}
      {activeTab === 'workload' && (() => {
        const total = allAssigned.length;
        const completed = allAssigned.filter(a => a.status === 'COMPLETED').length;
        const confirmed = allAssigned.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING').length;
        const cancelled = allAssigned.filter(a => a.status === 'CANCELLED' || a.status === 'REJECTED').length;
        const expired = allAssigned.filter(a => a.status === 'EXPIRED' || a.status === 'NO_SHOW').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const typeCount = {};
        allAssigned.forEach(a => { const t = a.appointmentType || 'OTHER'; typeCount[t] = (typeCount[t] || 0) + 1; });
        const monthMap = {};
        allAssigned.forEach(a => {
          if (!a.appointmentDate) return;
          const m = a.appointmentDate.substring(0, 7);
          if (!monthMap[m]) monthMap[m] = { total: 0, completed: 0, cancelled: 0, expired: 0 };
          monthMap[m].total++;
          if (a.status === 'COMPLETED') monthMap[m].completed++;
          if (a.status === 'CANCELLED' || a.status === 'REJECTED') monthMap[m].cancelled++;
          if (a.status === 'EXPIRED' || a.status === 'NO_SHOW') monthMap[m].expired++;
        });
        const months = Object.keys(monthMap).sort().reverse();
        return (
          <div className="epic-card print-report-container">
            <div className="epic-card-header no-print">
              <div>
                <h2>📊 Appointment Workload Report</h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Monitor your appointment workload, completion performance, and monthly trends.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', background: '#f0fdf4', color: '#16a34a', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: '600' }}>{total} Total Appointments</span>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: '#1d4ed8', color: '#fff',
                    border: 'none', borderRadius: '8px',
                    padding: '0.45rem 0.9rem',
                    fontWeight: '700', fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  🖨️ Print / Export Report
                </button>
              </div>
            </div>

            {/* Hospital Letterhead - Print Only */}
            <div className="print-only" style={{ display: 'none', marginBottom: '1.25rem', paddingBottom: '0.85rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: '68px', height: '68px', borderRadius: '50%',
                    border: '3px solid #5682b1', padding: '2px',
                    background: '#fff', flexShrink: 0, boxSizing: 'border-box', overflow: 'hidden'
                  }}>
                    <img src="/dog_and_cat.jpg" alt="Hospital Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.25' }}>
                      Sri Jayawardenapura<br />Animal Hospital
                    </h3>
                    <div style={{ margin: '0.3rem 0', fontSize: '0.78rem', color: '#64748b', lineHeight: '1.35' }}>
                      No. 34, Parliament Road, Perakumba Mawatha, Ethul Kotte,<br />Sri Jayawardenepura Kotte
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.7rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '700' }}>
                      Hotline: 0112 888 291
                    </div>
                  </div>
                </div>
                <div style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  padding: '0.85rem 1.3rem', borderRadius: '12px',
                  textAlign: 'left', minWidth: '175px', flexShrink: 0
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2563eb', letterSpacing: '0.04em', textTransform: 'uppercase' }}>WORKLOAD REPORT</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0.15rem 0' }}>{doctorName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>{specialization}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>Generated: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            {/* Completion Rate */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151' }}>Overall Completion Rate</span>
                <span style={{ fontWeight: '800', fontSize: '1.1rem', color: completionRate >= 70 ? '#16a34a' : completionRate >= 40 ? '#d97706' : '#dc2626' }}>{completionRate}%</span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${completionRate}%`, height: '100%', borderRadius: '999px', background: completionRate >= 70 ? '#16a34a' : completionRate >= 40 ? '#d97706' : '#dc2626', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>{completed} completed out of {total} total appointments</div>
            </div>
            {/* Status Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Completed', count: completed, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅' },
                { label: 'Active / Upcoming', count: confirmed, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '📅' },
                { label: 'Cancelled / Rejected', count: cancelled, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🚫' },
                { label: 'Expired / No-Show', count: expired, color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⌛' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                  <div style={{ fontWeight: '800', fontSize: '1.4rem', color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{total > 0 ? Math.round((s.count / total) * 100) : 0}% of total</div>
                </div>
              ))}
            </div>
            {/* Appointment Type Breakdown */}
            {Object.keys(typeCount).length > 0 && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151', marginBottom: '0.85rem' }}>📋 Appointment Type Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ minWidth: '130px', fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>{type.replace('_', ' ')}</div>
                      <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((count / total) * 100)}%`, height: '100%', background: '#6366f1', borderRadius: '999px' }} />
                      </div>
                      <div style={{ minWidth: '60px', textAlign: 'right', fontSize: '0.82rem', fontWeight: '700', color: '#6366f1' }}>{count} ({Math.round((count / total) * 100)}%)</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Month-wise Table */}
            {months.length > 0 && (
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#374151', marginBottom: '0.75rem' }}>📆 Month-wise Performance</div>
                <div className="epic-table-wrapper">
                  <table className="epic-table">
                    <thead>
                      <tr>
                        <th>Month</th><th>Total</th><th>Completed</th><th>Cancelled</th><th>Expired</th><th>Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {months.map(m => {
                        const d = monthMap[m];
                        const rate = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
                        return (
                          <tr key={m}>
                            <td><strong>{m}</strong></td>
                            <td>{d.total}</td>
                            <td style={{ color: '#16a34a', fontWeight: '700' }}>{d.completed}</td>
                            <td style={{ color: '#dc2626', fontWeight: '700' }}>{d.cancelled}</td>
                            <td style={{ color: '#d97706', fontWeight: '700' }}>{d.expired}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '999px', height: '6px', minWidth: '60px' }}>
                                  <div style={{ width: `${rate}%`, height: '100%', background: rate >= 70 ? '#16a34a' : rate >= 40 ? '#d97706' : '#dc2626', borderRadius: '999px' }} />
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '0.82rem', color: rate >= 70 ? '#16a34a' : rate >= 40 ? '#d97706' : '#dc2626' }}>{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {total === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                <p style={{ margin: 0, fontWeight: '600', color: '#475569' }}>No appointment data available yet.</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Workload statistics will appear once appointments are assigned to you.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* MODAL 1: COMPLETE APPOINTMENT (US 4.31) */}
      {showCompleteModal && selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✅ Complete Consultation #{selectedAppt.appointmentNumber}</h2>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCompleteSubmit}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div>Patient: <strong>{selectedAppt.petName}</strong> ({normalizeSpecies(selectedAppt.petSpecies)})</div>
                <div>Owner: <strong>{selectedAppt.ownerName}</strong> ({selectedAppt.ownerPhone})</div>
                <div>Reason: <em>{selectedAppt.reasonForVisit || 'Regular visit'}</em></div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Doctor's Clinical Notes & Follow-up Instructions
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="e.g. Administered rabies booster. Heart and lungs clear. Recommended dental cleaning in 6 months."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Confirm Completion
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD TREATMENT SERVICES (Doctor adds services without price -> Admin prices them) */}
      {showChargesModal && chargeAppt && (() => {
        const isReadOnlyServices = chargeAppt.status === 'COMPLETED' || chargeAppt.isBilled || Boolean(chargeAppt.invoiceId);
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }}>
              <div className="modal-header">
                <h2>📋 {isReadOnlyServices ? `Treatment Services for ${chargeAppt.petName} (View Only)` : `Record Treatment Services for ${chargeAppt.petName}`}</h2>
                <button className="modal-close" onClick={() => setShowChargesModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSaveDoctorCharges}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1.1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>Patient: <strong>🐾 {chargeAppt.petName}</strong> ({normalizeSpecies(chargeAppt.petSpecies)}) &bull; Owner: <strong>{chargeAppt.ownerName}</strong></span>
                    <span style={{ color: '#0369a1' }}>Attending Doctor: <strong>🩺 {chargeAppt.doctorName || doctorName}</strong></span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Appointment Ref: <strong>{chargeAppt.appointmentNumber}</strong> &bull; {chargeAppt.appointmentDate} ({chargeAppt.timeSlot})
                  </div>
                </div>

                {isReadOnlyServices ? (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#166534',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    🔒 Consultation Completed & Invoiced: Treatment services have been finalized and processed for billing. This record is locked in read-only view.
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.4' }}>
                    Enter the medical services, medications, or procedures performed during this visit. The <strong>Admin will assign unit prices, compute totals, and dispatch the official invoice</strong> to the pet owner.
                  </p>
                )}

                {/* Column Titles */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isReadOnlyServices ? 'minmax(140px, 1.5fr) minmax(200px, 2.5fr) 80px' : 'minmax(160px, 1.5fr) minmax(200px, 2.2fr) 75px 38px',
                  gap: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '0.4rem',
                  padding: '0 0.2rem'
                }}>
                  <div>Category</div>
                  <div>Service / Medication Name</div>
                  <div style={{ textAlign: 'center' }}>Qty</div>
                  {!isReadOnlyServices && <div style={{ textAlign: 'center' }}></div>}
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.25rem' }}>
                  {chargeItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isReadOnlyServices ? 'minmax(140px, 1.5fr) minmax(200px, 2.5fr) 80px' : 'minmax(160px, 1.5fr) minmax(200px, 2.2fr) 75px 38px',
                        gap: '0.6rem',
                        alignItems: 'center',
                        marginBottom: '0.6rem',
                        background: isReadOnlyServices ? '#f8fafc' : 'transparent',
                        padding: isReadOnlyServices ? '0.5rem 0.75rem' : '0',
                        borderRadius: '6px',
                        border: isReadOnlyServices ? '1px solid #e2e8f0' : 'none'
                      }}
                    >
                      {isReadOnlyServices ? (
                        <>
                          <div style={{ fontWeight: '600', color: '#0369a1' }}>{item.itemType}</div>
                          <div style={{ color: '#1e293b' }}>{item.description}</div>
                          <div style={{ textAlign: 'center', fontWeight: '700', color: '#475569' }}>Qty: {item.quantity}</div>
                        </>
                      ) : (
                        <>
                          <select
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                            value={item.itemType}
                            onChange={(e) => updateChargeItem(idx, 'itemType', e.target.value)}
                          >
                            <option value="CONSULTATION">Consultation</option>
                            <option value="PROCEDURE">Procedure / Treatment</option>
                            <option value="MEDICATION">Medication / Prescription</option>
                            <option value="SURGERY">Surgery / Operation</option>
                            <option value="VACCINATION">Vaccination</option>
                          </select>
                          <select
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                            value={item.description}
                            onChange={(e) => updateChargeItem(idx, 'description', e.target.value)}
                          >
                            {SERVICES_MAP[item.itemType] && SERVICES_MAP[item.itemType].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            {item.description && (!SERVICES_MAP[item.itemType] || !SERVICES_MAP[item.itemType].includes(item.description)) && (
                              <option key={item.description} value={item.description}>{item.description}</option>
                            )}
                          </select>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="Qty"
                            style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                            value={item.quantity}
                            onChange={(e) => updateChargeItem(idx, 'quantity', Number(e.target.value))}
                          />
                          <button
                            type="button"
                            style={{
                              width: '38px',
                              height: '38px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#fee2e2',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '0.9rem'
                            }}
                            onClick={() => removeChargeRow(idx)}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {isReadOnlyServices ? (
                  <button
                    type="button"
                    className="btn-secondary-epic"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: '700' }}
                    onClick={() => setShowChargesModal(false)}
                  >
                    Close View
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-secondary-epic"
                      style={{ width: '100%', marginBottom: '1.25rem' }}
                      onClick={addChargeRow}
                    >
                      + Add Another Service / Item
                    </button>

                    <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                      🚀 Send Services to Admin for Invoicing
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: PATIENT REVIEWS & FEEDBACK */}
      {showReviewsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
                  <span>⭐</span> Patient Reviews & Feedback
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {doctorName} &mdash; <span style={{ color: '#0ea5e9' }}>{specialization}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowReviewsModal(false)}>✕</button>
            </div>

            {/* Rating Overview Box */}
            <div style={{
              background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid #ddd6fe',
              margin: '1rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#6d28d9', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  {workload?.averageRating !== null && workload?.averageRating !== undefined ? (
                    <>
                      <span>{workload.averageRating}</span>
                      <span style={{ fontSize: '1.05rem', color: '#7c3aed', fontWeight: '600' }}>/ 5.0</span>
                    </>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#5b21b6', fontWeight: '500', marginTop: '0.15rem' }}>
                  {doctorReviews.length} {doctorReviews.length === 1 ? 'review' : 'reviews'} received from pet owners
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', letterSpacing: '2px' }}>
                {workload?.averageRating ? '⭐'.repeat(Math.min(5, Math.max(1, Math.round(workload.averageRating)))) : '⭐'}
              </div>
            </div>

            {/* Reviews List */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem', maxHeight: '400px' }}>
              {loadingReviews ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                  Loading patient reviews...
                </div>
              ) : doctorReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#64748b' }}>No Reviews Yet</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    When pet owners complete consultations and leave feedback, their ratings and comments will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {doctorReviews.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                              {rev.ownerName || 'Pet Owner'}
                            </strong>
                            {rev.petName && (
                              <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '9999px' }}>
                                🐾 {rev.petName}
                              </span>
                            )}
                            {rev.serviceCategory && (
                              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '9999px', fontWeight: '500' }}>
                                {rev.serviceCategory.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : (rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString() : 'Recent')}
                            {rev.appointmentNumber && ` • Ref: ${rev.appointmentNumber}`}
                          </div>
                        </div>

                        {/* Star Rating Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          background: '#fef3c7',
                          color: '#b45309',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}>
                          ⭐ {rev.rating} / 5
                        </div>
                      </div>

                      {/* Comment */}
                      <div style={{
                        background: '#f8fafc',
                        padding: '0.75rem 0.85rem',
                        borderRadius: '8px',
                        borderLeft: '3px solid #8b5cf6',
                        fontSize: '0.88rem',
                        color: '#334155',
                        lineHeight: '1.45',
                        fontStyle: 'italic',
                      }}>
                        "{rev.reviewComments || 'No written comments provided.'}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                type="button"
                className="btn-secondary-epic"
                onClick={() => setShowReviewsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
