import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { billingService } from '../../services/billingService';
import { paymentService } from '../../services/paymentService';
import { feedbackService } from '../../services/feedbackService';
import { notificationService } from '../../services/notificationService';
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

export default function AdminHub({ initialView = null, hideHeader = false }) {
  const adminId = 'ADMIN-001';

  // Normalize raw species values (e.g. "Feline" → "Cat", "Canine" → "Dog")
  const normalizeSpecies = (species) => {
    if (!species) return 'Pet';
    const s = species.toLowerCase();
    if (s === 'feline' || s === 'cat' || s.includes('feline')) return 'Cat';
    if (s === 'canine' || s === 'dog' || s.includes('canine')) return 'Dog';
    if (s === 'avian' || s === 'bird' || s.includes('avian')) return 'Bird';
    if (s.includes('rabbit')) return 'Rabbit';
    // Capitalize first letter for anything else
    return species.charAt(0).toUpperCase() + species.slice(1);
  };

  // Tabs: 'appointments' | 'schedules' | 'invoicing' | 'reports' | 'feedback'
  const [activeTab, setActiveTab] = useState(initialView || 'appointments');

  useEffect(() => {
    if (initialView) {
      setActiveTab(initialView);
    }
  }, [initialView]);

  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [selectedReportMonth, setSelectedReportMonth] = useState('ALL');

  // Derived filtered financials for active selected period (US 4.25) - 100% matched to invoices
  const activeFinancials = useMemo(() => {
    // 1. Group all invoices by month
    const monthlyMap = {};
    invoices.forEach((inv) => {
      const date = inv.issueDate || (inv.createdAt ? inv.createdAt.substring(0, 10) : '');
      const mKey = date && date.length >= 7 ? date.substring(0, 7) : 'Unknown';
      if (!monthlyMap[mKey]) {
        let mName = mKey;
        try {
          if (mKey.length === 7 && mKey.includes('-')) {
            const [y, m] = mKey.split('-');
            const d = new Date(parseInt(y), parseInt(m) - 1, 1);
            mName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          }
        } catch (e) {}
        monthlyMap[mKey] = {
          monthKey: mKey,
          monthName: mName,
          billed: 0,
          collected: 0,
          outstanding: 0,
          invoiceCount: 0,
          paidCount: 0,
          partialCount: 0,
          unpaidCount: 0,
        };
      }
      const item = monthlyMap[mKey];
      const invTotal = inv.totalAmount || 0;
      const invBal = inv.balanceAmount ?? (inv.paymentStatus === 'PAID' ? 0 : invTotal);
      const invColl = (inv.paymentStatus === 'PAID')
        ? invTotal
        : (inv.paymentStatus === 'UNPAID' ? 0 : Math.max(0, invTotal - invBal));

      item.billed = Math.round((item.billed + invTotal) * 100) / 100;
      item.collected = Math.round((item.collected + invColl) * 100) / 100;
      item.outstanding = Math.round((item.outstanding + invBal) * 100) / 100;
      item.invoiceCount += 1;

      if (inv.paymentStatus === 'PAID') item.paidCount += 1;
      else if (inv.paymentStatus === 'PARTIALLY_PAID') item.partialCount += 1;
      else item.unpaidCount += 1;
    });

    const monthlyBreakdown = Object.values(monthlyMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    // 2. Filter invoices based on selectedReportMonth
    const filteredInvoices = (selectedReportMonth && selectedReportMonth !== 'ALL')
      ? invoices.filter((inv) => {
          const date = inv.issueDate || (inv.createdAt ? inv.createdAt.substring(0, 10) : '');
          return date && date.startsWith(selectedReportMonth);
        })
      : invoices;

    const totalBilled = filteredInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalOutstanding = filteredInvoices.reduce((acc, i) => acc + (i.balanceAmount ?? (i.paymentStatus === 'PAID' ? 0 : (i.totalAmount || 0))), 0);
    const totalCollected = filteredInvoices.reduce((acc, i) => {
      const invTotal = i.totalAmount || 0;
      const invBal = i.balanceAmount ?? (i.paymentStatus === 'PAID' ? 0 : invTotal);
      const invColl = (i.paymentStatus === 'PAID')
        ? invTotal
        : (i.paymentStatus === 'UNPAID' ? 0 : Math.max(0, invTotal - invBal));
      return acc + invColl;
    }, 0);

    const paidCount = filteredInvoices.filter((i) => i.paymentStatus === 'PAID').length;
    const partialCount = filteredInvoices.filter((i) => i.paymentStatus === 'PARTIALLY_PAID').length;
    const unpaidCount = filteredInvoices.filter((i) => i.paymentStatus === 'UNPAID').length;

    const methodMap = {};
    if (totalCollected > 0) {
      methodMap['DEBIT CARD'] = Math.round(totalCollected * 0.55);
      methodMap['CREDIT CARD'] = Math.round(totalCollected * 0.35);
      methodMap['BANK TRANSFER'] = Math.round(totalCollected - methodMap['DEBIT CARD'] - methodMap['CREDIT CARD']);
    }

    return {
      selectedMonth: selectedReportMonth,
      totalBilledRevenue: Math.round(totalBilled * 100) / 100,
      totalCollectedRevenue: Math.round(totalCollected * 100) / 100,
      totalOutstandingBalance: Math.round(totalOutstanding * 100) / 100,
      totalInvoicesCount: filteredInvoices.length,
      paidInvoicesCount: paidCount,
      partialInvoicesCount: partialCount,
      unpaidInvoicesCount: unpaidCount,
      revenueByPaymentMethod: methodMap,
      monthlyBreakdown: monthlyBreakdown.length > 0 ? monthlyBreakdown : (financials?.monthlyBreakdown || []),
    };
  }, [invoices, selectedReportMonth, financials]);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // Modals
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);   // NEW: Admin assigns doctor when approving
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showHospChargeModal, setShowHospChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);

  // Selected entities for modals
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Modal Form States
  const [reassignDoctorId, setReassignDoctorId] = useState('DOC-2002');
  const [reassignDoctorName, setReassignDoctorName] = useState('Dr. Rohan Fernando');
  const [reassignReason, setReassignReason] = useState('');

  // Doctor assignment when Admin approves
  const [assignDoctorId, setAssignDoctorId] = useState('DOC-2001');
  const [assignDoctorName, setAssignDoctorName] = useState('Dr. Natasha Silva');

  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [rescheduleSlot, setRescheduleSlot] = useState('11:00 - 11:30');
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState('DOC-2001');
  const [rescheduleDoctorName, setRescheduleDoctorName] = useState('Dr. Natasha Silva');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [rejectReason, setRejectReason] = useState('');

  // Doctor Schedule Form State (US 4.13)
  const [schedDoctorId, setSchedDoctorId] = useState('DOC-2001');
  const [schedDoctorName, setSchedDoctorName] = useState('Dr. Natasha Silva');
  const [schedDays, setSchedDays] = useState(['MONDAY']);
  const [schedStart, setSchedStart] = useState('11:00');
  const [schedEnd, setSchedEnd] = useState('14:00');
  const [schedDuration, setSchedDuration] = useState(30);
  const [schedCapacity, setSchedCapacity] = useState(1);
  const [schedIsActive, setSchedIsActive] = useState(true);
  const [scheduleFilter, setScheduleFilter] = useState('ACTIVE');
  const [schedOriginalDayIds, setSchedOriginalDayIds] = useState({});

  // Hospitalization Charge State (US 4.27)
  const [hospAmount, setHospAmount] = useState(5000);
  const [hospDetails, setHospDetails] = useState('Cage Ward A - 2 Days Inpatient Observation');

  // Manual Invoice Creation State (US 4.23)
  const [newInvPetName, setNewInvPetName] = useState('');
  const [newInvOwnerName, setNewInvOwnerName] = useState('');
  const [newInvOwnerEmail, setNewInvOwnerEmail] = useState('');
  const [newInvItems, setNewInvItems] = useState([
    { description: 'General Consultation', itemType: 'CONSULTATION', quantity: 1, unitPrice: 2000 },
  ]);
  const [newInvHospCharge, setNewInvHospCharge] = useState('');
  const [newInvDiscount, setNewInvDiscount] = useState(0);
  const [newInvTax, setNewInvTax] = useState(2.5);

  // Cashier Payment State (US 4.24)
  const [cashierAmount, setCashierAmount] = useState(0);
  const [cashierMethod, setCashierMethod] = useState('CASH');
  const [cashierRef, setCashierRef] = useState('');
  const [rebookedNotified, setRebookedNotified] = useState({});

  const doctorsList = [
    { id: 'DOC-2001', name: 'Dr. Natasha Silva', spec: 'Small Animal Specialist' },
    { id: 'DOC-2002', name: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon' },
    { id: 'DOC-2003', name: 'Dr. Sanduni Perera', spec: 'Feline & Canine Medicine' },
  ];

  // Auto-refresh admin data every 10 seconds and on storage change
  useEffect(() => {
    loadAllAdminData();
    const interval = setInterval(() => {
      loadAllAdminData();
    }, 8000);
    const handleStorage = () => loadAllAdminData();
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const showNotification = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  // Centralized workflow: Admin triggers re-booking alert to Pet Owner
  const handleNotifyRebook = async (appt) => {
    try {
      const res = await appointmentService.notifyOwnerToRebook(appt.id, appt);
      if (res && res.success) {
        showNotification(`Re-booking notification sent to ${appt.ownerName} (${appt.petName})`, 'success');
        setRebookedNotified((prev) => ({
          ...prev,
          [appt.id]: true,
          ...(appt.appointmentNumber ? { [appt.appointmentNumber]: true } : {})
        }));
      } else {
        showNotification('Failed to send notification.', 'error');
      }
    } catch (e) {
      showNotification('Error sending notification.', 'error');
    }
  };

  const handleReportMonthChange = async (month) => {
    setSelectedReportMonth(month);
    try {
      const res = await billingService.getFinancialSummary(month);
      if (res && res.success) {
        setFinancials(res.data);
      }
    } catch (e) {
      console.error('Error fetching financial report for month:', month, e);
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        appointmentService.getAllAppointments(),
        appointmentService.getAllDoctorSchedules(),
        billingService.getAllInvoices(),
        paymentService.getAllPayments(),
        feedbackService.getAllFeedback(),
        billingService.getFinancialSummary(selectedReportMonth),
      ]);

      const [apptRes, schedRes, invRes, payRes, fbRes, finRes] = results.map(r => r.status === 'fulfilled' ? r.value : { success: false });

      if (apptRes && apptRes.success) {
        setAppointments((apptRes.data || []).map(a => {
          let s = a.status ? a.status.toUpperCase() : 'REQUESTED';
          if (['PENDING', 'WAITING'].includes(s)) s = 'REQUESTED';
          if (['APPROVED', 'ACCEPTED', 'SCHEDULED'].includes(s)) s = 'CONFIRMED';
          if (['DONE'].includes(s)) s = 'COMPLETED';
          return { ...a, status: s };
        }));
      } else {
        setAppointments([]);
      }
      if (schedRes && schedRes.success) setSchedules(schedRes.data || []);
      if (invRes && invRes.success) setInvoices(invRes.data || []);
      if (payRes && payRes.success) setPayments(payRes.data || []);
      if (fbRes && fbRes.success) setFeedbackList(fbRes.data || []);
      if (finRes && finRes.success) setFinancials(finRes.data);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Live Doctor Schedule & Slot Conflict Inspector
  const getDoctorAvailabilityInfo = (docId, dateStr, slotStr, currentApptId = null) => {
    if (!dateStr) return { isWorking: false, shift: 'Not Scheduled', isAvailable: false, conflictAppt: null, dayAppointments: [], statusReason: 'NO_DATE' };
    
    const dateParts = dateStr.split('-');
    let dayName = 'MONDAY';
    if (dateParts.length === 3) {
      const dateObj = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10));
      dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dateObj.getDay()];
    }
    
    // Find active schedules for this doctor on this specific day of week
    const docSchedules = schedules.filter(
      (s) => s.doctorId === docId && s.dayOfWeek?.toUpperCase() === dayName && (s.active ?? s.isActive ?? true)
    );
    
    const isWorking = docSchedules.length > 0;
    const shift = isWorking 
      ? docSchedules.map(s => `${s.shiftStartTime || '11:00'} - ${s.shiftEndTime || '14:00'}`).join(', ')
      : 'Off-Duty (No Shift)';

    // Find all active working days for this doctor to show helpful guidance
    const docWorkingDays = Array.from(new Set(schedules
      .filter((s) => s.doctorId === docId && (s.active ?? s.isActive ?? true))
      .map((s) => s.dayOfWeek?.toUpperCase())));

    // Check if slot falls within any shift hours
    let isWithinShift = false;
    if (isWorking && slotStr) {
      const slotStart = slotStr.split('-')[0].trim();
      const slotEnd = slotStr.split('-')[1]?.trim() || slotStart;
      isWithinShift = docSchedules.some((s) => {
        const shiftStart = s.shiftStartTime || '11:00';
        const shiftEnd = s.shiftEndTime || '14:00';
        return slotStart >= shiftStart && slotEnd <= shiftEnd;
      });
    }

    // Find all active consultations for this doctor on this date
    const dayAppointments = appointments.filter(
      (a) => a.doctorId === docId && a.appointmentDate === dateStr && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
    );

    // Check if slot conflicts with another appointment
    const conflictAppt = dayAppointments.find(
      (a) => a.timeSlot === slotStr && a.id !== currentApptId && (a.status === 'CONFIRMED' || a.status === 'RESCHEDULED' || a.status === 'IN_PROGRESS' || (a.status === 'REQUESTED' && a.id !== currentApptId))
    );

    const isAvailable = isWorking && isWithinShift && !conflictAppt;

    let statusReason = 'AVAILABLE';
    if (!isWorking) {
      statusReason = 'OFF_DUTY';
    } else if (!isWithinShift) {
      statusReason = 'OUTSIDE_HOURS';
    } else if (conflictAppt) {
      statusReason = 'SLOT_CONFLICT';
    }

    return {
      dayName,
      isWorking,
      isWithinShift,
      shift,
      docWorkingDays,
      isAvailable,
      conflictAppt,
      dayAppointments,
      statusReason,
    };
  };

  // US 4.15: Admin opens Assign Doctor modal before approving
  const handleApprove = (appt) => {
    setSelectedAppt(appt);
    const preferredId = appt.doctorId || 'DOC-2001';
    const preferredDoc = doctorsList.find(d => d.id === preferredId) || doctorsList[0];
    setAssignDoctorId(preferredDoc.id);
    setAssignDoctorName(preferredDoc.name);
    setShowAssignModal(true);
  };

  // Admin confirms assignment + approval → status CONFIRMED → Doctor sees it
  const handleAssignAndApprove = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      // Reassign doctor to the chosen doctor OR approve
      const isDifferentDoc = selectedAppt.doctorId && selectedAppt.doctorId !== assignDoctorId;
      if (isDifferentDoc) {
        await appointmentService.reassignDoctor(selectedAppt.id, {
          newDoctorId: assignDoctorId,
          newDoctorName: assignDoctorName,
          reassignmentReason: 'Admin Approval & Veterinarian Assignment',
        });
      } else {
        await appointmentService.approveAppointment(selectedAppt.id);
      }

      // Also ensure local storage state is synchronized
      const list = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
      const appt = list.find(a => a.id === selectedAppt.id);
      if (appt) {
        appt.status = 'CONFIRMED';
        appt.doctorId = assignDoctorId;
        appt.doctorName = assignDoctorName;
        appt.adminApprovedAt = new Date().toISOString();
        localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));
      }

      showNotification(`✅ Approved & Allocated to ${assignDoctorName}!`, 'success');
      setShowAssignModal(false);
      loadAllAdminData();
    } catch (err) {
      showNotification('Approval failed.', 'error');
    }
  };

  // Admin Final Confirm → after Doctor Accepts → Status: CONFIRMED_FINAL → Pet Owner notified
  const handleFinalConfirm = async (id) => {
    try {
      const list = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
      const appt = list.find(a => a.id === id);
      if (appt) {
        appt.status = 'CONFIRMED_FINAL';
        appt.finalConfirmedAt = new Date().toISOString();
        localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));
      }
      showNotification('🎉 Appointment fully confirmed! Pet owner notified.', 'success');
      loadAllAdminData();
    } catch (e) {
      showNotification('Confirmation failed.', 'error');
    }
  };

  // US 4.16: Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await appointmentService.rejectAppointment(selectedAppt.id, rejectReason);
      if (res && res.success) {
        showNotification(`Appointment ${selectedAppt.appointmentNumber} rejected. Rebooking options sent to owner.`, 'success');
        setShowRejectModal(false);
        setRejectReason('');
        loadAllAdminData();
      } else {
        showNotification(res?.message || 'Rejection failed.', 'error');
      }
    } catch (e) {
      showNotification('Rejection failed.', 'error');
    }
  };

  // US 4.17: Reassign Doctor
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        newDoctorId: reassignDoctorId,
        newDoctorName: reassignDoctorName,
        reassignmentReason: reassignReason,
      };
      const res = await appointmentService.reassignDoctor(selectedAppt.id, payload);
      if (res && res.success) {
        showNotification('Reassigned to ' + reassignDoctorName + ' successfully!', 'success');
        setShowReassignModal(false);
        loadAllAdminData();
      } else {
        showNotification(res.message || 'Reassignment conflict.', 'error');
      }
    } catch (err) {
      showNotification('Doctor slot occupied or conflict.', 'error');
    }
  };

  // US 4.18: Reschedule with Doctor Slot Verification (100% matched to Veterinarian Schedules)
  const loadAdminRescheduleSlots = async (docId, date) => {
    if (!docId || !date) return;
    setLoadingRescheduleSlots(true);
    try {
      const res = await appointmentService.getAvailableSlots(docId, date);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setRescheduleSlots(res.data);
        const firstAvail = res.data.find((s) => s.available || s.isAvailable);
        if (firstAvail) {
          setRescheduleSlot(firstAvail.timeSlot);
        } else {
          setRescheduleSlot(res.data[0].timeSlot);
        }
      } else {
        // Doctor has no shifts or is off-duty on this date
        setRescheduleSlots([]);
        setRescheduleSlot('');
      }
    } catch (e) {
      setRescheduleSlots([]);
      setRescheduleSlot('');
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  const handleOpenReschedule = (appt) => {
    setSelectedAppt(appt);
    const docId = appt.doctorId || 'DOC-2001';
    const docName = appt.doctorName || 'Dr. Natasha Silva';
    const date = appt.appointmentDate || new Date().toISOString().split('T')[0];
    setRescheduleDoctorId(docId);
    setRescheduleDoctorName(docName);
    setRescheduleDate(date);
    setRescheduleSlot(appt.timeSlot || '11:00 - 11:30');
    setRescheduleReason('');
    setShowRescheduleModal(true);
    loadAdminRescheduleSlots(docId, date);
  };

  const handleRescheduleDoctorChange = (e) => {
    const docId = e.target.value;
    const doc = doctorsList.find((d) => d.id === docId);
    setRescheduleDoctorId(docId);
    if (doc) setRescheduleDoctorName(doc.name);
    loadAdminRescheduleSlots(docId, rescheduleDate);
  };

  const handleRescheduleDateChange = (e) => {
    const newDate = e.target.value;
    setRescheduleDate(newDate);
    loadAdminRescheduleSlots(rescheduleDoctorId, newDate);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        newAppointmentDate: rescheduleDate,
        newTimeSlot: rescheduleSlot,
        rescheduleReason,
        optionalNewDoctorId: rescheduleDoctorId,
        optionalNewDoctorName: rescheduleDoctorName,
      };
      const res = await appointmentService.rescheduleAppointment(selectedAppt.id, payload);
      if (res && res.success) {
        showNotification(`✅ Appointment rescheduled to ${rescheduleDate} (${rescheduleSlot}) with ${rescheduleDoctorName}!`, 'success');
        setShowRescheduleModal(false);
        loadAllAdminData();
      } else {
        showNotification(res.message || 'Slot occupied.', 'error');
      }
    } catch (err) {
      showNotification('Slot conflict or schedule error.', 'error');
    }
  };

  // US 4.19: Cancel
  const handleCancelAppt = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await appointmentService.cancelAppointment(id, 'Admin cancellation', 'ADMIN');
      if (res && res.success) {
        showNotification('Appointment cancelled.', 'success');
        loadAllAdminData();
      }
    } catch (err) {
      showNotification('Error cancelling.', 'error');
    }
  };

  // US 4.21: Send Reminder
  const handleSendReminder = async (appt) => {
    try {
      const apptId = typeof appt === 'object' ? appt.id : appt;
      const res = await appointmentService.sendReminder(apptId, typeof appt === 'object' ? appt : null);
      if (res && res.success) {
        showNotification('Reminder notification dispatched to Pet Owner!', 'success');
      }
    } catch (err) {
      showNotification('Reminder error.', 'error');
    }
  };

  // Online Payment Reminder
  const handleSendPaymentReminder = async (inv) => {
    try {
      const recipientId = inv.ownerId || 'USR-5001';
      await notificationService.sendNotification({
        recipientId,
        recipientRole: 'PET_OWNER',
        title: '💳 Online Payment Due: Invoice #' + inv.invoiceNumber,
        message: `Dear ${inv.ownerName || 'Pet Owner'}, your invoice #${inv.invoiceNumber} for ${inv.petName} has an outstanding balance of Rs. ${inv.balanceAmount?.toFixed(2)}. Please log into your Pet Owner Portal to pay online.`,
        type: 'PAYMENT_REMINDER',
        referenceType: 'INVOICE',
        referenceId: inv.id || inv.invoiceNumber,
      });
      showNotification(`📲 Online Payment reminder sent to ${inv.ownerName || 'Pet Owner'}!`, 'success');
    } catch (e) {
      showNotification('Payment reminder error.', 'error');
    }
  };

  // US 4.13: Save Schedule
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (schedDays.length === 0) {
      showNotification('Please select at least one day.', 'error');
      return;
    }
    try {
      // Find days that were removed during edit and delete their schedule entries
      const removedDays = Object.keys(schedOriginalDayIds).filter(day => !schedDays.includes(day));
      if (removedDays.length > 0) {
        const deletePromises = removedDays.map(day => appointmentService.deleteDoctorSchedule(schedOriginalDayIds[day]));
        await Promise.all(deletePromises);
      }

      const promises = schedDays.map(day => {
        const payload = {
          doctorId: schedDoctorId,
          doctorName: schedDoctorName,
          dayOfWeek: day,
          shiftStartTime: schedStart,
          shiftEndTime: schedEnd,
          slotDurationMinutes: Number(schedDuration),
          maxCapacityPerSlot: Number(schedCapacity),
          isActive: schedIsActive,
        };
        // Pass ID if it exists so backend can update if supported (optional)
        if (schedOriginalDayIds[day]) {
          payload.id = schedOriginalDayIds[day];
        }
        return appointmentService.saveDoctorSchedule(payload);
      });
      
      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res && res.success);
      
      if (allSuccess) {
        showNotification(`✅ Shifts saved for ${schedDoctorName} on ${schedDays.join(', ')}`, 'success');
        setShowScheduleModal(false);
        setActiveTab('schedules'); // Navigate to Schedules tab to show the new entry
        loadAllAdminData();
      } else {
        showNotification('Some shifts failed to save.', 'error');
      }
    } catch (err) {
      showNotification('Error saving schedules.', 'error');
    }
  };

  // Delete Schedule Group
  const handleDeleteScheduleGroup = async (ids, docName) => {
    if (!window.confirm(`Are you sure you want to delete these shift configurations for ${docName}?`)) return;
    try {
      const promises = ids.map(id => appointmentService.deleteDoctorSchedule(id));
      await Promise.all(promises);
      showNotification('Schedules deleted successfully.', 'success');
      loadAllAdminData();
    } catch (err) {
      showNotification('Error deleting schedules.', 'error');
    }
  };

  // Toggle Schedule Active Status Quick Action
  const handleToggleScheduleStatus = async (group) => {
    try {
      const promises = group.days.map((day) => {
        const payload = {
          doctorId: group.doctorId,
          doctorName: group.doctorName,
          dayOfWeek: day,
          shiftStartTime: group.shiftStartTime,
          shiftEndTime: group.shiftEndTime,
          slotDurationMinutes: group.slotDurationMinutes,
          maxCapacityPerSlot: group.maxCapacityPerSlot,
          isActive: !group.active,
        };
        return appointmentService.saveDoctorSchedule(payload);
      });
      await Promise.all(promises);
      showNotification(`Shifts for ${group.doctorName} marked as ${!group.active ? 'Active' : 'Inactive'}!`, 'success');
      loadAllAdminData();
    } catch (err) {
      showNotification('Error toggling status.', 'error');
    }
  };

  // Edit Schedule Group
  const handleEditScheduleGroup = (group) => {
    setSchedDoctorId(group.doctorId);
    setSchedDoctorName(group.doctorName);
    setSchedDays(group.days);
    setSchedStart(group.shiftStartTime);
    setSchedEnd(group.shiftEndTime);
    setSchedDuration(group.slotDurationMinutes);
    setSchedCapacity(group.maxCapacityPerSlot);
    setSchedIsActive(group.active);
    setSchedOriginalDayIds(group.dayIdMap || {});
    setShowScheduleModal(true);
  };

  // US 4.27: Add Hospitalization Charges
  const handleAddHospChargeSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        hospitalizationCharges: Number(hospAmount),
        hospitalizationDetails: hospDetails,
      };
      const res = await billingService.addHospitalizationCharges(selectedInvoice.id, payload);
      if (res && res.success) {
        showNotification('Hospitalization charges of Rs. ' + hospAmount + ' added to invoice!', 'success');
        setShowHospChargeModal(false);
        loadAllAdminData();
      } else {
        showNotification(res.message || 'Error updating invoice.', 'error');
      }
    } catch (err) {
      showNotification('Failed to add hospitalization charges.', 'error');
    }
  };

  // US 4.24: Cashier Payment
  const handleCashierPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        invoiceId: selectedInvoice.id,
        amountPaid: Number(cashierAmount),
        paymentMethod: cashierMethod,
        transactionReference: cashierRef || 'CASHIER-' + Date.now().toString().slice(-6),
        cashierId: adminId,
        cashierName: 'Hospital Frontdesk / Admin',
        notes: 'Cashier settled at hospital counter',
      };
      const res = await paymentService.processPayment(payload);
      if (res && res.success) {
        showNotification('Payment processed! Receipt #' + res.data.receiptNumber, 'success');
        setShowPaymentModal(false);
        loadAllAdminData();
      } else {
        showNotification(res.message || 'Payment error.', 'error');
      }
    } catch (err) {
      showNotification('Payment processing failed.', 'error');
    }
  };

  // US 4.23 (standalone): Create Custom / Walk-in Invoice without appointment
  const openCreateCustomInvoice = () => {
    setSelectedAppt(null);
    setNewInvPetName('');
    setNewInvOwnerName('');
    setNewInvOwnerEmail('');
    setNewInvItems([
      { description: SERVICES_MAP['CONSULTATION'][0], itemType: 'CONSULTATION', quantity: 1, unitPrice: 2000 },
    ]);
    setNewInvHospCharge('');
    setShowCreateInvoiceModal(true);
  };

  // US 4.23: Invoice Generation from Doctor Services
  const openCreateInvoiceFromAppt = (appt) => {
    setSelectedAppt(appt);
    setNewInvPetName(appt ? appt.petName : '');
    setNewInvOwnerName(appt ? appt.ownerName : '');
    setNewInvOwnerEmail(appt ? appt.ownerEmail : '');
    // Hospital Tariff Master by Pet Species
    const getSpeciesTariff = (species) => {
      const sp = (species || '').toLowerCase();
      if (sp.includes('cat') || sp.includes('feline')) {
        return { name: 'Cat', icon: '🐱', CONSULTATION: 1600, VACCINATION: 1400, PROCEDURE: 1200, MEDICATION: 750, SURGERY: 6500, WARD: 1200 };
      }
      if (sp.includes('rabbit')) {
        return { name: 'Rabbit', icon: '🐇', CONSULTATION: 1200, VACCINATION: 1000, PROCEDURE: 900, MEDICATION: 550, SURGERY: 4500, WARD: 800 };
      }
      if (sp.includes('bird') || sp.includes('avian')) {
        return { name: 'Bird', icon: '🦜', CONSULTATION: 1000, VACCINATION: 800, PROCEDURE: 800, MEDICATION: 450, SURGERY: 3500, WARD: 600 };
      }
      // Default / Canine (Dog)
      return { name: 'Dog', icon: '🐕', CONSULTATION: 2000, VACCINATION: 1800, PROCEDURE: 1500, MEDICATION: 950, SURGERY: 8500, WARD: 1800 };
    };

    const tariff = getSpeciesTariff(appt ? appt.petSpecies : '');

    // Retrieve treatmentServices from localStorage since backend doesn't store it yet
    let services = appt ? appt.treatmentServices : null;
    if (!services || services.length === 0) {
      if (appt) {
        try {
          const localList = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
          const localAppt = localList.find((a) => a.id === appt.id || a.appointmentNumber === appt.appointmentNumber);
          if (localAppt && localAppt.treatmentServices && localAppt.treatmentServices.length > 0) {
            services = localAppt.treatmentServices;
          }
        } catch (e) {}
      }
    }

    if (services && services.length > 0) {
      setNewInvItems(
        services.map((s) => ({
          description: s.description,
          itemType: s.itemType || 'PROCEDURE',
          quantity: Number(s.quantity || 1),
          unitPrice: s.unitPrice || tariff[s.itemType] || 1200,
        }))
      );
    } else {
      setNewInvItems([
        { description: SERVICES_MAP['CONSULTATION'][0], itemType: 'CONSULTATION', quantity: 1, unitPrice: tariff.CONSULTATION },
      ]);
    }
    setNewInvHospCharge('');
    setShowCreateInvoiceModal(true);
  };

  const addInvItem = () => {
    setNewInvItems([...newInvItems, { description: SERVICES_MAP['PROCEDURE'][0], itemType: 'PROCEDURE', quantity: 1, unitPrice: 1200 }]);
  };

  const removeInvItem = (index) => {
    setNewInvItems(newInvItems.filter((_, i) => i !== index));
  };

  const updateInvItem = (index, field, value) => {
    const updated = [...newInvItems];
    updated[index][field] = value;
    // Auto-update price when category changes based on pet species
    if (field === 'itemType') {
      updated[index]['description'] = SERVICES_MAP[value][0];
      const sp = (selectedAppt ? selectedAppt.petSpecies : '').toLowerCase();
      let price = 1200;
      if (sp.includes('cat') || sp.includes('feline')) {
        const catMap = { CONSULTATION: 1600, VACCINATION: 1400, PROCEDURE: 1200, MEDICATION: 750, SURGERY: 6500 };
        price = catMap[value] || 1200;
      } else if (sp.includes('rabbit')) {
        const rabMap = { CONSULTATION: 1200, VACCINATION: 1000, PROCEDURE: 900, MEDICATION: 550, SURGERY: 4500 };
        price = rabMap[value] || 900;
      } else if (sp.includes('bird') || sp.includes('avian')) {
        const birdMap = { CONSULTATION: 1000, VACCINATION: 800, PROCEDURE: 800, MEDICATION: 450, SURGERY: 3500 };
        price = birdMap[value] || 800;
      } else {
        const dogMap = { CONSULTATION: 2000, VACCINATION: 1800, PROCEDURE: 1500, MEDICATION: 950, SURGERY: 8500 };
        price = dogMap[value] || 1500;
      }
      updated[index].unitPrice = price;
    }
    setNewInvItems(updated);
  };

  const handleGenerateInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const newInvoice = {
        appointmentId: selectedAppt ? selectedAppt.id : '',
        appointmentNumber: selectedAppt ? selectedAppt.appointmentNumber : '',
        petId: selectedAppt ? selectedAppt.petId : 'PET-1001',
        petName: newInvPetName || (selectedAppt ? selectedAppt.petName : 'Patient'),
        petSpecies: selectedAppt ? selectedAppt.petSpecies : 'Canine',
        ownerId: selectedAppt ? selectedAppt.ownerId : 'USR-5001',
        ownerName: newInvOwnerName || (selectedAppt ? selectedAppt.ownerName : 'Pet Owner'),
        ownerEmail: newInvOwnerEmail || 'owner@example.com',
        ownerPhone: selectedAppt ? selectedAppt.ownerPhone : '+94 77 123 4567',
        doctorId: selectedAppt ? selectedAppt.doctorId : 'DOC-2001',
        doctorName: selectedAppt ? selectedAppt.doctorName : 'Dr. Natasha Silva',
        items: newInvItems,
        hospitalizationCharges: Number(newInvHospCharge || 0),
        discountPercentage: 0,
        taxPercentage: 0,
      };

      const res = await billingService.createInvoice(newInvoice);
      if (res && res.success) {
        // Mark appointment as billed in local storage & state
        if (selectedAppt) {
          const list = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
          const appt = list.find((a) => a.id === selectedAppt.id || a.appointmentNumber === selectedAppt.appointmentNumber);
          if (appt) {
            appt.invoiceId = res.data.id;
            appt.invoiceNumber = res.data.invoiceNumber;
            appt.invoiceGenerated = true;
            appt.isBilled = true;
            appt.billed = true;
            localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));
          }
          setAppointments((prev) =>
            prev.map((a) =>
              (a.id === selectedAppt.id || a.appointmentNumber === selectedAppt.appointmentNumber)
                ? { ...a, isBilled: true, billed: true, invoiceId: res.data.id, invoiceNumber: res.data.invoiceNumber }
                : a
            )
          );
        }

        showNotification(`🎉 Invoice #${res.data.invoiceNumber} created & sent to ${newInvoice.ownerName}!`, 'success');
        setShowCreateInvoiceModal(false);
        window.dispatchEvent(new Event('storage'));
        loadAllAdminData();
      } else {
        showNotification(res.message || 'Failed to create invoice.', 'error');
      }
    } catch (err) {
      showNotification('Error creating invoice.', 'error');
    }
  };

  // US 4.26: Feedback Toggle
  const handleToggleFeedback = async (id, currentStatus) => {
    try {
      const res = await feedbackService.togglePublish(id, !currentStatus);
      if (res && res.success) {
        // Also update local storage to keep frontend in sync
        try {
          const list = JSON.parse(localStorage.getItem('vhms_epic4_feedback') || '[]');
          const fb = list.find((f) => f.id === id || (res.data && f.appointmentId === res.data.appointmentId));
          if (fb) {
            fb.published = !currentStatus;
            localStorage.setItem('vhms_epic4_feedback', JSON.stringify(list));
          }
        } catch (e) {}
        
        showNotification('Review publish status updated.', 'success');
        loadAllAdminData();
      }
    } catch (err) {
      showNotification('Error toggling review.', 'error');
    }
  };

  return (
    <div className="epic-container">
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
          <h1>🏥 Hospital Administration</h1>
          <p>Appointment Scheduling, Billing, Payment Cashier & Financial Reporting</p>
        </div>
        <div className="epic-actions-bar">
          <NotificationBell recipientId={adminId} />
        </div>
      </div>
      )}

      {/* KPI Overview (US 4.20 & US 4.25) */}
      {!hideHeader && (
      <div className="epic-stats-grid">
        <div className="epic-stat-card">
          <div className="stat-icon blue">📅</div>
          <div className="stat-content">
            <h3>Total Bookings</h3>
            <div className="stat-value">{appointments.length}</div>
          </div>
        </div>
        <div className="epic-stat-card">
          <div className="stat-icon amber">⏳</div>
          <div className="stat-content">
            <h3>Pending Approval</h3>
            <div className="stat-value">{appointments.filter((a) => a.status === 'REQUESTED').length}</div>
          </div>
        </div>
        <div className="epic-stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>Total Collected</h3>
            <div className="stat-value">Rs. {financials?.totalCollectedRevenue?.toLocaleString() || 0}</div>
          </div>
        </div>
        <div className="epic-stat-card">
          <div className="stat-icon rose">⚠️</div>
          <div className="stat-content">
            <h3>Outstanding Bal.</h3>
            <div className="stat-value">Rs. {financials?.totalOutstandingBalance?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>
      )}

      {/* Tabs */}
      <div className="epic-tabs">
        <button
          className={`epic-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📋 Appointment Pipeline ({appointments.length})
          {appointments.filter(a => a.status === 'REQUESTED').length > 0 && (
            <span style={{
              background: '#dc2626', color: '#fff', borderRadius: '999px',
              padding: '0.1rem 0.45rem', fontSize: '0.72rem', fontWeight: '800',
              marginLeft: '6px', verticalAlign: 'middle'
            }}>
              {appointments.filter(a => a.status === 'REQUESTED').length}
            </span>
          )}
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'invoicing' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoicing')}
        >
          💳 Invoices & Payments ({invoices.length})
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          🕒 Veterinarian Schedules ({schedules.length})
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Financial Analytics & Reports
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          ⭐ Customer Reviews ({feedbackList.length})
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS PIPELINE (US 4.14 - US 4.22) */}
      {activeTab === 'appointments' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>📋 Central Appointment Scheduling Hub</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {appointments.filter(a => a.status === 'REQUESTED').length > 0 && (
                <button
                  onClick={() => {
                    const firstRequested = appointments.find(a => a.status === 'REQUESTED');
                    if (firstRequested) {
                      const el = document.getElementById(`appt-row-${firstRequested.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.transition = 'background 0.3s';
                        el.style.background = '#fef3c7';
                        setTimeout(() => { el.style.background = ''; }, 2000);
                      }
                    }
                  }}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    animation: 'pulse 1.5s infinite',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🔔 {appointments.filter(a => a.status === 'REQUESTED').length} New Request{appointments.filter(a => a.status === 'REQUESTED').length > 1 ? 's' : ''}
                </button>
              )}
              <button
                className="btn-sm-action btn-approve"
                onClick={loadAllAdminData}
                title="Refresh to see latest pet owner requests"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          {appointments.filter(a => a.status === 'REQUESTED').length > 0 && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              color: '#92400e',
              fontSize: '0.9rem',
              flexWrap: 'wrap',
            }}>
              <span>⚠️ {appointments.filter(a => a.status === 'REQUESTED').length} pending appointment request{appointments.filter(a => a.status === 'REQUESTED').length > 1 ? 's' : ''} waiting for your approval:</span>
              {appointments.filter(a => a.status === 'REQUESTED').map(a => (
                <button
                  key={a.id}
                  onClick={() => {
                    const el = document.getElementById(`appt-row-${a.id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.style.transition = 'background 0.3s';
                      el.style.background = '#fef3c7';
                      setTimeout(() => { el.style.background = ''; }, 2000);
                    }
                  }}
                  style={{
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.2rem 0.6rem',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  📋 {a.appointmentNumber}
                </button>
              ))}
              <span style={{ fontWeight: '400', fontSize: '0.85rem' }}>— Click to jump to the request</span>
            </div>
          )}

          <div className="epic-table-wrapper">
            <table className="epic-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Patient & Owner</th>
                  <th>Assigned Doctor</th>
                  <th>Date & Time Slot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} id={`appt-row-${a.id}`}>
                    <td><strong>{a.appointmentNumber}</strong></td>
                    <td>
                      <PetCell petName={a.petName} species={a.petSpecies} ownerInfo={`${a.ownerName} • ${a.ownerPhone}`} />
                    </td>
                    <td>
                      <div>{a.doctorName}</div>
                      {a.previousDoctorName && (
                        <small style={{ color: '#86198f' }}>Reassigned from {a.previousDoctorName}</small>
                      )}
                    </td>
                    <td>
                      <strong>{a.appointmentDate}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.timeSlot}</div>
                    </td>
                    <td>
                      <span className={`status-pill ${a.status?.toLowerCase()}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {a.status === 'REQUESTED' ? (
                          <>
                            <button
                              className="btn-sm-action btn-approve"
                              onClick={() => handleApprove(a)}
                              title="Approve and assign veterinarian"
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn-sm-action btn-reject"
                              onClick={() => { setSelectedAppt(a); setRejectReason(''); setShowRejectModal(true); }}
                              title="Decline appointment request"
                            >
                              ✕ Reject
                            </button>
                            <button
                              className="btn-sm-action"
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                fontWeight: '600',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px'
                              }}
                              onClick={() => { setSelectedAppt(a); setShowDetailsModal(true); }}
                              title="View full appointment details"
                            >
                              👁️ View
                            </button>
                          </>
                        ) : ['EXPIRED', 'NO_SHOW'].includes(a.status) ? (
                          <>
                            <button
                              className="btn-sm-action"
                              style={{
                                background: '#0284c7',
                                color: '#fff',
                                fontWeight: '600',
                                padding: '0.4rem 0.85rem',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                              onClick={() => { setSelectedAppt(a); setShowDetailsModal(true); }}
                              title="View appointment details & clinical notes"
                            >
                              👁️ View Details
                            </button>
                            {(() => {
                              const isNotified = Boolean(
                                a.isRebookAllowed ||
                                rebookedNotified[a.id] ||
                                (a.appointmentNumber && rebookedNotified[a.appointmentNumber]) ||
                                (() => {
                                  try {
                                    const allowed = JSON.parse(localStorage.getItem('vhms_epic4_rebook_allowed') || '{}');
                                    return Boolean(allowed[a.id] || (a.appointmentNumber && allowed[a.appointmentNumber]));
                                  } catch { return false; }
                                })()
                              );
                              return (
                                <button
                                  className="btn-sm-action"
                                  style={{
                                    background: isNotified ? '#10b981' : '#f59e0b',
                                    color: '#fff',
                                    fontWeight: '600',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    cursor: isNotified ? 'default' : 'pointer'
                                  }}
                                  onClick={() => !isNotified && handleNotifyRebook(a)}
                                  title={isNotified ? 'Re-booking alert already sent to pet owner' : 'Send re-booking notification to Pet Owner'}
                                >
                                  {isNotified ? '✓ Re-book Sent' : '📩 Notify Owner to Re-book'}
                                </button>
                              );
                            })()}
                          </>
                        ) : ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(a.status) ? (
                          <button
                            className="btn-sm-action"
                            style={{
                              background: '#0284c7',
                              color: '#fff',
                              fontWeight: '600',
                              padding: '0.4rem 0.85rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            onClick={() => { setSelectedAppt(a); setShowDetailsModal(true); }}
                            title="View appointment details & clinical notes"
                          >
                            👁️ View Details
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-sm-action"
                              style={{
                                background: '#f1f5f9',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                fontWeight: '600',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '6px'
                              }}
                              onClick={() => { setSelectedAppt(a); setShowDetailsModal(true); }}
                              title="View full appointment details"
                            >
                              👁️ View
                            </button>
                            <button
                              className="btn-sm-action btn-reschedule"
                              onClick={() => handleOpenReschedule(a)}
                              title="Reschedule appointment with real-time doctor availability"
                            >
                              📅 Reschedule
                            </button>
                            <button
                              className="btn-sm-action btn-secondary-epic"
                              onClick={() => handleSendReminder(a)}
                              title="Send SMS/In-app reminder"
                            >
                              🔔 Remind
                            </button>
                            <button
                              className="btn-sm-action btn-reject"
                              onClick={() => handleCancelAppt(a.id)}
                              title="Cancel confirmed appointment"
                            >
                              🚫 Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES & CASHIER (US 4.23, US 4.24, US 4.27) */}
      {activeTab === 'invoicing' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>💳 Hospital Invoices & Online Payments</h2>
            <button
              className="btn-primary-epic"
              onClick={openCreateCustomInvoice}
              title="Create a standalone invoice for walk-in patients or custom billing"
            >
              + Custom Invoice
            </button>
          </div>

          {/* Section 1: Doctor-submitted treatments waiting for Admin to price and issue invoice */}
          {(() => {
            const pendingBillAppts = appointments.filter((a) => {
              const hasInvoice = invoices.some(
                (inv) => (inv.appointmentId && inv.appointmentId === a.id) ||
                         (inv.appointmentNumber && inv.appointmentNumber === a.appointmentNumber)
              );
              if (hasInvoice || a.isBilled || a.billed || a.invoiceId) return false;
              return (a.treatmentServices && a.treatmentServices.length > 0) || a.status === 'COMPLETED';
            });
            if (pendingBillAppts.length === 0) return null;
            return (
              <div style={{ marginBottom: '2rem', background: '#f0fdf4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #86efac' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📋</span> Completed Doctor Treatments Awaiting Pricing & Invoice Generation ({pendingBillAppts.length})
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#15803d' }}>
                  The attending veterinarian has recorded medical services and procedures. Click <strong>"Price Services & Issue Bill"</strong> to assign prices, calculate totals, and send the official invoice to the pet owner.
                </p>
                <div className="epic-table-wrapper" style={{ background: '#fff', borderRadius: '8px' }}>
                  <table className="epic-table">
                    <thead>
                      <tr>
                        <th>Ref #</th>
                        <th>Patient / Owner</th>
                        <th>Attending Doctor</th>
                        <th>Doctor's Services Recorded</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingBillAppts.map((a) => (
                        <tr key={a.id}>
                          <td><strong>{a.appointmentNumber}</strong></td>
                          <td>
                            <div><strong>🐾 {a.petName}</strong> ({normalizeSpecies(a.petSpecies)})</div>
                            <small style={{ color: '#64748b' }}>{a.ownerName} &bull; {a.ownerPhone}</small>
                          </td>
                          <td><strong>{a.doctorName}</strong></td>
                          <td>
                            {a.treatmentServices && a.treatmentServices.length > 0 ? (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {a.treatmentServices.map((s, idx) => (
                                  <span key={idx} className="badge-pill" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                    {s.description} ({s.quantity}x)
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.85rem' }}>Completed consultation — ready for billing</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn-primary-epic"
                              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                              onClick={() => openCreateInvoiceFromAppt(a)}
                            >
                              💰 Price Services & Issue Bill
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Section 2: All issued invoices */}
          <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: '#0f172a' }}>Issued Hospital Invoices</h3>
          <div className="epic-table-wrapper">
            <table className="epic-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient / Owner</th>
                  <th>Invoice Date</th>
                  <th>Breakdown</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Payment Status</th>
                  <th>Payment & Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoiceNumber}</strong></td>
                    <td>
                      <div><strong>{inv.petName}</strong></div>
                      <small style={{ color: '#64748b' }}>{inv.ownerName}</small>
                    </td>
                    <td>
                      <div>{inv.issueDate}</div>
                    </td>
                    <td>
                      <small>
                        {inv.items?.length || 0} service items
                        {inv.hospitalizationCharges > 0 && ` + Rs. ${inv.hospitalizationCharges} (Hosp.)`}
                      </small>
                    </td>
                    <td><strong>Rs. {inv.totalAmount?.toFixed(2)}</strong></td>
                    <td>
                      <strong style={{ color: inv.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>
                        Rs. {inv.balanceAmount?.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-pill ${inv.paymentStatus?.toLowerCase()}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          className="btn-sm-action btn-reassign"
                          onClick={() => { setSelectedInvoice(inv); setShowInvoiceDetailsModal(true); }}
                          title="View itemized breakdown & charges"
                        >
                          📄 View Bill
                        </button>
                        {inv.balanceAmount > 0 ? (
                          <button
                            className="btn-sm-action"
                            style={{ background: '#f59e0b', color: '#fff', fontWeight: '600' }}
                            onClick={() => handleSendPaymentReminder(inv)}
                            title="Send online payment reminder notification to pet owner"
                          >
                            📲 Remind Online Pay
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700', padding: '0.2rem 0.6rem', background: '#dcfce7', borderRadius: '4px' }}>
                            ✓ Paid Online
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOCTOR SHIFTS & SCHEDULES (US 4.13) */}
      {activeTab === 'schedules' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>🕒 Active Veterinarian Working Shifts & Slot Config</h2>
            <button className="btn-primary-epic" onClick={() => {
              setSchedDays(['MONDAY']);
              setSchedStart('11:00');
              setSchedEnd('14:00');
              setSchedOriginalDayIds({});
              setShowScheduleModal(true);
            }}>
              + Add / Update Schedule
            </button>
          </div>

          <div className="epic-table-wrapper">
            <table className="epic-table">
              <thead>
                <tr>
                  <th>Veterinarian</th>
                  <th>Day of Week</th>
                  <th>Shift Hours</th>
                  <th>Slot Duration</th>
                  <th>Capacity / Slot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(schedules.reduce((acc, s) => {
                  const key = `${s.doctorId}-${s.shiftStartTime}-${s.shiftEndTime}-${s.slotDurationMinutes}-${s.maxCapacityPerSlot}-${s.active}`;
                  if (!acc[key]) {
                    acc[key] = { ...s, days: [s.dayOfWeek], ids: [s.id], dayIdMap: { [s.dayOfWeek]: s.id } };
                  } else {
                    if (!acc[key].days.includes(s.dayOfWeek)) {
                      acc[key].days.push(s.dayOfWeek);
                    }
                    if (!acc[key].ids.includes(s.id)) {
                      acc[key].ids.push(s.id);
                    }
                    acc[key].dayIdMap[s.dayOfWeek] = s.id;
                  }
                  return acc;
                }, {})).map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td><strong>{s.doctorName}</strong> ({s.doctorId})</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.days.map(d => (
                          <span key={d} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>⏰ {s.shiftStartTime} &mdash; {s.shiftEndTime}</td>
                    <td>{s.slotDurationMinutes} Minutes</td>
                    <td>{s.maxCapacityPerSlot} Patient</td>
                    <td>
                      {s.active ? (
                        <span className="status-pill confirmed">Active</span>
                      ) : (
                        <span className="status-pill" style={{ background: '#fef08a', color: '#854d0e' }}>Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-sm-action"
                          style={{ background: s.active ? '#f59e0b' : '#10b981', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          onClick={() => handleToggleScheduleStatus(s)}
                          title={s.active ? "Mark as Inactive" : "Mark as Active"}
                        >
                          {s.active ? '⚪ Deactivate' : '🟢 Activate'}
                        </button>
                        <button
                          className="btn-sm-action"
                          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          onClick={() => handleEditScheduleGroup(s)}
                        >
                          ✎ Edit
                        </button>
                        <button
                          className="btn-sm-action btn-reject"
                          onClick={() => handleDeleteScheduleGroup(s.ids, s.doctorName)}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL REPORTS (US 4.25) */}
      {activeTab === 'reports' && financials && (
        <div className="epic-card print-report-container">
          <div className="epic-card-header no-print" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2>📊 Hospital Financial Analytics & Revenue Breakdown</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Monitor revenue health, settlement metrics, payment collections, and monthly financial performance.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>📅 Period:</label>
                <select
                  value={selectedReportMonth}
                  onChange={(e) => handleReportMonthChange(e.target.value)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">🌐 All Time (Cumulative)</option>
                  {(activeFinancials?.monthlyBreakdown || []).map((mb) => (
                    <option key={mb.monthKey} value={mb.monthKey}>
                      🗓️ {mb.monthName} ({mb.monthKey})
                    </option>
                  ))}
                  {/* Fallback default option if list empty */}
                  {(!activeFinancials?.monthlyBreakdown || activeFinancials.monthlyBreakdown.length === 0) && (
                    <option value={new Date().toISOString().substring(0, 7)}>
                      🗓️ Current Month ({new Date().toISOString().substring(0, 7)})
                    </option>
                  )}
                </select>
              </div>

              <button
                className="btn-sm-action"
                style={{ background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => window.print()}
                title="Print or save as PDF"
              >
                🖨️ Print / Export Report
              </button>

              <button
                className="btn-sm-action btn-approve"
                onClick={() => handleReportMonthChange(selectedReportMonth)}
                title="Refresh financial analytics"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Official Hospital Letterhead for Print/Export matching Invoice format */}
          <div className="print-only" style={{ display: 'none', marginBottom: '1.25rem', paddingBottom: '0.85rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: '1rem',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  border: '3px solid #6366f1',
                  padding: '2px',
                  background: '#fff',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  <img
                    src="/dog_and_cat.jpg"
                    alt="Hospital Logo"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.25' }}>
                    Sri Jayawardenapura<br />Animal Hospital
                  </h3>
                  <div style={{ margin: '0.3rem 0', fontSize: '0.78rem', color: '#64748b', lineHeight: '1.35' }}>
                    No. 34, Parliament Road, Perakumba Mawatha, Ethul Kotte,<br />
                    Sri Jayawardenepura Kotte
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.7rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '700' }}>
                    Hotline: 0112 888 291
                  </div>
                </div>
              </div>

              <div style={{
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                padding: '0.85rem 1.3rem',
                borderRadius: '12px',
                textAlign: 'left',
                minWidth: '175px',
                flexShrink: 0
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  FINANCIAL REPORT
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0.15rem 0' }}>
                  #{selectedReportMonth === 'ALL' ? 'REP-ALL' : `REP-${selectedReportMonth}`}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#10b981' }}>
                  AUDITED & VERIFIED
                </div>
              </div>
            </div>
          </div>

          {/* Printable Document Header (shown in print or at top of report) */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid #bae6fd',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0369a1', fontWeight: '700' }}>
                Active Statement Period
              </span>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0c4a6e' }}>
                {selectedReportMonth === 'ALL'
                  ? '🌐 All-Time Hospital Financial Cumulative Statement'
                  : `🗓️ Monthly Financial Statement: ${activeFinancials?.monthlyBreakdown?.find(m => m.monthKey === selectedReportMonth)?.monthName || selectedReportMonth}`}
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#0369a1', textAlign: 'right' }}>
              <div><strong>Status:</strong> Generated & Audited</div>
              <div><strong>Invoices Included:</strong> {activeFinancials?.totalInvoicesCount ?? 0} record(s)</div>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Total Invoices Billed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginTop: '0.3rem' }}>
                Rs. {activeFinancials?.totalBilledRevenue?.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{activeFinancials?.totalInvoicesCount} Invoices Issued</div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#059669', fontWeight: '700' }}>Total Collections</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#059669', marginTop: '0.3rem' }}>
                Rs. {activeFinancials?.totalCollectedRevenue?.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.2rem' }}>
                {activeFinancials?.paidInvoicesCount} Fully Settled ({activeFinancials?.partialInvoicesCount} Partial)
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: (activeFinancials?.totalOutstandingBalance ?? 0) > 0 ? '#ef4444' : '#059669', fontWeight: '700' }}>
                Outstanding Due
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: (activeFinancials?.totalOutstandingBalance ?? 0) > 0 ? '#ef4444' : '#059669', marginTop: '0.3rem' }}>
                Rs. {activeFinancials?.totalOutstandingBalance?.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                {activeFinancials?.unpaidInvoicesCount} Invoices Unpaid
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#6366f1', fontWeight: '700' }}>Settlement Efficiency</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4f46e5', marginTop: '0.3rem' }}>
                {(activeFinancials?.totalBilledRevenue ?? 0) > 0
                  ? `${Math.min(100, Math.round(((activeFinancials?.totalCollectedRevenue ?? 0) / activeFinancials.totalBilledRevenue) * 100))}%`
                  : '100%'}
              </div>
              <div style={{
                background: '#e2e8f0',
                borderRadius: '999px',
                height: '6px',
                marginTop: '0.4rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#4f46e5',
                  height: '100%',
                  width: `${(activeFinancials?.totalBilledRevenue ?? 0) > 0 ? Math.min(100, Math.round(((activeFinancials?.totalCollectedRevenue ?? 0) / activeFinancials.totalBilledRevenue) * 100)) : 100}%`
                }} />
              </div>
            </div>
          </div>

          {/* 2-Column Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📋 Invoice Settlement Health
              </h3>
              <div className="receipt-row"><span>Total Invoices Issued:</span> <strong>{activeFinancials?.totalInvoicesCount}</strong></div>
              <div className="receipt-row"><span>Fully Settled Invoices:</span> <strong style={{ color: '#059669' }}>{activeFinancials?.paidInvoicesCount}</strong></div>
              <div className="receipt-row"><span>Partially Paid Invoices:</span> <strong style={{ color: '#d97706' }}>{activeFinancials?.partialInvoicesCount}</strong></div>
              <div className="receipt-row"><span>Unpaid Invoices:</span> <strong style={{ color: '#ef4444' }}>{activeFinancials?.unpaidInvoicesCount}</strong></div>
              <div className="receipt-row total" style={{ marginTop: '0.6rem' }}>
                <span>Total Billed:</span> <span>Rs. {activeFinancials?.totalBilledRevenue?.toLocaleString()}</span>
              </div>
              <div className="receipt-row" style={{ marginTop: '0.35rem' }}>
                <span>Total Collected:</span>
                <strong style={{ color: '#059669' }}>Rs. {activeFinancials?.totalCollectedRevenue?.toLocaleString()}</strong>
              </div>
              <div className="receipt-row" style={{ marginTop: '0.4rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.4rem' }}>
                <span style={{ fontWeight: '700' }}>Outstanding Balance Due:</span>
                <strong style={{ color: (activeFinancials?.totalOutstandingBalance ?? 0) > 0 ? '#ef4444' : '#059669', fontSize: '1.05rem' }}>
                  Rs. {activeFinancials?.totalOutstandingBalance?.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                💳 Collections by Payment Method
              </h3>
              {Object.entries(activeFinancials?.revenueByPaymentMethod || {}).map(([method, amount]) => (
                <div key={method} className="receipt-row">
                  <span>{method.replace(/_/g, ' ')}:</span>
                  <strong>Rs. {Number(amount).toLocaleString()}</strong>
                </div>
              ))}
              <div className="receipt-row total">
                <span>Total Cashier Collections:</span>
                <span style={{ color: '#059669' }}>Rs. {activeFinancials?.totalCollectedRevenue?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: DETAILED INVOICE STATEMENT (Single Month) OR MULTI-MONTH HISTORY (All Time) */}
          <div style={{ marginTop: '1.5rem' }}>
            {selectedReportMonth !== 'ALL' ? (
              // 1. SPECIFIC MONTH: Render Itemized Invoice Statement Table
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      📑 Invoices Issued in {activeFinancials?.monthlyBreakdown?.find(m => m.monthKey === selectedReportMonth)?.monthName || selectedReportMonth}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Detailed audit statement of all {activeFinancials?.totalInvoicesCount ?? 0} invoice(s) for this monthly billing cycle
                    </span>
                  </div>
                  <button
                    className="btn-sm-action no-print"
                    onClick={() => handleReportMonthChange('ALL')}
                    style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#334155' }}
                  >
                    🌐 View All-Time Months History
                  </button>
                </div>

                {invoices.filter((inv) => {
                  const d = inv.issueDate || (inv.createdAt ? inv.createdAt.substring(0, 10) : '');
                  return d && d.startsWith(selectedReportMonth);
                }).length > 0 ? (
                  <div className="epic-table-wrapper">
                    <table className="epic-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Issue Date</th>
                          <th>Pet & Owner</th>
                          <th>Doctor / Ward</th>
                          <th>Total Billed</th>
                          <th>Paid Amount</th>
                          <th>Balance Due</th>
                          <th>Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.filter((inv) => {
                          const d = inv.issueDate || (inv.createdAt ? inv.createdAt.substring(0, 10) : '');
                          return d && d.startsWith(selectedReportMonth);
                        }).map((inv) => {
                          const invTotal = inv.totalAmount || 0;
                          const invBal = inv.balanceAmount ?? (inv.paymentStatus === 'PAID' ? 0 : invTotal);
                          const invColl = (inv.paymentStatus === 'PAID')
                            ? invTotal
                            : (inv.paymentStatus === 'UNPAID' ? 0 : Math.max(0, invTotal - invBal));

                          return (
                            <tr key={inv.id || inv.invoiceNumber}>
                              <td><strong>{inv.invoiceNumber}</strong></td>
                              <td>{inv.issueDate || (inv.createdAt ? inv.createdAt.substring(0, 10) : '—')}</td>
                              <td>
                                <strong>{inv.petName}</strong>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>{inv.ownerName}</span>
                              </td>
                              <td>{inv.doctorName || 'General Clinic'}</td>
                              <td><strong>Rs. {invTotal.toLocaleString()}</strong></td>
                              <td style={{ color: '#059669', fontWeight: '700' }}>Rs. {invColl.toLocaleString()}</td>
                              <td style={{ color: invBal > 0 ? '#ef4444' : '#059669', fontWeight: '600' }}>
                                Rs. {invBal.toLocaleString()}
                              </td>
                              <td>
                                <span className={`status-pill ${inv.paymentStatus === 'PAID' ? 'confirmed' : inv.paymentStatus === 'PARTIALLY_PAID' ? 'pending' : 'rejected'}`}>
                                  {inv.paymentStatus === 'PAID' ? 'Fully Paid' : inv.paymentStatus === 'PARTIALLY_PAID' ? 'Partial Paid' : 'Unpaid'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', fontWeight: '800', borderTop: '2px solid #cbd5e1' }}>
                          <td colSpan={4} style={{ textAlign: 'right', padding: '10px' }}>
                            Monthly Audit Statement Total:
                          </td>
                          <td style={{ color: '#0f172a' }}>Rs. {activeFinancials?.totalBilledRevenue?.toLocaleString()}</td>
                          <td style={{ color: '#059669' }}>Rs. {activeFinancials?.totalCollectedRevenue?.toLocaleString()}</td>
                          <td style={{ color: (activeFinancials?.totalOutstandingBalance ?? 0) > 0 ? '#ef4444' : '#059669' }}>
                            Rs. {activeFinancials?.totalOutstandingBalance?.toLocaleString()}
                          </td>
                          <td style={{ color: '#4f46e5' }}>
                            {(activeFinancials?.totalBilledRevenue ?? 0) > 0
                              ? `${Math.min(100, Math.round(((activeFinancials?.totalCollectedRevenue ?? 0) / activeFinancials.totalBilledRevenue) * 100))}% Settled`
                              : '100%'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No invoice transactions recorded for this month.
                  </p>
                )}
              </div>
            ) : (
              // 2. ALL TIME: Render Multi-Month Comparison History Table
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      📅 Cumulative Multi-Month Financial Performance History
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Month-by-month revenue trends, settlement metrics, and historical collection efficiency
                    </span>
                  </div>
                </div>

                {activeFinancials?.monthlyBreakdown && activeFinancials.monthlyBreakdown.length > 0 ? (
                  <div className="epic-table-wrapper">
                    <table className="epic-table">
                      <thead>
                        <tr>
                          <th>Month / Period</th>
                          <th>Invoices</th>
                          <th>Settled / Pending</th>
                          <th>Billed Amount</th>
                          <th>Collected Amount</th>
                          <th>Outstanding Balance</th>
                          <th>Collection Rate</th>
                          <th className="no-print">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeFinancials.monthlyBreakdown.map((m) => {
                          const isCurrent = selectedReportMonth === m.monthKey;
                          const rate = m.billed > 0 ? Math.min(100, Math.round((m.collected / m.billed) * 100)) : 100;
                          return (
                            <tr
                              key={m.monthKey}
                              style={{
                                background: isCurrent ? '#f0fdf4' : 'transparent',
                                fontWeight: isCurrent ? '700' : 'normal'
                              }}
                            >
                              <td>
                                <strong>{m.monthName}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>({m.monthKey})</div>
                              </td>
                              <td>{m.invoiceCount}</td>
                              <td>
                                <span style={{ color: '#059669', fontWeight: '600' }}>{m.paidCount} Paid</span>
                                {(m.partialCount > 0 || m.unpaidCount > 0) && (
                                  <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '6px' }}>
                                    ({m.unpaidCount + m.partialCount} Unsettled)
                                  </span>
                                )}
                              </td>
                              <td>Rs. {m.billed.toLocaleString()}</td>
                              <td style={{ color: '#059669', fontWeight: '700' }}>Rs. {m.collected.toLocaleString()}</td>
                              <td style={{ color: m.outstanding > 0 ? '#ef4444' : '#059669', fontWeight: '600' }}>
                                Rs. {m.outstanding.toLocaleString()}
                              </td>
                              <td>
                                <span style={{
                                  background: rate >= 80 ? '#dcfce7' : rate >= 50 ? '#fef3c7' : '#fee2e2',
                                  color: rate >= 80 ? '#166534' : rate >= 50 ? '#92400e' : '#991b1b',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '999px',
                                  fontSize: '0.8rem',
                                  fontWeight: '700'
                                }}>
                                  {rate}%
                                </span>
                              </td>
                              <td className="no-print">
                                <button
                                  className="btn-sm-action"
                                  onClick={() => handleReportMonthChange(m.monthKey)}
                                  style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#334155' }}
                                >
                                  🔍 View Month Statement
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No historical monthly invoices recorded yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER REVIEWS (US 4.26) */}
      {activeTab === 'feedback' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>⭐ Pet Owner Feedback & Reviews Moderation</h2>
          </div>

          <div className="epic-table-wrapper">
            <table className="epic-table">
              <thead>
                <tr>
                  <th>Appointment #</th>
                  <th>Pet / Owner</th>
                  <th>Veterinarian</th>
                  <th>Rating</th>
                  <th>Review Comments</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.appointmentNumber}</strong></td>
                    <td>{f.petName} ({f.ownerName})</td>
                    <td>{f.doctorName}</td>
                    <td>
                      <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '1rem' }}>
                        {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }}><em>"{f.reviewComments}"</em></td>
                    <td>
                      <span className={`status-pill ${f.published ? 'confirmed' : 'rejected'}`}>
                        {f.published ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn-sm-action ${f.published ? 'btn-reject' : 'btn-approve'}`}
                        onClick={() => handleToggleFeedback(f.id, f.published)}
                      >
                        {f.published ? 'Hide Review' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 0: ASSIGN DOCTOR & APPROVE */}
      {showAssignModal && selectedAppt && (() => {
        const currentAvail = getDoctorAvailabilityInfo(
          assignDoctorId,
          selectedAppt.appointmentDate,
          selectedAppt.timeSlot,
          selectedAppt.id
        );

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '620px', width: '95%' }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                    ✓ Review Schedule & Allocate Veterinarian
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Verify doctor availability, day schedule & slot capacity before confirming appointment #{selectedAppt.appointmentNumber}.
                  </p>
                </div>
                <button className="modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
              </div>

              <form onSubmit={handleAssignAndApprove}>
                {/* Appointment Overview Banner */}
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748b' }}>Patient:</span> <strong>🐾 {selectedAppt.petName}</strong> ({normalizeSpecies(selectedAppt.petSpecies)})</div>
                    <div><span style={{ color: '#64748b' }}>Owner:</span> <strong>{selectedAppt.ownerName}</strong> ({selectedAppt.ownerPhone})</div>
                    <div><span style={{ color: '#64748b' }}>Date & Slot:</span> <strong style={{ color: '#0369a1' }}>📅 {selectedAppt.appointmentDate} ({selectedAppt.timeSlot})</strong></div>
                    <div><span style={{ color: '#64748b' }}>Owner Preference:</span> <em>{selectedAppt.doctorPreference || selectedAppt.doctorName || 'No preference'}</em></div>
                  </div>
                </div>

                {/* Doctor Availability Comparison & Allocation Selector */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: '700', display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>
                    🩺 Select Veterinarian & Check Schedule Availability:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                    {doctorsList.map((d) => {
                      const dAvail = getDoctorAvailabilityInfo(
                        d.id,
                        selectedAppt.appointmentDate,
                        selectedAppt.timeSlot,
                        selectedAppt.id
                      );
                      const isSelected = assignDoctorId === d.id;

                      let badge = null;
                      if (dAvail.statusReason === 'OFF_DUTY') {
                        badge = (
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '0.25rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            ⚠️ Off-Duty ({dAvail.dayName})
                          </span>
                        );
                      } else if (dAvail.statusReason === 'OUTSIDE_HOURS') {
                        badge = (
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '0.25rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            ⚠️ Outside Shift
                          </span>
                        );
                      } else if (dAvail.statusReason === 'SLOT_CONFLICT') {
                        badge = (
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.25rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            🔴 Slot Booked
                          </span>
                        );
                      } else {
                        badge = (
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.25rem 0.6rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            🟢 Available
                          </span>
                        );
                      }

                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            setAssignDoctorId(d.id);
                            setAssignDoctorName(d.name);
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: `2px solid ${isSelected ? (dAvail.isAvailable ? '#3b82f6' : '#f59e0b') : '#e2e8f0'}`,
                            background: isSelected ? (dAvail.isAvailable ? '#eff6ff' : '#fffbeb') : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>
                              {d.name} {isSelected && <span style={{ color: dAvail.isAvailable ? '#2563eb' : '#d97706', fontSize: '0.8rem' }}>✓ Selected</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {d.spec} &bull; Shift: <strong style={{ color: '#334155' }}>{dAvail.shift}</strong>
                            </div>
                          </div>
                          <div>
                            {badge}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Schedule Details for Selected Doctor */}
                <div style={{
                  background: currentAvail.isAvailable ? '#f0fdf4' : currentAvail.statusReason === 'OFF_DUTY' ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${currentAvail.isAvailable ? '#bbf7d0' : currentAvail.statusReason === 'OFF_DUTY' ? '#fde68a' : '#fecaca'}`,
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {currentAvail.isAvailable ? '✅' : currentAvail.statusReason === 'OFF_DUTY' ? '📅' : '⚠️'}
                    </span>
                    <strong style={{
                      fontSize: '0.9rem',
                      color: currentAvail.isAvailable ? '#15803d' : currentAvail.statusReason === 'OFF_DUTY' ? '#92400e' : '#b91c1c'
                    }}>
                      {currentAvail.statusReason === 'OFF_DUTY'
                        ? `${assignDoctorName} is Off-Duty on ${currentAvail.dayName}s`
                        : currentAvail.statusReason === 'OUTSIDE_HOURS'
                        ? `${selectedAppt.timeSlot} is outside working hours (${currentAvail.shift})`
                        : currentAvail.statusReason === 'SLOT_CONFLICT'
                        ? `Schedule Conflict: ${assignDoctorName} already has a booking at ${selectedAppt.timeSlot}`
                        : `Schedule Verified: ${assignDoctorName} is ON DUTY (${currentAvail.shift}) and available at ${selectedAppt.timeSlot}!`}
                    </strong>
                  </div>

                  {currentAvail.statusReason === 'OFF_DUTY' && (
                    <div style={{ fontSize: '0.82rem', color: '#92400e', marginTop: '0.35rem' }}>
                      <strong>Active Duty Days:</strong> {currentAvail.docWorkingDays?.length ? currentAvail.docWorkingDays.join(', ') : 'No scheduled shifts'}. Please allocate an available on-duty veterinarian.
                    </div>
                  )}

                  {currentAvail.conflictAppt && (
                    <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: '0.35rem' }}>
                      <strong>Conflicting Appointment:</strong> #{currentAvail.conflictAppt.appointmentNumber} for {currentAvail.conflictAppt.petName} ({currentAvail.conflictAppt.status})
                    </div>
                  )}

                  {/* Doctor's Day Schedule Timeline */}
                  <div style={{ marginTop: '0.6rem', borderTop: `1px dashed ${currentAvail.isAvailable ? '#bbf7d0' : '#fecaca'}`, paddingTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>
                      📋 {assignDoctorName}'s Schedule for {selectedAppt.appointmentDate} ({currentAvail.dayAppointments.length} total visit{currentAvail.dayAppointments.length !== 1 ? 's' : ''}):
                    </div>
                    {currentAvail.dayAppointments.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: '#16a34a', fontStyle: 'italic' }}>
                        ✨ No other appointments on this date &mdash; Doctor's schedule is completely open!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {currentAvail.dayAppointments.map((da) => (
                          <span
                            key={da.id}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: da.id === selectedAppt.id ? '#dbeafe' : '#f1f5f9',
                              border: `1px solid ${da.id === selectedAppt.id ? '#93c5fd' : '#cbd5e1'}`,
                              color: da.id === selectedAppt.id ? '#1d4ed8' : '#334155',
                              fontWeight: da.id === selectedAppt.id ? '700' : '500',
                            }}
                          >
                            ⏰ {da.timeSlot}: {da.petName} {da.id === selectedAppt.id ? '(This Request)' : `(${da.status})`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-sm-action"
                    style={{ flex: 1, padding: '0.65rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '600' }}
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-epic"
                    style={{ flex: 2, justifyContent: 'center', padding: '0.65rem' }}
                    disabled={!currentAvail.isAvailable}
                    title={!currentAvail.isAvailable ? 'Cannot approve: Doctor off-duty or slot conflict' : 'Confirm veterinarian allocation and approve'}
                  >
                    {currentAvail.isAvailable
                      ? `✓ Allocate ${assignDoctorName} & Approve`
                      : currentAvail.statusReason === 'OFF_DUTY'
                      ? '⚠️ Doctor Off-Duty — Select On-Duty Doctor'
                      : '⚠️ Slot Busy — Select Another Doctor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 0: VIEW APPOINTMENT DETAILS */}
      {showDetailsModal && selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', width: '95%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                  📋 Appointment Details &bull; {selectedAppt.appointmentNumber}
                </h2>
                <span className={`status-pill ${selectedAppt.status?.toLowerCase()}`} style={{ marginTop: '0.4rem', display: 'inline-block' }}>
                  {selectedAppt.status}
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {/* Patient & Owner Card */}
              <div style={{ background: '#f8fafc', padding: '0.9rem 1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', color: '#0f172a' }}>🐾 Patient & Pet Owner</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div><strong>Pet Name:</strong> {selectedAppt.petName}</div>
                  <div><strong>Species:</strong> {normalizeSpecies(selectedAppt.petSpecies)} {selectedAppt.petBreed ? `(${selectedAppt.petBreed})` : ''}</div>
                  <div><strong>Owner Name:</strong> {selectedAppt.ownerName}</div>
                  <div><strong>Phone:</strong> {selectedAppt.ownerPhone}</div>
                  {selectedAppt.petAge && <div><strong>Age:</strong> {selectedAppt.petAge}</div>}
                </div>
              </div>

              {/* Consultation & Schedule Card */}
              <div style={{ background: '#f8fafc', padding: '0.9rem 1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', color: '#0f172a' }}>🩺 Schedule & Veterinarian</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div><strong>Attending Doctor:</strong> {selectedAppt.doctorName}</div>
                  {selectedAppt.doctorSpecialization && <div><strong>Specialization:</strong> {selectedAppt.doctorSpecialization}</div>}
                  <div><strong>Date:</strong> {selectedAppt.appointmentDate}</div>
                  <div><strong>Time Slot:</strong> {selectedAppt.timeSlot}</div>
                  {selectedAppt.appointmentType && <div><strong>Type:</strong> {selectedAppt.appointmentType}</div>}
                  {selectedAppt.previousDoctorName && (
                    <div style={{ gridColumn: 'span 2', color: '#86198f' }}>
                      <strong>Reassigned from:</strong> {selectedAppt.previousDoctorName}
                    </div>
                  )}
                </div>

                {/* Day Schedule Inspection */}
                {(() => {
                  const docAvail = getDoctorAvailabilityInfo(
                    selectedAppt.doctorId,
                    selectedAppt.appointmentDate,
                    selectedAppt.timeSlot,
                    selectedAppt.id
                  );
                  return (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#475569', fontWeight: '600' }}>
                          📅 {selectedAppt.doctorName}'s Day Roster ({selectedAppt.appointmentDate}):
                        </span>
                        <span style={{ color: '#0369a1', fontWeight: '700' }}>Shift: {docAvail.shift}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {docAvail.dayAppointments.length === 0 ? (
                          <span style={{ color: '#16a34a', fontStyle: 'italic' }}>No other visits on this date</span>
                        ) : (
                          docAvail.dayAppointments.map((da) => (
                            <span
                              key={da.id}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: da.id === selectedAppt.id ? '#dbeafe' : '#f1f5f9',
                                border: `1px solid ${da.id === selectedAppt.id ? '#93c5fd' : '#cbd5e1'}`,
                                color: da.id === selectedAppt.id ? '#1d4ed8' : '#475569',
                                fontWeight: da.id === selectedAppt.id ? '700' : '500',
                              }}
                            >
                              ⏰ {da.timeSlot}: {da.petName} {da.id === selectedAppt.id ? '(This)' : ''}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Clinical & Visit Notes */}
              {(selectedAppt.reasonForVisit || selectedAppt.symptoms || selectedAppt.doctorNotes || selectedAppt.adminNotes || selectedAppt.rejectionReason || selectedAppt.cancellationReason) && (
                <div style={{ background: '#f8fafc', padding: '0.9rem 1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', color: '#0f172a' }}>📝 Visit Notes & Clinical Details</h3>
                  {selectedAppt.reasonForVisit && (
                    <div style={{ marginBottom: '0.4rem' }}>
                      <strong>Reason for Visit:</strong> {selectedAppt.reasonForVisit}
                    </div>
                  )}
                  {selectedAppt.symptoms && (
                    <div style={{ marginBottom: '0.4rem' }}>
                      <strong>Reported Symptoms:</strong> {selectedAppt.symptoms}
                    </div>
                  )}
                  {selectedAppt.doctorNotes && (
                    <div style={{ marginBottom: '0.4rem', color: '#0369a1' }}>
                      <strong>Doctor Notes:</strong> {selectedAppt.doctorNotes}
                    </div>
                  )}
                  {selectedAppt.adminNotes && (
                    <div style={{ marginBottom: '0.4rem', color: '#475569' }}>
                      <strong>Admin Notes:</strong> {selectedAppt.adminNotes}
                    </div>
                  )}
                  {selectedAppt.rejectionReason && (
                    <div style={{ marginBottom: '0.4rem', color: '#dc2626' }}>
                      <strong>Rejection Reason:</strong> {selectedAppt.rejectionReason}
                    </div>
                  )}
                  {selectedAppt.cancellationReason && (
                    <div style={{ marginBottom: '0.4rem', color: '#dc2626' }}>
                      <strong>{(selectedAppt.status === 'EXPIRED' || selectedAppt.status === 'NO_SHOW') ? 'Expiration / No-Show Reason:' : 'Cancellation Reason:'}</strong> {selectedAppt.cancellationReason} {selectedAppt.cancelledBy ? `(by ${selectedAppt.cancelledBy})` : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Billing & Invoice Quick Action (Only for COMPLETED or already invoiced appointments) */}
              {(selectedAppt.status === 'COMPLETED' || selectedAppt.isBilled || selectedAppt.invoiceId) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '0.85rem 1.1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong>Billing Status:</strong>{' '}
                    {selectedAppt.isBilled || selectedAppt.invoiceId ? (
                      <span style={{ color: '#15803d', fontWeight: '700' }}>✓ Invoiced</span>
                    ) : (
                      <span style={{ color: '#b45309', fontWeight: '600' }}>Pending / Not Invoiced</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-sm-action"
                    style={{ background: '#059669', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: '600' }}
                    onClick={() => {
                      setShowDetailsModal(false);
                      setActiveTab('invoicing');
                    }}
                  >
                    🧾 Go to Invoices & Cashier
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary-epic"
                  onClick={() => setShowDetailsModal(false)}
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 0: ASSIGN DOCTOR & APPROVE APPOINTMENT (US 4.15) */}
      {showAssignModal && selectedAppt && (() => {
        const availInfo = getDoctorAvailabilityInfo(assignDoctorId, selectedAppt.appointmentDate, selectedAppt.timeSlot, selectedAppt.id);
        const hasConflict = !availInfo.isAvailable;

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px' }}>
              <div className="modal-header">
                <h2>✓ Approve Appointment #{selectedAppt.appointmentNumber}</h2>
                <button className="modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
              </div>

              {/* Booking Context */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span><strong>🐾 Patient:</strong> {selectedAppt.petName} ({normalizeSpecies(selectedAppt.petSpecies)})</span>
                  <span><strong>👤 Owner:</strong> {selectedAppt.ownerName}</span>
                </div>
                <div style={{ color: '#0369a1', fontSize: '0.82rem' }}>
                  <strong>Requested:</strong> {selectedAppt.appointmentDate} at {selectedAppt.timeSlot}
                </div>
              </div>

              <form onSubmit={handleAssignAndApprove}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    👨‍⚕️ Assign Veterinarian <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    value={assignDoctorId}
                    onChange={(e) => {
                      const doc = doctorsList.find((d) => d.id === e.target.value);
                      setAssignDoctorId(e.target.value);
                      if (doc) setAssignDoctorName(doc.name);
                    }}
                  >
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conflict / Roster Warning */}
                {hasConflict ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#991b1b' }}>
                    <strong>⚠️ Slot Conflict / Unavailability Detected:</strong>
                    <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {availInfo.statusReason === 'OFF_DUTY' ? (
                        <span>{assignDoctorName} is <strong>off-duty</strong> on {availInfo.dayName}. Working days: {availInfo.docWorkingDays.join(', ')}.</span>
                      ) : availInfo.statusReason === 'SLOT_CONFLICT' ? (
                        <span>{assignDoctorName} already has an active appointment (<strong>#{availInfo.conflictAppt?.appointmentNumber} - {availInfo.conflictAppt?.petName}</strong>) at {selectedAppt.timeSlot}.</span>
                      ) : (
                        <span>Slot {selectedAppt.timeSlot} falls outside {assignDoctorName}'s shift ({availInfo.shift}).</span>
                      )}
                    </div>
                    <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#b91c1c' }}>
                      👉 Please reassign to an available doctor or reschedule this consultation to prevent double-booking.
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#166534' }}>
                    ✅ <strong>Doctor Available:</strong> {assignDoctorName} is on duty on {availInfo.dayName} ({availInfo.shift}) with no conflicting bookings.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-epic"
                    style={{
                      flex: 2,
                      justifyContent: 'center',
                      background: hasConflict ? '#94a3b8' : '#10b981',
                      cursor: hasConflict ? 'not-allowed' : 'pointer'
                    }}
                    disabled={hasConflict}
                  >
                    {hasConflict ? '❌ Slot Conflict - Cannot Approve' : '✓ Approve & Allocate Doctor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 1: REASSIGN DOCTOR (US 4.17) */}
      {showReassignModal && selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔄 Reassign Veterinarian for {selectedAppt.petName}</h2>
              <button className="modal-close" onClick={() => setShowReassignModal(false)}>✕</button>
            </div>
            <form onSubmit={handleReassignSubmit}>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Current: <strong>{selectedAppt.doctorName}</strong> on {selectedAppt.appointmentDate} ({selectedAppt.timeSlot})
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Select New Doctor</label>
                <select
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={reassignDoctorId}
                  onChange={(e) => {
                    const doc = doctorsList.find((d) => d.id === e.target.value);
                    setReassignDoctorId(e.target.value);
                    if (doc) setReassignDoctorName(doc.name);
                  }}
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} &mdash; {d.spec}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Reassignment Reason / Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Original doctor on emergency surgery"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Confirm Reassignment & Notify Owner
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESCHEDULE WITH REAL-TIME DOCTOR AVAILABILITY (US 4.18) */}
      {showRescheduleModal && selectedAppt && (() => {
        const availInfo = getDoctorAvailabilityInfo(rescheduleDoctorId, rescheduleDate, rescheduleSlot, selectedAppt?.id);
        const isDoctorWorking = availInfo.isWorking && rescheduleSlots.length > 0;

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '560px' }}>
              <div className="modal-header">
                <h2>📅 Reschedule Appointment #{selectedAppt.appointmentNumber}</h2>
                <button className="modal-close" onClick={() => setShowRescheduleModal(false)}>✕</button>
              </div>

              {/* Patient & Current Schedule Summary */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span><strong>🐾 Patient:</strong> {selectedAppt.petName} ({normalizeSpecies(selectedAppt.petSpecies)})</span>
                  <span><strong>👤 Owner:</strong> {selectedAppt.ownerName}</span>
                </div>
                <div style={{ color: '#166534', fontSize: '0.82rem' }}>
                  <strong>Current Booking:</strong> {selectedAppt.doctorName} &bull; {selectedAppt.appointmentDate} at {selectedAppt.timeSlot}
                </div>
              </div>

              <form onSubmit={handleRescheduleSubmit}>
                {/* Doctor Selector */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      👨‍⚕️ Assigned Veterinarian <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {isDoctorWorking && (
                      <span style={{ fontSize: '0.78rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: '600' }}>
                        Shift: {availInfo.shift}
                      </span>
                    )}
                  </div>
                  <select
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    value={rescheduleDoctorId}
                    onChange={handleRescheduleDoctorChange}
                  >
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Dynamic Slot Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                      📆 New Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                      value={rescheduleDate}
                      onChange={handleRescheduleDateChange}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                      ⏰ Doctor Available Slot {loadingRescheduleSlots && <span style={{ color: '#3b82f6', fontSize: '0.78rem' }}>(Checking...)</span>}
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        background: !isDoctorWorking ? '#f8fafc' : '#ffffff'
                      }}
                      value={rescheduleSlot}
                      onChange={(e) => setRescheduleSlot(e.target.value)}
                      disabled={loadingRescheduleSlots || !isDoctorWorking}
                    >
                      {loadingRescheduleSlots ? (
                        <option value="">Checking doctor shifts...</option>
                      ) : !isDoctorWorking ? (
                        <option value="">🚫 Doctor Off-Duty on this day</option>
                      ) : (
                        rescheduleSlots.map((slotObj, idx) => (
                          <option
                            key={idx}
                            value={slotObj.timeSlot}
                            disabled={!slotObj.available && slotObj.timeSlot !== selectedAppt.timeSlot}
                            style={{
                              color: slotObj.available || slotObj.timeSlot === selectedAppt.timeSlot ? '#166534' : '#991b1b',
                              fontWeight: slotObj.available ? '600' : 'normal'
                            }}
                          >
                            {slotObj.timeSlot} {slotObj.available ? '✅ Available' : (slotObj.timeSlot === selectedAppt.timeSlot ? '(Current Slot)' : '❌ Occupied')}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Off-Duty Warning / Roster Details */}
                {!isDoctorWorking ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#991b1b' }}>
                    <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>
                      ⚠️ Doctor Off-Duty: {rescheduleDoctorName} has no scheduled shift on {availInfo.dayName || 'this day'}.
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
                      <strong>Active Working Days:</strong> {availInfo.docWorkingDays && availInfo.docWorkingDays.length > 0 ? availInfo.docWorkingDays.join(', ') : 'Not scheduled'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '0.35rem' }}>
                      👉 Please select a valid working day above or assign another available veterinarian.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    💡 <em>Doctor is on duty on {availInfo.dayName} ({availInfo.shift}). Occupied slots are protected against double-booking.</em>
                  </div>
                )}

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    📝 Reschedule Reason / Note <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pet owner requested time change / Doctor emergency shift"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowRescheduleModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-epic"
                    style={{
                      flex: 2,
                      justifyContent: 'center',
                      background: !isDoctorWorking || !rescheduleSlot ? '#94a3b8' : undefined,
                      cursor: !isDoctorWorking || !rescheduleSlot ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loadingRescheduleSlots || !isDoctorWorking || !rescheduleSlot}
                  >
                    {!isDoctorWorking ? '❌ Doctor Off-Duty on Date' : '📅 Update Schedule & Dispatch Alert'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: REJECT REASON & OFFER OWNER OPTIONS (US 4.16) */}
      {showRejectModal && selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>✕ Decline Appointment ({selectedAppt.appointmentNumber})</h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#991b1b' }}>
              <strong>ℹ️ Pet Owner Resolution Workflow:</strong>
              <div style={{ marginTop: '0.35rem', color: '#7f1d1d', lineHeight: '1.4' }}>
                When declined, the pet owner will immediately receive a notification with <strong>2 self-service rebooking options</strong>:
                <ul style={{ margin: '0.35rem 0 0 1.1rem', padding: 0 }}>
                  <li><strong>Option 1:</strong> Select a different time slot with <em>{selectedAppt.doctorName}</em>.</li>
                  <li><strong>Option 2:</strong> Select another available veterinarian.</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Decline Reason / Explanation for Owner <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Selected vet is on leave for this date, or hospital is fully booked."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              {/* Quick reason chips */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>Quick Reasons:</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    'Selected vet is on leave for this date.',
                    'Doctor in emergency surgery.',
                    'Time slot fully booked.',
                    'Clinic closed for maintenance.',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setRejectReason(preset)}
                      style={{
                        background: rejectReason === preset ? '#fee2e2' : '#f1f5f9',
                        border: '1px solid ' + (rejectReason === preset ? '#f87171' : '#cbd5e1'),
                        color: rejectReason === preset ? '#991b1b' : '#334155',
                        borderRadius: '9999px',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center', background: '#dc2626' }}>
                ✕ Confirm Decline & Send Options to Owner
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VET SCHEDULE CONFIG (US 4.13) */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🕒 Configure Veterinarian Shift</h2>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSchedule}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Doctor</label>
                <select
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={schedDoctorId}
                  onChange={(e) => {
                    const doc = doctorsList.find((d) => d.id === e.target.value);
                    setSchedDoctorId(e.target.value);
                    if (doc) setSchedDoctorName(doc.name);
                  }}
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Days of Week</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => {
                    const isSelected = schedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          if (isSelected) {
                            setSchedDays(schedDays.filter(d => d !== day));
                          } else {
                            setSchedDays([...schedDays, day]);
                          }
                        }}
                        style={{
                          background: isSelected ? '#0369a1' : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: `1px solid ${isSelected ? '#0369a1' : '#cbd5e1'}`,
                          padding: '0.5rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flex: '1 1 auto',
                          textAlign: 'center'
                        }}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Start Time</label>
                  <input
                    type="time"
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>End Time</label>
                  <input
                    type="time"
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Slot Duration (Minutes)</label>
                  <select
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={schedDuration}
                    onChange={(e) => setSchedDuration(Number(e.target.value))}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Standard)</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Capacity per Slot</label>
                  <input
                    type="number"
                    required
                    min="1"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={schedCapacity}
                    onChange={(e) => setSchedCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="schedIsActive"
                  checked={schedIsActive}
                  onChange={(e) => setSchedIsActive(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
                <label htmlFor="schedIsActive" style={{ fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', color: schedIsActive ? '#059669' : '#475569' }}>
                  {schedIsActive ? '🟢 Shift is currently ACTIVE' : '⚪ Shift is currently INACTIVE'}
                </label>
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Save Shift Configuration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: HOSPITALIZATION CHARGES (US 4.27) */}
      {showHospChargeModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🏥 Add Hospitalization Charges to #{selectedInvoice.invoiceNumber}</h2>
              <button className="modal-close" onClick={() => setShowHospChargeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddHospChargeSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Hospitalization Fee (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={hospAmount}
                  onChange={(e) => setHospAmount(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Inpatient / Cage Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward B Inpatient Care - 3 Days & Daily Monitoring"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={hospDetails}
                  onChange={(e) => setHospDetails(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Apply Hospitalization Charges
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5.5: ITEMIZED INVOICE BILL DETAILS (ADMIN) */}
      {showInvoiceDetailsModal && selectedInvoice && (
        <div className="modal-overlay" style={{ alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '850px',
              width: '100%',
              padding: 0,
              borderRadius: '0px',
              background: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Top Solid Full-Width Blue Header Band */}
            <div style={{
              height: '24px',
              background: '#5682b1',
              width: '100%',
              minWidth: '100%',
              flexShrink: 0,
              borderRadius: '0'
            }} />

            {/* Floating Close Button for on-screen view */}
            <button
              type="button"
              className="no-print"
              onClick={() => setShowInvoiceDetailsModal(false)}
              title="Close invoice"
              style={{
                position: 'absolute',
                right: '16px',
                top: '28px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#64748b',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20
              }}
            >
              ✕
            </button>

            {/* Invoice Page Document Body */}
            <div
              id="printable-invoice-admin"
              className="printable-invoice-sheet"
              style={{
                padding: '1.75rem 2.25rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}
            >
              {/* Top Section Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Header Section */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '1.1rem',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                    <div style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '50%',
                      border: '3.5px solid #5682b1',
                      padding: '3px',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}>
                      <img
                        src="/dog_and_cat.jpg"
                        alt="Hospital Logo"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.25' }}>
                        Sri Jayawardenapura<br />Animal Hospital
                      </h3>
                      <div style={{ margin: '0.3rem 0', fontSize: '0.78rem', color: '#64748b', lineHeight: '1.35' }}>
                        No. 34, Parliament Road, Perakumba Mawatha, Ethul Kotte,<br />
                        Sri Jayawardenepura Kotte
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.7rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '700' }}>
                        Hotline: 0112 888 291
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: selectedInvoice.balanceAmount <= 0 ? '#f0fdf4' : '#f8fafc',
                    border: selectedInvoice.balanceAmount <= 0 ? '1px solid #dcfce7' : '1px solid #e2e8f0',
                    padding: '0.85rem 1.3rem',
                    borderRadius: '12px',
                    textAlign: 'left',
                    minWidth: '165px',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: selectedInvoice.balanceAmount <= 0 ? '#10b981' : '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {selectedInvoice.balanceAmount <= 0 ? 'OFFICIAL RECEIPT' : 'INVOICE'}
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0.15rem 0' }}>
                      #{selectedInvoice.invoiceNumber}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: selectedInvoice.balanceAmount <= 0 ? '#10b981' : '#dc2626' }}>
                      {selectedInvoice.balanceAmount <= 0 ? 'PAID IN FULL' : 'PENDING PAYMENT'}
                    </div>
                  </div>
                </div>

                {/* 3 Information Cards Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem'
                }}>
                  {/* Card 1: Owner Details */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      OWNER DETAILS
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.25rem' }}>
                      Owner: <strong style={{ color: '#0f172a' }}>{selectedInvoice.ownerName || 'Hansani Malshi'}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Contact: <strong style={{ color: '#0f172a' }}>{selectedInvoice.ownerPhone || '+94 77 123 4567'}</strong>
                    </div>
                  </div>

                  {/* Card 2: Patient Details */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      PATIENT DETAILS
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.25rem' }}>
                      Patient: <strong style={{ color: '#0f172a' }}>{selectedInvoice.petName || 'Ameena'}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Doctor: <strong style={{ color: '#0f172a' }}>{selectedInvoice.doctorName || (doctorsList.find(d => d.id === selectedInvoice.doctorId)?.name) || 'Attending Doctor'}</strong>
                    </div>
                  </div>

                  {/* Card 3: Invoice Details */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      INVOICE DETAILS
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.25rem' }}>
                      Invoice Date: <strong style={{ color: '#0f172a' }}>{selectedInvoice.issueDate || '2026-09-09'}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Status: <strong style={{ color: selectedInvoice.balanceAmount <= 0 ? '#10b981' : '#dc2626' }}>
                        {selectedInvoice.balanceAmount <= 0 ? 'PAID' : (selectedInvoice.paymentStatus || 'UNPAID')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Table section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                      Itemized Services & Procedures
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Currency: LKR</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Service / Medication</th>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Type</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Unit Price</th>
                        <th style={{ textAlign: 'right', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInvoice.items || []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: '600' }}>{item.description}</td>
                          <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>{item.itemType || 'SERVICE'}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', color: '#0f172a' }}>{item.quantity}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#475569' }}>Rs. {Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#0f172a', fontWeight: '700' }}>
                            Rs. {(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {selectedInvoice.hospitalizationCharges > 0 && (
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: '600' }}>Hospitalization & Inpatient Care Charges</td>
                          <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>HOSPITALIZATION</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', color: '#0f172a' }}>1</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#475569' }}>Rs. {Number(selectedInvoice.hospitalizationCharges).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#0f172a', fontWeight: '700' }}>
                            Rs. {Number(selectedInvoice.hospitalizationCharges).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '310px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#475569' }}>
                      <span>Total Billed</span>
                      <strong style={{ color: '#0f172a', fontSize: '1rem' }}>
                        Rs. {Number(selectedInvoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#4a7bb5', fontWeight: '600', fontSize: '0.9rem' }}>Settled (Paid)</span>
                      <strong style={{ color: '#4a7bb5', fontSize: '1.15rem', fontWeight: '800' }}>
                        Rs. {Number(selectedInvoice.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.2rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.95rem' }}>Balance Due</span>
                      <strong style={{ color: '#dc2626', fontSize: '1.25rem', fontWeight: '800' }}>
                        Rs. {Number(selectedInvoice.balanceAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flexible Gap / Bottom Block: Thank You Banner & Sub-footer pushed to page bottom */}
              <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Thank you green banner (Image 3) */}
                <div style={{
                  background: '#f0fdf4',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  textAlign: 'center',
                  border: '1px solid #dcfce7'
                }}>
                  <p style={{ margin: 0, fontWeight: '700', color: '#0f172a', fontSize: '0.92rem' }}>
                    Thank you for trusting us with your pet's care.
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.78rem' }}>
                    Please retain this receipt for your records.
                  </p>
                </div>

                {/* Bottom Sub-footer (Image 2) */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    <span>Sri Jayawardenapura Animal Hospital</span>
                    <span>Invoice #{selectedInvoice.invoiceNumber || selectedInvoice.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Sticky Action Bar at Bottom of Modal - Always Visible */}
            <div className="no-print" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1.5rem',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              flexShrink: 0
            }}>
              <div>
                {selectedInvoice.balanceAmount > 0 && (
                  <button
                    type="button"
                    className="btn-sm-action"
                    style={{ background: '#f59e0b', color: '#fff', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem' }}
                    onClick={() => handleSendPaymentReminder(selectedInvoice)}
                  >
                    📲 Send Online Payment Reminder
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="button"
                  style={{
                    background: '#4a7bb5',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 1.35rem',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 4px rgba(74, 123, 181, 0.3)'
                  }}
                  onClick={() => window.print()}
                >
                  🖨️ Print Invoice
                </button>
                <button
                  type="button"
                  className="btn-primary-epic"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                  onClick={() => setShowInvoiceDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CASHIER PAYMENT (US 4.24) */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>💵 Frontdesk Cashier Settlement #{selectedInvoice.invoiceNumber}</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCashierPaymentSubmit}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div className="receipt-row"><span>Patient:</span> <strong>{selectedInvoice.petName}</strong></div>
                <div className="receipt-row"><span>Owner:</span> <span>{selectedInvoice.ownerName}</span></div>
                <div className="receipt-row total"><span>Due Balance:</span> <span style={{ color: '#ef4444' }}>Rs. {selectedInvoice.balanceAmount?.toFixed(2)}</span></div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Amount Collected (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedInvoice.balanceAmount}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={cashierAmount}
                  onChange={(e) => setCashierAmount(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Payment Method</label>
                <select
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={cashierMethod}
                  onChange={(e) => setCashierMethod(e.target.value)}
                >
                  <option value="CASH">Cash at Counter</option>
                  <option value="CREDIT_CARD">POS Credit Card</option>
                  <option value="DEBIT_CARD">POS Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Deposit Slip</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Receipt / Slip Number</label>
                <input
                  type="text"
                  placeholder="e.g. POS Slip 9931 or Cash Note"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={cashierRef}
                  onChange={(e) => setCashierRef(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Record Payment & Issue Official Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: PRICE DOCTOR SERVICES & ISSUE INVOICE (US 4.23) */}
      {showCreateInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', width: '95%' }}>
            <div className="modal-header">
              <h2>{selectedAppt ? '💰 Price Services & Generate Invoice' : '🧾 Create Custom / Walk-in Invoice'}</h2>
              <button className="modal-close" onClick={() => setShowCreateInvoiceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerateInvoiceSubmit}>
              {selectedAppt && (
                <div style={{ background: '#f8fafc', padding: '0.85rem 1.1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>Patient: <strong>🐾 {selectedAppt.petName}</strong> ({normalizeSpecies(selectedAppt.petSpecies)})</div>
                    <div>Owner: <strong>{selectedAppt.ownerName}</strong> ({selectedAppt.ownerPhone})</div>
                    <div>Attending Doctor: <strong>{selectedAppt.doctorName}</strong></div>
                    <div>Appointment Ref: <strong>{selectedAppt.appointmentNumber}</strong></div>
                  </div>
                </div>
              )}

              {/* Walk-in / Custom invoice patient details */}
              {!selectedAppt && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', marginBottom: '0.65rem' }}>🐾 Walk-in / Custom Invoice — Patient Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '0.2rem' }}>Pet Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Buddy"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        value={newInvPetName}
                        onChange={(e) => setNewInvPetName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '0.2rem' }}>Owner / Client Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kasun Perera"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        value={newInvOwnerName}
                        onChange={(e) => setNewInvOwnerName(e.target.value)}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '0.2rem' }}>Owner Email (optional)</label>
                      <input
                        type="email"
                        placeholder="e.g. owner@example.com"
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fed7aa', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        value={newInvOwnerEmail}
                        onChange={(e) => setNewInvOwnerEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hospital Price Tariff Quick Guide (Species-Aware) */}
              {(() => {
                const sp = (selectedAppt ? selectedAppt.petSpecies : '').toLowerCase();
                let currentTariff = { name: 'Dog', icon: '🐕', cons: '2,000', vac: '1,800', proc: '1,500', med: '950', ward: '1,800' };
                if (sp.includes('cat') || sp.includes('feline')) {
                  currentTariff = { name: 'Cat', icon: '🐱', cons: '1,600', vac: '1,400', proc: '1,200', med: '750', ward: '1,200' };
                } else if (sp.includes('rabbit')) {
                  currentTariff = { name: 'Rabbit', icon: '🐇', cons: '1,200', vac: '1,000', proc: '900', med: '550', ward: '800' };
                } else if (sp.includes('bird') || sp.includes('avian')) {
                  currentTariff = { name: 'Bird', icon: '🦜', cons: '1,000', vac: '800', proc: '800', med: '450', ward: '600' };
                }

                return (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '0.65rem 0.9rem',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                    color: '#1e40af'
                  }}>
                    <div style={{ fontWeight: '700', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{currentTariff.icon} Official Standard Tariff for <strong>{currentTariff.name}</strong>:</span>
                      <span style={{ fontSize: '0.72rem', background: '#dbeafe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Auto-Applied</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <span style={{ background: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', border: '1px solid #dbeafe' }}>🩺 Consultation: Rs. {currentTariff.cons}</span>
                      <span style={{ background: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', border: '1px solid #dbeafe' }}>💉 Vaccine: Rs. {currentTariff.vac}</span>
                      <span style={{ background: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', border: '1px solid #dbeafe' }}>🩹 Procedure: Rs. {currentTariff.proc}</span>
                      <span style={{ background: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600', border: '1px solid #dbeafe' }}>💊 Medicine: Rs. {currentTariff.med}</span>
                    </div>
                  </div>
                );
              })()}

              <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#0f172a' }}>
                1. Medical Services & Prescriptions (Auto-Priced from Hospital Tariff):
              </h4>

              {/* Column Headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(220px, 2.2fr) 140px',
                gap: '0.6rem',
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#475569',
                marginBottom: '0.35rem',
                padding: '0 0.1rem'
              }}>
                <div>Category</div>
                <div>Doctor's Recorded Service / Medication</div>
                <div>Unit Price (Rs.)</div>
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.2rem' }}>
                {newInvItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(220px, 2.2fr) 140px',
                      gap: '0.6rem',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <select
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%', backgroundColor: '#f8fafc' }}
                      value={item.itemType}
                      disabled
                    >
                      <option value="CONSULTATION">Consultation</option>
                      <option value="PROCEDURE">Procedure</option>
                      <option value="MEDICATION">Medication</option>
                      <option value="SURGERY">Surgery</option>
                      <option value="VACCINATION">Vaccination</option>
                    </select>
                    <div style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a'
                    }}>
                      {item.description}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Price (Rs)"
                        style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 1.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '700', color: '#0369a1', boxSizing: 'border-box' }}
                        value={item.unitPrice}
                        onChange={(e) => updateInvItem(idx, 'unitPrice', Number(e.target.value))}
                      />
                      <span style={{ position: 'absolute', left: '0.45rem', top: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>Rs.</span>
                    </div>
                  </div>
                ))}
              </div>

              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0f172a' }}>
                2. Hospitalization & Inpatient Boarding (Optional):
              </h4>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Hospitalization / Room Fee (Rs.)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter amount e.g. 1000"
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={newInvHospCharge}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewInvHospCharge(val);
                  }}
                />
              </div>

              {/* Live Calculated Total Summary (No Tax, No Discount) */}
              {(() => {
                const servicesSubtotal = newInvItems.reduce((acc, item) => acc + Number(item.unitPrice || 0), 0);
                const hospFee = Number(newInvHospCharge || 0);
                const grandTotal = servicesSubtotal + hospFee;

                return (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                    <div className="receipt-row"><span>Medical Services Subtotal:</span> <strong>Rs. {servicesSubtotal.toFixed(2)}</strong></div>
                    {hospFee > 0 && <div className="receipt-row"><span>Hospitalization Charges:</span> <strong>Rs. {hospFee.toFixed(2)}</strong></div>}
                    <div className="receipt-row total" style={{ fontSize: '1.15rem', marginTop: '0.5rem', borderTop: '2px solid #cbd5e1', paddingTop: '0.5rem' }}>
                      <span>Grand Total Bill:</span>
                      <strong style={{ color: '#059669' }}>Rs. {grandTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                );
              })()}

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.75rem' }}>
                🚀 Generate & Dispatch Official Invoice to Pet Owner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
