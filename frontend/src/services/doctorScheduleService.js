import API_BASE_URL from './apiConfig';

const fetchWithTimeout = async (url, options = {}, timeout = 3000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const DEFAULT_SCHEDULES = [
  // Dr. Natasha Silva (DOC-2001) - Morning Shift (11:00 - 14:00, 30 mins)
  { id: 'SCH-101', doctorId: 'DOC-2001', doctorName: 'Dr. Natasha Silva', spec: 'Small Animal Specialist', dayOfWeek: 'MONDAY', shiftStartTime: '11:00', shiftEndTime: '14:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-102', doctorId: 'DOC-2001', doctorName: 'Dr. Natasha Silva', spec: 'Small Animal Specialist', dayOfWeek: 'WEDNESDAY', shiftStartTime: '11:00', shiftEndTime: '14:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-103', doctorId: 'DOC-2001', doctorName: 'Dr. Natasha Silva', spec: 'Small Animal Specialist', dayOfWeek: 'FRIDAY', shiftStartTime: '11:00', shiftEndTime: '14:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-104', doctorId: 'DOC-2001', doctorName: 'Dr. Natasha Silva', spec: 'Small Animal Specialist', dayOfWeek: 'SATURDAY', shiftStartTime: '11:00', shiftEndTime: '14:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },

  // Dr. Rohan Fernando (DOC-2002) - Veterinary Surgeon (11:00 - 14:00 Morning & 15:00 - 20:00 Evening)
  { id: 'SCH-201', doctorId: 'DOC-2002', doctorName: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon', dayOfWeek: 'TUESDAY', shiftStartTime: '11:00', shiftEndTime: '14:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-202', doctorId: 'DOC-2002', doctorName: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon', dayOfWeek: 'TUESDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-203', doctorId: 'DOC-2002', doctorName: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon', dayOfWeek: 'THURSDAY', shiftStartTime: '11:00', shiftEndTime: '14:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-204', doctorId: 'DOC-2002', doctorName: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon', dayOfWeek: 'THURSDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-205', doctorId: 'DOC-2002', doctorName: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon', dayOfWeek: 'SATURDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-206', doctorId: 'DOC-2002', doctorName: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon', dayOfWeek: 'SUNDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },

  // Dr. Sanduni Perera (DOC-2003) - Evening Shift (15:00 - 20:00, 30 mins)
  { id: 'SCH-301', doctorId: 'DOC-2003', doctorName: 'Dr. Sanduni Perera', spec: 'Feline & Canine Medicine', dayOfWeek: 'SUNDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-302', doctorId: 'DOC-2003', doctorName: 'Dr. Sanduni Perera', spec: 'Feline & Canine Medicine', dayOfWeek: 'MONDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-303', doctorId: 'DOC-2003', doctorName: 'Dr. Sanduni Perera', spec: 'Feline & Canine Medicine', dayOfWeek: 'WEDNESDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
  { id: 'SCH-304', doctorId: 'DOC-2003', doctorName: 'Dr. Sanduni Perera', spec: 'Feline & Canine Medicine', dayOfWeek: 'FRIDAY', shiftStartTime: '15:00', shiftEndTime: '20:00', slotDurationMinutes: 30, maxCapacityPerSlot: 1, active: true },
];

export const doctorScheduleService = {
  async getAllSchedules() {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/doctor-schedules/all`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, data: DEFAULT_SCHEDULES };
  },

  async getSchedulesByDoctor(doctorId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/doctor-schedules/doctor/${doctorId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const filtered = DEFAULT_SCHEDULES.filter((s) => s.doctorId === doctorId);
    return { success: true, data: filtered };
  },

  async getAvailableSlots(doctorId, date) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/doctor-schedules/slots?doctorId=${doctorId}&date=${date}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          return json;
        }
      }
    } catch (e) {}

    // Roster-aware fallback slot generator
    if (!doctorId || !date) return { success: true, data: [] };

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = days[d.getDay()];

    const matchingSchedules = DEFAULT_SCHEDULES.filter(
      (s) => s.doctorId === doctorId && s.dayOfWeek === dayOfWeek && s.active
    );

    if (!matchingSchedules || matchingSchedules.length === 0) {
      // Doctor is off duty on this day of week!
      return { success: true, data: [] };
    }

    const generatedSlots = [];

    for (const schedule of matchingSchedules) {
      const [startH, startM] = schedule.shiftStartTime.split(':').map(Number);
      const [endH, endM] = schedule.shiftEndTime.split(':').map(Number);
      const duration = schedule.slotDurationMinutes || 30;

      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (currentMinutes + duration <= endMinutes) {
        const sH = Math.floor(currentMinutes / 60);
        const sM = currentMinutes % 60;
        const eH = Math.floor((currentMinutes + duration) / 60);
        const eM = (currentMinutes + duration) % 60;

        const slotStr = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')} - ${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
        generatedSlots.push(slotStr);
        currentMinutes += duration;
      }
    }

    let localAppts = [];
    try {
      localAppts = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
    } catch (e) {}

    const mapped = generatedSlots.map((s) => {
      const isBooked = localAppts.some(
        (a) => a.doctorId === doctorId && a.appointmentDate === date && a.timeSlot === s && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
      );
      return {
        timeSlot: s,
        isAvailable: !isBooked,
        available: !isBooked,
        doctorId,
        date,
      };
    });

    return { success: true, data: mapped };
  },
};
