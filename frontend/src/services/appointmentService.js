import API_BASE_URL from './apiConfig';
import { doctorScheduleService } from './doctorScheduleService';

// Timeout helper to keep UI snappy even if network or backend is slow
const fetchWithTimeout = async (url, options = {}, timeoutMs = 2500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Helper to generate 30-min time slots between start and end time
function generateStandardSlots(startTime = '11:00', endTime = '14:00', duration = 30) {
  const slots = [];
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  let currentMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  while (currentMinutes + duration <= endMinutes) {
    const nextMinutes = currentMinutes + duration;
    const startHour = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const startMin = String(currentMinutes % 60).padStart(2, '0');
    const endHour = String(Math.floor(nextMinutes / 60)).padStart(2, '0');
    const endMin = String(nextMinutes % 60).padStart(2, '0');

    slots.push({
      timeSlot: `${startHour}:${startMin} - ${endHour}:${endMin}`,
      startTime: `${startHour}:${startMin}`,
      endTime: `${endHour}:${endMin}`,
      available: true,
    });
    currentMinutes = nextMinutes;
  }
  return slots;
}

// Local mock store for instant reactivity
const getLocalAppointments = () => {
  try {
    const epic4 = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
    const legacy = JSON.parse(localStorage.getItem('vhms_user_appointments') || '[]');
    
    const map = new Map();
    // Normalize legacy appointments so they match Epic 4 structure
    legacy.forEach(a => {
        const id = a.id || a.appointmentNumber;
        const statusMap = {
            'APPROVED': 'CONFIRMED',
            'PENDING_APPROVAL': 'REQUESTED'
        };
        let normDate = a.appointmentDate || a.date;
        if (normDate && String(normDate).length > 20) {
            try { normDate = new Date(normDate).toISOString().split('T')[0]; } catch(e) {}
        }
        map.set(id, {
            ...a,
            appointmentNumber: a.appointmentNumber || id,
            appointmentDate: normDate,
            status: statusMap[a.status] || a.status
        });
    });
    
    epic4.forEach(a => {
        const id = a.id || a.appointmentNumber;
        map.set(id, a);
    });
    
    return Array.from(map.values());
  } catch (e) {
    return [];
  }
};

const saveLocalAppointments = (list) => {
  localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));
};

const addLocalNotification = (recipientId, title, message, extra = {}) => {
  try {
    const notes = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
    notes.unshift({
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      recipientId: recipientId || 'USR-5001',
      recipientRole: 'PET_OWNER',
      title,
      message,
      read: false,
      isRead: false,
      sentAt: new Date().toISOString(),
      ...extra,
    });
    localStorage.setItem('vhms_epic4_notifications', JSON.stringify(notes));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('vhms_notifications_changed'));
  } catch (e) {}
};

export const appointmentService = {
  // Create appointment request
  async createAppointment(data) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      console.warn('Backend unavailable or slow, saving locally:', e.message);
    }

    // Local fallback
    const list = getLocalAppointments();
    const isBooked = data.doctorId ? list.some(
      (a) =>
        a.doctorId === data.doctorId &&
        a.appointmentDate === data.appointmentDate &&
        a.timeSlot === data.timeSlot &&
        a.status !== 'CANCELLED' &&
        a.status !== 'REJECTED'
    ) : false;

    if (isBooked) {
      return { success: false, message: 'This slot is already booked for this veterinarian.' };
    }

    const todayStr = (data.appointmentDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const prefix = `APT-${todayStr}-`;
    const existingNums = new Set(list.map((a) => a.appointmentNumber).filter(Boolean));
    let seq = 1;
    while (existingNums.has(`${prefix}${String(seq).padStart(4, '0')}`)) {
      seq++;
    }
    const appointmentNumber = `${prefix}${String(seq).padStart(4, '0')}`;

    const newAppt = {
      id: 'local-apt-' + Date.now(),
      appointmentNumber,
      ...data,
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newAppt);
    saveLocalAppointments(list);

    // Add local notification
    addLocalNotification(
      data.ownerId || 'USR-5001',
      'Appointment Request Submitted',
      `Your request for ${data.petName} on ${data.appointmentDate} (${data.timeSlot}) is pending Admin approval.`
    );
    addLocalNotification(
      'ADMIN-001',
      'New Appointment Request',
      `New appointment request for ${data.petName} by ${data.ownerName} (${data.appointmentDate}, ${data.timeSlot}).`
    );

    return { success: true, data: newAppt };
  },

  // Get all appointments (Admin)
  async getAllAppointments(status = '') {
    try {
      const query = status ? `?status=${status}` : '';
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments${query}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using local store');
    }
    const list = getLocalAppointments();
    const filtered = status ? list.filter((a) => a.status === status) : list;
    return { success: true, data: filtered };
  },

  // Get appointment by ID
  async getAppointmentById(id) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const appt = getLocalAppointments().find((a) => a.id === id);
    return { success: !!appt, data: appt };
  },

  // Get appointments by Owner (Pet Owner)
  async getAppointmentsByOwner(ownerId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/owner/${ownerId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocalAppointments().filter((a) => a.ownerId === ownerId);
    return { success: true, data: list };
  },

  async getAppointmentsByDoctor(doctorId) {
    let allAppts = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments`);
      if (res.ok) {
        const json = await res.json();
        allAppts = json.data && Array.isArray(json.data) ? json.data : [];
      }
    } catch (e) {}
    
    // Merge with local appointments
    const local = getLocalAppointments();
    const map = new Map();
    allAppts.forEach(a => map.set(a.id || a.appointmentNumber, a));
    local.forEach(a => map.set(a.id || a.appointmentNumber, a));
    const mergedList = Array.from(map.values());

    let user = null;
    try { user = JSON.parse(localStorage.getItem('vhms_user')); } catch (e) {}
    
    const filteredList = mergedList.filter((a) => {
        let match = (String(a.doctorId) === String(doctorId));
        if (!match && user) {
            if (String(a.doctorId) === String(user.id) || String(a.doctorId) === String(user.staffId)) match = true;
            if (a.doctorName && user.name && a.doctorName.toLowerCase().includes(user.name.toLowerCase())) match = true;
            if (a.doctorName && user.fullName && a.doctorName.toLowerCase().includes(user.fullName.toLowerCase())) match = true;
        }
        return match && a.status !== 'REQUESTED' && !String(a.doctorName || '').includes('Dr. Smith');
    });
    
    return { success: true, data: filteredList };
  },

  // Get Doctor daily agenda
  async getDoctorDailyAgenda(doctorId, date = '') {
    const queryDate = date || new Date().toISOString().split('T')[0];
    let allAppts = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments`);
      if (res.ok) {
        const json = await res.json();
        allAppts = json.data && Array.isArray(json.data) ? json.data : [];
      }
    } catch (e) {}
    
    // Merge with local appointments
    const local = getLocalAppointments();
    const map = new Map();
    allAppts.forEach(a => map.set(a.id || a.appointmentNumber, a));
    local.forEach(a => map.set(a.id || a.appointmentNumber, a));
    const mergedList = Array.from(map.values());

    let user = null;
    try { user = JSON.parse(localStorage.getItem('vhms_user')); } catch (e) {}
    
    const filteredList = mergedList.filter((a) => {
        let match = (String(a.doctorId) === String(doctorId));
        if (!match && user) {
            if (String(a.doctorId) === String(user.id) || String(a.doctorId) === String(user.staffId)) match = true;
            if (a.doctorName && user.name && a.doctorName.toLowerCase().includes(user.name.toLowerCase())) match = true;
            if (a.doctorName && user.fullName && a.doctorName.toLowerCase().includes(user.fullName.toLowerCase())) match = true;
        }
        return match && a.appointmentDate === queryDate && a.status !== 'REQUESTED' && a.status !== 'CANCELLED' && a.status !== 'REJECTED' && !String(a.doctorName || '').includes('Dr. Smith');
    });
    
    return { success: true, data: filteredList };
  },

  // Approve appointment (Admin)
  async approveAppointment(id) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/approve`, { method: 'PATCH' });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocalAppointments();
    const appt = list.find((a) => a.id === id);
    if (appt) {
      appt.status = 'CONFIRMED';
      saveLocalAppointments(list);
      addLocalNotification(appt.ownerId, 'Appointment Confirmed! ✅', `Your appointment for ${appt.petName} on ${appt.appointmentDate} (${appt.timeSlot}) has been approved.`);
      if (appt.doctorId) {
        addLocalNotification(appt.doctorId, 'New Confirmed Appointment Assigned', `An appointment for ${appt.petName} on ${appt.appointmentDate} (${appt.timeSlot}) has been confirmed and assigned to your schedule.`);
      }
      return { success: true, data: appt };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Reject appointment (Admin)
  async rejectAppointment(id, reason) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocalAppointments();
    const appt = list.find((a) => a.id === id);
    if (appt) {
      appt.status = 'REJECTED';
      appt.rejectionReason = reason;
      saveLocalAppointments(list);
      addLocalNotification(appt.ownerId, 'Appointment Cancelled/Rejected', `Appointment request #${appt.appointmentNumber} could not be confirmed: ${reason}`);
      return { success: true, data: appt };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Reassign doctor (Admin)
  async reassignDoctor(id, data) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocalAppointments();
    const appt = list.find((a) => a.id === id);
    if (appt) {
      appt.previousDoctorName = appt.doctorName;
      appt.doctorId = data.newDoctorId;
      appt.doctorName = data.newDoctorName;
      appt.status = 'CONFIRMED';
      saveLocalAppointments(list);
      addLocalNotification(appt.ownerId, 'Doctor Assigned/Updated', `Your appointment #${appt.appointmentNumber} is assigned to ${data.newDoctorName}.`);
      return { success: true, data: appt };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Reschedule appointment (Admin / Owner)
  async rescheduleAppointment(id, data) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocalAppointments();
    const appt = list.find((a) => a.id === id);
    if (appt) {
      const wasRejected = appt.status === 'REJECTED';
      appt.appointmentDate = data.newAppointmentDate;
      appt.timeSlot = data.newTimeSlot;
      if (data.optionalNewDoctorId) {
        appt.previousDoctorId = appt.doctorId;
        appt.previousDoctorName = appt.doctorName;
        appt.doctorId = data.optionalNewDoctorId;
        if (data.optionalNewDoctorName) {
          appt.doctorName = data.optionalNewDoctorName;
        }
      }
      appt.status = wasRejected ? 'REQUESTED' : 'RESCHEDULED';
      appt.rejectionReason = null;
      if (data.rescheduleReason) {
        appt.adminNotes = (wasRejected ? 'Re-selected: ' : 'Rescheduled: ') + data.rescheduleReason;
      }
      saveLocalAppointments(list);
      addLocalNotification(appt.ownerId, wasRejected ? 'Appointment Resubmitted' : 'Appointment Rescheduled', `Your appointment #${appt.appointmentNumber} is now scheduled for ${data.newAppointmentDate} at ${data.newTimeSlot} with ${appt.doctorName}.`);
      if (appt.doctorId) {
        addLocalNotification(appt.doctorId, `Appointment #${appt.appointmentNumber} Rescheduled`, `Patient ${appt.petName} (${appt.ownerName}) is now rescheduled to ${data.newAppointmentDate} at ${data.newTimeSlot}.`);
      }
      return { success: true, data: appt };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Cancel appointment
  async cancelAppointment(id, reason, cancelledBy = 'ADMIN') {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, cancelledBy }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocalAppointments();
    const appt = list.find((a) => a.id === id);
    if (appt) {
      appt.status = 'CANCELLED';
      appt.cancellationReason = reason;
      appt.cancelledBy = cancelledBy;
      saveLocalAppointments(list);
      addLocalNotification(appt.ownerId, 'Appointment Cancelled', `Your appointment #${appt.appointmentNumber} has been cancelled.`);
      return { success: true, data: appt };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Complete appointment (Doctor)
  async completeAppointment(id, doctorNotes = '') {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorNotes }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getLocalAppointments();
    const appt = list.find((a) => a.id === id);
    if (appt) {
      appt.status = 'COMPLETED';
      appt.doctorNotes = doctorNotes;
      saveLocalAppointments(list);
      addLocalNotification(appt.ownerId, 'Consultation Completed! 🩺', `Doctor consultation for ${appt.petName} is completed.`);
      return { success: true, data: appt };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Mark appointment as EXPIRED / No-show
  // Mark appointment as EXPIRED / No-show (Doctor marks, Admin is notified to decide follow-up)
  async markExpired(id, reason = 'Patient did not attend on scheduled date') {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EXPIRED', reason }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const list = getLocalAppointments();
    const appt = list.find((a) => a.id === id || a.appointmentNumber === id);
    if (appt) {
      appt.status = 'EXPIRED';
      appt.cancellationReason = reason;
      saveLocalAppointments(list);
      // Notify Admin ONLY (fallback)
      addLocalNotification(
        'ADMIN-001',
        '⚠️ Appointment Marked Expired / No-Show',
        `Appointment #${appt.appointmentNumber} for ${appt.petName} was marked as Expired (No-Show) by ${appt.doctorName || 'Doctor'}.`
      );
      return { success: true, data: appt };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Admin notifies Pet Owner to re-book expired appointment
  async notifyOwnerToRebook(id, apptData = null) {
    try {
      const list = getLocalAppointments();
      const localAppt = list.find((a) => a.id === id || a.appointmentNumber === id);
      if (localAppt) {
        localAppt.isRebookAllowed = true;
        saveLocalAppointments(list);
      }
      const allowed = JSON.parse(localStorage.getItem('vhms_epic4_rebook_allowed') || '{}');
      allowed[id] = true;
      if (apptData?.appointmentNumber) allowed[apptData.appointmentNumber] = true;
      localStorage.setItem('vhms_epic4_rebook_allowed', JSON.stringify(allowed));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/notify-rebook`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Local fallback notification
    const list = getLocalAppointments();
    const appt = apptData || list.find((a) => a.id === id || a.appointmentNumber === id);
    if (appt) {
      addLocalNotification(
        appt.ownerId || 'USR-5001',
        'Appointment Expired - Re-booking Available ⌛',
        `Your scheduled appointment #${appt.appointmentNumber} for ${appt.petName} on ${appt.appointmentDate} was marked as expired. Hospital Admin has opened the re-booking option for you. Please visit your Pet Owner Portal to book a new slot if care is needed.`
      );
      return { success: true, message: 'Re-booking notification sent to pet owner' };
    }
    return { success: false, message: 'Appointment not found' };
  },

  // Send manual reminder (Admin)
  async sendReminder(id, apptData = null) {
    let appt = apptData;
    if (!appt) {
      const list = getLocalAppointments();
      appt = list.find((a) => a.id === id || a.appointmentNumber === id);
    }
    const apptNum = appt?.appointmentNumber || id;
    const pet = appt?.petName || 'your pet';
    const date = appt?.appointmentDate || 'scheduled date';
    const time = appt?.timeSlot || 'scheduled time';
    const doc = appt?.doctorName || 'Assigned Veterinarian';
    const ownerId = appt?.ownerId || 'USR-5001';

    // Dispatch local notification for immediate UI bell update
    addLocalNotification(
      ownerId,
      'Upcoming Appointment Reminder 🔔',
      `Reminder: Your appointment (${apptNum}) for ${pet} is scheduled on ${date} at ${time} with ${doc} at Sri Jayawardanapura Animal Hospital.`,
      { referenceType: 'APPOINTMENT', referenceId: appt?.id || id, type: 'APPOINTMENT_REMINDER' }
    );

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}/remind`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}

    return { success: true, message: 'Reminder sent' };
  },

  // Get available slots for doctor & date (US 4.13)
  async getAvailableSlots(doctorId, date) {
    return await doctorScheduleService.getAvailableSlots(doctorId, date);
  },

  // Manage doctor schedules
  async saveDoctorSchedule(scheduleData) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/doctor-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, data: scheduleData };
  },

  async deleteDoctorSchedule(scheduleId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/doctor-schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true };
  },

  async getDoctorSchedules(doctorId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/doctor-schedules/doctor/${doctorId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, data: [] };
  },

  async getAllDoctorSchedules() {
    return await doctorScheduleService.getAllSchedules();
  },
};
