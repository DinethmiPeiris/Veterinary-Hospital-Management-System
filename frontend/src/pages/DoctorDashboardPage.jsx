import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import DoctorHospitalizedPetsPage from './DoctorHospitalizedPetsPage';
import DoctorPortal from './epic4/DoctorPortal';
import DoctorRecommendPage from './DoctorRecommendPage';
import ConsultationPage from './doctor/workflow/ConsultationPage';
import './DoctorDashboardPage.css';

// SVG Icons
const IconStethoscope = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V8a5 5 0 0 0 10 0V2.6a.3.3 0 0 0-.3-.3" />
        <path d="M8 10v2a4 4 0 0 0 8 0v-2" />
        <path d="M12 14v4a3 3 0 0 0 6 0v-1" />
        <circle cx="18" cy="16" r="2" />
    </svg>
);

const IconCalendar = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const IconPaw = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 10c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2s2-.9 2-2v-3c0-1.1-.9-2-2-2z" />
        <path d="M6.5 12c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2s2-.9 2-2v-2c0-1.1-.9-2-2-2z" />
        <path d="M17.5 12c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2s2-.9 2-2v-2c0-1.1-.9-2-2-2z" />
        <path d="M9 7c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2s2-.9 2-2V9c0-1.1-.9-2-2-2z" />
        <path d="M15 7c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2s2-.9 2-2V9c0-1.1-.9-2-2-2z" />
    </svg>
);

const IconUser = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconFileText = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const IconCheckCircle = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const IconPhone = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const IconMail = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const IconX = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function DoctorDashboardPage({ initialView = null, hideHeader = false }) {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    // View state — always default to OVERVIEW on load/navigation
    const DOCTOR_VIEW_KEY = 'vhms_doctor_view';
    const [currentView, setCurrentViewRaw] = useState(initialView || 'OVERVIEW');
    const setCurrentView = (v) => { try { localStorage.setItem(DOCTOR_VIEW_KEY, v); } catch { } setCurrentViewRaw(v); window.scrollTo({ top: 0, behavior: 'instant' }); };

    useEffect(() => {
        if (initialView) {
            setCurrentViewRaw(initialView);
        }
    }, [initialView]);

    // Doctor Availability Status: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
    const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE');

    // Doctor Profile Management
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedConsultationId, setSelectedConsultationId] = useState(null);
    const [doctorProfile, setDoctorProfile] = useState(null);

    // Password change state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPass, setIsSavingPass] = useState(false);
    const [hasCustomPassword, setHasCustomPassword] = useState(false);
    const [showFirstTimeResetModal, setShowFirstTimeResetModal] = useState(false);

    // Doctor Consultation Management State
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApptForDiagnosis, setSelectedApptForDiagnosis] = useState(null);
    const [diagnosisNotes, setDiagnosisNotes] = useState('');
    const [prescriptionNotes, setPrescriptionNotes] = useState('');

    // Inspect Modals State
    const [selectedPetForProfile, setSelectedPetForProfile] = useState(null);
    const [selectedOwnerForProfile, setSelectedOwnerForProfile] = useState(null);

    const [appointments, setAppointments] = useState([]);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '', show: false });

    const showToast = (message, type = 'success') => {
        setToast({ message, type, show: true });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };

    useEffect(() => {
        const userStr = localStorage.getItem('vhms_user');
        let currentEmail = 'perera@vhms.com';
        let currentDocName = 'Dr. Kasun Perera';

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                currentDocName = user.name || 'Dr. Kasun Perera';
                currentEmail = user.email || 'perera@vhms.com';
                setName(currentDocName);
                setEmail(currentEmail);
                setPhone(user.phone || '0771234567');
                setDepartment(user.address || 'Veterinary Surgery & Critical Care');

                // Check first time login flag
                const firstLogins = JSON.parse(localStorage.getItem('vhms_first_login_doctors') || '{}');
                const isExplicitlyFalse = firstLogins[currentEmail] === false || firstLogins[currentDocName] === false || user.isFirstTimeLogin === false;
                const isExplicitlyTrue = user.isFirstTimeLogin === true || firstLogins[currentEmail] === true || firstLogins[currentDocName] === true;

                if (isExplicitlyTrue && !isExplicitlyFalse) {
                    setShowFirstTimeResetModal(true);
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            setName('Dr. Kasun Perera');
            setEmail('perera@vhms.com');
            setPhone('0771234567');
            setDepartment('Veterinary Surgery & Critical Care');
        }

        // Load full profile from admin-created doctor roster
        try {
            const storedEmail = JSON.parse(localStorage.getItem('vhms_user') || '{}').email;
            const customDocs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]');
            const matched = customDocs.find(d => d.email === storedEmail);
            if (matched) setDoctorProfile(matched);

            const passwords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}');
            if (storedEmail && passwords[storedEmail]) setHasCustomPassword(true);
        } catch { }

        // Load saved availability status & check working days schedule
        try {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const now = new Date();
            const todayDayName = dayNames[now.getDay()];
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const totalMinutes = currentHour * 60 + currentMinute;

            const isChannaDoc = (currentDocName && currentDocName.toLowerCase().includes('channa')) || (currentEmail && currentEmail.toLowerCase().includes('channa'));
            const isNimalDoc = (currentDocName && currentDocName.toLowerCase().includes('nimal')) || (currentEmail && currentEmail.toLowerCase().includes('nimal'));

            const workingDaysMap = JSON.parse(localStorage.getItem('vhms_doctor_working_days') || '{}');

            const keysToTry = [
                currentEmail,
                currentEmail ? currentEmail.toLowerCase() : null,
                currentDocName,
                currentDocName ? currentDocName.toLowerCase() : null,
                'nimal@vhms.com',
                'nimal@sjah.com',
                'Dr. Nimal Perera',
                'channa@sjah.com',
                'channa@vhms.com',
                'Dr. Sirimath Channa Molligoda'
            ].filter(Boolean);

            let doctorWorkingDays = null;
            for (const key of keysToTry) {
                if (workingDaysMap[key]) {
                    doctorWorkingDays = workingDaysMap[key];
                    break;
                }
            }

            if (doctorProfile?.availableHours) {
                const dayNamesListNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const parsedDays = dayNamesListNames.filter(d => doctorProfile.availableHours.toLowerCase().includes(d.toLowerCase()));
                if (parsedDays.length > 0) doctorWorkingDays = parsedDays;
            }
            if (!doctorWorkingDays) {
                const isKarunanayake = (currentDocName && currentDocName.toLowerCase().includes('karunanayake')) || (currentEmail && currentEmail.toLowerCase().includes('karunanayake'));
                if (isKarunanayake) doctorWorkingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                else if (isNimalDoc) doctorWorkingDays = ['Sat', 'Sun'];
                else if (isChannaDoc) doctorWorkingDays = ['Mon', 'Wed', 'Fri', 'Sat'];
                else doctorWorkingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            }

            const todayStrFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const globalSchedules = JSON.parse(localStorage.getItem('vhms_schedules') || '{}');
            let todayCustomSched = null;
            for (const key of keysToTry) {
                if (globalSchedules[key] && globalSchedules[key][todayStrFormatted] !== undefined) {
                    todayCustomSched = globalSchedules[key][todayStrFormatted];
                    break;
                }
            }

            let isOffDutyToday = false;

            if (todayCustomSched) {
                if (todayCustomSched.length === 0) {
                    isOffDutyToday = true;
                } else {
                    const parseTime = (t) => {
                        const m = t.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i);
                        if (!m) return 0;
                        let h = parseInt(m[1], 10);
                        if (m[3] && m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
                        if (m[3] && m[3].toUpperCase() === 'AM' && h === 12) h = 0;
                        return h * 60 + parseInt(m[2], 10);
                    };
                    const times = todayCustomSched.map(s => parseTime(typeof s === 'object' ? s.time : s)).filter(t => t > 0);
                    if (times.length > 0) {
                        const minSlot = Math.min(...times);
                        const maxSlot = Math.max(...times) + 30;
                        if (totalMinutes < minSlot || totalMinutes >= maxSlot) {
                            isOffDutyToday = true;
                        }
                    }
                }
            } else {
                isOffDutyToday = doctorWorkingDays ? !doctorWorkingDays.includes(todayDayName) : false;

                if (!isOffDutyToday) {
                    let availableStr = doctorProfile?.availableHours || '';
                    const isKarunanayake = (currentDocName && currentDocName.toLowerCase().includes('karunanayake')) || (currentEmail && currentEmail.toLowerCase().includes('karunanayake'));
                    if (!availableStr && isKarunanayake) availableStr = "3.00 PM - 8.00 PM";
                    if (!availableStr && isNimalDoc) availableStr = "11.00 AM - 2.00 PM";

                    if (availableStr) {
                        const timeRanges = [];
                        const rangeRegex = /(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?\s*[-–to]+\s*(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?/gi;
                        let match;
                        while ((match = rangeRegex.exec(availableStr)) !== null) {
                            let startH = parseInt(match[1], 10);
                            let startM = match[2] ? parseInt(match[2], 10) : 0;
                            let startAmPm = match[3] ? match[3].toUpperCase() : null;

                            let endH = parseInt(match[4], 10);
                            let endM = match[5] ? parseInt(match[5], 10) : 0;
                            let endAmPm = match[6] ? match[6].toUpperCase() : null;

                            if (!startAmPm && !endAmPm) {
                                if (startH >= 7 && startH < 12) startAmPm = 'AM';
                                if (endH < startH || endH < 7) endAmPm = 'PM';
                            } else if (startAmPm && !endAmPm) {
                                if (endH < startH) endAmPm = 'PM';
                                else endAmPm = startAmPm;
                            } else if (!startAmPm && endAmPm) {
                                if (startH >= 7 && startH < 12) startAmPm = 'AM';
                                else startAmPm = endAmPm;
                            }

                            if (startAmPm === 'PM' && startH !== 12) startH += 12;
                            if (startAmPm === 'AM' && startH === 12) startH = 0;
                            if (endAmPm === 'PM' && endH !== 12) endH += 12;
                            if (endAmPm === 'AM' && endH === 12) endH = 0;

                            const startTotal = startH * 60 + startM;
                            const endTotal = endH * 60 + endM;
                            if (endTotal > startTotal) {
                                timeRanges.push({ start: startTotal, end: endTotal });
                            }
                        }
                        if (timeRanges.length > 0 && !timeRanges.some(r => totalMinutes >= r.start && totalMinutes < r.end)) {
                            isOffDutyToday = true;
                        }
                    } else if (isNimalDoc) {
                        if (totalMinutes < 660 || totalMinutes >= 840) isOffDutyToday = true;
                    }
                }
            }

            if (isOffDutyToday) {
                setAvailabilityStatus('UNAVAILABLE');
            } else {
                const savedStatuses = JSON.parse(localStorage.getItem('vhms_doctor_statuses') || '{}');
                const existingStatus = savedStatuses[currentEmail] || savedStatuses[currentDocName] || 'AVAILABLE';
                setAvailabilityStatus(existingStatus);
            }
        } catch { }

        const loadDoctorAppointments = async () => {
            let apiAppts = [];
            try {
                const fetched = await api.getAppointments();
                if (Array.isArray(fetched)) apiAppts = fetched;
            } catch (e) { }

            let localAppts = [];
            try {
                const stored = localStorage.getItem('vhms_user_appointments');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) localAppts = parsed;
                }
            } catch (e) { }

            const combined = [...apiAppts];
            localAppts.forEach(la => {
                if (!combined.some(ca => ca.id === la.id || (ca.petName === la.petName && ca.date === la.date && ca.timeSlot === la.timeSlot))) {
                    combined.push(la);
                }
            });

            const todayStr = new Date().toISOString().split('T')[0];
            const cleaned = combined.filter(a => {
                const isMock = String(a.doctorName || '').includes('Dr. Smith') || (a.date && String(a.date).length > 20);
                return !isMock;
            }).map(a => {
                if (a.status === 'COMPLETED' && a.date > todayStr) {
                    return { ...a, status: 'APPROVED' };
                }
                return a;
            });

            setAppointments(cleaned);
        };

        loadDoctorAppointments();

        const handleStorageChange = () => loadDoctorAppointments();
        window.addEventListener('storage', handleStorageChange);
        const pollInterval = setInterval(() => loadDoctorAppointments(), 3000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(pollInterval);
        };
    }, []);


    const handleLogout = () => {
        localStorage.removeItem('vhms_user');
        navigate('/login');
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            showToast('Please fill in both password fields.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters.', 'error');
            return;
        }
        if (newPassword === 'Doctor@123') {
            showToast('You cannot use the default password. Please choose a different one.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match. Please try again.', 'error');
            return;
        }

        setIsSavingPass(true);
        try {
            const passwords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}');
            passwords[email] = newPassword;
            localStorage.setItem('vhms_doctor_passwords', JSON.stringify(passwords));
            setHasCustomPassword(true);
            setNewPassword('');
            setConfirmPassword('');
            showToast('Password changed successfully!', 'success');
        } catch {
            showToast('Failed to save password.', 'error');
        } finally {
            setIsSavingPass(false);
        }
    };

    const handleFirstTimePasswordReset = (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            showToast('Please fill in both password fields.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters long.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match. Please re-enter.', 'error');
            return;
        }

        const passwords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}');
        const docEmail = email || currentUser?.email;
        const docName = name || currentUser?.name;

        if (docEmail) passwords[docEmail] = newPassword;
        if (docName) passwords[docName] = newPassword;
        localStorage.setItem('vhms_doctor_passwords', JSON.stringify(passwords));

        const firstLogins = JSON.parse(localStorage.getItem('vhms_first_login_doctors') || '{}');
        if (docEmail) firstLogins[docEmail] = false;
        if (docName) firstLogins[docName] = false;
        if (currentUser?.email) firstLogins[currentUser.email] = false;
        if (currentUser?.name) firstLogins[currentUser.name] = false;
        localStorage.setItem('vhms_first_login_doctors', JSON.stringify(firstLogins));

        const updatedUser = { ...(currentUser || {}), email: docEmail || currentUser?.email, name: docName || currentUser?.name, isFirstTimeLogin: false };
        localStorage.setItem('vhms_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        setHasCustomPassword(true);
        setNewPassword('');
        setConfirmPassword('');
        setShowFirstTimeResetModal(false);
        showToast('🔐 Password updated successfully! Your account is now secure.', 'success');
    };

    const handleAvailabilityChange = (status) => {
        if (status === 'AVAILABLE') {
            const now = new Date();
            const totalMinutes = now.getHours() * 60 + now.getMinutes();
            const todayDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

            const workingDaysMap = JSON.parse(localStorage.getItem('vhms_doctor_working_days') || '{}');
            let doctorWorkingDays = workingDaysMap[email] || workingDaysMap[name];

            const isKarunanayake = (name && name.toLowerCase().includes('karunanayake')) || (email && email.toLowerCase().includes('karunanayake'));
            const isNimalDoc = (name && name.toLowerCase().includes('nimal')) || (email && email.toLowerCase().includes('nimal'));

            const isChannaDoc = (name && name.toLowerCase().includes('channa')) || (email && email.toLowerCase().includes('channa'));
            if (doctorProfile?.availableHours) {
                const dayNamesListNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const parsedDays = dayNamesListNames.filter(d => doctorProfile.availableHours.toLowerCase().includes(d.toLowerCase()));
                if (parsedDays.length > 0) doctorWorkingDays = parsedDays;
            }
            if (!doctorWorkingDays) {
                if (isKarunanayake) doctorWorkingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                else if (isNimalDoc) doctorWorkingDays = ['Sat', 'Sun'];
                else if (isChannaDoc) doctorWorkingDays = ['Mon', 'Wed', 'Fri', 'Sat'];
                else doctorWorkingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            }

            const keysToTry = [
                email, email ? email.toLowerCase() : null,
                name, name ? name.toLowerCase() : null,
                'nimal@vhms.com', 'nimal@sjah.com', 'Dr. Nimal Perera',
                'channa@sjah.com', 'channa@vhms.com', 'Dr. Sirimath Channa Molligoda'
            ].filter(Boolean);

            const todayStrFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const globalSchedules = JSON.parse(localStorage.getItem('vhms_schedules') || '{}');
            let todayCustomSched = null;
            for (const key of keysToTry) {
                if (globalSchedules[key] && globalSchedules[key][todayStrFormatted] !== undefined) {
                    todayCustomSched = globalSchedules[key][todayStrFormatted];
                    break;
                }
            }

            let isOffDutyToday = false;

            if (todayCustomSched) {
                if (todayCustomSched.length === 0) {
                    isOffDutyToday = true;
                } else {
                    const parseTime = (t) => {
                        const m = t.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i);
                        if (!m) return 0;
                        let h = parseInt(m[1], 10);
                        if (m[3] && m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
                        if (m[3] && m[3].toUpperCase() === 'AM' && h === 12) h = 0;
                        return h * 60 + parseInt(m[2], 10);
                    };
                    const times = todayCustomSched.map(s => parseTime(typeof s === 'object' ? s.time : s)).filter(t => t > 0);
                    if (times.length > 0) {
                        const minSlot = Math.min(...times);
                        const maxSlot = Math.max(...times) + 30;
                        if (totalMinutes < minSlot || totalMinutes >= maxSlot) {
                            isOffDutyToday = true;
                        }
                    }
                }
            } else {
                isOffDutyToday = doctorWorkingDays ? !doctorWorkingDays.includes(todayDayName) : false;

                if (!isOffDutyToday) {
                    let availableStr = doctorProfile?.availableHours || '';
                    if (!availableStr && isKarunanayake) availableStr = "3.00 PM - 8.00 PM";
                    if (!availableStr && isNimalDoc) availableStr = "11.00 AM - 2.00 PM";

                    if (availableStr) {
                        const timeRanges = [];
                        const rangeRegex = /(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?\s*[-–to]+\s*(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?/gi;
                        let match;
                        while ((match = rangeRegex.exec(availableStr)) !== null) {
                            let startH = parseInt(match[1], 10);
                            let startM = match[2] ? parseInt(match[2], 10) : 0;
                            let startAmPm = match[3] ? match[3].toUpperCase() : null;

                            let endH = parseInt(match[4], 10);
                            let endM = match[5] ? parseInt(match[5], 10) : 0;
                            let endAmPm = match[6] ? match[6].toUpperCase() : null;

                            if (!startAmPm && !endAmPm) {
                                if (startH >= 7 && startH < 12) startAmPm = 'AM';
                                if (endH < startH || endH < 7) endAmPm = 'PM';
                            } else if (startAmPm && !endAmPm) {
                                if (endH < startH) endAmPm = 'PM';
                                else endAmPm = startAmPm;
                            } else if (!startAmPm && endAmPm) {
                                if (startH >= 7 && startH < 12) startAmPm = 'AM';
                                else startAmPm = endAmPm;
                            }

                            if (startAmPm === 'PM' && startH !== 12) startH += 12;
                            if (startAmPm === 'AM' && startH === 12) startH = 0;
                            if (endAmPm === 'PM' && endH !== 12) endH += 12;
                            if (endAmPm === 'AM' && endH === 12) endH = 0;

                            const startTotal = startH * 60 + startM;
                            const endTotal = endH * 60 + endM;
                            if (endTotal > startTotal) {
                                timeRanges.push({ start: startTotal, end: endTotal });
                            }
                        }
                        if (timeRanges.length > 0 && !timeRanges.some(r => totalMinutes >= r.start && totalMinutes < r.end)) {
                            isOffDutyToday = true;
                        }
                    } else if (isNimalDoc) {
                        if (totalMinutes < 660 || totalMinutes >= 840) isOffDutyToday = true;
                    }
                }
            }

            if (isOffDutyToday) {
                showToast('Action Denied: You cannot go On Duty outside of your official scheduled working hours.', 'error');
                return;
            }
        }

        setAvailabilityStatus(status);
        try {
            const savedStatuses = JSON.parse(localStorage.getItem('vhms_doctor_statuses') || '{}');
            const docEmail = email || 'channa@sjah.com';
            const docName = name || 'Dr. Sirimath Channa Molligoda';

            savedStatuses[docEmail] = status;
            savedStatuses[docName] = status;
            if ((docName && docName.toLowerCase().includes('nimal')) || (docEmail && docEmail.toLowerCase().includes('nimal'))) {
                savedStatuses['nimal@vhms.com'] = status;
                savedStatuses['nimal@sjah.com'] = status;
                savedStatuses['Dr. Nimal Perera'] = status;
            }

            localStorage.setItem('vhms_doctor_statuses', JSON.stringify(savedStatuses));

            const storedDocs = localStorage.getItem('vhms_custom_doctors');
            if (storedDocs) {
                const customDocs = JSON.parse(storedDocs);
                const updatedDocs = customDocs.map(d => {
                    if (
                        d.email === docEmail ||
                        d.name === docName ||
                        (d.name && d.name.toLowerCase().includes('nimal') && docName.toLowerCase().includes('nimal')) ||
                        (d.name && d.name.toLowerCase().includes('channa') && docName.toLowerCase().includes('channa'))
                    ) {
                        return { ...d, status: status };
                    }
                    return d;
                });
                localStorage.setItem('vhms_custom_doctors', JSON.stringify(updatedDocs));
            }
            window.dispatchEvent(new Event('storage'));
        } catch { }
    };

    const handleOpenDiagnosisModal = (appt) => {
        setSelectedApptForDiagnosis(appt);
        setDiagnosisNotes(appt.diagnosis || '');
        setPrescriptionNotes(appt.prescription || '');
    };

    const handleSaveDiagnosis = (e) => {
        e.preventDefault();
        if (!selectedApptForDiagnosis) return;

        const updatedAppts = appointments.map(a => a.id === selectedApptForDiagnosis.id ? {
            ...a,
            status: 'COMPLETED',
            diagnosis: diagnosisNotes,
            prescription: prescriptionNotes
        } : a);

        setAppointments(updatedAppts);

        try {
            const stored = localStorage.getItem('vhms_user_appointments');
            let userAppts = stored ? JSON.parse(stored) : [];
            const index = userAppts.findIndex(a => a.id === selectedApptForDiagnosis.id);
            if (index !== -1) {
                userAppts[index] = {
                    ...userAppts[index],
                    status: 'COMPLETED',
                    diagnosis: diagnosisNotes,
                    prescription: prescriptionNotes
                };
            } else {
                userAppts.push({
                    ...selectedApptForDiagnosis,
                    status: 'COMPLETED',
                    diagnosis: diagnosisNotes,
                    prescription: prescriptionNotes
                });
            }
            localStorage.setItem('vhms_user_appointments', JSON.stringify(userAppts));
        } catch (e) { }

        showToast('Clinical diagnosis & RX prescription saved!', 'success');
        setSelectedApptForDiagnosis(null);
    };



    // Open Pet Medical Profile Inspector Modal (Now redirects to EMR)
    const handleViewPetProfile = async (appt) => {
        if (appt.petId) {
            navigate(`/doctor/pet/${appt.petId}/history?appointmentId=${appt.id || appt.appointmentId || appt.appointmentNumber}`);
        } else {
            showToast('Pet ID not available for this appointment.', 'error');
        }
    };

    // Open Owner Contact Profile Inspector Modal
    const handleViewOwnerProfile = (appt) => {
        let ownerDetails = {
            name: appt.ownerName || 'Pet Owner',
            phone: appt.ownerPhone || '0771234567',
            email: appt.ownerEmail || `${(appt.ownerName || 'owner').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            address: appt.ownerAddress || 'Colombo, Sri Lanka',
            registeredPets: [appt.petName || 'Milo'],
            status: 'Verified Pet Owner Account'
        };

        try {
            const regUsersStr = localStorage.getItem('vhms_registered_users');
            if (regUsersStr) {
                const regUsers = JSON.parse(regUsersStr);
                const found = regUsers.find(u => u.name?.toLowerCase() === appt.ownerName?.toLowerCase() || u.phone === appt.ownerPhone);
                if (found) {
                    ownerDetails = { ...ownerDetails, ...found };
                }
            }
        } catch { }

        setSelectedOwnerForProfile(ownerDetails);
    };

    const handleCompleteAppointment = (apptId, petName) => {
        const updated = appointments.map(a => a.id === apptId ? { ...a, status: 'COMPLETED' } : a);
        setAppointments(updated);
        try {
            localStorage.setItem('vhms_user_appointments', JSON.stringify(updated));
        } catch { }
        showToast(`✅ Consultation for ${petName || 'patient'} marked as Completed!`, 'success');
    };

    // Filter appointments for this doctor
    const myAppointments = appointments.filter(a => {
        if (!a.doctorName && !a.doctorId) return false;
        const docNameLower = (name || '').toLowerCase();
        const docEmailLower = (email || '').toLowerCase();
        const docIdLower = (currentUser?.id || '').toLowerCase();

        const aptDocNameLower = (a.doctorName || '').toLowerCase();
        const aptDocIdLower = (a.doctorId || '').toLowerCase();

        if (aptDocNameLower.includes('assigned') || aptDocNameLower.includes('specialist')) return true;

        if (aptDocNameLower && (aptDocNameLower.includes(docNameLower) || docNameLower.includes(aptDocNameLower))) return true;
        if (aptDocIdLower && (aptDocIdLower === docIdLower || aptDocIdLower === docEmailLower || aptDocIdLower.includes(docEmailLower) || docEmailLower.includes(aptDocIdLower))) return true;

        // Token matching (e.g. "Natasha" matches "Dr. Natasha Perera" or "Dr. Natasha")
        const nameTokens = docNameLower.replace('dr.', '').trim().split(/\s+/).filter(t => t.length >= 3);
        if (nameTokens.some(token => aptDocNameLower.includes(token) || aptDocIdLower.includes(token))) return true;

        const aptTokens = aptDocNameLower.replace('dr.', '').trim().split(/\s+/).filter(t => t.length >= 3);
        if (aptTokens.some(token => docNameLower.includes(token) || docEmailLower.includes(token))) return true;

        return false;
    });

    const filteredAppointments = myAppointments.filter(a => {
        if (statusFilter !== 'ALL' && a.status !== statusFilter && !(statusFilter === 'APPROVED' && a.status === 'CONFIRMED')) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (a.petName || '').toLowerCase().includes(q) ||
                (a.ownerName || '').toLowerCase().includes(q) ||
                (a.serviceType || '').toLowerCase().includes(q);
        }
        return true;
    });

    const userInitial = name ? name.replace('Dr. ', '').charAt(0).toUpperCase() : 'D';

    return (
        <div className="admin-page doctor-theme" style={hideHeader ? { padding: 0, minHeight: 'auto', background: 'transparent' } : {}}>
            {/* Header */}
            {!hideHeader && (
                <header className="admin-header">
                    <div className="admin-shell">
                        <div className="admin-brand">
                            <Link to="/doctor/portal" onClick={() => setCurrentView('OVERVIEW')} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div className="brand-icon-glow">
                                    <span className="brand-icon"><IconStethoscope size={24} /></span>
                                </div>
                                <div>
                                    <strong className="brand-name">Sri Jayawardanapura Animal Hospital</strong>
                                    <span className="brand-subtitle">Doctor Portal</span>
                                </div>
                            </Link>
                        </div>

                        <div className="admin-nav-right">
                            <div className="doctor-dropdown-wrapper" style={{ position: 'relative' }}>
                                <div
                                    className={`admin-user-pill ${isDropdownOpen ? 'active' : ''}`}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="user-avatar-sm">
                                        {userInitial}
                                    </div>
                                    <div className="user-meta">
                                        <strong>{name}</strong>
                                        <span className="user-role-badge doctor-badge">Veterinary Surgeon</span>
                                    </div>
                                    <span className={`dropdown-caret ${isDropdownOpen ? 'open' : ''}`}>▾</span>
                                </div>

                                {isDropdownOpen && (
                                    <div className="doctor-user-dropdown">
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setCurrentView('PROFILE');
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            My Profile
                                        </button>
                                        <button
                                            className="dropdown-item logout"
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                handleLogout();
                                            }}
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <div className="doc-unified-layout">
                <main className="admin-main admin-shell" style={hideHeader ? { padding: '10px 0' } : { padding: '24px 0' }}>
                    {currentView !== 'OVERVIEW' && currentView !== 'CONSULTATION' && (
                        <div className="back-navigation-bar" style={{ marginBottom: '10px' }}>
                            <button className="btn-back-overview" onClick={() => setCurrentView('OVERVIEW')}>
                                ← Back to Clinical Workspace
                            </button>
                        </div>
                    )}

                    {currentView === 'OVERVIEW' && (
                        <>
                            {/* Clinical Hero Banner */}
                            <section className="admin-hero-card">
                                <div className="hero-content">
                                    <div className="hero-status-pill">
                                        <span className="live-pulse"></span> Authenticated Veterinary Surgeon Workspace
                                    </div>
                                    <h1 className="hero-title">Welcome, {name}</h1>
                                    <p className="hero-description">
                                        Manage clinical consultations, inspect patient medical records, and log Rx prescriptions.
                                    </p>
                                </div>
                                <div className="hero-actions">
                                    <div className={`live-availability-badge ${availabilityStatus.toLowerCase()}`}>
                                        <span className="status-dot"></span>
                                        {availabilityStatus === 'AVAILABLE' && 'Available for Consultations'}
                                        {availabilityStatus === 'UNAVAILABLE' && 'Off Duty'}
                                    </div>
                                </div>
                            </section>

                            {/* Executive Clinical KPI Cards */}
                            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                                <div className="bento-card">
                                    <div className="bento-head">
                                        <span className="bento-label">Total Assigned Consultations</span>
                                        <span className="bento-icon-wrap emerald"><IconCalendar size={22} /></span>
                                    </div>
                                    <div className="bento-number">{myAppointments.length}</div>
                                    <div className="bento-footer text-muted">Active Clinical Appointments</div>
                                </div>

                                <div className="bento-card">
                                    <div className="bento-head">
                                        <span className="bento-label">Completed Consultations</span>
                                        <span className="bento-icon-wrap blue"><IconCheckCircle size={22} /></span>
                                    </div>
                                    <div className="bento-number">{myAppointments.filter(a => a.status === 'COMPLETED').length}</div>
                                    <div className="bento-footer text-muted">Successfully Treated Patients</div>
                                </div>

                                <div className="bento-card">
                                    <div className="bento-head">
                                        <span className="bento-label">Practice Duty Status</span>
                                        <span className="bento-icon-wrap purple"><IconStethoscope size={22} /></span>
                                    </div>
                                    <div className="bento-number" style={{ fontSize: '1.25rem', color: availabilityStatus === 'AVAILABLE' ? '#047857' : '#dc2626' }}>
                                        {availabilityStatus === 'AVAILABLE' ? 'On Duty' : 'Off Duty'}
                                    </div>
                                    <div className="bento-footer text-muted">Live Consultation Toggle</div>
                                </div>

                                <div className="bento-card" style={{ cursor: 'pointer', borderTop: '4px solid #3b82f6' }} onClick={() => setCurrentView('HOSPITALIZED_PETS')}>
                                    <div className="bento-head">
                                        <span className="bento-label" style={{ fontWeight: 800 }}>Hospitalized Patients</span>
                                        <span className="bento-icon-wrap blue"><IconCalendar size={22} /></span>
                                    </div>
                                    <div className="bento-number" style={{ fontSize: '1.5rem' }}>Admissions</div>
                                    <div className="bento-footer text-muted">Manage Inpatient Care</div>
                                </div>

                                <div className="bento-card" style={{ cursor: 'pointer', borderTop: '4px solid #8b5cf6' }} onClick={() => setCurrentView('RECOMMEND_ADMISSION')}>
                                    <div className="bento-head">
                                        <span className="bento-label" style={{ fontWeight: 800 }}>Hospitalization Requests</span>
                                        <span className="bento-icon-wrap purple"><IconStethoscope size={22} /></span>
                                    </div>
                                    <div className="bento-number" style={{ fontSize: '1.5rem' }}>Recommend</div>
                                    <div className="bento-footer text-muted">Recommend Pet Admission</div>
                                </div>

                                <div className="bento-card" style={{ cursor: 'pointer', borderTop: '4px solid #f59e0b' }} onClick={() => setCurrentView('BILLING')}>
                                    <div className="bento-head">
                                        <span className="bento-label" style={{ fontWeight: 800 }}>Consultation Hub</span>
                                        <span className="bento-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}><IconCheckCircle size={22} /></span>
                                    </div>
                                    <div className="bento-number" style={{ fontSize: '1.5rem' }}>Appointments</div>
                                    <div className="bento-footer text-muted">Manage Clinical Consultations</div>
                                </div>
                            </section>


                            {/* Live Availability Duty Control */}
                            <section className="admin-panel-card" style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span>⚡ Live Duty Availability Toggle</span>
                                        </h3>
                                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.86rem' }}>
                                            Update your real-time status visible to hospital staff and pet owners seeking consultations.
                                        </p>
                                    </div>

                                    <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '5px', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '4px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleAvailabilityChange('AVAILABLE')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 20px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.86rem',
                                                cursor: 'pointer',
                                                background: availabilityStatus === 'AVAILABLE' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                                                color: availabilityStatus === 'AVAILABLE' ? '#ffffff' : '#64748b',
                                                boxShadow: availabilityStatus === 'AVAILABLE' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                                            }}
                                        >
                                            Available for Consultations
                                        </button>



                                        <button
                                            type="button"
                                            onClick={() => handleAvailabilityChange('UNAVAILABLE')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px 20px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                fontWeight: 700,
                                                fontSize: '0.86rem',
                                                cursor: 'pointer',
                                                background: availabilityStatus === 'UNAVAILABLE' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                                                color: availabilityStatus === 'UNAVAILABLE' ? '#ffffff' : '#64748b',
                                                boxShadow: availabilityStatus === 'UNAVAILABLE' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                                            }}
                                        >
                                            Off Duty
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Patient Consultations Roster */}
                            <section className="admin-panel-card">
                                <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                                            <span>📅 Assigned Consultations & Medical Roster</span>
                                        </h3>

                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <span style={{ background: '#f1f5f9', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', border: '1px solid #e2e8f0' }}>
                                            Total: {myAppointments.length}
                                        </span>
                                        <span style={{ background: '#dcfce7', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, color: '#15803d', border: '1px solid #bbf7d0' }}>
                                            Approved: {myAppointments.filter(a => ['APPROVED', 'CONFIRMED'].includes(a.status)).length}
                                        </span>
                                    </div>
                                </div>

                                {/* Filter Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px 0', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '4px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                        {['ALL', 'APPROVED', 'COMPLETED'].map(st => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() => setStatusFilter(st)}
                                                style={{
                                                    padding: '7px 16px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    fontWeight: 700,
                                                    fontSize: '0.82rem',
                                                    cursor: 'pointer',
                                                    background: statusFilter === st ? '#10b981' : 'transparent',
                                                    color: statusFilter === st ? '#ffffff' : '#64748b',
                                                    boxShadow: statusFilter === st ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none'
                                                }}
                                            >
                                                {st === 'ALL' && `All Patients (${myAppointments.length})`}
                                                {st === 'APPROVED' && `Approved (${myAppointments.filter(a => ['APPROVED', 'CONFIRMED'].includes(a.status)).length})`}
                                                {st === 'COMPLETED' && `Completed (${myAppointments.filter(a => a.status === 'COMPLETED').length})`}
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ position: 'relative', width: '280px' }}>
                                        <input
                                            type="text"
                                            placeholder="Search by pet, species, or owner..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '9px 14px 9px 36px',
                                                borderRadius: '12px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '0.86rem',
                                                outline: 'none'
                                            }}
                                        />
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94a3b8' }}>🔍</span>
                                    </div>
                                </div>

                                {/* Patient List */}
                                {filteredAppointments.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
                                        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>No Consultations Match Selection</h4>
                                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>Try updating your search query or filter controls.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                                        {filteredAppointments.map((appt) => (
                                            <div key={appt.id} className="doc-patient-card">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(145deg, #f8fafc, #f1f5f9)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.7), 0 4px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                                                                <IconPaw size={26} strokeWidth={2.2} />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <button className="clickable-pet-title" onClick={() => handleViewPetProfile(appt)} style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    {appt.petName} <span style={{ color: '#0ea5e9' }}><IconCheckCircle size={16} strokeWidth={2.5} /></span>
                                                                </button>
                                                                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                                                                    {appt.species} • {appt.breed || 'Standard Breed'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <span style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '100px',
                                                            fontSize: '0.78rem',
                                                            fontWeight: 800,
                                                            background: appt.status === 'COMPLETED' ? '#e0f2fe' : ['APPROVED', 'CONFIRMED'].includes(appt.status) ? '#dcfce7' : appt.status === 'REJECTED' ? '#fef2f2' : '#fef3c7',
                                                            color: appt.status === 'COMPLETED' ? '#0284c7' : ['APPROVED', 'CONFIRMED'].includes(appt.status) ? '#16a34a' : appt.status === 'REJECTED' ? '#dc2626' : '#b45309',
                                                        }}>
                                                            {appt.status === 'COMPLETED' ? 'Completed' : ['APPROVED', 'CONFIRMED'].includes(appt.status) ? 'Approved' : ['REJECTED', 'CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(appt.status) ? 'Declined' : 'Pending Approval'}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '18px', background: 'transparent', padding: '0', fontSize: '0.86rem', color: '#475569' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</span>
                                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{appt.date} • {appt.timeSlot || '10:30 AM'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Type</span>
                                                            <span style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.serviceType || 'General Consultation'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pet Owner</span>
                                                            <button className="clickable-entity-btn" onClick={() => handleViewOwnerProfile(appt)} style={{ fontWeight: 600, color: '#0f172a', textDecorationColor: '#cbd5e1' }}>
                                                                {appt.ownerName}
                                                            </button>
                                                        </div>
                                                        {appt.reason && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Complaint</span>
                                                                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.reason}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {appt.diagnosis && (
                                                        <div style={{ background: '#f8fafc', borderLeft: '4px solid #10b981', padding: '14px 16px', borderRadius: '0 12px 12px 0', fontSize: '0.86rem', color: '#334155', marginTop: '4px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <div><span style={{ color: '#059669', fontWeight: 800 }}>Diagnosis:</span> {appt.diagnosis}</div>
                                                                {appt.prescription && <div><span style={{ color: '#0ea5e9', fontWeight: 800 }}>Rx:</span> {appt.prescription}</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', marginTop: 'auto' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewPetProfile(appt)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 16px',
                                                            borderRadius: '100px',
                                                            background: '#f8fafc',
                                                            color: '#475569',
                                                            fontWeight: 700,
                                                            fontSize: '0.86rem',
                                                            border: '0',
                                                            cursor: 'pointer',
                                                            textAlign: 'center',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                                                        onMouseOut={(e) => e.target.style.background = '#f8fafc'}
                                                    >
                                                        Inspect Profile
                                                    </button>

                                                    {['APPROVED', 'CONFIRMED', 'IN_PROGRESS'].includes(appt.status) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedConsultationId(appt.id || appt.appointmentId || appt.appointmentNumber);
                                                                setCurrentView('CONSULTATION');
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '10px 16px',
                                                                borderRadius: '100px',
                                                                border: 'none',
                                                                background: '#0f172a',
                                                                color: '#ffffff',
                                                                fontWeight: 700,
                                                                fontSize: '0.86rem',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                                                                textAlign: 'center',
                                                                transition: 'transform 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px'
                                                            }}
                                                            onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)' }}
                                                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                                        >
                                                            {appt.status === 'IN_PROGRESS' ? 'Resume Consult' : 'Start Consult'}
                                                        </button>
                                                    ) : appt.status === 'COMPLETED' ? (
                                                        <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', borderRadius: '100px', background: '#f8fafc', color: '#94a3b8', fontWeight: 700, fontSize: '0.86rem', border: '0' }}>
                                                            Consult Completed
                                                        </span>
                                                    ) : appt.status === 'REJECTED' || appt.status === 'DECLINED' ? (
                                                        <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', borderRadius: '100px', background: '#f8fafc', color: '#ef4444', fontWeight: 700, fontSize: '0.86rem', border: '0' }}>
                                                            Access Declined
                                                        </span>
                                                    ) : (
                                                        <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', borderRadius: '100px', background: '#f8fafc', color: '#94a3b8', fontWeight: 700, fontSize: '0.86rem', border: '0' }}>
                                                            Awaiting Approval
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* READ-ONLY DOCTOR PROFILE VIEW */}
                    {currentView === 'PROFILE' && (
                        <section className="admin-panel-card profile-panel">
                            <div className="panel-card-header">
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>👤 My Professional Doctor Profile</h2>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
                                <img
                                    src={doctorProfile?.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'}
                                    alt="Doctor"
                                    style={{ width: '90px', height: '90px', borderRadius: '20px', objectFit: 'cover', border: '3px solid #ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                                />
                                <div>
                                    <span style={{ background: '#dcfce7', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>{doctorProfile?.id ? `${doctorProfile.id} • ` : ''}Authorized Surgeon</span>
                                    <h2 style={{ margin: '6px 0 2px', fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{doctorProfile?.name || name}</h2>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#059669', fontWeight: 700 }}>{doctorProfile?.specialization || department}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Professional Information</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: '#334155' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                                <strong style={{ color: '#0f172a' }}>Medical Licence / ID:</strong> <span>{doctorProfile?.id || 'Pending Validation'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                                <strong style={{ color: '#0f172a' }}>Credentials:</strong> <span>{doctorProfile?.experience || 'Registered Surgeon'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                                <strong style={{ color: '#0f172a' }}>Operating Hours:</strong> <span>{doctorProfile?.availableHours || '08:00 AM - 05:00 PM'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <strong style={{ color: '#0f172a' }}>Registration Status:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>Active - Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Contact Information</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: '#334155' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><IconMail size={18} style={{ color: '#64748b' }} /> <span>{doctorProfile?.email || email}</span></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><IconPhone size={18} style={{ color: '#64748b' }} /> <span>{doctorProfile?.phone || phone}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Clinical Biography & Services</p>
                                        <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
                                            {doctorProfile?.bio || 'Professional veterinary surgeon dedicated to premium animal care.'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Approved Medical Services</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {(doctorProfile?.services || ['General Care', 'Consultations']).map((srv, i) => (
                                                <span key={i} style={{ background: '#f1f5f9', color: '#0f172a', padding: '5px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #e2e8f0' }}>
                                                    {srv}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '24px' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Account Security Update</p>
                                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <input
                                                type="password"
                                                placeholder="Enter New Password (min 6 chars)"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm New Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                                            />
                                            <button type="submit" disabled={isSavingPass} style={{ padding: '10px', borderRadius: '10px', border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                                {isSavingPass ? 'Processing...' : 'Confirm Password Change'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {currentView === 'HOSPITALIZED_PETS' && (
                        <DoctorHospitalizedPetsPage hideHeader={true} />
                    )}

                    {currentView === 'BILLING' && (
                        <DoctorPortal
                            hideHeader={true}
                            onStartConsultation={(id) => {
                                setSelectedConsultationId(id);
                                setCurrentView('CONSULTATION');
                            }}
                        />
                    )}

                    {currentView === 'CONSULTATION' && selectedConsultationId && (
                        <div style={{ padding: '20px' }}>
                            <div className="back-navigation-bar" style={{ marginBottom: '20px' }}>
                                <button className="btn-back-overview" onClick={() => setCurrentView('BILLING')}>
                                    ← Back to Booking Requests
                                </button>
                            </div>
                            <ConsultationPage appointmentId={selectedConsultationId} onExit={() => setCurrentView('BILLING')} />
                        </div>
                    )}

                    {currentView === 'RECOMMEND_ADMISSION' && (
                        <DoctorRecommendPage />
                    )}
                </main>
            </div>

            {/* PET MEDICAL PROFILE INSPECTOR MODAL */}
            {selectedPetForProfile && (
                <div className="modal-overlay" onClick={() => setSelectedPetForProfile(null)}>
                    <div className="clinical-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', borderRadius: '24px', overflow: 'hidden', padding: '0' }}>
                        {/* Premium Header Banner */}
                        <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '24px 28px', color: '#ffffff', position: 'relative' }}>
                            <button
                                className="clinical-modal-close-btn"
                                onClick={() => setSelectedPetForProfile(null)}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                            >
                                <IconX size={18} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {selectedPetForProfile.photoUrl ? (
                                    <img src={selectedPetForProfile.photoUrl} alt="Pet" style={{ width: '72px', height: '72px', borderRadius: '20px', objectFit: 'cover', border: '3px solid rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                ) : (
                                    <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.2)', border: '2px solid rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', backdropFilter: 'blur(4px)' }}>
                                        <IconPaw size={36} />
                                    </div>
                                )}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>{selectedPetForProfile.name}</h3>
                                        <span style={{ background: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', padding: '3px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                                            {selectedPetForProfile.species || 'Dog'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#ecfdf5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ background: '#34d399', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                                        <span>Active Health Profile</span>
                                        <span style={{ opacity: 0.6 }}>•</span>
                                        <span>Owner: <strong>{selectedPetForProfile.ownerName || 'Dinethmi Peiris'}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px 28px' }}>
                            {/* Health Vitals Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', background: '#f8fafc', padding: '16px', borderRadius: '18px', marginBottom: '22px', border: '1px solid #e2e8f0' }}>
                                <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Breed</span>
                                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>{selectedPetForProfile.breed}</strong>
                                </div>
                                <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Age</span>
                                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>{selectedPetForProfile.age}</strong>
                                </div>
                                <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Weight</span>
                                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>{selectedPetForProfile.weight}</strong>
                                </div>
                                <div style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Gender</span>
                                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>{selectedPetForProfile.gender || 'Male'}</strong>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>DOB</span>
                                    <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>{selectedPetForProfile.dateOfBirth || 'Oct 4, 2024'}</strong>
                                </div>
                            </div>

                            {/* Medical Alert & Allergies */}
                            <div style={{ marginBottom: '22px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.9rem' }}>🛡️</span>
                                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>Special Medical Notes & Allergies</h4>
                                </div>
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '14px', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }}></div>
                                    <div>{selectedPetForProfile.notes || 'No known drug allergies reported. Core DHPP & Rabies vaccinations up-to-date.'}</div>
                                </div>
                            </div>

                            {/* Clinical History Timeline */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.9rem' }}>📋</span>
                                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>Clinical Record & Consultations</h4>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {selectedPetForProfile.history?.map((h, idx) => (
                                        <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '16px', fontSize: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>📅 {h.date}</span>
                                                <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.8rem' }}>{h.service || 'General Consultation'}</span>
                                            </div>
                                            <div style={{ color: '#1e293b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                <strong style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Diagnosis / Clinical Assessment:</strong>
                                                {h.diagnosis || 'Routine physical examination completed. All vital signs within normal parameters.'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PET OWNER CONTACT PROFILE INSPECTOR MODAL */}
            {selectedOwnerForProfile && (
                <div className="modal-overlay" onClick={() => setSelectedOwnerForProfile(null)}>
                    <div className="clinical-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="clinical-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e0f2fe', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                                    <IconUser size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{selectedOwnerForProfile.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700 }}>Pet Owner Contact Profile</span>
                                </div>
                            </div>
                            <button className="clinical-modal-close-btn" onClick={() => setSelectedOwnerForProfile(null)}><IconX size={18} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <IconPhone size={18} style={{ color: '#059669' }} />
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Phone Contact</span>
                                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{selectedOwnerForProfile.phone}</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <IconMail size={18} style={{ color: '#0284c7' }} />
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{selectedOwnerForProfile.email}</strong>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Registered Pets under Owner</h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {selectedOwnerForProfile.registeredPets?.map((pet, idx) => (
                                    <span key={idx} style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '6px 14px', borderRadius: '100px', fontSize: '0.84rem', fontWeight: 700 }}>
                                        🐾 {pet}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CLINICAL DIAGNOSIS & PRESCRIPTION ENTRY MODAL */}
            {selectedApptForDiagnosis && (
                <div className="modal-overlay" onClick={() => setSelectedApptForDiagnosis(null)}>
                    <div className="clinical-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="clinical-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                                    <IconStethoscope size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>Clinical Record & RX Prescription</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#059669' }}>
                                        Patient: <strong>{selectedApptForDiagnosis.petName}</strong> ({selectedApptForDiagnosis.species}) • Owner: {selectedApptForDiagnosis.ownerName}
                                    </p>
                                </div>
                            </div>
                            <button className="clinical-modal-close-btn" onClick={() => setSelectedApptForDiagnosis(null)}><IconX size={18} /></button>
                        </div>

                        <form onSubmit={handleSaveDiagnosis}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Clinical Findings & Diagnosis *</label>
                                <textarea
                                    rows="3"
                                    value={diagnosisNotes}
                                    onChange={(e) => setDiagnosisNotes(e.target.value)}
                                    placeholder="Physical exam results, vitals, temperature, diagnosis details..."
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit' }}
                                ></textarea>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>Rx Medication & Dosage Instructions *</label>
                                <textarea
                                    rows="3"
                                    value={prescriptionNotes}
                                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                                    placeholder="e.g. Amoxicillin 250mg twice daily x 7 days; Meloxicam 1.5mg once daily..."
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit' }}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setSelectedApptForDiagnosis(null)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Record & Complete Visit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mandatory First-Time Password Reset Modal */}
            {showFirstTimeResetModal && (
                <div className="modal-backdrop" style={{ zIndex: 100000 }}>
                    <div className="pet-profile-view-modal" style={{ maxWidth: '480px', width: '90%', padding: '32px', textAlign: 'center', borderRadius: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', border: '2px solid #fde68a' }}>
                            🔒
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                            First-Time Security Reset Required
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: '1.4' }}>
                            Welcome to VHMS, <strong>{name}</strong>! Your account was initialized with a temporary password. Please set your unique permanent password to continue.
                        </p>

                        <form onSubmit={handleFirstTimePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>New Permanent Password *</label>
                                <input
                                    type="password"
                                    placeholder="Enter at least 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Confirm New Password *</label>
                                <input
                                    type="password"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    marginTop: '10px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                Set New Password & Access Workspace →
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <div className={`toast-modern${toast.show ? ' show' : ''} ${toast.type}`}>
                {toast.message}
            </div>
        </div>
    );
}
