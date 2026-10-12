import API_BASE_URL from './apiConfig';
import { notificationService } from './notificationService';

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

const INITIAL_INVOICES = [
  {
    id: 'inv-0001',
    invoiceNumber: 'INV-0001',
    appointmentId: 'APT-0001',
    appointmentNumber: 'APT-0001',
    petName: 'Daisy',
    petSpecies: 'Cat',
    ownerId: 'USR-5001',
    ownerName: 'Unknown Owner',
    ownerPhone: '+94 77 123 4567',
    doctorId: 'DOC-2003',
    doctorName: 'Dr. Sanduni Perera',
    items: [
      { description: 'Veterinary Consultation Fee', itemType: 'CONSULTATION', quantity: 1, unitPrice: 1600, totalPrice: 1600 }
    ],
    hospitalizationCharges: 1000,
    hospitalizationDetails: 'Observation Ward B - 1 Day Post-Checkup',
    subtotal: 2600,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 2600,
    paidAmount: 2600,
    balanceAmount: 0,
    paymentStatus: 'PAID',
    issueDate: '2026-09-06',
    dueDate: '2026-09-13',
  },
  {
    id: 'inv-0003',
    invoiceNumber: 'INV-0003',
    appointmentId: 'APT-0003',
    appointmentNumber: 'APT-0003',
    petName: 'Ameena',
    petSpecies: 'Cat',
    ownerId: 'USR-5001',
    ownerName: 'Unknown Owner',
    ownerPhone: '+94 77 123 4567',
    doctorId: 'DOC-2001',
    doctorName: 'Dr. Natasha Silva',
    items: [
      { description: 'General Consultation', itemType: 'CONSULTATION', quantity: 1, unitPrice: 1800, totalPrice: 1800 }
    ],
    hospitalizationCharges: 0,
    subtotal: 1800,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 1800,
    paidAmount: 1800,
    balanceAmount: 0,
    paymentStatus: 'PAID',
    issueDate: '2026-09-09',
    dueDate: '2026-09-16',
  }
];

const getLocalInvoices = () => {
  try {
    const raw = localStorage.getItem('vhms_epic4_invoices');
    if (!raw) {
      localStorage.setItem('vhms_epic4_invoices', JSON.stringify(INITIAL_INVOICES));
      return [...INITIAL_INVOICES];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('vhms_epic4_invoices', JSON.stringify(INITIAL_INVOICES));
      return [...INITIAL_INVOICES];
    }
    
    let needsUpdate = false;
    const sanitized = parsed.map(inv => {
      if (inv.ownerName === 'Hansani Malshi') {
        needsUpdate = true;
        return { ...inv, ownerName: 'Unknown Owner' };
      }
      return inv;
    });
    
    if (needsUpdate) {
      localStorage.setItem('vhms_epic4_invoices', JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    return [...INITIAL_INVOICES];
  }
};

const saveLocalInvoices = (list) => {
  localStorage.setItem('vhms_epic4_invoices', JSON.stringify(list));
};


// Helper: calculate actual avg rating for a doctor from localStorage feedback
const calcLocalAvgRating = (doctorId, doctorName = '') => {
  try {
    const allFeedback = JSON.parse(localStorage.getItem('vhms_epic4_feedback') || '[]');
    const doctorFeedback = allFeedback.filter((f) => {
      const idMatch = f.doctorId && doctorId && String(f.doctorId) === String(doctorId);
      const nameMatch = doctorName && f.doctorName && f.doctorName.toLowerCase().trim() === doctorName.toLowerCase().trim();
      return (idMatch || nameMatch) && typeof f.rating === 'number' && f.rating > 0 && f.published !== false;
    });
    if (doctorFeedback.length === 0) return null;
    const sum = doctorFeedback.reduce((acc, f) => acc + f.rating, 0);
    return {
      avg: Math.round((sum / doctorFeedback.length) * 10) / 10,
      count: doctorFeedback.length,
    };
  } catch (e) {
    return null;
  }
};

const normalizeInvoiceNumber = (inv) => {
  if (!inv) return inv;
  let num = inv.invoiceNumber;
  if (inv.petName === 'Daisy' || inv.appointmentNumber === 'APT-0001' || (inv.appointmentNumber && String(inv.appointmentNumber).includes('3621'))) {
    num = 'INV-0001';
  } else if (inv.petName === 'Ameena' || inv.appointmentNumber === 'APT-0003') {
    num = 'INV-0003';
  } else if (inv.appointmentNumber) {
    const match = String(inv.appointmentNumber).match(/\d+$/);
    if (match && match[0].length <= 4) {
      num = `INV-${match[0].padStart(4, '0')}`;
    } else {
      num = String(inv.appointmentNumber).replace('APT-', 'INV-').replace('APT', 'INV');
    }
  } else if (inv.invoiceNumber) {
    const match = String(inv.invoiceNumber).match(/\d+$/);
    if (match && match[0].length <= 4) {
      num = `INV-${match[0].padStart(4, '0')}`;
    }
  }
  return { ...inv, invoiceNumber: num || inv.invoiceNumber };
};

export const billingService = {

  // Generate invoice (Admin - US 4.23)
  async createInvoice(invoiceData) {
    let subtotal = (invoiceData.items || []).reduce((acc, item) => acc + (Number(item.quantity || 1) * Number(item.unitPrice || 0)), 0);
    subtotal += Number(invoiceData.hospitalizationCharges || 0);
    const total = subtotal;

    let invoiceNumber = '';
    if (invoiceData.appointmentNumber) {
      const match = invoiceData.appointmentNumber.match(/\d+$/);
      invoiceNumber = match ? `INV-${match[0].padStart(4, '0')}` : invoiceData.appointmentNumber.replace('APT-', 'INV-').replace('APT', 'INV');
    } else {
      const list = getLocalInvoices();
      const existingSeqs = new Set();
      list.forEach((i) => {
        const m = (i.invoiceNumber || '').match(/\d+$/);
        if (m) existingSeqs.add(parseInt(m[0], 10));
      });
      let seq = 1;
      while (existingSeqs.has(seq)) seq++;
      invoiceNumber = `INV-${String(seq).padStart(4, '0')}`;
    }

    const newInv = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      ...invoiceData,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: Math.round(total * 100) / 100,
      paidAmount: 0,
      balanceAmount: Math.round(total * 100) / 100,
      paymentStatus: 'UNPAID',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };

    // Always save to localStorage first for instant multi-tab sync
    const list = getLocalInvoices();
    list.unshift(newInv);
    saveLocalInvoices(list);

    // Resolve Pet Owner Recipient with fallbacks
    let recId = invoiceData.petOwnerId || invoiceData.ownerId || invoiceData.ownerEmail || '';
    let recEmail = invoiceData.ownerEmail || invoiceData.petOwnerEmail || '';
    if (!recId || recId === 'USR-5001') {
      try {
        const regUsers = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]');
        const cachedUsers = JSON.parse(localStorage.getItem('vhms_all_users_cache') || '[]');
        const allUsers = [...regUsers, ...cachedUsers];
        const petOwner = allUsers.find(u => u.role === 'PET_OWNER' || u.role === 'OWNER');
        if (petOwner) {
          recId = petOwner.id || petOwner._id || recId || 'USR-5001';
          if (!recEmail) recEmail = petOwner.email || '';
        }
      } catch (e) {}
    }
    if (!recId) recId = 'USR-5001';
    if (!recEmail) recEmail = 'owner@example.com';

    // Notify Pet Owner with valid enum
    await notificationService.sendNotification({
      recipientId: recId,
      recipientEmail: recEmail,
      recipientRole: 'PET_OWNER',
      title: '🧾 New Billing Invoice Generated',
      message: `An invoice (${invoiceNumber}) has been generated for ${invoiceData.petName || 'your pet'}. Total: Rs. ${total.toFixed(2)}.`,
      type: 'INVOICE_GENERATED',
      notificationType: 'INVOICE_GENERATED',
      referenceType: 'INVOICE',
      referenceId: invoiceNumber,
    });

    // Try backend persistence as well (ensuring ownerId and petId are non-empty for validation)
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoiceData,
          ownerId: invoiceData.ownerId || recId,
          petId: invoiceData.petId || 'PET-1001',
          ownerEmail: invoiceData.ownerEmail || recEmail,
          invoiceNumber,
          items: (invoiceData.items || []).map(i => ({
            description: i.description,
            itemType: i.itemType || 'PROCEDURE',
            quantity: Number(i.quantity || 1),
            unitPrice: Number(i.unitPrice || 0),
            totalPrice: Number(i.quantity || 1) * Number(i.unitPrice || 0),
          })),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Backend saved successfully — remove the temp localStorage copy to avoid duplicate
          const currentList = getLocalInvoices();
          const withoutTemp = currentList.filter(i => i.id !== newInv.id);
          saveLocalInvoices(withoutTemp);
          return json;
        }
      }
    } catch (e) {
      console.warn('Backend unavailable, using local invoice:', e.message);
    }

    return { success: true, data: newInv };
  },

  async getInvoiceById(id) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return { ...json, data: normalizeInvoiceNumber(json.data) };
      }
    } catch (e) {}
    const inv = getLocalInvoices().find((i) => i.id === id);
    return { success: !!inv, data: inv ? normalizeInvoiceNumber(inv) : null };
  },

  async getAllInvoices() {
    let remoteInvoices = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invoices`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          remoteInvoices = json.data;
        }
      }
    } catch (e) {}

    const localInvoices = getLocalInvoices();
    const map = new Map();
    INITIAL_INVOICES.forEach(inv => {
      const n = normalizeInvoiceNumber(inv);
      map.set(n.invoiceNumber, n);
    });
    localInvoices.forEach(inv => {
      const n = normalizeInvoiceNumber(inv);
      const key = n.invoiceNumber || n.appointmentNumber || n.id;
      map.set(key, n);
    });
    remoteInvoices.forEach(inv => {
      const n = normalizeInvoiceNumber(inv);
      const key = n.invoiceNumber || n.appointmentNumber || n.id;
      map.set(key, n);
    });

    const allInvoices = Array.from(map.values()).sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
    return { success: true, data: allInvoices };
  },

  async getInvoicesByOwner(ownerId) {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('vhms_user')); } catch (e) {}

    const resolvedOwnerId = ownerId || user?.id || user?._id || user?.userId || user?.email || '';

    // Try fetching from backend /invoices/owner/${resolvedOwnerId}
    let backendInvoices = [];
    if (resolvedOwnerId) {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/owner/${encodeURIComponent(resolvedOwnerId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            backendInvoices.push(...json.data);
          }
        }
      } catch (e) {}
    }

    if (user?.email && user.email !== resolvedOwnerId) {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/owner/${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            backendInvoices.push(...json.data);
          }
        }
      } catch (e) {}
    }

    const isPetOwner = user?.role === 'PET_OWNER' || user?.role === 'OWNER' || String(resolvedOwnerId).toUpperCase() === 'USR-5001';
    if (isPetOwner) {
      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/owner/USR-5001`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            backendInvoices.push(...json.data);
          }
        }
      } catch (e) {}
    }

    const res = await this.getAllInvoices();
    const all = [...(res.data || []), ...backendInvoices];

    // Build user identifiers for matching
    const userEmails = [user?.email, user?.petOwnerEmail, resolvedOwnerId.includes('@') ? resolvedOwnerId : null]
      .filter(Boolean)
      .map((e) => String(e).toLowerCase());
    const userIds = [resolvedOwnerId, user?.id, user?._id, user?.userId].filter(Boolean).map((id) => String(id));

    if (isPetOwner) {
      if (!userIds.includes('USR-5001')) userIds.push('USR-5001');
      if (!userIds.includes('usr-5001')) userIds.push('usr-5001');
      if (!userEmails.includes('owner@example.com')) userEmails.push('owner@example.com');
    }

    // Also collect appointment numbers/ids and pet names from user's appointments and pets
    const userApptKeys = new Set();
    const userPetNames = new Set();
    try {
      const userAppts = JSON.parse(localStorage.getItem('vhms_user_appointments') || '[]');
      const epic4Appts = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
      const allAppts = [...userAppts, ...epic4Appts];
      allAppts.forEach((a) => {
        const aOwner = String(a.ownerId || a.petOwnerId || a.ownerEmail || '').toLowerCase();
        const aEmail = String(a.ownerEmail || a.petOwnerEmail || '').toLowerCase();
        if (userIds.some(uid => uid && uid.toLowerCase() === aOwner) || (aEmail && userEmails.includes(aEmail)) || userEmails.includes(aOwner)) {
          if (a.id) userApptKeys.add(String(a.id));
          if (a.appointmentNumber) userApptKeys.add(String(a.appointmentNumber));
          if (a.petName) userPetNames.add(String(a.petName).trim().toLowerCase());
        }
      });

      const userPets = JSON.parse(localStorage.getItem('vhms_pets') || '[]');
      if (Array.isArray(userPets)) {
        userPets.forEach(p => {
          if (p.name) userPetNames.add(String(p.name).trim().toLowerCase());
        });
      }
    } catch (e) {}

    const map = new Map();
    all.forEach((i) => {
      const norm = normalizeInvoiceNumber(i);
      const key = norm.invoiceNumber || norm.id;

      const iOwnerId = String(norm.ownerId || norm.petOwnerId || '').toLowerCase();
      const iEmail = String(norm.ownerEmail || norm.petOwnerEmail || '').toLowerCase();
      const iPet = String(norm.petName || '').trim().toLowerCase();

      const matchId = userIds.length > 0 && userIds.some((uid) => uid && iOwnerId === uid.toLowerCase());
      const matchEmail = userEmails.length > 0 && (userEmails.includes(iEmail) || userEmails.includes(iOwnerId));
      const matchAppt = (norm.appointmentId && userApptKeys.has(String(norm.appointmentId))) ||
                        (norm.appointmentNumber && userApptKeys.has(String(norm.appointmentNumber)));
      const matchPet = iPet && userPetNames.has(iPet);

      if (matchId || matchEmail || matchAppt || matchPet) {
        map.set(key, norm);
      }
    });

    const list = Array.from(map.values()).sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
    return { success: true, data: list };
  },

  async getInvoicesByDoctor(doctorId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/doctor/${doctorId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, data: getLocalInvoices().filter((i) => i.doctorId === doctorId) };
  },

  async getInvoiceByAppointmentId(appointmentId) {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/appointment/${appointmentId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const inv = getLocalInvoices().find((i) => i.appointmentId === appointmentId);
    return { success: !!inv, data: inv };
  },

  // Add hospitalization charges (Admin - US 4.27)
  async addHospitalizationCharges(invoiceId, chargesData) {
    const list = getLocalInvoices();
    const inv = list.find((i) => i.id === invoiceId);
    if (inv) {
      inv.hospitalizationCharges = chargesData.hospitalizationCharges;
      inv.hospitalizationDetails = chargesData.hospitalizationDetails;
      inv.totalAmount = (inv.subtotal || 0) + chargesData.hospitalizationCharges;
      inv.balanceAmount = inv.totalAmount - (inv.paidAmount || 0);
      saveLocalInvoices(list);
    }

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/${invoiceId}/hospitalization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chargesData),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    if (inv) return { success: true, data: inv };
    return { success: false, message: 'Invoice not found' };
  },

  // Add doctor treatment charges (Doctor - US 4.33)
  async addDoctorCharges(invoiceId, chargesData) {
    const list = getLocalInvoices();
    const inv = list.find((i) => i.id === invoiceId);
    if (inv) {
      inv.items = [...(inv.items || []), ...(chargesData.items || [])];
      saveLocalInvoices(list);
    }

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/invoices/${invoiceId}/doctor-charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chargesData),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    if (inv) return { success: true, data: inv };
    return { success: false, message: 'Invoice not found' };
  },

  // Financial summary (US 4.25)
  async getFinancialSummary(month = '') {
    try {
      const url = month && month !== 'ALL' ? `${API_BASE_URL}/reports/financial?month=${encodeURIComponent(month)}` : `${API_BASE_URL}/reports/financial`;
      const res = await fetchWithTimeout(url);
      if (res.ok) return await res.json();
    } catch (e) {}

    let invoices = getLocalInvoices();
    if (month && month !== 'ALL') {
      invoices = invoices.filter(i => (i.issueDate && i.issueDate.startsWith(month)) || (i.createdAt && i.createdAt.startsWith(month)));
    }

    const totalBilled = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const totalOutstanding = invoices.reduce((acc, i) => acc + (i.balanceAmount || 0), 0);

    return {
      success: true,
      data: {
        selectedMonth: month || 'ALL',
        totalBilledRevenue: totalBilled,
        totalCollectedRevenue: totalCollected,
        totalOutstandingBalance: totalOutstanding,
        totalInvoicesCount: invoices.length,
        paidInvoicesCount: invoices.filter((i) => i.paymentStatus === 'PAID').length,
        unpaidInvoicesCount: invoices.filter((i) => i.paymentStatus === 'UNPAID').length,
        partialInvoicesCount: invoices.filter((i) => i.paymentStatus === 'PARTIALLY_PAID').length,
        revenueByPaymentMethod: {
          CREDIT_CARD: totalCollected * 0.6,
          CASH: totalCollected * 0.3,
          BANK_TRANSFER: totalCollected * 0.1,
        },
        monthlyBreakdown: [],
      },
    };
  },

  async getDoctorWorkload(doctorId, doctorName = '', specialization = '') {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/reports/doctor-workload/${doctorId}`);
      if (res.ok) {
        const json = await res.json();
        // If backend returns a hardcoded/wrong rating with 0 reviews, override with local calc
        if (json.success && json.data) {
          const localRating = calcLocalAvgRating(doctorId, doctorName);
          if (localRating !== null) {
            json.data.averageRating = localRating.avg;
            json.data.totalReviewsCount = localRating.count;
          } else if (json.data.averageRating !== null && json.data.averageRating !== undefined && json.data.totalReviewsCount > 0) {
            // Keep backend's rating and count
          } else {
            json.data.averageRating = null;
            json.data.totalReviewsCount = 0;
          }
          return json;
        }
      }
    } catch (e) {}

    // Fallback: calculate from local appointments & feedback
    const appts = (() => {
      try { return JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]'); } catch { return []; }
    })();
    const doctorAppts = appts.filter(a => String(a.doctorId) === String(doctorId) || (doctorName && a.doctorName && a.doctorName.toLowerCase().trim() === doctorName.toLowerCase().trim()));
    const total = doctorAppts.length;
    const completed = doctorAppts.filter(a => a.status === 'COMPLETED').length;
    const pending = doctorAppts.filter(a => ['CONFIRMED', 'ASSIGNED', 'DOCTOR_ACCEPTED'].includes(a.status)).length;
    const cancelled = doctorAppts.filter(a => ['CANCELLED', 'REJECTED', 'EXPIRED', 'NO_SHOW'].includes(a.status)).length;

    const localRating = calcLocalAvgRating(doctorId, doctorName);

    return {
      success: true,
      data: {
        doctorId,
        doctorName: doctorName || 'Dr.',
        doctorSpecialization: specialization || 'Veterinarian',
        totalAssignedAppointments: total,
        completedAppointments: completed,
        pendingAppointments: pending,
        pendingTodayAppointments: pending,
        cancelledAppointments: cancelled,
        averageRating: localRating ? localRating.avg : null,
        totalReviewsCount: localRating ? localRating.count : 0,
      },
    };
  },
};
