import { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { billingService } from '../../services/billingService';
import { paymentService } from '../../services/paymentService';
import { feedbackService } from '../../services/feedbackService';
import { PetAvatar, SpeciesPill, PetCell } from '../../utils/petBadgeHelper';
import NotificationBell from './NotificationBell';
import './Epic4.css';

export default function PetOwnerPortal({ initialView = null, hideHeader = false }) {
  let userObj = null;
  try {
    userObj = JSON.parse(localStorage.getItem('vhms_user'));
  } catch(e) {}
  
  const ownerId = userObj?.id || 'USR-5001';
  const ownerName = userObj?.name || userObj?.fullName || '';
  const ownerEmail = userObj?.email || 'john.doe@example.com';
  const ownerPhone = userObj?.phone || '+94 77 123 4567';

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

  // Tabs: 'appointments' | 'invoices' | 'payments'
  const [activeTab, setActiveTab] = useState(initialView || 'invoices');

  useEffect(() => {
    if (initialView) {
      setActiveTab(initialView);
    }
  }, [initialView]);

  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Owner Active Appointment Reschedule & Cancel States
  const [showOwnerRescheduleModal, setShowOwnerRescheduleModal] = useState(false);
  const [showOwnerCancelModal, setShowOwnerCancelModal] = useState(false);
  const [selectedOwnerAppt, setSelectedOwnerAppt] = useState(null);
  const [ownerReschedDoctorId, setOwnerReschedDoctorId] = useState('');
  const [ownerReschedDoctorName, setOwnerReschedDoctorName] = useState('');
  const [ownerReschedDate, setOwnerReschedDate] = useState(new Date().toISOString().split('T')[0]);
  const [ownerReschedSlots, setOwnerReschedSlots] = useState([]);
  const [ownerReschedSlot, setOwnerReschedSlot] = useState('');
  const [ownerReschedReason, setOwnerReschedReason] = useState('');
  const [ownerCancelReason, setOwnerCancelReason] = useState('Prefer different veterinarian or date');

  // Reselect / Rebook following decline
  const [showReselectModal, setShowReselectModal] = useState(false);
  const [reselectAppt, setReselectAppt] = useState(null);
  const [reselectMode, setReselectMode] = useState('SAME_DOCTOR'); // 'SAME_DOCTOR' | 'DIFFERENT_DOCTOR'
  const [reselectDoctorId, setReselectDoctorId] = useState('');
  const [reselectDoctorName, setReselectDoctorName] = useState('');
  const [reselectDate, setReselectDate] = useState(new Date().toISOString().split('T')[0]);
  const [reselectSlots, setReselectSlots] = useState([]);
  const [reselectSlot, setReselectSlot] = useState('');
  const [reselectReason, setReselectReason] = useState('');

  // Selected entities for modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedCompletedAppt, setSelectedCompletedAppt] = useState(null);

  // Booking Form State
  const [bookingPetName, setBookingPetName] = useState('');
  const [bookingPetSpecies, setBookingPetSpecies] = useState('');
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  const [bookingDoctorName, setBookingDoctorName] = useState('');
  const [bookingDoctorPreference, setBookingDoctorPreference] = useState('');
  const [bookingApptType, setBookingApptType] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingReason, setBookingReason] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CREDIT_CARD');
  const [payRef, setPayRef] = useState('');

  // Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState([]);

  const doctorsList = [
    { id: 'DOC-2001', name: 'Dr. Natasha Silva', spec: 'Small Animal Specialist' },
    { id: 'DOC-2002', name: 'Dr. Rohan Fernando', spec: 'Veterinary Surgeon' },
    { id: 'DOC-2003', name: 'Dr. Sanduni Perera', spec: 'Feline & Canine Medicine' },
  ];

  useEffect(() => {
    try {
      const existing = localStorage.getItem('vhms_epic4_rebook_allowed');
      if (!existing) {
        localStorage.setItem('vhms_epic4_rebook_allowed', JSON.stringify({ 'APT-0002': true }));
      }
    } catch (e) { }
    loadAllData();
    const interval = setInterval(loadAllData, 3000);
    const handleStorage = () => {
      loadAllData();
      try {
        const notifs = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
        const latest = notifs[0];
        if (latest && !latest.read && (latest.recipientId === ownerId || latest.recipientId === 'ALL')) {
          showNotification(`🔔 ${latest.title} — ${latest.message}`, 'info');
        }
      } catch (err) { }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('vhms_notifications_changed', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('vhms_notifications_changed', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (showBookingModal && bookingDate) {
      if (bookingDoctorId) {
        loadSlots(bookingDoctorId, bookingDate);
      } else {
        setAvailableSlots([]);
        setSelectedSlot('');
      }
    }
  }, [showBookingModal, bookingDoctorId, bookingDate]);

  useEffect(() => {
    if (showReselectModal && reselectDate && reselectDoctorId) {
      loadReselectSlots(reselectDoctorId, reselectDate);
    }
  }, [showReselectModal, reselectDoctorId, reselectDate]);

  const loadReselectSlots = async (doctorId, date) => {
    try {
      const res = await appointmentService.getAvailableSlots(doctorId, date);
      if (res && res.success && res.data) {
        setReselectSlots(res.data);
        const firstAvail = res.data.find((s) => s.available);
        setReselectSlot(firstAvail ? firstAvail.timeSlot : '');
      } else {
        setReselectSlots([]);
        setReselectSlot('');
      }
    } catch (e) {
      console.error('Error fetching reselect slots:', e);
      setReselectSlots([]);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [apptRes, invRes, payRes, fbRes] = await Promise.all([
        appointmentService.getAppointmentsByOwner(ownerId),
        billingService.getInvoicesByOwner(ownerId),
        paymentService.getPaymentsByOwner(ownerId),
        feedbackService.getFeedbackByOwner(ownerId).catch(() => ({ success: false, data: [] })),
      ]);

      if (apptRes && apptRes.success) {
        setAppointments((apptRes.data || []).map(a => {
          let s = a.status ? a.status.toUpperCase() : 'REQUESTED';
          if (['PENDING', 'WAITING'].includes(s)) s = 'REQUESTED';
          if (['APPROVED', 'ACCEPTED', 'SCHEDULED'].includes(s)) s = 'CONFIRMED';
          if (['DONE'].includes(s)) s = 'COMPLETED';
          return { ...a, status: s };
        }));
      }
      if (invRes && invRes.success) setInvoices(invRes.data || []);
      if (payRes && payRes.success) setPayments(payRes.data || []);

      const localFb = (() => {
        try { return JSON.parse(localStorage.getItem('vhms_epic4_feedback') || '[]'); } catch { return []; }
      })();
      const backendFb = (fbRes && fbRes.data) || [];
      const fbMap = new Map();
      backendFb.forEach((f) => { if (f.appointmentId) fbMap.set(f.appointmentId, f); });
      localFb.forEach((f) => { if (f.appointmentId) fbMap.set(f.appointmentId, f); });
      setSubmittedFeedback(Array.from(fbMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (doctorId, date) => {
    try {
      const res = await appointmentService.getAvailableSlots(doctorId, date);
      if (res && res.success && res.data) {
        setAvailableSlots(res.data);
        if (res.data.length > 0) {
          const firstAvail = res.data.find((s) => s.available);
          setSelectedSlot(firstAvail ? firstAvail.timeSlot : '');
        }
      }
    } catch (e) {
      console.error('Error fetching slots:', e);
    }
  };

  const openBookingModal = () => {
    setBookingPetName('');
    setBookingPetSpecies('');
    setBookingDoctorId('');
    setBookingDoctorName('');
    setBookingDoctorPreference('');
    setBookingApptType('');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setAvailableSlots([]);
    setSelectedSlot('');
    setBookingReason('');
    setShowBookingModal(true);
  };

  const openRebookForAppt = (appt) => {
    setBookingPetName(appt.petName || '');
    setBookingPetSpecies(appt.petSpecies || '');
    setBookingDoctorId(appt.doctorId || '');
    setBookingDoctorName(appt.doctorName || '');
    setBookingDoctorPreference(appt.doctorPreference || '');
    setBookingApptType(appt.appointmentType || 'GENERAL_CHECKUP');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setBookingReason(appt.reasonForVisit ? `Re-booking: ${appt.reasonForVisit}` : '');
    setSelectedSlot('');
    setShowBookingModal(true);
    if (appt.doctorId) {
      loadSlots(appt.doctorId, new Date().toISOString().split('T')[0]);
    }
  };

  // Owner Reschedule Active Consultation
  const handleOpenOwnerReschedule = async (appt) => {
    setSelectedOwnerAppt(appt);
    const initialDocId = appt.doctorId || 'DOC-2001';
    const initialDocObj = doctorsList.find((d) => d.id === initialDocId) || doctorsList[0];
    setOwnerReschedDoctorId(initialDocId);
    setOwnerReschedDoctorName(initialDocObj.name);

    const todayStr = new Date().toISOString().split('T')[0];
    const initialDate = appt.appointmentDate >= todayStr ? appt.appointmentDate : todayStr;
    setOwnerReschedDate(initialDate);
    setOwnerReschedReason('');
    setShowOwnerRescheduleModal(true);

    try {
      const res = await appointmentService.getAvailableSlots(initialDocId, initialDate);
      if (res && res.success && res.data) {
        setOwnerReschedSlots(res.data);
        const firstAvail = res.data.find((s) => s.available || s.isAvailable);
        setOwnerReschedSlot(firstAvail ? firstAvail.timeSlot : '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOwnerReschedDocOrDateChange = async (docId, date) => {
    try {
      const res = await appointmentService.getAvailableSlots(docId, date);
      if (res && res.success && res.data) {
        setOwnerReschedSlots(res.data);
        const firstAvail = res.data.find((s) => s.available || s.isAvailable);
        setOwnerReschedSlot(firstAvail ? firstAvail.timeSlot : '');
      }
    } catch (e) { }
  };

  const handleOwnerRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOwnerAppt || !ownerReschedSlot) {
      showNotification('Please select an available time slot.', 'error');
      return;
    }
    try {
      const res = await appointmentService.rescheduleAppointment(selectedOwnerAppt.id, {
        newAppointmentDate: ownerReschedDate,
        newTimeSlot: ownerReschedSlot,
        optionalNewDoctorId: ownerReschedDoctorId,
        optionalNewDoctorName: ownerReschedDoctorName,
        rescheduleReason: ownerReschedReason || 'Owner requested slot/doctor change',
      });

      if (res && res.success) {
        const list = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
        const target = list.find((a) => a.id === selectedOwnerAppt.id);
        if (target) {
          target.appointmentDate = ownerReschedDate;
          target.timeSlot = ownerReschedSlot;
          target.doctorId = ownerReschedDoctorId;
          target.doctorName = ownerReschedDoctorName;
          target.status = 'CONFIRMED';
          localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));
        }

        const notifs = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
        notifs.unshift({
          id: 'notif-resched-' + Date.now(),
          recipientId: 'ADMIN-001',
          type: 'APPOINTMENT_RESCHEDULED',
          title: '🔄 Appointment Rescheduled by Pet Owner',
          message: `${ownerName} moved appointment #${selectedOwnerAppt.appointmentNumber} (${selectedOwnerAppt.petName}) to ${ownerReschedDate} (${ownerReschedSlot}) with ${ownerReschedDoctorName}.`,
          read: false,
          sentAt: new Date().toISOString(),
        });
        localStorage.setItem('vhms_epic4_notifications', JSON.stringify(notifs));

        showNotification('Appointment rescheduled successfully! 📅', 'success');
        setShowOwnerRescheduleModal(false);
        loadAllData();
      } else {
        showNotification(res.message || 'Reschedule failed. Slot occupied.', 'error');
      }
    } catch (err) {
      showNotification('Error rescheduling appointment.', 'error');
    }
  };

  const handleOpenOwnerCancel = (appt) => {
    setSelectedOwnerAppt(appt);
    setOwnerCancelReason('Prefer different veterinarian on another date');
    setShowOwnerCancelModal(true);
  };

  const handleOwnerCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOwnerAppt) return;
    try {
      const res = await appointmentService.cancelAppointment(
        selectedOwnerAppt.id,
        ownerCancelReason,
        'PET_OWNER'
      );
      if (res && res.success) {
        const list = JSON.parse(localStorage.getItem('vhms_epic4_appointments') || '[]');
        const target = list.find((a) => a.id === selectedOwnerAppt.id);
        if (target) {
          target.status = 'CANCELLED';
          target.cancellationReason = ownerCancelReason;
          target.cancelledBy = 'PET_OWNER';
          localStorage.setItem('vhms_epic4_appointments', JSON.stringify(list));
        }

        const notifs = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
        notifs.unshift({
          id: 'notif-can-' + Date.now(),
          recipientId: 'ADMIN-001',
          type: 'APPOINTMENT_CANCELLED',
          title: '🚫 Appointment Cancelled by Pet Owner',
          message: `${ownerName} cancelled appointment #${selectedOwnerAppt.appointmentNumber} for ${selectedOwnerAppt.petName}. Reason: ${ownerCancelReason}`,
          read: false,
          sentAt: new Date().toISOString(),
        });
        localStorage.setItem('vhms_epic4_notifications', JSON.stringify(notifs));

        showNotification('Appointment cancelled successfully.', 'success');
        setShowOwnerCancelModal(false);
        loadAllData();
      } else {
        showNotification('Failed to cancel appointment.', 'error');
      }
    } catch (err) {
      showNotification('Error cancelling appointment.', 'error');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingPetName.trim()) {
      showNotification('Please enter your pet name.', 'error');
      return;
    }
    if (!bookingPetSpecies) {
      showNotification('Please select pet species.', 'error');
      return;
    }
    if (!bookingDoctorId) {
      showNotification('Please select a preferred veterinarian / doctor.', 'error');
      return;
    }
    if (!bookingApptType) {
      showNotification('Please select a service type.', 'error');
      return;
    }
    if (!selectedSlot) {
      showNotification('Please select an available time slot.', 'error');
      return;
    }

    try {
      const payload = {
        petId: 'PET-1001',
        petName: bookingPetName.trim(),
        petSpecies: bookingPetSpecies,
        ownerId,
        ownerName,
        ownerPhone,
        ownerEmail,
        doctorId: bookingDoctorId,
        doctorName: bookingDoctorName,
        doctorPreference: bookingDoctorName,
        appointmentType: bookingApptType,
        appointmentDate: bookingDate,
        timeSlot: selectedSlot,
        reasonForVisit: bookingReason,
        status: 'REQUESTED',
      };

      const res = await appointmentService.createAppointment(payload);
      if (res && res.success) {
        showNotification('Appointment requested successfully! #' + res.data.appointmentNumber, 'success');
        setShowBookingModal(false);
        setBookingPetName('');
        setBookingPetSpecies('');
        setBookingDoctorId('');
        setBookingDoctorName('');
        setBookingApptType('');
        setSelectedSlot('');
        setBookingReason('');
        loadAllData();
      } else {
        showNotification(res.message || 'Booking failed. Slot conflict.', 'error');
      }
    } catch (err) {
      showNotification('Slot already occupied or network error.', 'error');
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPayAmount(invoice.balanceAmount);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (payAmount <= 0) {
      showNotification('Enter a valid amount to pay.', 'error');
      return;
    }

    if (payMethod === 'CREDIT_CARD' || payMethod === 'DEBIT_CARD') {
      if (!payRef || payRef.length !== 4) {
        showNotification('Payment is incorrect, try again. Exactly 4 digits required.', 'error');
        return;
      }
    }

    try {
      const payload = {
        invoiceId: selectedInvoice.id,
        amountPaid: Number(payAmount),
        paymentMethod: payMethod,
        transactionReference: payRef || 'REF-' + Date.now().toString().slice(-6),
        cashierId: 'ONLINE-PORTAL',
        cashierName: 'Owner Online Portal',
        notes: 'Self-checkout online payment',
      };

      const res = await paymentService.processPayment(payload);
      if (res && res.success) {
        showNotification('Payment Success! Receipt #' + res.data.receiptNumber, 'success');
        setShowPaymentModal(false);
        setSelectedReceipt(res.data);
        setShowReceiptModal(true);
        loadAllData();
      } else {
        showNotification(res.message || 'Payment failed.', 'error');
      }
    } catch (err) {
      showNotification('Error processing payment.', 'error');
    }
  };

  const openFeedbackModal = (appt) => {
    setSelectedCompletedAppt(appt);
    setFeedbackRating(5);
    setFeedbackComments('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackComments) {
      showNotification('Please add review comments.', 'error');
      return;
    }

    try {
      const payload = {
        appointmentId: selectedCompletedAppt.id,
        rating: feedbackRating,
        reviewComments: feedbackComments,
        serviceCategory: selectedCompletedAppt.appointmentType,
      };

      const res = await feedbackService.submitFeedback(payload);
      if (res && res.success) {
        // Also save to localStorage so Doctor Portal can calculate real avg rating
        const localFeedback = JSON.parse(localStorage.getItem('vhms_epic4_feedback') || '[]');
        const newFeedback = {
          id: res.data?.id || ('fb-' + Date.now()),
          appointmentId: selectedCompletedAppt.id,
          appointmentNumber: selectedCompletedAppt.appointmentNumber,
          doctorId: selectedCompletedAppt.doctorId,
          doctorName: selectedCompletedAppt.doctorName,
          petName: selectedCompletedAppt.petName,
          ownerName: selectedCompletedAppt.ownerName,
          ownerId: selectedCompletedAppt.ownerId || ownerId,
          rating: feedbackRating,
          reviewComments: feedbackComments,
          published: true,
          submittedAt: new Date().toISOString(),
        };
        localFeedback.unshift(newFeedback);
        localStorage.setItem('vhms_epic4_feedback', JSON.stringify(localFeedback));

        showNotification('⭐ Thank you! Your feedback has been submitted.', 'success');
        setShowFeedbackModal(false);
        loadAllData();
      } else {
        // Backend failed — save locally anyway so rating still works offline
        const localFeedback = JSON.parse(localStorage.getItem('vhms_epic4_feedback') || '[]');
        const newFeedback = {
          id: 'fb-' + Date.now(),
          appointmentId: selectedCompletedAppt.id,
          appointmentNumber: selectedCompletedAppt.appointmentNumber,
          doctorId: selectedCompletedAppt.doctorId,
          doctorName: selectedCompletedAppt.doctorName,
          petName: selectedCompletedAppt.petName,
          ownerName: selectedCompletedAppt.ownerName,
          ownerId: selectedCompletedAppt.ownerId || ownerId,
          rating: feedbackRating,
          reviewComments: feedbackComments,
          published: true,
          submittedAt: new Date().toISOString(),
        };
        localFeedback.unshift(newFeedback);
        localStorage.setItem('vhms_epic4_feedback', JSON.stringify(localFeedback));

        showNotification('⭐ Thank you! Your feedback has been saved.', 'success');
        setShowFeedbackModal(false);
        loadAllData();
      }
    } catch (err) {
      showNotification('Failed to submit review.', 'error');
    }
  };

  const handleOpenReselectSameDoctor = (appt) => {
    setReselectAppt(appt);
    setReselectMode('SAME_DOCTOR');
    setReselectDoctorId(appt.doctorId || 'DOC-2001');
    setReselectDoctorName(appt.doctorName || 'Dr. Natasha Silva');
    setReselectDate(appt.appointmentDate || new Date().toISOString().split('T')[0]);
    setReselectSlot('');
    setReselectReason(`Selected new time with ${appt.doctorName}`);
    setShowReselectModal(true);
  };

  const handleOpenReselectDifferentDoctor = (appt) => {
    setReselectAppt(appt);
    setReselectMode('DIFFERENT_DOCTOR');
    const otherDoc = doctorsList.find((d) => d.id !== appt.doctorId) || doctorsList[0];
    setReselectDoctorId(otherDoc.id);
    setReselectDoctorName(otherDoc.name);
    setReselectDate(appt.appointmentDate || new Date().toISOString().split('T')[0]);
    setReselectSlot('');
    setReselectReason(`Selected alternative doctor (${otherDoc.name})`);
    setShowReselectModal(true);
  };

  const handleCancelRejectedAppt = async (appt) => {
    if (!window.confirm(`Are you sure you want to cancel and remove request ${appt.appointmentNumber}?`)) return;
    try {
      const res = await appointmentService.cancelAppointment(appt.id, 'Cancelled by owner following decline', 'PET_OWNER');
      if (res && res.success) {
        showNotification(`Appointment ${appt.appointmentNumber} cancelled.`, 'success');
        loadAllData();
      }
    } catch (e) {
      showNotification('Error cancelling appointment.', 'error');
    }
  };

  const handleReselectSubmit = async (e) => {
    e.preventDefault();
    if (!reselectDoctorId) {
      showNotification('Please select a doctor.', 'error');
      return;
    }
    if (!reselectDate) {
      showNotification('Please select a date.', 'error');
      return;
    }
    if (!reselectSlot) {
      showNotification('Please select an available time slot.', 'error');
      return;
    }

    try {
      const payload = {
        newAppointmentDate: reselectDate,
        newTimeSlot: reselectSlot,
        optionalNewDoctorId: reselectDoctorId,
        optionalNewDoctorName: reselectDoctorName,
        rescheduleReason: reselectReason || `Re-selected ${reselectDoctorName} on ${reselectDate} (${reselectSlot})`,
      };

      const res = await appointmentService.rescheduleAppointment(reselectAppt.id, payload);
      if (res && res.success) {
        // Also update local storage notification for admin
        const notifications = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
        notifications.unshift({
          id: 'notif-' + Date.now(),
          recipientId: 'ADMIN-001',
          type: 'APPOINTMENT_RESCHEDULED',
          title: `Re-selected Request: ${reselectAppt.appointmentNumber} 🔄`,
          message: `${ownerName} re-selected ${reselectDoctorName} on ${reselectDate} at ${reselectSlot} for ${reselectAppt.petName}. Pending approval.`,
          appointmentId: reselectAppt.id,
          appointmentNumber: reselectAppt.appointmentNumber,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('vhms_epic4_notifications', JSON.stringify(notifications));

        showNotification(`🎉 Appointment ${reselectAppt.appointmentNumber} re-submitted to Admin for approval!`, 'success');
        setShowReselectModal(false);
        setReselectAppt(null);
        loadAllData();
      } else {
        showNotification(res?.message || 'Slot conflict or selection error.', 'error');
      }
    } catch (err) {
      showNotification('Slot already occupied or network error.', 'error');
    }
  };

  const rejectedAppts = appointments.filter((a) => a.status === 'REJECTED');
  const upcomingAppts = appointments.filter((a) => a.status === 'REQUESTED' || a.status === 'CONFIRMED' || a.status === 'RESCHEDULED');
  const pastAppts = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'EXPIRED' || a.status === 'NO_SHOW');

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
            <h1>🐾 Pet Owner Portal</h1>
            <p>Welcome, {ownerName} &mdash; Manage appointments, settle invoices, and view receipts.</p>
          </div>
          <div className="epic-actions-bar">
            <NotificationBell recipientId={ownerId} />
            <button className="btn-primary-epic" onClick={openBookingModal}>
              + Book Appointment
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="epic-tabs">

        <button
          className={`epic-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          💳 Invoices & Bills ({invoices.length})
        </button>
        <button
          className={`epic-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          🧾 Payment History & Receipts ({payments.length})
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS (US 4.1, US 4.6) */}
      {activeTab === 'appointments' && (
        <>
          {/* Action Required Banner for Declined / Rejected Appointments */}
          {rejectedAppts.length > 0 && (
            <div style={{
              background: '#fff1f2',
              border: '2px solid #fecdd3',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#9f1239', fontWeight: '700' }}>
                  Action Required: {rejectedAppts.length} Appointment Request{rejectedAppts.length > 1 ? 's' : ''} Declined by Hospital Admin
                </h3>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#881337', lineHeight: '1.4' }}>
                Your appointment request could not be approved for the requested slot. Please choose one of the <strong>2 options below</strong> to rebook immediately, or cancel the request:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {rejectedAppts.map((a) => (
                  <div key={a.id} style={{
                    background: '#ffffff',
                    border: '1px solid #fda4af',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{a.appointmentNumber}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>• 🐾 {a.petName}</span>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>• 👨‍⚕️ {a.doctorName}</span>
                        <span style={{ fontSize: '0.85rem', color: '#475569' }}>• 📅 {a.appointmentDate} ({a.timeSlot})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#be123c', background: '#ffe4e6', padding: '0.3rem 0.6rem', borderRadius: '6px', display: 'inline-block' }}>
                        <strong>Admin Reason:</strong> {a.rejectionReason || 'Doctor unavailable on requested slot.'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenReselectSameDoctor(a)}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem 0.9rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        🕒 Option 1: Same Doctor, New Time
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReselectDifferentDoctor(a)}
                        style={{
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem 0.9rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        👨‍⚕️ Option 2: Choose Different Doctor
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelRejectedAppt(a)}
                        style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.55rem 0.85rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          <div className="epic-card">
            <div className="epic-card-header">
              <h2>🕒 Upcoming Appointments</h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{upcomingAppts.length} Scheduled</span>
            </div>

            {upcomingAppts.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem 0' }}>
                No upcoming appointments. Click "+ Book Appointment" above to schedule a visit.
              </p>
            ) : (
              <div className="epic-table-wrapper">
                <table className="epic-table">
                  <thead>
                    <tr>
                      <th>Appointment Numbers</th>
                      <th>Pet</th>
                      <th>Veterinarian</th>
                      <th>Date & Slot</th>
                      <th>Type / Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppts.map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.appointmentNumber}</strong></td>
                        <td>
                          <PetCell petName={a.petName} species={a.petSpecies} />
                        </td>
                        <td>{a.doctorName}</td>
                        <td>
                          <strong>{a.appointmentDate}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.timeSlot}</div>
                        </td>
                        <td>
                          <div>{a.appointmentType?.replace('_', ' ')}</div>
                          <small style={{ color: '#64748b' }}>{a.reasonForVisit || 'N/A'}</small>
                        </td>
                        <td>
                          <span className={`status-pill ${a.status?.toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past History Section (US 4.6) */}
          <div className="epic-card">
            <div className="epic-card-header">
              <h2>📜 Past Appointments History</h2>
            </div>

            {pastAppts.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem 0' }}>
                No previous appointment records.
              </p>
            ) : (
              <div className="epic-table-wrapper">
                <table className="epic-table">
                  <thead>
                    <tr>
                      <th>Appointment Numbers</th>
                      <th>Pet</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Doctor Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAppts.map((a) => (
                      <tr key={a.id}>
                        <td><strong>{a.appointmentNumber}</strong></td>
                        <td>
                          <PetCell petName={a.petName} species={a.petSpecies} />
                        </td>
                        <td>{a.doctorName}</td>
                        <td>{a.appointmentDate} ({a.timeSlot})</td>
                        <td>
                          <span className={`status-pill ${a.status?.toLowerCase()}`}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <small style={{ color: (a.status === 'EXPIRED' || a.status === 'NO_SHOW') ? '#dc2626' : a.status === 'CANCELLED' ? '#d97706' : '#475569' }}>
                            {(() => {
                              if (a.status === 'EXPIRED' || a.status === 'NO_SHOW') {
                                return a.cancellationReason || a.doctorNotes || 'Patient did not attend on scheduled date';
                              }
                              if (a.status === 'CANCELLED') {
                                return a.cancellationReason || a.doctorNotes || 'Appointment cancelled';
                              }
                              if (a.status === 'REJECTED') {
                                return a.rejectionReason || 'Request declined by hospital';
                              }
                              if (a.status === 'COMPLETED') {
                                return a.doctorNotes || 'Consultation completed';
                              }
                              return a.doctorNotes || a.adminNotes || '-';
                            })()}
                          </small>
                        </td>
                        <td>
                          {(() => {
                            const isAllowed = Boolean(
                              a.isRebookAllowed ||
                              (() => {
                                try {
                                  const allowed = JSON.parse(localStorage.getItem('vhms_epic4_rebook_allowed') || '{}');
                                  return Boolean(allowed[a.id] || (a.appointmentNumber && allowed[a.appointmentNumber]));
                                } catch { return false; }
                              })()
                            );

                            if (a.status === 'EXPIRED' || a.status === 'NO_SHOW') {
                              if (isAllowed) {
                                return (
                                  <button
                                    className="btn-sm-action"
                                    style={{
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      color: '#fff',
                                      fontSize: '0.8rem',
                                      fontWeight: '700',
                                      padding: '0.45rem 0.85rem',
                                      borderRadius: '8px',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                      border: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => openRebookForAppt(a)}
                                    title="Admin has approved re-booking. Click to book a new appointment."
                                  >
                                    📅 Re-book Appointment
                                  </button>
                                );
                              } else {
                                return (
                                  <span
                                    style={{
                                      color: '#64748b',
                                      fontSize: '0.78rem',
                                      background: '#f1f5f9',
                                      border: '1px solid #e2e8f0',
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '6px',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}
                                    title="Hospital Admin is reviewing this appointment. You will receive a notification once re-booking is opened."
                                  >
                                    🔒 Awaiting Admin Review
                                  </span>
                                );
                              }
                            }

                            if (a.status === 'CANCELLED') {
                              const isCancelledByOwner =
                                a.cancelledBy === 'PET_OWNER' ||
                                a.cancelledBy === 'OWNER' ||
                                (a.cancellationReason &&
                                  a.cancellationReason.toLowerCase().includes('owner') &&
                                  !a.cancellationReason.toLowerCase().includes('admin'));

                              if (isCancelledByOwner) {
                                return (
                                  <span
                                    style={{
                                      color: '#64748b',
                                      fontSize: '0.78rem',
                                      background: '#f8fafc',
                                      border: '1px solid #e2e8f0',
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '6px',
                                      fontWeight: '600',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                    }}
                                    title="You cancelled this appointment"
                                  >
                                    🚫 Cancelled by you
                                  </span>
                                );
                              }

                              return (
                                <button
                                  className="btn-sm-action"
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    padding: '0.45rem 0.85rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                    border: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onClick={() => openRebookForAppt(a)}
                                  title="Admin/Hospital cancelled this appointment. Click to re-book."
                                >
                                  📅 Re-book Appointment
                                </button>
                              );
                            }

                            return null;
                          })()}
                          {a.status === 'COMPLETED' && (() => {
                            const existingFb = submittedFeedback.find(
                              (f) => f.appointmentId === a.id || (f.appointmentNumber && f.appointmentNumber === a.appointmentNumber)
                            );
                            if (existingFb) {
                              return (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  fontSize: '0.78rem',
                                  fontWeight: '600',
                                  color: '#7c3aed',
                                  background: '#f5f3ff',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '9999px',
                                  border: '1px solid #ddd6fe',
                                  whiteSpace: 'nowrap',
                                }}>
                                  ⭐ {existingFb.rating}★ Reviewed
                                </span>
                              );
                            }
                            return (
                              <button
                                className="btn-sm-action btn-reassign"
                                onClick={() => openFeedbackModal(a)}
                              >
                                ⭐ Leave Review
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: INVOICES (US 4.7, US 4.8) */}
      {activeTab === 'invoices' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>💳 Veterinary Invoices & Charges</h2>
          </div>

          {invoices.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>
              No invoices generated for your account yet.
            </p>
          ) : (
            <>
              {invoices.some(i => i.balanceAmount > 0) && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '0.85rem 1.1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#92400e',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>🔔</span>
                  <div>
                    <strong>Payment Reminder from Hospital Administration:</strong> You have an outstanding veterinary invoice balance waiting for online settlement. Click <strong>"Pay Bill"</strong> below to pay securely via Card or Online Transfer.
                  </div>
                </div>
              )}
              <div className="epic-table-wrapper">
                <table className="epic-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Patient</th>
                      <th>Invoice Date</th>
                      <th>Breakdown</th>
                      <th>Total Due</th>
                      <th>Balance</th>
                      <th>Payment Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>{inv.invoiceNumber}</strong></td>
                        <td>{inv.petName}</td>
                        <td>
                          <div>{inv.issueDate}</div>
                        </td>
                        <td>
                          <small>
                            {inv.items?.length || 0} items
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
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn-sm-action btn-reassign"
                              onClick={() => { setSelectedInvoice(inv); setShowInvoiceDetailsModal(true); }}
                              title="View itemized breakdown"
                            >
                              📄 View Bill
                            </button>
                            {inv.balanceAmount > 0 ? (
                              <button
                                className="btn-sm-action btn-pay"
                                onClick={() => openPaymentModal(inv)}
                              >
                                💳 Pay Bill
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '600', alignSelf: 'center' }}>✓ Settled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENT HISTORY & RECEIPTS (US 4.9, US 4.10) */}
      {activeTab === 'payments' && (
        <div className="epic-card">
          <div className="epic-card-header">
            <h2>🧾 Payment History & Official Receipts</h2>
          </div>

          {payments.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0' }}>
              No payments recorded yet.
            </p>
          ) : (
            <div className="epic-table-wrapper">
              <table className="epic-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Transaction #</th>
                    <th>Invoice #</th>
                    <th>Amount Paid</th>
                    <th>Method</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.receiptNumber}</strong></td>
                      <td>{p.transactionNumber}</td>
                      <td>{p.invoiceNumber}</td>
                      <td><strong style={{ color: '#059669' }}>Rs. {p.amountPaid?.toFixed(2)}</strong></td>
                      <td>{p.paymentMethod?.replace('_', ' ')}</td>
                      <td>{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : 'N/A'}</td>
                      <td>
                        <button
                          className="btn-sm-action btn-reassign"
                          onClick={() => { setSelectedReceipt(p); setShowReceiptModal(true); }}
                        >
                          📄 View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: APPOINTMENT BOOKING (US 4.1, Slot Allocation) */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📅 Book Veterinary Appointment</h2>
              <button className="modal-close" onClick={() => setShowBookingModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateBooking}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Pet Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daisy, Bella, Rocky"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={bookingPetName}
                    onChange={(e) => setBookingPetName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    Species <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    value={bookingPetSpecies}
                    onChange={(e) => setBookingPetSpecies(e.target.value)}
                  >
                    <option value="">-- Select Species --</option>
                    <option value="Canine">Dog</option>
                    <option value="Feline">Cat</option>
                    <option value="Avian">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Select Veterinarian / Doctor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  value={bookingDoctorId}
                  onChange={(e) => {
                    const doc = doctorsList.find((d) => d.id === e.target.value);
                    if (doc) {
                      setBookingDoctorId(doc.id);
                      setBookingDoctorName(doc.name);
                      setBookingDoctorPreference(doc.name);
                      if (bookingDate) loadSlots(doc.id, bookingDate);
                    } else {
                      setBookingDoctorId('');
                      setBookingDoctorName('');
                      setBookingDoctorPreference('');
                      setAvailableSlots([]);
                      setSelectedSlot('');
                    }
                  }}
                >
                  <option value="">-- Select Veterinarian / Doctor --</option>
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.spec}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  ℹ️ Selected veterinarian will be assigned upon Admin approval.
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    Service Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    value={bookingApptType}
                    onChange={(e) => setBookingApptType(e.target.value)}
                  >
                    <option value="">-- Select Service Type --</option>
                    <option value="GENERAL_CHECKUP">General Checkup</option>
                    <option value="VACCINATION">Vaccination</option>
                    <option value="SURGERY">Surgery Consultation</option>
                    <option value="DENTAL">Dental Care</option>
                    <option value="EMERGENCY">Emergency Care</option>
                    <option value="GROOMING">Medical Grooming</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Appointment Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Slot Picker */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Available 30-Min Time Slots <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {!bookingDoctorId ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px dashed #cbd5e1', margin: '0.35rem 0 0 0' }}>
                    👉 Please select a veterinarian above to view available time slots.
                  </p>
                ) : availableSlots.length === 0 ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#92400e', fontSize: '0.82rem', marginTop: '0.35rem' }}>
                    ⚠️ <strong>{bookingDoctorName || 'Selected Doctor'}</strong> is <strong>Off-Duty</strong> on this date. Please select a working day or choose a different veterinarian.
                  </div>
                ) : (
                  <div className="slot-grid">
                    {availableSlots.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={!s.available && !s.isAvailable}
                        className={`slot-btn ${selectedSlot === s.timeSlot ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(s.timeSlot)}
                      >
                        {s.timeSlot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Reason for Visit / Symptoms</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Annual rabies shot, loss of appetite, checkup"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Confirm Appointment Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INVOICE PAYMENT (US 4.8) */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>💳 Settle Invoice #{selectedInvoice.invoiceNumber}</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleProcessPayment}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div className="receipt-row"><span>Patient:</span> <strong>{selectedInvoice.petName}</strong></div>
                <div className="receipt-row"><span>Total Bill:</span> <span>Rs. {selectedInvoice.totalAmount?.toFixed(2)}</span></div>
                <div className="receipt-row"><span>Already Paid:</span> <span>Rs. {selectedInvoice.paidAmount?.toFixed(2)}</span></div>
                <div className="receipt-row total"><span>Outstanding Balance:</span> <span style={{ color: '#ef4444' }}>Rs. {selectedInvoice.balanceAmount?.toFixed(2)}</span></div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Payment Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedInvoice.balanceAmount}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Payment Method</label>
                <select
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="CREDIT_CARD">Credit Card (Visa / Mastercard)</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>Card Last 4 Digits</label>
                <input
                  type="text"
                  maxLength="4"
                  required
                  placeholder="e.g. 4482"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>
                  🔒 Enter the last 4 digits of your card for verification & receipt.
                </small>
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Process Payment of Rs. {Number(payAmount || 0).toFixed(2)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE RECEIPT (US 4.10) */}
      {showReceiptModal && selectedReceipt && (
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
              onClick={() => setShowReceiptModal(false)}
              title="Close receipt"
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

            {/* Receipt Page Document Body */}
            <div
              id="printable-receipt"
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
                    background: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    padding: '0.85rem 1.3rem',
                    borderRadius: '12px',
                    textAlign: 'left',
                    minWidth: '175px',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      OFFICIAL PAYMENT RECEIPT
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0.15rem 0' }}>
                      #{selectedReceipt.receiptNumber}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#10b981' }}>
                      ✓ PAYMENT COMPLETED
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
                      Owner: <strong style={{ color: '#0f172a' }}>{selectedReceipt.ownerName || ownerName || 'Unknown Owner'}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Contact: <strong style={{ color: '#0f172a' }}>{ownerPhone || '+94 77 123 4567'}</strong>
                    </div>
                  </div>

                  {/* Card 2: Patient & Doctor Details */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      PATIENT & DOCTOR
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.25rem' }}>
                      Patient: <strong style={{ color: '#0f172a' }}>{selectedReceipt.petName || (invoices.find(inv => inv.invoiceNumber === selectedReceipt.invoiceNumber || inv.id === selectedReceipt.invoiceId)?.petName) || 'Ameena'}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      Doctor: <strong style={{ color: '#0f172a' }}>{selectedReceipt.doctorName || (invoices.find(inv => inv.invoiceNumber === selectedReceipt.invoiceNumber || inv.id === selectedReceipt.invoiceId)?.doctorName) || 'Dr. Natasha Silva'}</strong>
                    </div>
                  </div>

                  {/* Card 3: Payment Details */}
                  <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      PAYMENT DETAILS
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.25rem' }}>
                      Paid Date: <strong style={{ color: '#0f172a' }}>{new Date(selectedReceipt.paymentDate || Date.now()).toLocaleDateString()}</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      For Invoice: <strong style={{ color: '#0f172a' }}>#{selectedReceipt.invoiceNumber}</strong>
                    </div>
                  </div>
                </div>

                {/* Itemized Payment Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                      Payment Breakdown & Settlement
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Currency: LKR</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Description</th>
                        <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Payment Method</th>
                        <th style={{ textAlign: 'right', padding: '0.65rem 0.75rem', color: '#475569', fontWeight: '600' }}>Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', color: '#0f172a', fontWeight: '600' }}>
                          Medical Bill Settlement for Invoice #{selectedReceipt.invoiceNumber}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#0f172a', textTransform: 'uppercase', fontSize: '0.76rem', fontWeight: '700' }}>
                          <span style={{ background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '4px', color: '#475569' }}>
                            {selectedReceipt.paymentMethod?.replace('_', ' ') || 'ONLINE'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#0f172a', fontWeight: '700', fontSize: '0.92rem' }}>
                          Rs. {Number(selectedReceipt.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '310px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#5682b1', fontWeight: '600', fontSize: '0.95rem' }}>Total Amount Paid</span>
                      <strong style={{ color: '#5682b1', fontSize: '1.3rem', fontWeight: '800' }}>
                        Rs. {Number(selectedReceipt.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.2rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.88rem' }}>Settlement Status</span>
                      <strong style={{ color: '#10b981', fontSize: '0.92rem', fontWeight: '800' }}>
                        VERIFIED & SETTLED
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flexible Gap / Bottom Block: Thank You Banner & Sub-footer */}
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
                    Please retain this official payment receipt for your records.
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
                    <span>Receipt #{selectedReceipt.receiptNumber || selectedReceipt.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Sticky Action Bar at Bottom of Modal - Always Visible */}
            <div className="no-print" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '0.85rem 1.5rem',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              gap: '0.65rem',
              flexShrink: 0
            }}>
              <button
                type="button"
                style={{
                  background: '#5682b1',
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
                  boxShadow: '0 2px 4px rgba(86, 130, 177, 0.3)'
                }}
                onClick={() => window.print()}
              >
                🖨️ Print Receipt
              </button>
              <button
                type="button"
                className="btn-secondary-epic"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3.5: ITEMIZED INVOICE BILL DETAILS */}
      {/* MODAL 6: ITEMIZED INVOICE BILL DETAILS (PET OWNER) */}
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
              id="printable-invoice-owner"
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
                      Owner: <strong style={{ color: '#0f172a' }}>{selectedInvoice.ownerName || 'Unknown Owner'}</strong>
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
                    className="btn-primary-epic"
                    style={{ padding: '0.55rem 1.15rem', fontSize: '0.88rem' }}
                    onClick={() => {
                      setShowInvoiceDetailsModal(false);
                      openPaymentModal(selectedInvoice);
                    }}
                  >
                    💳 Proceed to Settle Bill (Rs. {selectedInvoice.balanceAmount?.toFixed(2)})
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
                  className="btn-secondary-epic"
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

      {/* MODAL 4: FEEDBACK / REVIEW (US 4.12) */}
      {showFeedbackModal && selectedCompletedAppt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>⭐ Rate Your Veterinary Visit</h2>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitFeedback}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Appointment: <strong>{selectedCompletedAppt.appointmentNumber}</strong> with <strong>{selectedCompletedAppt.doctorName}</strong>
              </p>

              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                  Select Star Rating (1 to 5)
                </label>
                <div className="star-rating" style={{ justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${feedbackRating >= star ? 'filled' : ''}`}
                      onClick={() => setFeedbackRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Your Review & Comments
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="How was your pet's consultation experience?"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-epic" style={{ width: '100%', justifyContent: 'center' }}>
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RE-SELECT TIME OR DOCTOR FOLLOWING DECLINE */}
      {showReselectModal && reselectAppt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2>
                {reselectMode === 'SAME_DOCTOR' ? '🕒 Option 1: Pick New Time Slot' : '👨‍⚕️ Option 2: Choose Another Doctor'}
              </h2>
              <button className="modal-close" onClick={() => setShowReselectModal(false)}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem 1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span><strong>Ref:</strong> {reselectAppt.appointmentNumber} (🐾 {reselectAppt.petName})</span>
                <span style={{ color: '#64748b' }}>Original: {reselectAppt.appointmentDate} ({reselectAppt.timeSlot})</span>
              </div>
              <div style={{ color: '#be123c', background: '#ffe4e6', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                <strong>Admin Decline Reason:</strong> {reselectAppt.rejectionReason || 'Doctor unavailable on original slot.'}
              </div>
            </div>

            {/* Mode switch tabs inside modal */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setReselectMode('SAME_DOCTOR');
                  setReselectDoctorId(reselectAppt.doctorId || 'DOC-2001');
                  setReselectDoctorName(reselectAppt.doctorName || 'Dr. Natasha Silva');
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid ' + (reselectMode === 'SAME_DOCTOR' ? '#0284c7' : '#e2e8f0'),
                  background: reselectMode === 'SAME_DOCTOR' ? '#f0f9ff' : '#fff',
                  color: reselectMode === 'SAME_DOCTOR' ? '#0369a1' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                1. Same Doctor ({reselectAppt.doctorName})
              </button>
              <button
                type="button"
                onClick={() => {
                  setReselectMode('DIFFERENT_DOCTOR');
                  const otherDoc = doctorsList.find((d) => d.id !== reselectAppt.doctorId) || doctorsList[0];
                  setReselectDoctorId(otherDoc.id);
                  setReselectDoctorName(otherDoc.name);
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid ' + (reselectMode === 'DIFFERENT_DOCTOR' ? '#7c3aed' : '#e2e8f0'),
                  background: reselectMode === 'DIFFERENT_DOCTOR' ? '#f5f3ff' : '#fff',
                  color: reselectMode === 'DIFFERENT_DOCTOR' ? '#6d28d9' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                2. Different Doctor
              </button>
            </div>

            <form onSubmit={handleReselectSubmit}>
              {reselectMode === 'DIFFERENT_DOCTOR' ? (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    Select Available Veterinarian <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    value={reselectDoctorId}
                    onChange={(e) => {
                      const doc = doctorsList.find((d) => d.id === e.target.value);
                      setReselectDoctorId(e.target.value);
                      if (doc) {
                        setReselectDoctorName(doc.name);
                        setReselectReason(`Selected alternative doctor (${doc.name})`);
                      }
                    }}
                  >
                    {doctorsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} &mdash; {d.spec} {d.id === reselectAppt.doctorId ? '(Previous)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    Doctor
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${reselectDoctorName} (Same Veterinarian)`}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    New Preferred Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={reselectDate}
                    onChange={(e) => setReselectDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    Available Time Slot <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                    value={reselectSlot}
                    onChange={(e) => setReselectSlot(e.target.value)}
                  >
                    <option value="">-- Select Time Slot --</option>
                    {reselectSlots.length > 0 ? (
                      reselectSlots.map((s, idx) => (
                        <option key={idx} value={s.timeSlot} disabled={!s.available && !s.isAvailable}>
                          {s.timeSlot} {(s.available || s.isAvailable) ? '✓ Available' : '✗ Booked'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        ⚠️ Off-Duty on this day (No slots)
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {reselectSlots.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', color: '#92400e', fontSize: '0.82rem' }}>
                  ⚠️ <strong>{reselectDoctorName}</strong> is <strong>Off-Duty</strong> on this date. Please select a working date or choose another doctor.
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Owner Note / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Selected alternative morning time"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  value={reselectReason}
                  onChange={(e) => setReselectReason(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary-epic"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: reselectMode === 'SAME_DOCTOR' ? '#0284c7' : '#7c3aed'
                }}
              >
                🔄 Submit Updated Request to Hospital Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PET OWNER APPOINTMENT RESCHEDULE / CHANGE DOCTOR */}
      {showOwnerRescheduleModal && selectedOwnerAppt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>🔄 Reschedule Appointment / Change Doctor</h2>
              <button className="modal-close" onClick={() => setShowOwnerRescheduleModal(false)}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <strong>{selectedOwnerAppt.appointmentNumber}</strong>
                <span style={{ color: '#0369a1', fontWeight: '600' }}>🐾 {selectedOwnerAppt.petName}</span>
              </div>
              <div style={{ color: '#475569' }}>
                Current: <strong>{selectedOwnerAppt.doctorName}</strong> on {selectedOwnerAppt.appointmentDate} ({selectedOwnerAppt.timeSlot})
              </div>
            </div>

            <form onSubmit={handleOwnerRescheduleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Select Veterinarian / Doctor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.9rem' }}
                  value={ownerReschedDoctorId}
                  onChange={(e) => {
                    const docId = e.target.value;
                    const docObj = doctorsList.find((d) => d.id === docId);
                    setOwnerReschedDoctorId(docId);
                    if (docObj) setOwnerReschedDoctorName(docObj.name);
                    handleOwnerReschedDocOrDateChange(docId, ownerReschedDate);
                  }}
                >
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.spec}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    New Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    value={ownerReschedDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setOwnerReschedDate(newDate);
                      handleOwnerReschedDocOrDateChange(ownerReschedDoctorId, newDate);
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                    Available Slot <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    required
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.9rem' }}
                    value={ownerReschedSlot}
                    onChange={(e) => setOwnerReschedSlot(e.target.value)}
                  >
                    <option value="">-- Select Slot --</option>
                    {ownerReschedSlots.length > 0 ? (
                      ownerReschedSlots.map((s, idx) => (
                        <option key={idx} value={s.timeSlot} disabled={!s.available && !s.isAvailable}>
                          {s.timeSlot} {(s.available || s.isAvailable) ? '🟢 Available' : '🔴 Occupied'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        ⚠️ Off-Duty on this day (No slots)
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {ownerReschedSlots.length === 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', color: '#92400e', fontSize: '0.82rem' }}>
                  ⚠️ <strong>{ownerReschedDoctorName}</strong> is <strong>Off-Duty</strong> on this date. Please select a day when this veterinarian is working or choose a different doctor above.
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Reason for Change
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prefer afternoon slot or different doctor"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  value={ownerReschedReason}
                  onChange={(e) => setOwnerReschedReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary-epic"
                  onClick={() => setShowOwnerRescheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-epic"
                  style={{ background: '#0284c7' }}
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: PET OWNER CANCEL APPOINTMENT */}
      {showOwnerCancelModal && selectedOwnerAppt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2>🚫 Cancel Appointment</h2>
              <button className="modal-close" onClick={() => setShowOwnerCancelModal(false)}>✕</button>
            </div>

            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem', color: '#9f1239', fontSize: '0.875rem' }}>
              Are you sure you want to cancel appointment <strong>#{selectedOwnerAppt.appointmentNumber}</strong> for <strong>{selectedOwnerAppt.petName}</strong> on <strong>{selectedOwnerAppt.appointmentDate}</strong>?
            </div>

            <form onSubmit={handleOwnerCancelSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.35rem' }}>
                  Reason for Cancellation
                </label>
                <select
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem', marginBottom: '0.5rem' }}
                  value={ownerCancelReason}
                  onChange={(e) => setOwnerCancelReason(e.target.value)}
                >
                  <option value="Prefer different veterinarian on another date">Prefer different veterinarian on another date</option>
                  <option value="Personal schedule conflict">Personal schedule conflict</option>
                  <option value="Pet condition improved / recovered">Pet condition improved / recovered</option>
                  <option value="Other reason">Other reason</option>
                </select>
                {ownerCancelReason === 'Other reason' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter reason..."
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    onChange={(e) => setOwnerCancelReason(e.target.value)}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary-epic"
                  onClick={() => setShowOwnerCancelModal(false)}
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  className="btn-action-reject"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  Yes, Cancel Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
