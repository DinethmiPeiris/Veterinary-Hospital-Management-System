import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, Calendar, ShieldCheck, Heart, Plus, ChevronDown, ChevronRight, ArrowRight, Shield, Bell, Check, CheckCheck, Trash2, Filter, Search, Mail, Info, AlertCircle, X, Clock } from 'lucide-react';
import { api } from '../services/api';
import PetOwnerConsultations from './petowner/PetOwnerConsultations';
import PetOwnerMedicalHistory from './petowner/PetOwnerMedicalHistory';
import PetOwnerAdmissionsPage from './PetOwnerAdmissionsPage';
import PetOwnerPortal from './epic4/PetOwnerPortal';
import './PetManagementPage.css';
import './saas-dashboard.css';

const petEmojis = ['🐕', '🐈', '🐇', '🦜', '🐠', '🐹', '🐾', '🦮', '🐈‍⬛', '🦔'];

// --- Reusable Components (SaaS Re-architecture) ---

const DualPawIcon = ({ size, className, fill }) => (
    <div style={{ position: 'relative', width: size, height: size }}>
        <PawPrint size={size * 0.7} className={className} strokeWidth={2} fill={fill} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-20deg)' }} />
        <PawPrint size={size * 0.85} className={className} strokeWidth={2} fill={fill} style={{ position: 'absolute', bottom: '-2px', right: '-2px', transform: 'rotate(10deg)' }} />
    </div>
);

const PortalHeader = ({
    currentUser,
    isDropdownOpen,
    setIsDropdownOpen,
    handleLogout,
    setCurrentView,
    resetSubpageState,
    notifications = [],
    unreadNotifCount = 0,
    isNotifDropdownOpen = false,
    setIsNotifDropdownOpen,
    markAsRead,
    markAllAsRead,
    setSelectedNotifDetail
}) => (
    <header className="saas-header">
        <div className="saas-header-inner">
            <div
                className="saas-logo"
                onClick={() => {
                    setCurrentView('OVERVIEW');
                    if (resetSubpageState) resetSubpageState();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ cursor: 'pointer' }}
                title="Go to Pet Owner Dashboard Overview"
            >
                <div className="saas-logo-icon" style={{ position: 'relative', overflow: 'hidden' }}>
                    <PawPrint size={14} color="#064e3b" fill="#064e3b" style={{ position: 'absolute', top: '6px', left: '6px', transform: 'rotate(-20deg)' }} />
                    <PawPrint size={18} color="#064e3b" fill="#064e3b" style={{ position: 'absolute', bottom: '6px', right: '6px', transform: 'rotate(10deg)' }} />
                </div>
                <div className="saas-logo-text">
                    <strong>Sri Jayawardanapura Animal Hospital</strong>
                    <span>Pet Owner Portal</span>
                </div>
            </div>

            <div className="saas-header-actions-group">
                {/* NOTIFICATION BELL ICON TRIGGER (US 1.27, US 1.28, US 1.29) */}
                <div style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className="saas-notif-bell-btn"
                        onClick={() => {
                            if (setIsNotifDropdownOpen) setIsNotifDropdownOpen(!isNotifDropdownOpen);
                            if (setIsDropdownOpen) setIsDropdownOpen(false);
                        }}
                        title="Notification Center"
                    >
                        <Bell size={20} color="#059669" />
                        {unreadNotifCount > 0 && (
                            <span className="saas-notif-badge">{unreadNotifCount}</span>
                        )}
                        {unreadNotifCount > 0 && <span className="saas-notif-pulse"></span>}
                    </button>

                    {/* NOTIFICATION HEADER QUICK DROPDOWN */}
                    {isNotifDropdownOpen && (
                        <div className="saas-notif-dropdown" onClick={(e) => e.stopPropagation()}>
                            <div className="notif-dropdown-header">
                                <h4>
                                    <Bell size={16} color="#059669" /> Notifications
                                    {unreadNotifCount > 0 && (
                                        <span className="saas-notif-badge" style={{ position: 'static', border: 'none' }}>
                                            {unreadNotifCount} unread
                                        </span>
                                    )}
                                </h4>
                                {unreadNotifCount > 0 && (
                                    <button
                                        type="button"
                                        className="btn-text-action"
                                        onClick={() => markAllAsRead && markAllAsRead()}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="notif-dropdown-list">
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                        🔔 No notifications yet
                                    </div>
                                ) : (
                                    notifications.slice(0, 4).map((n) => {
                                        const isUnread = !n.read;
                                        return (
                                            <div
                                                key={n.id}
                                                className={`notif-dropdown-item ${isUnread ? 'unread' : ''}`}
                                                onClick={() => {
                                                    if (markAsRead && isUnread) markAsRead(n.id);
                                                    if (setSelectedNotifDetail) setSelectedNotifDetail(n);
                                                    if (setIsNotifDropdownOpen) setIsNotifDropdownOpen(false);
                                                }}
                                            >
                                                <div className={`notif-item-icon ${n.type === 'APPOINTMENT' ? 'type-bg-appointment' : n.type === 'VACCINE' ? 'type-bg-vaccine' : n.type === 'PET_PROFILE' ? 'type-bg-pet' : 'type-bg-system'}`}>
                                                    {n.type === 'APPOINTMENT' ? '📅' : n.type === 'VACCINE' ? '💉' : n.type === 'PET_PROFILE' ? '🐾' : '⚙️'}
                                                </div>
                                                <div className="notif-item-content">
                                                    <h5 className="notif-item-title">{n.title}</h5>
                                                    <p className="notif-item-msg">{n.message}</p>
                                                    <span className="notif-item-time">{n.timestamp}</span>
                                                </div>
                                                {isUnread && <div className="notif-unread-dot"></div>}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="notif-dropdown-footer">
                                <button
                                    type="button"
                                    className="btn-view-all-notifs"
                                    onClick={() => {
                                        if (setIsNotifDropdownOpen) setIsNotifDropdownOpen(false);
                                        setCurrentView('NOTIFICATIONS');
                                    }}
                                >
                                    View Centralized Notification Center →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* USER PROFILE PILL */}
                <div className="saas-user-pill">
                    <div className="saas-profile-trigger" onClick={() => { setIsDropdownOpen(!isDropdownOpen); if (setIsNotifDropdownOpen) setIsNotifDropdownOpen(false); }}>
                        <div className="saas-user-avatar">
                            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="saas-user-info">
                            <strong>{currentUser?.name || 'Guest'}</strong>
                            <span>{currentUser?.email || 'guest@vhms.com'}</span>
                        </div>
                        <ChevronDown size={14} className={`saas-chevron ${isDropdownOpen ? 'open' : ''}`} />
                    </div>
                    {isDropdownOpen && (
                        <div className="saas-dropdown">
                            <button onClick={() => { setCurrentView('NOTIFICATIONS'); setIsDropdownOpen(false); }}>Notification Center</button>
                            <button onClick={() => { setCurrentView('PROFILE'); setIsDropdownOpen(false); }}>My Profile</button>
                            <button className="text-red" onClick={() => { setIsDropdownOpen(false); handleLogout(); }}>Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </header>
);

const HeroSection = ({ currentUser }) => {
    const displayName = currentUser?.name ? currentUser.name : 'Pet Owner';
    return (
        <section className="saas-hero">
            <div className="saas-hero-content">
                <div className="saas-status">
                    <span className="saas-pulse"></span> Pet Portal Operational
                </div>
                <h1 className="saas-hero-title">Welcome back, <span className="saas-highlight">{displayName}</span> 🐾</h1>
                <p className="saas-hero-description">Manage your registered pet profiles, update medical stats, and prepare for hospital visits.</p>

                <div className="saas-hero-features">
                    <span><Heart size={16} color="#10b981" /> Health Records</span>
                    <span><Calendar size={16} color="#10b981" /> Hospital Visits</span>
                    <span><ShieldCheck size={16} color="#10b981" /> Secure & Private</span>
                    <span><PawPrint size={16} color="#10b981" /> Better Care Together</span>
                </div>
            </div>
            <div className="saas-hero-graphics">
                <div className="saas-blob"></div>
                <PawPrint className="saas-decor d1" size={24} color="#bbf7d0" />
                <PawPrint className="saas-decor d2" size={20} color="#bbf7d0" />
                <img
                    src="/hero-pets-clean.png"
                    alt="Happy Pets"
                    style={{ position: 'absolute', right: '35px', bottom: '-15px', height: '100%', objectFit: 'contain', zIndex: 5 }}
                />
            </div>
        </section>
    );
};

const DashboardCard = ({ icon: Icon, theme, label, value, subtext, onClick, solid = false }) => (
    <div className={`saas-card saas-card-${theme}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <div className={`saas-card-icon bg-${theme}`}>
                    <Icon size={28} className={`text-${theme}`} strokeWidth={2.5} fill={solid ? "currentColor" : "none"} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '2px' }}>
                    <span className="saas-card-label" style={{ marginBottom: '6px' }}>{label}</span>
                    <span className="saas-card-val" style={{ lineHeight: '1', marginBottom: '6px' }}>{value}</span>
                    <span className="saas-card-sub" style={{ margin: 0 }}>{subtext}</span>
                </div>
            </div>
            {onClick && (
                <div className={`saas-card-arrow bg-${theme}`}>
                    <ChevronRight size={16} strokeWidth={2.5} />
                </div>
            )}
        </div>
    </div>
);

const FooterQuote = () => (
    <div className="saas-footer">
        <div className="saas-wave-bg"></div>
    </div>
);

export default function PetManagementPage({ initialView = null, hideHeader = false }) {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    // View state — persisted across refreshes
    const PET_VIEW_KEY = 'vhms_pet_view';
    const safePetViews = ['OVERVIEW', 'PETS_LIST', 'FIND_DOCTOR', 'MY_APPOINTMENTS', 'CONSULTATIONS', 'MEDICAL_HISTORY', 'PROFILE', 'NOTIFICATIONS', 'ADMISSIONS', 'BILLING', 'INVOICES', 'PAYMENTS'];
    const initPetView = (() => { 
        if (initialView) return initialView;
        try { const v = localStorage.getItem(PET_VIEW_KEY); return safePetViews.includes(v) ? v : 'OVERVIEW'; } catch { return 'OVERVIEW'; } 
    })();
    const [currentView, setCurrentViewRaw] = useState(initPetView);
    const setCurrentView = (v) => { if (safePetViews.includes(v)) { try { localStorage.setItem(PET_VIEW_KEY, v); } catch { } } setCurrentViewRaw(v); window.scrollTo({ top: 0, behavior: 'instant' }); };

    useEffect(() => {
        if (initialView) {
            setCurrentViewRaw(initialView);
        }
    }, [initialView]);

    // Doctor Roster & Search State
    const [doctors, setDoctors] = useState([]);
    const [doctorSearch, setDoctorSearch] = useState('');
    const [specFilter, setSpecFilter] = useState('ALL');
    const [selectedDoctorForModal, setSelectedDoctorForModal] = useState(null);

    // Multi-Step Appointment Booking State
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);

    // Global dynamic schedules state
    const [globalSchedules, setGlobalSchedules] = useState({});

    // Helper to evaluate if a doctor is Off Duty right now (based on real-time clock, working days, and time slots)
    const isDoctorOffDuty = (doc) => {
        if (!doc) return true;

        // Account status check (INACTIVE or DEACTIVATED by Admin)
        if (doc.status === 'INACTIVE' || doc.status === 'DEACTIVATED') return true;

        const now = new Date();
        const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIndex = now.getDay();
        const todayShort = dayNamesShort[todayIndex]; // e.g. 'Wed'
        const todayFull = dayNamesFull[todayIndex];   // e.g. 'Wednesday'
        const currentMins = now.getHours() * 60 + now.getMinutes(); // e.g. 11:07 AM = 667 mins

        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStrFormatted = `${yyyy}-${mm}-${dd}`;

        const keysToTry = [
            doc.id,
            String(doc.id),
            doc.email,
            doc.email ? doc.email.toLowerCase() : null,
            doc.name,
            doc.name ? doc.name.toLowerCase() : null
        ].filter(Boolean);

        // 1. Custom Date Schedule Override (from localStorage `vhms_schedules`)
        try {
            const globalSchedules = JSON.parse(localStorage.getItem('vhms_schedules') || '{}');
            let todayCustomSched = null;
            for (const key of keysToTry) {
                if (globalSchedules[key] && globalSchedules[key][todayStrFormatted] !== undefined) {
                    todayCustomSched = globalSchedules[key][todayStrFormatted];
                    break;
                }
            }
            if (todayCustomSched === null) {
                const matchedKey = Object.keys(globalSchedules).find(k =>
                    (doc.name && (k.toLowerCase().includes(doc.name.toLowerCase()) || doc.name.toLowerCase().includes(k.toLowerCase()))) ||
                    (doc.email && (k.toLowerCase().includes(doc.email.toLowerCase()) || doc.email.toLowerCase().includes(k.toLowerCase())))
                );
                if (matchedKey && globalSchedules[matchedKey] && globalSchedules[matchedKey][todayStrFormatted] !== undefined) {
                    todayCustomSched = globalSchedules[matchedKey][todayStrFormatted];
                }
            }

            if (todayCustomSched !== null && Array.isArray(todayCustomSched)) {
                if (todayCustomSched.length === 0) return true; // Off duty if explicitly cleared for today by Admin
                const parseTimeStr = (t) => {
                    if (typeof t === 'object' && t.time) t = t.time;
                    const m = String(t).match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)?$/i);
                    if (!m) return 0;
                    let h = parseInt(m[1], 10);
                    const min = parseInt(m[2], 10);
                    const ampm = m[3] ? m[3].toUpperCase() : null;
                    if (ampm === 'PM' && h !== 12) h += 12;
                    if (ampm === 'AM' && h === 12) h = 0;
                    return h * 60 + min;
                };
                const times = todayCustomSched.map(parseTimeStr).filter(t => t > 0);
                if (times.length > 0) {
                    const minSlot = Math.min(...times);
                    const maxSlot = Math.max(...times) + 30; // 30 min duration for last slot
                    if (currentMins < minSlot || currentMins >= maxSlot) return true;
                    return false; // Within active custom schedule time range!
                }
            }
        } catch (e) { }

        // 2. Determine Active Working Days
        let activeDays = null;

        // Check localStorage `vhms_doctor_working_days`
        try {
            const workingDaysMap = JSON.parse(localStorage.getItem('vhms_doctor_working_days') || '{}');
            for (const key of keysToTry) {
                if (workingDaysMap[key]) {
                    activeDays = workingDaysMap[key];
                    break;
                }
            }
            if (!activeDays) {
                const matchedKey = Object.keys(workingDaysMap).find(k =>
                    (doc.name && (k.toLowerCase().includes(doc.name.toLowerCase()) || doc.name.toLowerCase().includes(k.toLowerCase()))) ||
                    (doc.email && (k.toLowerCase().includes(doc.email.toLowerCase()) || doc.email.toLowerCase().includes(k.toLowerCase())))
                );
                if (matchedKey) activeDays = workingDaysMap[matchedKey];
            }
        } catch (e) { }

        // Parse Working Days from doc.availableHours string if not set in workingDaysMap
        const hoursStr = doc.availableHours || '';
        if (!activeDays && hoursStr) {
            const hLower = hoursStr.toLowerCase();
            const parsed = [];

            // Check explicit day ranges: e.g. "Monday - Friday", "Mon - Sat", "Mon-Fri", "Monday to Friday"
            if (hLower.includes('monday') || hLower.includes('mon')) {
                if (hLower.includes('-') || hLower.includes('to')) {
                    if (hLower.includes('friday') || hLower.includes('fri')) {
                        parsed.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri');
                    } else if (hLower.includes('saturday') || hLower.includes('sat')) {
                        parsed.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
                    } else if (hLower.includes('sunday') || hLower.includes('sun')) {
                        parsed.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
                    }
                }
            }
            if (hLower.includes('saturday - sunday') || hLower.includes('sat - sun') || hLower.includes('sat-sun')) {
                if (!parsed.includes('Sat')) parsed.push('Sat');
                if (!parsed.includes('Sun')) parsed.push('Sun');
            }

            // Check individual day names
            dayNamesShort.forEach((shortName, idx) => {
                const fullName = dayNamesFull[idx].toLowerCase();
                if (hLower.includes(fullName) || hLower.includes(shortName.toLowerCase())) {
                    if (!parsed.includes(shortName)) parsed.push(shortName);
                }
            });

            if (parsed.length > 0) activeDays = parsed;
        }

        // Default working days: if no working days specified anywhere, assume Mon - Sun
        if (!activeDays || activeDays.length === 0) {
            activeDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        }

        // Is today one of the doctor's working days?
        const isTodayWorkingDay = activeDays.some(d => String(d).toLowerCase().startsWith(todayShort.toLowerCase()));
        if (!isTodayWorkingDay) return true; // Off duty if today is not a working day

        // 3. Parse Time Ranges from `availableHours`
        const timeRanges = [];
        if (hoursStr) {
            // Match time range patterns like "11.00 AM - 2.00 PM", "11:00 AM - 02:00 PM", "11.00 - 2.00", "08:00 AM - 05:00 PM"
            const rangeRegex = /(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?\s*[-–to]+\s*(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?/gi;
            let match;
            while ((match = rangeRegex.exec(hoursStr)) !== null) {
                let startH = parseInt(match[1], 10);
                let startM = match[2] ? parseInt(match[2], 10) : 0;
                let startAmPm = match[3] ? match[3].toUpperCase() : null;

                let endH = parseInt(match[4], 10);
                let endM = match[5] ? parseInt(match[5], 10) : 0;
                let endAmPm = match[6] ? match[6].toUpperCase() : null;

                // Handle missing AM/PM intelligently
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
        }

        // Default time range if none parsed: 11:00 AM - 02:00 PM (660 mins to 840 mins)
        if (timeRanges.length === 0) {
            timeRanges.push({ start: 11 * 60, end: 14 * 60 });
        }

        // Check if current time falls into ANY parsed time range
        const isWithinTimeRange = timeRanges.some(r => currentMins >= r.start && currentMins < r.end);
        if (!isWithinTimeRange) return true; // Off duty if outside shift hours

        // If within shift hours and today is working day -> ON DUTY (return false for isOffDuty)
        return false;
    };

    // Separate check: is today a WORKING DAY for this doctor?
    // This ignores clock time — used for booking button label & default date.
    // A doctor can be "Off Duty" right now (shift not started) but still work later today.
    const isDoctorWorkingToday = (doc) => {
        if (!doc) return false;

        // Remove strict UNAVAILABLE blocking here so they can still be booked if they just went offline briefly
        if (doc.status === 'INACTIVE' || doc.status === 'DEACTIVATED') return false;

        const now = new Date();
        const dayNamesList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDay = dayNamesList[now.getDay()];
        const todayFull = fullDayNames[now.getDay()];
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        try {
            const keysToTry = [
                doc.id, String(doc.id), doc.email,
                doc.email ? doc.email.toLowerCase() : null,
                doc.name, doc.name ? doc.name.toLowerCase() : null
            ].filter(Boolean);

            const globalSchedules = JSON.parse(localStorage.getItem('vhms_schedules') || '{}');
            for (const key of keysToTry) {
                if (globalSchedules[key] && globalSchedules[key][todayStr] !== undefined) {
                    return globalSchedules[key][todayStr].length > 0;
                }
            }

            const workingDaysMap = JSON.parse(localStorage.getItem('vhms_doctor_working_days') || '{}');
            let activeDays = null;
            for (const key of keysToTry) {
                if (workingDaysMap[key]) { activeDays = workingDaysMap[key]; break; }
            }

            if (activeDays && Array.isArray(activeDays)) {
                return activeDays.some(d => String(d).toLowerCase().startsWith(todayDay.toLowerCase()));
            }
        } catch { }

        // Ultimate Fallback: String parsing on availableHours
        if (doc.availableHours) {
            const h = doc.availableHours.toLowerCase();

            // Explicitly handle "Monday - Friday" / "Monday - Saturday" formats
            if (h.includes('monday') || h.includes('mon')) {
                if (h.includes('-') || h.includes('to')) {
                    if (h.includes('friday') || h.includes('fri') || h.includes('saturday') || h.includes('sat')) {
                        // Mon-Fri or Mon-Sat includes Tuesday!
                        if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(todayDay)) return true;
                        if (h.includes('sat') && todayDay === 'Sat') return true;
                    }
                }
            }

            // If the string explicitly mentions today
            if (h.includes(todayFull.toLowerCase()) || h.includes(todayDay.toLowerCase())) return true;

            // If it's a specific doctor who User requested to be available today, just allow them
            const n = (doc.name || '').toLowerCase();
            if (n.includes('channa') || n.includes('karunanayake') || n.includes('natasha')) {
                return true;
            }
        }

        return true; // Default: assume working
    };

    useEffect(() => {
        const syncDynamicDoctors = async () => {
            let doctorStatuses = {};
            try {
                const st = localStorage.getItem('vhms_doctor_statuses');
                if (st) doctorStatuses = JSON.parse(st);
            } catch { }

            let customDocs = [];
            try {
                const stored = localStorage.getItem('vhms_custom_doctors');
                if (stored) {
                    customDocs = JSON.parse(stored);
                    if (customDocs.some(d => d.email === 'john.test@vhms.com' || (d.name || '').toLowerCase().includes('john test'))) {
                        customDocs = customDocs.filter(d => d.email !== 'john.test@vhms.com' && !(d.name || '').toLowerCase().includes('john test'));
                        localStorage.setItem('vhms_custom_doctors', JSON.stringify(customDocs));
                    }
                }
            } catch { }

            let apiDocs = [];
            try {
                const fetched = await api.getDoctors();
                if (Array.isArray(fetched)) {
                    apiDocs = fetched
                        .filter(u => u.email !== 'john.test@vhms.com' && !(u.name || '').toLowerCase().includes('john test') && !(u.name || '').toLowerCase().includes('dr. john'))
                        .map(u => ({
                            id: u.id || `DOC-${u.email}`,
                            name: u.name.startsWith('Dr.') ? u.name : `Dr. ${u.name}`,
                            email: u.email,
                            phone: u.phone || '0770000000',
                            specialization: u.specialization || u.address || 'Veterinary Surgery & Medicine',
                            services: Array.isArray(u.services) ? u.services : (u.services ? u.services.split(',').map(s => s.trim()) : ['General Care', 'Consultation', 'Vaccination']),
                            status: 'AVAILABLE',
                            experience: u.experience || 'Registered Specialist',
                            bio: u.bio || `Hospital veterinarian specializing in ${u.specialization || u.address || 'Veterinary Care'}.`,
                            availableHours: u.availableHours || 'Mon - Fri | 08:00 AM - 05:00 PM',
                            photoUrl: u.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
                        }));
                }
            } catch { }

            const merged = [];
            // First pass: add API docs, but override with custom doc data if a match exists
            apiDocs.forEach(d => {
                if (!merged.some(m => m.email === d.email || m.id === d.id)) {
                    const customMatch = customDocs.find(cd =>
                        (cd.email && d.email && cd.email.toLowerCase() === d.email.toLowerCase()) ||
                        (cd.id && d.id && String(cd.id) === String(d.id)) ||
                        (cd.name && d.name && cd.name.toLowerCase() === d.name.toLowerCase())
                    );
                    const base = customMatch ? { ...d, ...customMatch } : d;
                    let savedSt = doctorStatuses[base.email] || doctorStatuses[base.name] || doctorStatuses[base.id];
                    if (!savedSt) {
                        const matchedKey = Object.keys(doctorStatuses).find(k =>
                            k !== 'default' && (
                                (base.name && k.toLowerCase().includes(base.name.toLowerCase())) ||
                                (base.name && base.name.toLowerCase().includes(k.toLowerCase())) ||
                                (base.email && k.toLowerCase().includes(base.email.toLowerCase()))
                            )
                        );
                        if (matchedKey) savedSt = doctorStatuses[matchedKey];
                    }
                    if (savedSt && savedSt !== 'default') base.status = savedSt;
                    const isChanna = (base.name && base.name.toLowerCase().includes('channa')) || (base.email && base.email.toLowerCase().includes('channa'));
                    base.availableHours = base.availableHours || (isChanna ? 'Mon - Sun | 11:00 AM - 02:00 PM' : 'Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM');
                    base.services = Array.isArray(base.services) && base.services.length > 0 ? base.services : ['General Care', 'Consultation', 'Vaccination'];
                    merged.push(base);
                }
            });
            // Second pass: add purely local custom docs not in API
            customDocs.forEach(cd => {
                if (!merged.some(m => (m.email && cd.email && m.email.toLowerCase() === cd.email.toLowerCase()) || (m.id && cd.id && String(m.id) === String(cd.id)))) {
                    let savedSt = doctorStatuses[cd.email] || doctorStatuses[cd.name];
                    if (savedSt && savedSt !== 'default') cd.status = savedSt;
                    const isChanna = (cd.name && cd.name.toLowerCase().includes('channa')) || (cd.email && cd.email.toLowerCase().includes('channa'));
                    cd.availableHours = cd.availableHours || (isChanna ? 'Mon - Sun | 11:00 AM - 02:00 PM' : 'Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM');
                    cd.services = Array.isArray(cd.services) && cd.services.length > 0 ? cd.services : (cd.services ? String(cd.services).split(',').map(s => s.trim()) : ['General Care', 'Consultation']);
                    merged.push(cd);
                }
            });

            if (merged.length === 0) {
                setDoctors([
                    {
                        id: 'DOC-1001',
                        name: 'Dr. Sirimath Channa Molligoda',
                        email: 'channa@vhms.com',
                        phone: '0771234567',
                        specialization: 'Veterinary Surgeon & OPD Specialist',
                        services: ['OPD Consultation', 'General Surgery', 'Vaccination', 'Health Checkup'],
                        status: 'AVAILABLE',
                        experience: 'Senior Veterinary Surgeon (12+ Years)',
                        bio: 'Chief Veterinary Surgeon specializing in OPD treatments, small animal surgeries, and critical care.',
                        availableHours: 'Mon - Sun | 11:00 AM - 02:00 PM',
                        photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'
                    },
                    {
                        id: 'DOC-1002',
                        name: 'Dr. Anura Perera',
                        email: 'anura@vhms.com',
                        phone: '0777654321',
                        specialization: 'Senior Veterinary Surgeon & Medicine Specialist',
                        services: ['Internal Medicine', 'Orthopedic Surgery', 'Emergency Care', 'Dental Care'],
                        status: 'AVAILABLE',
                        experience: 'Consultant Veterinarian (15+ Years)',
                        bio: 'Senior Veterinary Specialist with extensive experience in companion animal internal medicine and orthopedics.',
                        availableHours: 'Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM',
                        photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80'
                    }
                ]);
            } else {
                setDoctors(merged);
            }
        };

        syncDynamicDoctors();

        const handleStorageChange = () => {
            syncDynamicDoctors();
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentView]);

    useEffect(() => {
        if (bookingModalOpen) {
            try {
                const stored = localStorage.getItem('vhms_schedules');
                if (stored) setGlobalSchedules(JSON.parse(stored));
            } catch { }
        }
    }, [bookingModalOpen]);

    const [bookingData, setBookingData] = useState({
        petId: '',
        serviceType: 'General Consultation',
        doctorId: '',
        doctorName: '',
        date: '',
        timeSlot: '11:00 AM',
        reason: '',
        notes: '',
    });

    // Submitted Appointments List (Default 0, loaded from localStorage)
    const [appointments, setAppointments] = useState(() => {
        try {
            const stored = localStorage.getItem('vhms_user_appointments');
            let parsed = stored ? JSON.parse(stored) : [];

            parsed = parsed.filter(a => {
                const isMock = String(a.doctorName || '').includes('Dr. Smith') || (a.date && String(a.date).length > 20);
                return !isMock;
            });

            return parsed;
        } catch {
            return [];
        }
    });

    // Form State for Add / Edit
    const [editingPet, setEditingPet] = useState(null);
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('Dog');
    const [breed, setBreed] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [gender, setGender] = useState('Male');
    const [photoUrl, setPhotoUrl] = useState('');
    const [petFormErrors, setPetFormErrors] = useState({});

    const validatePetForm = () => {
        const errors = {};
        const trimmedName = name ? name.trim() : '';

        // 1. Pet Name Validation
        if (!trimmedName) {
            errors.name = 'Pet Name is required.';
        } else if (trimmedName.length < 2) {
            errors.name = 'Pet Name must be at least 2 characters.';
        } else if (trimmedName.length > 30) {
            errors.name = 'Pet Name cannot exceed 30 characters.';
        } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
            errors.name = 'Pet Name should contain letters and spaces only.';
        }

        // 2. Date of Birth Validation
        if (!dateOfBirth) {
            errors.dateOfBirth = 'Date of Birth is required.';
        } else {
            const dob = new Date(dateOfBirth);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (dob > today) {
                errors.dateOfBirth = 'Date of birth cannot be in the future.';
            }
        }

        // 3. Weight Validation
        const parsedWeight = parseFloat(weight);
        if (!weight && weight !== 0) {
            errors.weight = 'Weight is required.';
        } else if (isNaN(parsedWeight) || parsedWeight <= 0) {
            errors.weight = 'Weight must be greater than 0 kg (e.g. 1.5 kg).';
        } else if (parsedWeight > 250) {
            errors.weight = 'Please enter a valid weight (max 250 kg).';
        }

        // 4. Breed Validation
        if (breed && breed.trim().length > 40) {
            errors.breed = 'Breed cannot exceed 40 characters.';
        }

        setPetFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // User Dropdown & Profile State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userProfileName, setUserProfileName] = useState('');
    const [userProfilePhone, setUserProfilePhone] = useState('');
    const [userProfileAddress, setUserProfileAddress] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const validatePasswordComplexity = (password) => {
        if (!password || password.length < 6) {
            return 'Password must be at least 6 characters long.';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter (A-Z).';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter (a-z).';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number (0-9).';
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return 'Password must contain at least one special character (e.g. !@#$%^&*).';
        }
        return null;
    };

    // Danger Zone Delete Account State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');

    // Pet Profile Inspection Subpage State
    const [selectedPetDetail, setSelectedPetDetail] = useState(null);

    // Doctor Profile Detail State
    const [selectedDoctorDetail, setSelectedDoctorDetail] = useState(null);

    // Appointment Booking Details Modal State
    const [selectedApptDetail, setSelectedApptDetail] = useState(null);

    // =========================================================================
    // NOTIFICATION CENTER STATE & SEEDING LOGIC (US 1.27, US 1.28, US 1.29)
    // =========================================================================
    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
    const [notifFilter, setNotifFilter] = useState('ALL');
    const [notifSearch, setNotifSearch] = useState('');
    const [selectedNotifDetail, setSelectedNotifDetail] = useState(null);

    const NOTIF_STORAGE_PREFIX = 'vhms_notifications_';

    const [notifications, setNotifications] = useState(() => {
        try {
            const userKey = currentUser?.id || currentUser?.email || 'default';
            const stored = localStorage.getItem(`${NOTIF_STORAGE_PREFIX}${userKey}`);
            if (stored) return JSON.parse(stored);
        } catch { }
        return [];
    });

    // Compute unread notification count
    const unreadNotifCount = useMemo(() => {
        return notifications.filter(n => !n.read).length;
    }, [notifications]);

    // Seed default realistic notifications if user has none
    useEffect(() => {
        if (!currentUser) return;
        const userKey = currentUser.id || currentUser.email || 'default';
        const key = `${NOTIF_STORAGE_PREFIX}${userKey}`;

        const loadOrSeedNotifs = async () => {
            // Try backend API first
            let fetched = await api.getNotifications(currentUser.id, currentUser.email);
            if (fetched && Array.isArray(fetched) && fetched.length > 0) {
                setNotifications(fetched);
                try { localStorage.setItem(key, JSON.stringify(fetched)); } catch { }
                return;
            }

            // Fallback to local storage
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setNotifications(parsed);
                        return;
                    }
                }
            } catch { }

            // Default seed notifications for Pet Owner
            const petName = (pets && pets.length > 0) ? pets[0].name : 'Buddy';
            const seed = [
                {
                    id: 'NOTIF-101',
                    userId: currentUser.id || 'usr-1',
                    userEmail: currentUser.email || 'user@vhms.com',
                    title: 'Appointment Request Received 📅',
                    message: `Your consultation booking for ${petName} with Dr. Sirimath Channa Molligoda is currently under review by our hospital desk.`,
                    type: 'APPOINTMENT',
                    read: false,
                    timestamp: 'Just now',
                    relatedId: 'APT-1001'
                },
                {
                    id: 'NOTIF-102',
                    userId: currentUser.id || 'usr-1',
                    userEmail: currentUser.email || 'user@vhms.com',
                    title: 'Annual Rabies Vaccination Due 💉',
                    message: `Annual booster immunization for ${petName} is due this month. Please schedule a visit to ensure full health compliance.`,
                    type: 'VACCINE',
                    read: false,
                    timestamp: '2 hours ago',
                    relatedId: (pets && pets.length > 0) ? pets[0].id : ''
                },
                {
                    id: 'NOTIF-103',
                    userId: currentUser.id || 'usr-1',
                    userEmail: currentUser.email || 'user@vhms.com',
                    title: 'Welcome to VHMS Pet Owner Portal 🐾',
                    message: 'Welcome to Sri Jayawardenapura Animal Hospital! Manage your pets, book doctor visits, and view medical records all in one place.',
                    type: 'SYSTEM',
                    read: true,
                    timestamp: 'Yesterday at 09:30 AM',
                    relatedId: ''
                }
            ];

            setNotifications(seed);
            try { localStorage.setItem(key, JSON.stringify(seed)); } catch { }
        };

        loadOrSeedNotifs();
    }, [currentUser, pets]);

    // Save helper to persist notification updates locally and sync to API
    const saveNotifications = (newList) => {
        setNotifications(newList);
        try {
            const userKey = currentUser?.id || currentUser?.email || 'default';
            localStorage.setItem(`${NOTIF_STORAGE_PREFIX}${userKey}`, JSON.stringify(newList));
        } catch { }
    };

    // Helper to add a new system notification
    const addNotification = async (title, message, type = 'SYSTEM', relatedId = '') => {
        const newNotif = {
            id: 'NOTIF-' + Date.now(),
            userId: currentUser?.id || 'usr-1',
            userEmail: currentUser?.email || 'user@vhms.com',
            title,
            message,
            type,
            read: false,
            timestamp: 'Just now',
            relatedId
        };
        const updated = [newNotif, ...notifications];
        saveNotifications(updated);

        try {
            await api.createNotification(newNotif);
        } catch { }
    };

    // Mark single notification as read (US 1.28)
    const handleMarkAsRead = async (id) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        saveNotifications(updated);
        try {
            await api.markNotificationRead(id);
        } catch { }
    };

    // Toggle read/unread status (US 1.28)
    const handleToggleReadStatus = async (id) => {
        const target = notifications.find(n => n.id === id);
        if (!target) return;
        const newReadStatus = !target.read;
        const updated = notifications.map(n => n.id === id ? { ...n, read: newReadStatus } : n);
        saveNotifications(updated);
        if (newReadStatus) {
            try { await api.markNotificationRead(id); } catch { }
        }
    };

    // Mark all notifications as read (US 1.28)
    const handleMarkAllAsRead = async () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        saveNotifications(updated);
        showToast('All notifications marked as read! ✓', 'success');
        try {
            await api.markAllNotificationsRead(currentUser?.id, currentUser?.email);
        } catch { }
    };

    // Delete single notification (US 1.29)
    const handleDeleteNotification = async (id) => {
        const updated = notifications.filter(n => n.id !== id);
        saveNotifications(updated);
        showToast('Notification deleted ✓', 'info');
        if (selectedNotifDetail?.id === id) {
            setSelectedNotifDetail(null);
        }
        try {
            await api.deleteNotification(id);
        } catch { }
    };

    // Clear all read notifications (US 1.29)
    const handleClearReadNotifications = () => {
        const unreadOnly = notifications.filter(n => !n.read);
        saveNotifications(unreadOnly);
        showToast('Cleared read notifications ✓', 'info');
    };

    const openDoctorProfile = (doc) => {
        setSelectedDoctorDetail(doc);
        setCurrentView('DOCTOR_PROFILE');
    };

    const openViewPet = (pet) => {
        setSelectedPetDetail(pet);
        setCurrentView('PET_PROFILE_DETAIL');
    };

    const [toast, setToast] = useState({ message: '', type: '', show: false });

    const showToast = (message, type = 'success') => {
        setToast({ message, type, show: true });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };


    useEffect(() => {
        const userStr = localStorage.getItem('vhms_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                loadPets(user.id);
            } catch (err) {
                console.error(err);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const loadPets = async (ownerId) => {
        setLoading(true);
        try {
            // Load local-fallback pets (saved when backend was unavailable)
            const localKey = `vhms_pets_local_${ownerId || 'guest'}`;
            let localPets = [];
            try {
                localPets = JSON.parse(localStorage.getItem(localKey) || '[]');
            } catch { }

            let backendPets = [];
            try {
                const data = await api.getPets(ownerId);
                if (Array.isArray(data)) {
                    backendPets = data.filter(p =>
                        (ownerId && (p.ownerId === ownerId || p.ownerEmail === ownerId)) ||
                        (currentUser?.id && p.ownerId === currentUser.id) ||
                        (currentUser?.email && (p.ownerEmail === currentUser.email || p.ownerId === currentUser.email))
                    );
                    // Once backend is restored, sync local pets into backend and clear local cache
                    if (localPets.length > 0) {
                        for (const lp of localPets) {
                            try { await api.addPet(lp); } catch { }
                        }
                        localStorage.removeItem(localKey);
                        localPets = [];
                        // Reload from backend after sync
                        const synced = await api.getPets(ownerId);
                        if (Array.isArray(synced)) {
                            backendPets = synced.filter(p =>
                                (ownerId && (p.ownerId === ownerId || p.ownerEmail === ownerId)) ||
                                (currentUser?.id && p.ownerId === currentUser.id) ||
                                (currentUser?.email && (p.ownerEmail === currentUser.email || p.ownerId === currentUser.email))
                            );
                        }
                    }
                }
            } catch {
                // Backend unavailable — fall through to local pets only
            }

            // Merge: prefer backend pets, append local ones not yet synced
            const merged = [...backendPets];
            localPets.forEach(lp => {
                if (!merged.some(p => p.id === lp.id)) merged.push(lp);
            });
            setPets(merged);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePet = async (petId, petName) => {
        if (!window.confirm(`Are you sure you want to delete ${petName || 'this pet'}'s profile?`)) {
            return;
        }

        try {
            if (petId) {
                await api.deletePet(petId);
            }
            setPets(prev => prev.filter(p => p.id !== petId));
            showToast(`🗑️ ${petName || 'Pet'} profile deleted successfully.`, 'success');
            if (selectedPetDetail?.id === petId) {
                setSelectedPetDetail(null);
                setCurrentView('PETS_LIST');
            }
        } catch (err) {
            console.error(err);
            setPets(prev => prev.filter(p => p.id !== petId));
            showToast(`🗑️ ${petName || 'Pet'} profile removed.`, 'success');
            if (selectedPetDetail?.id === petId) {
                setSelectedPetDetail(null);
                setCurrentView('PETS_LIST');
            }
        }
    };

    const handleDobChange = (e) => {
        const dobVal = e.target.value;
        setDateOfBirth(dobVal);
        if (dobVal) {
            const birthDate = new Date(dobVal);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (birthDate > today) {
                setPetFormErrors(prev => ({ ...prev, dateOfBirth: 'Date of birth cannot be in the future.' }));
                setAge('');
                return;
            } else {
                setPetFormErrors(prev => ({ ...prev, dateOfBirth: null }));
            }

            if (!isNaN(birthDate.getTime())) {
                let years = today.getFullYear() - birthDate.getFullYear();
                let months = today.getMonth() - birthDate.getMonth();
                if (today.getDate() < birthDate.getDate()) {
                    months--;
                }
                if (months < 0) {
                    years--;
                    months += 12;
                }

                if (years <= 0) {
                    const totalMonths = Math.max(1, months);
                    setAge(`${totalMonths} ${totalMonths === 1 ? 'Month' : 'Months'}`);
                } else if (months > 0) {
                    setAge(`${years} ${years === 1 ? 'Year' : 'Years'} ${months} ${months === 1 ? 'Month' : 'Months'}`);
                } else {
                    setAge(`${years} ${years === 1 ? 'Year' : 'Years'}`);
                }
            }
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast('Image file size must be under 10MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                // Compress & resize via canvas before storing to avoid backend payload limits
                const img = new Image();
                img.onload = () => {
                    const MAX_DIM = 400;
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    if (width > MAX_DIM || height > MAX_DIM) {
                        if (width > height) {
                            height = Math.round((height * MAX_DIM) / width);
                            width = MAX_DIM;
                        } else {
                            width = Math.round((width * MAX_DIM) / height);
                            height = MAX_DIM;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    const compressed = canvas.toDataURL('image/jpeg', 0.7);
                    setPhotoUrl(compressed);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const openAddForm = () => {
        setEditingPet(null);
        setName('');
        setSpecies('Dog');
        setBreed('');
        setDateOfBirth('');
        setAge('');
        setWeight('');
        setGender('Male');
        setPhotoUrl('');
        setPetFormErrors({});
        setCurrentView('ADD_PET');
    };

    const openEditForm = (pet) => {
        setEditingPet(pet);
        setName(pet.name);
        setSpecies(pet.species);
        setBreed(pet.breed);
        setDateOfBirth(pet.dateOfBirth || '');
        setAge(pet.age);
        setWeight(pet.weight);
        setGender(pet.gender);
        setPhotoUrl(pet.photoUrl || '');
        setPetFormErrors({});
        setCurrentView('ADD_PET');
    };

    const handleSavePet = async (e) => {
        e.preventDefault();
        if (!validatePetForm()) {
            showToast('Please correct the validation errors before saving.', 'error');
            return;
        }

        // Safety: if photoUrl is a large base64 string (> ~200 KB encoded), fall back to default
        const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';
        const safePhotoUrl = (photoUrl && photoUrl.startsWith('data:') && photoUrl.length > 200 * 1024)
            ? DEFAULT_PHOTO
            : (photoUrl || DEFAULT_PHOTO);

        const petData = {
            ownerId: currentUser ? currentUser.id : 'GUEST_OWNER',
            name,
            species,
            breed: breed || 'Not Specified',
            dateOfBirth,
            age: parseInt(age, 10) || 0,
            weight: parseFloat(weight),
            gender,
            photoUrl: safePhotoUrl,
        };

        try {
            if (editingPet) {
                const updated = await api.updatePet(editingPet.id, petData);
                showToast(`🐾 ${updated.name}'s profile updated!`, 'success');
            } else {
                const added = await api.addPet(petData);
                showToast(`🎉 ${added.name} added to your pet profiles!`, 'success');
            }
            loadPets(currentUser ? currentUser.id : null);
            setCurrentView('PETS_LIST');
        } catch (err) {
            console.warn('Backend unavailable, saving pet to localStorage:', err);
            // --- LOCAL FALLBACK: persist to localStorage so the user is not blocked ---
            try {
                const localKey = `vhms_pets_local_${currentUser?.id || 'guest'}`;
                const stored = JSON.parse(localStorage.getItem(localKey) || '[]');
                if (editingPet) {
                    const idx = stored.findIndex(p => p.id === editingPet.id);
                    const updatedPet = { ...editingPet, ...petData };
                    if (idx >= 0) stored[idx] = updatedPet; else stored.push(updatedPet);
                    localStorage.setItem(localKey, JSON.stringify(stored));
                    setPets(prev => prev.map(p => p.id === editingPet.id ? updatedPet : p));
                    showToast(`🐾 ${petData.name}'s profile updated! (saved locally)`, 'success');
                } else {
                    const newPet = {
                        ...petData,
                        id: 'LOCAL-' + Date.now(),
                        ownerEmail: currentUser?.email,
                        createdAt: new Date().toISOString(),
                    };
                    stored.push(newPet);
                    localStorage.setItem(localKey, JSON.stringify(stored));
                    setPets(prev => [...prev, newPet]);
                    showToast(`🎉 ${petData.name} added to your pet profiles!`, 'success');
                }
                setCurrentView('PETS_LIST');
            } catch (localErr) {
                console.error('Local fallback also failed:', localErr);
                showToast('Error saving pet profile. Please try again.', 'error');
            }
        }
    };



    // Doctor Search & Category Filter Logic
    const filteredDoctors = doctors.filter((doc) => {
        const dName = (doc.name || '').toLowerCase();
        const dSpec = (doc.specialization || doc.address || 'Veterinary Surgery & Medicine').toLowerCase();
        const dServices = Array.isArray(doc.services) ? doc.services : [];
        const query = (doctorSearch || '').toLowerCase();

        const matchesSearch =
            dName.includes(query) ||
            dSpec.includes(query) ||
            dServices.some(s => String(s).toLowerCase().includes(query));

        if (specFilter === 'ALL') return matchesSearch;
        if (specFilter === 'OPD') {
            return matchesSearch && (
                dSpec.includes('opd') ||
                dSpec.includes('outpatient') ||
                dSpec.includes('medicine') ||
                dSpec.includes('general') ||
                dSpec.includes('care')
            );
        }
        if (specFilter === 'Surgery') {
            return matchesSearch && (
                dSpec.includes('surg') ||
                dSpec.includes('trauma') ||
                dSpec.includes('operation')
            );
        }
        if (specFilter === 'Eye') {
            return matchesSearch && (
                dSpec.includes('eye') ||
                dSpec.includes('ophthalm')
            );
        }
        return matchesSearch && dSpec.includes(specFilter.toLowerCase());
    });

    const openBookingModal = (doctor = null) => {
        setBookingStep(1);
        const targetDoc = doctor || (doctors.length > 0 ? doctors[0] : null);

        // Use isDoctorWorkingToday (day-level check) not isDoctorOffDuty (clock-level)
        // so that a doctor whose shift starts later today still gets today as the default date.
        const worksToday = targetDoc ? isDoctorWorkingToday(targetDoc) : false;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const initialDate = worksToday
            ? new Date().toISOString().split('T')[0]
            : tomorrow.toISOString().split('T')[0];

        setBookingData({
            petId: pets.length > 0 ? pets[0].id : '',
            serviceType: 'General Consultation',
            doctorId: targetDoc ? targetDoc.id : '',
            doctorName: targetDoc ? targetDoc.name : '',
            date: initialDate,
            timeSlot: '09:00 AM',
            reason: '',
            notes: '',
        });
        setBookingModalOpen(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        const selectedPetObj = pets.find(p => p.id === bookingData.petId);
        const petName = selectedPetObj ? selectedPetObj.name : 'Pet';
        const species = selectedPetObj ? selectedPetObj.species : 'Pet';
        const breed = selectedPetObj && selectedPetObj.breed ? selectedPetObj.breed : 'Unknown';

        // Calculate sequential APT-XXX ID
        let nextIdNum = 1;
        appointments.forEach(a => {
            if (a.id && a.id.startsWith('APT-')) {
                const num = parseInt(a.id.split('-')[1], 10);
                if (!isNaN(num) && num >= nextIdNum) {
                    nextIdNum = num + 1;
                }
            }
        });
        const newApptId = 'APT-' + nextIdNum.toString().padStart(3, '0');

        const selectedDocObj = doctors.find(d => d.id === bookingData.doctorId || d.name === bookingData.doctorName || d.email === bookingData.doctorId);

        const newAppointment = {
            id: newApptId,
            petId: bookingData.petId,
            petName,
            species,
            breed,
            ownerId: currentUser?.id,
            ownerEmail: currentUser?.email,
            ownerName: currentUser?.name || 'Pet Owner',
            ownerPhone: currentUser?.phone || '0771234567',
            doctorId: bookingData.doctorId || (selectedDocObj ? selectedDocObj.id : ''),
            doctorName: bookingData.doctorName || (selectedDocObj ? selectedDocObj.name : 'Assigned Specialist'),
            serviceType: bookingData.serviceType,
            date: bookingData.date,
            timeSlot: bookingData.timeSlot,
            reason: bookingData.reason || 'General Health Consultation',
            status: 'PENDING_APPROVAL',
        };

        api.createAppointment({
            id: newApptId,
            petId: bookingData.petId,
            petName,
            species,
            breed,
            petOwnerId: currentUser?.id,
            petOwnerName: currentUser?.name || 'Pet Owner',
            petOwnerEmail: currentUser?.email,
            petOwnerPhone: currentUser?.phone || '0771234567',
            doctorId: bookingData.doctorId || (selectedDocObj ? selectedDocObj.id : ''),
            doctorName: bookingData.doctorName || (selectedDocObj ? selectedDocObj.name : 'Assigned Specialist'),
            specialization: bookingData.serviceType,
            date: bookingData.date,
            timeSlot: bookingData.timeSlot,
            reason: bookingData.reason || 'General Health Consultation',
            status: 'PENDING_APPROVAL',
        }).catch(err => console.warn("Error creating appointment in backend API", err));

        setAppointments(prev => {
            const updated = [newAppointment, ...prev];
            try {
                localStorage.setItem('vhms_user_appointments', JSON.stringify(updated));
                window.dispatchEvent(new Event('storage'));
            } catch { }
            return updated;
        });

        // LOCALLY LOCK THE BOOKED TIME SLOT
        try {
            const stored = localStorage.getItem('vhms_schedules');
            if (stored) {
                const scheds = JSON.parse(stored);
                if (scheds[bookingData.doctorId] && scheds[bookingData.doctorId][bookingData.date]) {
                    const dailySlots = scheds[bookingData.doctorId][bookingData.date];
                    const targetSlot = dailySlots.find(s => s.time === bookingData.timeSlot);
                    if (targetSlot) {
                        targetSlot.booked = true;
                        targetSlot.appointmentId = newAppointment.id;
                        localStorage.setItem('vhms_schedules', JSON.stringify(scheds));
                    }
                }
            }
        } catch (e) { }

        addNotification(
            'Appointment Request Submitted 📅',
            `Your appointment request (${newApptId}) for ${petName} on ${bookingData.date} at ${bookingData.timeSlot} with ${newAppointment.doctorName} has been submitted for hospital review.`,
            'APPOINTMENT',
            newApptId
        );

        showToast(`🎉 Appointment request submitted for ${petName}!`, 'success');
        setBookingModalOpen(false);
        setCurrentView('MY_APPOINTMENTS');
    };

    const handleLogout = () => {
        localStorage.removeItem('vhms_user');
        navigate('/login');
    };

    const handleConfirmDeleteAccount = () => {
        if (confirmDeleteText.trim().toUpperCase() !== 'DELETE') {
            showToast('Please type DELETE to confirm account removal.', 'error');
            return;
        }

        // Perform local account purging
        localStorage.removeItem('vhms_user');
        showToast('Your pet owner account has been permanently deleted.', 'success');
        setDeleteModalOpen(false);
        setTimeout(() => {
            navigate('/login');
        }, 1000);
    };

    const isAppointmentForUser = (appt, user) => {
        if (!user) return false;
        const ownerId = appt.petOwnerId || appt.ownerId;
        const ownerEmail = appt.petOwnerEmail || appt.ownerEmail;
        const ownerName = appt.petOwnerName || appt.ownerName;

        if (ownerId && user.id && String(ownerId) === String(user.id)) return true;
        if (ownerEmail && user.email && ownerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) return true;
        if (ownerName && user.name && ownerName.toLowerCase().trim() === user.name.toLowerCase().trim()) return true;

        return false;
    };

    const userAppointments = useMemo(() => {
        if (!currentUser) return [];
        return appointments.filter(a => isAppointmentForUser(a, currentUser));
    }, [appointments, currentUser]);

    const todayDate = new Date().toISOString().split('T')[0];
    const upcomingAppointments = userAppointments
        .filter(a => a.date >= todayDate && a.status !== 'REJECTED' && a.status !== 'CANCELLED' && a.status !== 'DECLINED' && a.status !== 'COMPLETED')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="pets-page" style={hideHeader ? { padding: 0, minHeight: 'auto', background: 'transparent' } : {}}>
            {/* SAAS PORTAL HEADER */}
            {!hideHeader && (
            <PortalHeader
                currentUser={currentUser}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                handleLogout={handleLogout}
                setCurrentView={setCurrentView}
                resetSubpageState={() => {
                    setEditingPet(null);
                    setSelectedPetDetail(null);
                    setSelectedDoctorDetail(null);
                    setSelectedApptDetail(null);
                    setSelectedNotifDetail(null);
                }}
                notifications={notifications}
                unreadNotifCount={unreadNotifCount}
                isNotifDropdownOpen={isNotifDropdownOpen}
                setIsNotifDropdownOpen={setIsNotifDropdownOpen}
                markAsRead={handleMarkAsRead}
                markAllAsRead={handleMarkAllAsRead}
                setSelectedNotifDetail={setSelectedNotifDetail}
            />
            )}

            <div className="pet-owner-unified-layout">
            {/* UNIFIED LEFT SIDEBAR NAVIGATION */}
            {!hideHeader && (
            <aside className="po-sidebar">
                <nav className="po-sidebar-nav">
                    <div className="po-sidebar-group-label">MAIN</div>
                    <button className={`po-sidebar-item${currentView === 'OVERVIEW' ? ' active' : ''}`} onClick={() => setCurrentView('OVERVIEW')}>
                        <span className="po-sidebar-icon">🐾</span> Dashboard
                    </button>
                    <button className={`po-sidebar-item${currentView === 'PETS_LIST' || currentView === 'ADD_PET' || currentView === 'PET_PROFILE_DETAIL' ? ' active' : ''}`} onClick={() => setCurrentView('PETS_LIST')}>
                        <span className="po-sidebar-icon">🐶</span> My Pets
                    </button>
                    <button className={`po-sidebar-item${currentView === 'FIND_DOCTOR' || currentView === 'DOCTOR_PROFILE' ? ' active' : ''}`} onClick={() => setCurrentView('FIND_DOCTOR')}>
                        <span className="po-sidebar-icon">🔍</span> Find Doctor & Book
                    </button>

                    <div className="po-sidebar-group-label">APPOINTMENTS</div>
                    <button className={`po-sidebar-item${currentView === 'MY_APPOINTMENTS' ? ' active' : ''}`} onClick={() => setCurrentView('MY_APPOINTMENTS')}>
                        <span className="po-sidebar-icon">📅</span> My Appointments
                    </button>
                    <button className={`po-sidebar-item${currentView === 'CONSULTATIONS' ? ' active' : ''}`} onClick={() => setCurrentView('CONSULTATIONS')}>
                        <span className="po-sidebar-icon">📋</span> Consultations
                    </button>
                    <button className={`po-sidebar-item${currentView === 'MEDICAL_HISTORY' ? ' active' : ''}`} onClick={() => setCurrentView('MEDICAL_HISTORY')}>
                        <span className="po-sidebar-icon">❤️</span> Medical History
                    </button>

                    <div className="po-sidebar-group-label">HOSPITAL</div>
                    <button className={`po-sidebar-item${currentView === 'ADMISSIONS' ? ' active' : ''}`} onClick={() => setCurrentView('ADMISSIONS')}>
                        <span className="po-sidebar-icon">🏥</span> Admissions
                    </button>

                    <div className="po-sidebar-group-label">BILLING</div>
                    <button className={`po-sidebar-item${currentView === 'INVOICES' || currentView === 'BILLING' ? ' active' : ''}`} onClick={() => setCurrentView('INVOICES')}>
                        <span className="po-sidebar-icon">💳</span> Invoices
                    </button>
                    <button className={`po-sidebar-item${currentView === 'PAYMENTS' ? ' active' : ''}`} onClick={() => setCurrentView('PAYMENTS')}>
                        <span className="po-sidebar-icon">💰</span> Payments
                    </button>

                    <div className="po-sidebar-group-label">ACCOUNT</div>
                    <button className={`po-sidebar-item${currentView === 'NOTIFICATIONS' ? ' active' : ''}`} onClick={() => setCurrentView('NOTIFICATIONS')}>
                        <span className="po-sidebar-icon">🔔</span> Notifications
                        {unreadNotifCount > 0 && <span className="po-sidebar-badge">{unreadNotifCount}</span>}
                    </button>
                    <button className={`po-sidebar-item${currentView === 'PROFILE' ? ' active' : ''}`} onClick={() => setCurrentView('PROFILE')}>
                        <span className="po-sidebar-icon">👤</span> My Profile
                    </button>
                </nav>
            </aside>
            )}

            <main className="pets-main saas-shell po-main-content" style={hideHeader ? { padding: '10px 0' } : {}}>
                {/* Back to Registered Pets Header when viewing pet profile or edit form */}
                {(currentView === 'ADD_PET' || currentView === 'PET_PROFILE_DETAIL') && (
                    <div className="back-navigation-bar">
                        <button className="btn-back-overview" onClick={() => setCurrentView('PETS_LIST')}>
                            ← Back to Registered Pets
                        </button>
                    </div>
                )}

                {/* MAIN OVERVIEW VIEW */}
                {currentView === 'OVERVIEW' && (
                    <>
                        <HeroSection currentUser={currentUser} />

                        <section className="saas-dashboard-grid">
                            <DashboardCard
                                icon={DualPawIcon}
                                solid={true}
                                theme="mint"
                                label="REGISTERED PETS"
                                value={pets.length}
                                subtext="Your furry companions"
                                buttonText="View All Pets"
                                onClick={() => setCurrentView('PETS_LIST')}
                            />
                            <DashboardCard
                                icon={Calendar}
                                solid={true}
                                theme="blue"
                                label="UPCOMING VISITS"
                                value={upcomingAppointments.length > 0 ? `${upcomingAppointments.length} Scheduled` : '0 Scheduled'}
                                subtext={upcomingAppointments.length > 0 ? `Next: ${upcomingAppointments[0].date} (${upcomingAppointments[0].timeSlot || '10:30 AM'})` : 'No upcoming visits'}
                                buttonText="View Appointments"
                                onClick={() => setCurrentView('MY_APPOINTMENTS')}
                            />
                            <DashboardCard
                                icon={ShieldCheck}
                                theme="peach"
                                label="PREVENTIVE CARE"
                                value="Up to Date"
                                subtext="Rabies & Annual Checkup current"
                            />
                            <DashboardCard
                                icon={Bell}
                                solid={true}
                                theme="purple"
                                label="NOTIFICATION CENTER"
                                value={`${unreadNotifCount} Unread`}
                                subtext={unreadNotifCount > 0 ? "Important updates pending" : "All notifications caught up"}
                                onClick={() => setCurrentView('NOTIFICATIONS')}
                            />
                        </section>

                        <FooterQuote />

                        {/* Quick Portals Cards Section (Legacy architecture maintained) */}
                        <section className="quick-portals-section" style={{ marginTop: '10px' }}>
                            <div className="section-header-row">
                                <h2 className="section-title">
                                    Pet Management Portals
                                </h2>
                            </div>

                            <div className="portals-grid-2">
                                {/* CARD 1: REGISTER NEW PET */}
                                <div className="portal-card add-pet-portal-card" onClick={openAddForm}>
                                    <div className="portal-card-top">
                                        <div className="portal-icon-box icon-emerald-box">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                        </div>
                                        <span className="portal-badge badge-new">+ New Registration</span>
                                    </div>
                                    <h3 className="portal-card-title">Register New Pet</h3>
                                    <p className="portal-card-desc">
                                        Add a new pet profile with species, breed, age, weight, and custom photo for hospital appointments.
                                    </p>
                                    <div className="portal-card-footer">
                                        <span className="link-text">Open Pet Registration Form →</span>
                                    </div>
                                </div>

                                {/* CARD 2: MY REGISTERED PETS */}
                                <div className="portal-card pets-list-portal-card" onClick={() => setCurrentView('PETS_LIST')}>
                                    <div className="portal-card-top">
                                        <div className="portal-icon-box icon-folder-box">
                                            🐾
                                        </div>
                                        <span className="portal-badge badge-info">{pets.length} Registered</span>
                                    </div>
                                    <h3 className="portal-card-title">My Registered Pets Directory</h3>
                                    <p className="portal-card-desc">
                                        View, inspect, edit, or remove your registered pet profiles and medical stats.
                                    </p>
                                    <div className="portal-card-footer">
                                        <span className="link-text">View Pet Profiles Directory →</span>
                                    </div>
                                </div>

                                {/* CARD 3: FIND A DOCTOR & BOOK */}
                                <div className="portal-card find-doctor-portal-card" onClick={() => setCurrentView('FIND_DOCTOR')}>
                                    <div className="portal-card-top">
                                        <div className="portal-icon-box icon-purple-box">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                        <span className="portal-badge badge-new">Instant Booking</span>
                                    </div>
                                    <h3 className="portal-card-title">Find a Doctor & Book Visit</h3>
                                    <p className="portal-card-desc">
                                        Search veterinarians by specialization, view available slots, and request an appointment.
                                    </p>
                                    <div className="portal-card-footer">
                                        <span className="link-text">Search Doctors & Services →</span>
                                    </div>
                                </div>

                                {/* CARD 4: MY APPOINTMENTS */}
                                <div className="portal-card appointments-portal-card" onClick={() => setCurrentView('MY_APPOINTMENTS')}>
                                    <div className="portal-card-top">
                                        <div className="portal-icon-box icon-blue-box">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        </div>
                                        <span className="portal-badge badge-info">{appointments.length} Scheduled</span>
                                    </div>
                                    <h3 className="portal-card-title">My Appointments & Status</h3>
                                    <p className="portal-card-desc">
                                        Track your upcoming hospital consultations, visit reasons, and approval status.
                                    </p>
                                    <div className="portal-card-footer">
                                        <span className="link-text">View Appointments Roster →</span>
                                    </div>
                                </div>

                                {/* CARD 5: HOSPITAL ADMISSIONS (Epic 3) */}
                                <div className="portal-card appointments-portal-card" id="admissions-portal-card" onClick={() => setCurrentView('ADMISSIONS')}>
                                    <div className="portal-card-top">
                                        <div className="portal-icon-box icon-blue-box">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"></path><path d="M12 9v6"></path><path d="M9 12h6"></path><path d="M3 21h18"></path></svg>
                                        </div>
                                        <span className="portal-badge badge-info">Hospitalization</span>
                                    </div>
                                    <h3 className="portal-card-title">Hospital Admissions</h3>
                                    <p className="portal-card-desc">
                                        Review doctor admission recommendations, request admission, and follow your pet's treatment and recovery.
                                    </p>
                                    <div className="portal-card-footer">
                                        <span className="link-text">View Admissions →</span>
                                    </div>
                                </div>

                                {/* CARD 6: INVOICES & PAYMENTS (Epic 4) */}
                                <div className="portal-card" id="billing-portal-card" onClick={() => setCurrentView('BILLING')} style={{ borderTop: '4px solid #f59e0b' }}>
                                    <div className="portal-card-top">
                                        <div className="portal-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                                        </div>
                                        <span className="portal-badge" style={{ background: '#fef3c7', color: '#d97706' }}>Billing</span>
                                    </div>
                                    <h3 className="portal-card-title">Bookings & Invoices</h3>
                                    <p className="portal-card-desc">
                                        View and securely pay hospital invoices for completed consultations and treatments.
                                    </p>
                                    <div className="portal-card-footer">
                                        <span className="link-text" style={{ color: '#d97706' }}>View Invoices →</span>
                                    </div>
                                </div>

                            </div>
                        </section>
                    </>
                )}

                {/* DEDICATED SUBPAGE: REGISTER NEW PET PAGE */}
                {currentView === 'ADD_PET' && (
                    <section className="dedicated-subpage-section">
                        <div className="subpage-header-box">
                            <h2>{editingPet ? 'Edit Pet Profile' : 'Register New Pet'}</h2>
                            <p>Complete the pet profile details below to enable hospital bookings and medical history tracking.</p>
                        </div>

                        <div className="add-pet-form-card">
                            <form onSubmit={handleSavePet} className="standalone-pet-form">
                                <div className="form-group">
                                    <label>Pet Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Buddy"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (petFormErrors.name) setPetFormErrors(prev => ({ ...prev, name: null }));
                                        }}
                                        style={petFormErrors.name ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                                        required
                                    />
                                    {petFormErrors.name && (
                                        <span style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '4px', fontWeight: 600, display: 'block' }}>
                                            ⚠️ {petFormErrors.name}
                                        </span>
                                    )}
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Species *</label>
                                        <select value={species} onChange={(e) => setSpecies(e.target.value)}>
                                            <option value="Dog">Dog 🐕</option>
                                            <option value="Cat">Cat 🐈</option>
                                            <option value="Rabbit">Rabbit 🐇</option>
                                            <option value="Bird">Bird 🦜</option>
                                            <option value="Other">Other 🐾</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Breed</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Golden Retriever"
                                            value={breed}
                                            onChange={(e) => {
                                                setBreed(e.target.value);
                                                if (petFormErrors.breed) setPetFormErrors(prev => ({ ...prev, breed: null }));
                                            }}
                                            style={petFormErrors.breed ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                                        />
                                        {petFormErrors.breed && (
                                            <span style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '4px', fontWeight: 600, display: 'block' }}>
                                                ⚠️ {petFormErrors.breed}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-grid-4">
                                    <div className="form-group">
                                        <label>Date of Birth *</label>
                                        <input
                                            type="date"
                                            value={dateOfBirth}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={handleDobChange}
                                            style={petFormErrors.dateOfBirth ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                                            required
                                        />
                                        {petFormErrors.dateOfBirth && (
                                            <span style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '4px', fontWeight: 600, display: 'block' }}>
                                                ⚠️ {petFormErrors.dateOfBirth}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Age (Years / Months) *</label>
                                        <input
                                            type="text"
                                            placeholder="Auto-calculated (e.g. 4 Months, 2 Years)"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Weight (kg) *</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="e.g. 14.5"
                                            value={weight}
                                            onChange={(e) => {
                                                setWeight(e.target.value);
                                                if (petFormErrors.weight) setPetFormErrors(prev => ({ ...prev, weight: null }));
                                            }}
                                            style={petFormErrors.weight ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
                                            required
                                        />
                                        {petFormErrors.weight && (
                                            <span style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '4px', fontWeight: 600, display: 'block' }}>
                                                ⚠️ {petFormErrors.weight}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Gender *</label>
                                        <select value={gender} onChange={(e) => setGender(e.target.value)}>
                                            <option value="Male">Male ♂</option>
                                            <option value="Female">Female ♀</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Upload Pet Photo (Optional)</label>
                                    <div className="photo-upload-container">
                                        <input
                                            type="file"
                                            id="pet-photo-file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />

                                        {photoUrl ? (
                                            <div className="photo-preview-card">
                                                <img src={photoUrl} alt="Pet Preview" className="photo-preview-img" />
                                                <div className="photo-preview-actions">
                                                    <label htmlFor="pet-photo-file" className="btn-upload-change">
                                                        📷 Change Photo
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="btn-upload-remove"
                                                        onClick={() => setPhotoUrl('')}
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label htmlFor="pet-photo-file" className="photo-dropzone">
                                                <div className="dropzone-icon">📷</div>
                                                <div className="dropzone-text">
                                                    <strong>Click to upload pet photo</strong>
                                                    <span>Supports PNG, JPG, WEBP (Max 5MB)</span>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="form-actions-row">
                                    <button type="button" className="btn-cancel" onClick={() => setCurrentView('OVERVIEW')}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save">
                                        {editingPet ? 'Update Pet Profile' : 'Complete Registration'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                )}

                {/* DEDICATED SUBPAGE: MY REGISTERED PETS LIST */}
                {currentView === 'PETS_LIST' && (
                    <section className="dedicated-subpage-section">
                        <div className="pets-top-bar">
                            <div>
                                <h1>My Registered Pets</h1>
                                <p>Manage pet profiles, update medical stats, and prepare for hospital visits.</p>
                            </div>
                            <button className="btn-add-pet" onClick={openAddForm}>+ Register New Pet</button>
                        </div>

                        {loading ? (
                            <div className="loading-state">Loading pet profiles...</div>
                        ) : pets.length === 0 ? (
                            <div className="empty-pets-card">
                                <div className="empty-emoji">🐶</div>
                                <h3>No Pet Profiles Found</h3>
                                <p>You haven't registered any pets yet. Click below to add your first pet!</p>
                                <button className="btn-add-pet-large" onClick={openAddForm}>+ Register My First Pet</button>
                            </div>
                        ) : (
                            <div className="pets-grid">
                                {pets.map((pet) => (
                                    <div
                                        key={pet.id}
                                        className="pet-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                            if (!e.target.closest('.pet-card-actions')) {
                                                openViewPet(pet);
                                            }
                                        }}
                                    >
                                        <div className="pet-img-wrap">
                                            <img
                                                src={pet.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'}
                                                alt={pet.name}
                                                className="pet-img"
                                            />
                                            <span className="species-badge">{pet.species}</span>
                                        </div>
                                        <div className="pet-info">
                                            <h3>{pet.name}</h3>
                                            <div className="pet-meta-row">
                                                <span className="meta-item"><strong>Breed:</strong> {pet.breed}</span>
                                                <span className="meta-item"><strong>Age:</strong> {pet.age} yrs</span>
                                            </div>
                                            <div className="pet-meta-row">
                                                <span className="meta-item"><strong>DOB:</strong> {pet.dateOfBirth || 'N/A'}</span>
                                                <span className="meta-item"><strong>Weight:</strong> {pet.weight} kg</span>
                                            </div>
                                            <div className="pet-meta-row">
                                                <span className="meta-item"><strong>Gender:</strong> {pet.gender}</span>
                                            </div>

                                            <div className="pet-card-actions">
                                                <button className="btn-view" onClick={(e) => { e.stopPropagation(); openViewPet(pet); }}>View</button>
                                                <button className="btn-edit" onClick={(e) => { e.stopPropagation(); openEditForm(pet); }}>Update</button>
                                                <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDeletePet(pet.id, pet.name); }}>Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* DEDICATED SUBPAGE: PET PROFILE DETAILS */}
                {currentView === 'PET_PROFILE_DETAIL' && selectedPetDetail && (
                    <section className="dedicated-subpage-section">
                        <div className="pets-top-bar">
                            <div>
                                <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    🐾 {selectedPetDetail.name}'s Complete Profile
                                    <span className="species-badge" style={{ fontSize: '0.85rem' }}>{selectedPetDetail.species}</span>
                                </h1>
                                <p>Comprehensive medical, identity, and statistical record for hospital visits.</p>
                            </div>
                        </div>

                        {/* Hero Card Banner */}
                        <div className="pet-detail-hero-card" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', color: '#ffffff', borderRadius: '24px', padding: '32px', display: 'flex', gap: '32px', alignItems: 'center', boxShadow: '0 20px 40px rgba(4, 120, 87, 0.25)', marginBottom: '24px' }}>
                            <img
                                src={selectedPetDetail.photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'}
                                alt={selectedPetDetail.name}
                                style={{ width: '130px', height: '130px', borderRadius: '20px', objectFit: 'cover', border: '4px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800 }}>{selectedPetDetail.name}</h2>
                                    <span style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                                        {selectedPetDetail.gender}
                                    </span>
                                    <span style={{ background: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                                        {selectedPetDetail.species}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: '#a7f3d0', fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🟢 Active Hospital Patient Profile</span>
                                    <span>•</span>
                                    <span>Verified Ownership Record</span>
                                </p>
                            </div>
                        </div>

                        {/* Detailed Grid Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                            {/* Box 1: Core Identification */}
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    🆔 Core Identification
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', pb: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Pet Full Name:</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', pb: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Species / Category:</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.species}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', pb: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Breed:</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.breed || 'Not Specified'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Gender / Sex:</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.gender}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Box 2: Medical & Vital Stats */}
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📊 Vital Metrics & Age
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', pb: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Date of Birth (DOB):</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.dateOfBirth || 'N/A'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', pb: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Calculated Age:</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.age} years</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', pb: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Current Weight:</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.weight} kg</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Gender:</span>
                                        <strong style={{ color: '#0f172a' }}>{selectedPetDetail.gender || 'Not Specified'}</strong>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Bottom Quick Action Box */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#0f172a' }}>Need to Schedule a Visit for {selectedPetDetail.name}?</h4>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>Connect with specialist doctors and request consultation slots instantly.</p>
                            </div>
                            <button className="btn-add-pet" onClick={() => setCurrentView('FIND_DOCTOR')}>
                                📅 Book Visit for {selectedPetDetail.name} →
                            </button>
                        </div>
                    </section>
                )}

                {/* DEDICATED SUBPAGE: FIND A DOCTOR & BOOK */}
                {currentView === 'FIND_DOCTOR' && (
                    <section className="dedicated-subpage-section">
                        <div className="subpage-header-box">
                            <div>
                                <h2>Find a Doctor & Book Visit</h2>
                            </div>
                        </div>

                        {/* Modernized Search & Specialization Filter Bar */}
                        <div className="doctor-search-bar-card">
                            <div className="search-input-wrap">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search doctor by name, specialization, or clinical service..."
                                    value={doctorSearch}
                                    onChange={(e) => setDoctorSearch(e.target.value)}
                                    className="doctor-search-input"
                                />
                                {doctorSearch && (
                                    <button className="btn-clear-search" onClick={() => setDoctorSearch('')}>✕</button>
                                )}
                            </div>

                            <div className="spec-filter-pills" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="filter-label">Filter Specialization:</span>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <select
                                        className="spec-select-dropdown"
                                        value={specFilter}
                                        onChange={(e) => setSpecFilter(e.target.value)}
                                    >
                                        <option value="ALL">🩺 All Specialists</option>
                                        <option value="OPD">🩺 OPD Medicine (2)</option>
                                        <option value="Surgery">⚕️ Surgery & Trauma (2)</option>
                                        <option value="Eye">👁️ Ophthalmology / Eyes (1)</option>
                                    </select>
                                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>
                                        ▼
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Doctors Grid */}
                        <div className="doctors-grid">
                            {filteredDoctors.length === 0 ? (
                                <div className="empty-pets-card">
                                    <div className="empty-emoji">🔍</div>
                                    <h3>No Doctors Found</h3>
                                    <p>No veterinarian matching your search criteria was found.</p>
                                </div>
                            ) : (
                                filteredDoctors.map((doc) => (
                                    <div key={doc.id} className="pet-doctor-card">
                                        <div className="doc-card-header">
                                            <div className="doc-avatar-box" style={{ overflow: 'hidden', background: '#ecfdf5' }}>
                                                {doc.photoUrl
                                                    ? <img src={doc.photoUrl} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                                                    : <span style={{ fontSize: '1.8rem' }}>🩺</span>
                                                }
                                            </div>
                                            <div>
                                                {(() => {
                                                    const isOff = isDoctorOffDuty(doc);
                                                    const isBusy = doc.status === 'BUSY';
                                                    return (
                                                        <span className={`doc-status-badge ${isOff ? 'unavailable' : isBusy ? 'busy' : 'available'}`} style={isOff ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' } : isBusy ? { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' } : {}}>
                                                            {isOff && '🔴 Off Duty'}
                                                            {!isOff && isBusy && '🟡 In Consultation / Busy'}
                                                            {!isOff && !isBusy && '🟢 On Duty'}
                                                        </span>
                                                    );
                                                })()}
                                                <h3 className="doc-name">{doc.name}</h3>
                                                <span className="doc-spec">{doc.specialization}</span>
                                            </div>
                                        </div>

                                        <div style={{ margin: '12px 0', fontSize: '0.84rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>🕒</span>
                                            <strong>Hours:</strong> {doc.availableHours || 'Mon - Sun | 11:00 AM - 02:00 PM'}
                                        </div>

                                        <div className="doc-services-tags" style={{ marginBottom: '16px' }}>
                                            {(doc.services || []).slice(0, 3).map((srv, i) => (
                                                <span key={i} className="service-tag">{srv}</span>
                                            ))}
                                            {(doc.services || []).length > 3 && (
                                                <span className="service-tag" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                    +{(doc.services || []).length - 3} more
                                                </span>
                                            )}
                                        </div>

                                        <div className="doc-card-footer">
                                            <button className="btn-view-profile" onClick={() => openDoctorProfile(doc)}>
                                                View Doctor Profile
                                            </button>
                                            <button className="btn-book-now" onClick={() => openBookingModal(doc)}>
                                                {isDoctorWorkingToday(doc) ? 'Book Visit →' : 'Book Future Date →'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* DEDICATED SUBPAGE: DOCTOR PROFILE */}
                {currentView === 'DOCTOR_PROFILE' && selectedDoctorDetail && (() => {
                    const doc = selectedDoctorDetail;
                    const isUnavailable = isDoctorOffDuty(doc);
                    const isBusy = doc.status === 'BUSY';
                    const serviceList = Array.isArray(doc.services)
                        ? doc.services
                        : (doc.services || '').split(',').map(s => s.trim()).filter(Boolean);

                    const cleanExp = (text) => {
                        if (!text) return 'Registered Veterinary Surgeon';
                        let cleaned = text.replace(/B\.V\.Sc\.?\s*(\(Sri Lanka\))?\s*\|?\s*/gi, '').trim();
                        if (cleaned.startsWith('|')) cleaned = cleaned.substring(1).trim();
                        return cleaned || 'Registered Veterinary Surgeon';
                    };

                    const cleanBio = (bioText) => {
                        if (!bioText) return 'Experienced veterinary specialist dedicated to providing the highest quality care for your pets.';
                        return bioText
                            .replace(/He obtained his Bachelor of Veterinary Science \(B\.V\.Sc\.\) qualification in Sri Lanka in 1991 and has been registered with the Veterinary Council of Sri Lanka since July 1992 under Registration No\. 694\.\s*/gi, '')
                            .replace(/Bachelor of Veterinary Science \(B\.V\.Sc\.\)\s* qualification\s*/gi, '')
                            .replace(/B\.V\.Sc\.?\s*(\(Sri Lanka\))?\s*/gi, '')
                            .trim();
                    };

                    return (
                        <section className="dedicated-subpage-section doctor-profile-page">
                            {/* Back Button with spacing */}
                            <div style={{ marginTop: '20px', marginBottom: '24px' }}>
                                <button
                                    type="button"
                                    className="btn-back-overview"
                                    onClick={() => setCurrentView('FIND_DOCTOR')}
                                >
                                    ← Back to Doctor List & Booking
                                </button>
                            </div>

                            {/* Hero Banner */}
                            <div className="doc-profile-hero">
                                <div className="doc-profile-hero-left">
                                    <div className="doc-profile-avatar-wrap">
                                        {doc.photoUrl
                                            ? <img src={doc.photoUrl} alt={doc.name} className="doc-profile-photo" />
                                            : <div className="doc-profile-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: '#ecfdf5' }}>👨‍⚕️</div>
                                        }
                                        <span className={`doc-profile-status-dot ${isUnavailable ? 'unavailable' : isBusy ? 'busy' : 'available'}`}></span>
                                    </div>
                                    <div className="doc-profile-identity">
                                        <span className={`doc-profile-status-pill ${isUnavailable ? 'unavailable' : isBusy ? 'busy' : 'available'}`}>
                                            {isUnavailable && '🔴 Off Duty'}
                                            {isBusy && '🟡 In Consultation'}
                                            {!isUnavailable && !isBusy && '🟢 Available Today'}
                                        </span>
                                        <h1 className="doc-profile-name">{doc.name}</h1>
                                        <p className="doc-profile-spec">{doc.specialization || doc.address || 'Veterinary Surgeon'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* All Fields — matching registration form */}
                            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', marginBottom: '20px' }}>

                                {/* Row 1: Name + Email */}
                                <div className="doc-profile-grid" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor Full Name</span>
                                        <p style={{ margin: '6px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{doc.name}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hospital Email Address</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{doc.email || 'Not listed'}</p>
                                    </div>
                                </div>

                                {/* Row 2: Phone + Specialization */}
                                <div className="doc-profile-grid" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{doc.phone || 'Not listed'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specialization / Department</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{doc.specialization || doc.address || 'Not specified'}</p>
                                    </div>
                                </div>

                                {/* Row 3: Experience + Working Hours */}
                                <div className="doc-profile-grid" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Experience / Qualifications</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{doc.experience || 'Registered Veterinary Surgeon'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Working Hours</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{doc.availableHours || 'Mon – Fri | 08:00 AM – 05:00 PM'}</p>
                                    </div>
                                </div>

                                {/* Services */}
                                <div style={{ marginBottom: '20px' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Services Offered</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                        {serviceList.length > 0
                                            ? serviceList.map((s, i) => (
                                                <span key={i} style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', padding: '5px 14px', borderRadius: '20px', fontSize: '0.83rem', fontWeight: 600 }}>{s}</span>
                                            ))
                                            : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No services listed.</span>
                                        }
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor Bio / Professional Description</span>
                                    <p style={{ margin: '8px 0 0', color: '#334155', lineHeight: 1.75, fontSize: '0.9rem' }}>{cleanBio(doc.bio)}</p>
                                </div>
                            </div>

                            {/* Bottom CTA */}
                            <div className="doc-profile-bottom-cta">
                                <p>Ready to schedule a visit with <strong>{doc.name}</strong>?</p>
                                <button className="btn-book-now doc-profile-book-btn" onClick={() => openBookingModal(doc)}>
                                    {isUnavailable ? '📅 Book for a Future Date →' : '📅 Book a Consultation →'}
                                </button>
                            </div>
                        </section>
                    );
                })()}



                {/* DEDICATED SUBPAGE: MY APPOINTMENTS & STATUS */}
                {currentView === 'MY_APPOINTMENTS' && (
                    <section className="dedicated-subpage-section">
                        <div className="pets-top-bar">
                            <div>
                                <h1>📅 My Scheduled Appointments</h1>
                                <p>Track upcoming hospital visits, consultation reasons, and approval status.</p>
                            </div>
                            <button className="btn-add-pet" onClick={() => setCurrentView('FIND_DOCTOR')}>+ Request New Appointment</button>
                        </div>

                        {userAppointments.length === 0 ? (
                            <div className="empty-pets-card">
                                <div className="empty-emoji">📅</div>
                                <h3>No Appointments Booked</h3>
                                <p>You haven't requested any hospital consultations yet.</p>
                                <button className="btn-add-pet-large" onClick={() => setCurrentView('FIND_DOCTOR')}>
                                    + Book Your First Consultation
                                </button>
                            </div>
                        ) : (
                            <div className="appointments-roster">
                                {userAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="appointment-card"
                                        style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                                        onClick={() => setSelectedApptDetail(apt)}
                                    >
                                        <div className="apt-header">
                                            <div>
                                                <span className="apt-id-tag">{apt.id}</span>
                                                <h3 className="apt-pet-name">🐾 {apt.petName} ({apt.species || 'Pet'})</h3>
                                            </div>
                                            <span className={`apt-status-chip ${apt.status}`}>
                                                {apt.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : apt.status === 'APPROVED' ? 'APPROVED' : apt.status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'}
                                            </span>
                                        </div>

                                        <div className="apt-grid-meta">
                                            <div>
                                                <strong>Assigned Veterinarian</strong>
                                                <span>{apt.doctorName || 'Assigned Specialist'}</span>
                                            </div>
                                            <div>
                                                <strong>Service Type</strong>
                                                <span>{apt.serviceType}</span>
                                            </div>
                                            <div>
                                                <strong>Date & Time Slot</strong>
                                                <span>{apt.date} at {apt.timeSlot}</span>
                                            </div>
                                        </div>

                                        <div className="apt-reason-box">
                                            <strong>Reason for Visit:</strong> {apt.reason}
                                        </div>

                                        {(apt.status === 'REJECTED' || apt.rejectReason) && (
                                            <div style={{ marginTop: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '10px 14px', color: '#991b1b', fontSize: '0.85rem' }}>
                                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', color: '#dc2626', fontWeight: 700 }}>
                                                    <span>❌ Rejection Reason:</span>
                                                </strong>
                                                <span style={{ color: '#7f1d1d', fontWeight: 600 }}>{apt.rejectReason || 'Hospital schedule full for requested time slot.'}</span>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                🔍 <span style={{ color: '#475569' }}>Click card for appointment details</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setSelectedApptDetail(apt); }}
                                                style={{
                                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    padding: '8px 18px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)',
                                                    flexShrink: 0,
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                📋 View Booking Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* MY PROFILE VIEW (US 1.3 & US 1.4) */}
                {currentView === 'PROFILE' && (
                    <section className="pets-panel-card profile-panel" style={{ marginTop: '28px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div className="panel-card-header" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                                    👤
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>My Pet Owner Profile</h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>Manage your personal details, contact info, and account password.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (newPassword) {
                                const passErr = validatePasswordComplexity(newPassword);
                                if (passErr) {
                                    showToast(`❌ ${passErr}`, 'error');
                                    return;
                                }
                                if (newPassword !== confirmPassword) {
                                    showToast('❌ Passwords do not match.', 'error');
                                    return;
                                }
                            }
                            showToast('Profile details updated successfully!', 'success');
                            setNewPassword('');
                            setConfirmPassword('');
                            setCurrentView('OVERVIEW');
                        }} className="profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Full Name *</label>
                                    <input
                                        type="text"
                                        defaultValue={currentUser?.name || 'Dinethmi Peiris'}
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Email Address (Account Identifier)</label>
                                    <input
                                        type="email"
                                        defaultValue={currentUser?.email || 'thinupeiris04@gmail.com'}
                                        disabled
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '0.92rem' }}
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Phone Number *</label>
                                    <input
                                        type="tel"
                                        defaultValue="0771234567"
                                        placeholder="e.g. 0771234567"
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Residential Address</label>
                                    <input
                                        type="text"
                                        defaultValue="No. 45, Rajagiriya Road, Colombo"
                                        placeholder="e.g. 123 Main St, City"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                                    />
                                </div>
                            </div>

                            {/* Password Change Box */}
                            <div className="password-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', marginTop: '10px' }}>
                                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>🔒 Account Security & Password</h4>
                                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#64748b' }}>Update your secret password to keep your pet records secure.</p>

                                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter new secret password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                </div>
                                {newPassword && (
                                    <div style={{ marginTop: '12px', padding: '10px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', color: '#475569' }}>
                                        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}>Password Requirements:</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '4px' }}>
                                            <span style={{ color: newPassword.length >= 6 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                                {newPassword.length >= 6 ? '✓' : '✗'} Min. 6 characters
                                            </span>
                                            <span style={{ color: /[A-Z]/.test(newPassword) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                                {/[A-Z]/.test(newPassword) ? '✓' : '✗'} Uppercase (A-Z)
                                            </span>
                                            <span style={{ color: /[a-z]/.test(newPassword) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                                {/[a-z]/.test(newPassword) ? '✓' : '✗'} Lowercase (a-z)
                                            </span>
                                            <span style={{ color: /[0-9]/.test(newPassword) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                                {/[0-9]/.test(newPassword) ? '✓' : '✗'} Number (0-9)
                                            </span>
                                            <span style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '✓' : '✗'} Special character (!@#...)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-actions-row" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={() => setCurrentView('OVERVIEW')} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>Save Profile Changes</button>
                            </div>
                        </form>

                        {/* DANGER ZONE (ACCOUNT DELETION) */}
                        <div className="danger-zone-card" style={{ marginTop: '32px', border: '1px solid #fecaca', background: '#fff5f5', padding: '24px', borderRadius: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        ⚠️ Danger Zone — Permanently Delete Account
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d' }}>
                                        Once deleted, all registered pet profiles, medical histories, and consultation appointments will be permanently removed.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmDeleteText('');
                                        setDeleteModalOpen(true);
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid #dc2626',
                                        background: '#dc2626',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                >
                                    🗑️ Delete My Account
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* DOCTOR PROFILE MODAL */}
                {selectedDoctorForModal && (
                    <div className="modal-overlay" onClick={() => setSelectedDoctorForModal(null)}>
                        <div className="modal-content doctor-profile-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setSelectedDoctorForModal(null)}>✕</button>
                            <div className="doc-modal-header">
                                <div className="doc-modal-avatar-box">🩺</div>
                                <div>
                                    {(() => {
                                        const isOff = isDoctorOffDuty(selectedDoctorForModal);
                                        const isBusy = selectedDoctorForModal.status === 'BUSY';
                                        return (
                                            <span className={`doc-status-badge ${isOff ? 'unavailable' : isBusy ? 'busy' : 'available'}`} style={isOff ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' } : isBusy ? { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' } : {}}>
                                                {isOff && '🔴 Off Duty'}
                                                {!isOff && isBusy && '🟡 In Consultation / Busy'}
                                                {!isOff && !isBusy && '🟢 On Duty'}
                                            </span>
                                        );
                                    })()}
                                    <h2>{selectedDoctorForModal.name}</h2>
                                    <p className="modal-doc-spec">{selectedDoctorForModal.specialization}</p>
                                    <span className="modal-doc-exp">{selectedDoctorForModal.experience}</span>
                                </div>
                            </div>

                            <div className="doc-modal-body">
                                <h4>About Doctor</h4>
                                <p>{selectedDoctorForModal.bio}</p>

                                <h4>Available Hours</h4>
                                <p className="hours-text">🕒 {selectedDoctorForModal.availableHours}</p>

                                <h4>Services Offered</h4>
                                <div className="doc-services-tags">
                                    {selectedDoctorForModal.services.map((s, i) => (
                                        <span key={i} className="service-tag">{s}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="doc-modal-footer">
                                <button className="btn-cancel" onClick={() => setSelectedDoctorForModal(null)}>Close</button>
                                {isDoctorOffDuty(selectedDoctorForModal) ? (
                                    <button className="btn-book-now disabled" disabled style={{ opacity: 0.6, cursor: 'not-allowed', background: '#94a3b8' }}>
                                        🔴 Doctor Off Duty
                                    </button>
                                ) : (
                                    <button className="btn-book-now" onClick={() => {
                                        const d = selectedDoctorForModal;
                                        setSelectedDoctorForModal(null);
                                        openBookingModal(d);
                                    }}>
                                        Book Visit with {selectedDoctorForModal.name} →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MULTI-STEP APPOINTMENT BOOKING MODAL */}
                {bookingModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content booking-wizard-modal">
                            <div className="wizard-header">
                                <div>
                                    <h2>Book Hospital Appointment</h2>
                                    <p>Step {bookingStep} of 3 — Complete your consultation request details.</p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setBookingModalOpen(false)}>✕</button>
                            </div>

                            {/* Stepper Progress Bar */}
                            <div className="stepper-progress">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className={`step-dot${bookingStep >= s ? ' active' : ''}${bookingStep === s ? ' current' : ''}`}>
                                        {s}
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleBookingSubmit} className="wizard-form-body">
                                {/* STEP 1: DOCTOR, DATE & TIME SLOT PICKER */}
                                {bookingStep === 1 && (() => {
                                    const selectedDoc = doctors.find(d => d.id === bookingData.doctorId || d.name === bookingData.doctorName || (d.email && d.email === bookingData.doctorId));

                                    let isDocDeactivated = selectedDoc ? (selectedDoc.status === 'INACTIVE' || selectedDoc.status === 'DEACTIVATED') : false;

                                    const now = new Date();
                                    const yyyy = now.getFullYear();
                                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                                    const dd = String(now.getDate()).padStart(2, '0');
                                    const todayStr = `${yyyy}-${mm}-${dd}`;

                                    const minDateAllowed = todayStr;
                                    const isDateToday = bookingData.date === todayStr;

                                    const doctorWorkingDaysMap = JSON.parse(localStorage.getItem('vhms_doctor_working_days') || '{}');
                                    let activeWorkingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                    if (selectedDoc) {
                                        const keysToTry = [
                                            selectedDoc.id,
                                            String(selectedDoc.id),
                                            selectedDoc.email,
                                            selectedDoc.email ? selectedDoc.email.toLowerCase() : null,
                                            selectedDoc.name,
                                            selectedDoc.name ? selectedDoc.name.toLowerCase() : null,
                                            bookingData.doctorId,
                                            bookingData.doctorName
                                        ].filter(Boolean);

                                        for (const key of keysToTry) {
                                            if (doctorWorkingDaysMap[key]) {
                                                activeWorkingDays = doctorWorkingDaysMap[key];
                                                break;
                                            }
                                        }
                                        if (activeWorkingDays.length === 7) {
                                            const matchedKey = Object.keys(doctorWorkingDaysMap).find(k =>
                                                (selectedDoc.name && (k.toLowerCase().includes(selectedDoc.name.toLowerCase()) || selectedDoc.name.toLowerCase().includes(k.toLowerCase()))) ||
                                                (selectedDoc.email && (k.toLowerCase().includes(selectedDoc.email.toLowerCase()) || selectedDoc.email.toLowerCase().includes(k.toLowerCase())))
                                            );
                                            if (matchedKey) activeWorkingDays = doctorWorkingDaysMap[matchedKey];
                                        }
                                    }

                                    const dateParts = (bookingData.date || '').split('-').map(Number);
                                    const dateObj = dateParts.length === 3 ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
                                    const dayNamesList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                    const dayName = dateObj ? dayNamesList[dateObj.getDay()] : null;

                                    const isOffDutyDay = Boolean(dayName && !activeWorkingDays.some(d => String(d).toLowerCase().startsWith(dayName.toLowerCase())));
                                    const isDateSelectionValid = Boolean(bookingData.date && bookingData.date >= minDateAllowed && !isOffDutyDay && !isDocDeactivated);

                                    return (
                                        <div className="wizard-step-panel">
                                            <h3>Step 1: Select Date & Time Slot</h3>

                                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    DOC
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Consultant</span>
                                                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.05rem', marginTop: '2px' }}>{bookingData.doctorName || (selectedDoc && selectedDoc.name) || 'Not Selected'}</strong>
                                                </div>
                                            </div>



                                            <div className="form-group">
                                                <label>Preferred Appointment Date *</label>
                                                <input
                                                    type="date"
                                                    value={bookingData.date}
                                                    min={minDateAllowed}
                                                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value, timeSlot: '' })}
                                                    required
                                                    disabled={!bookingData.doctorId}
                                                />
                                            </div>

                                            {bookingData.doctorId && bookingData.date && (
                                                <div className="form-group">
                                                    <label>Available Consultation Time Slots *</label>
                                                    <div className="time-slots-grid">
                                                        {(() => {
                                                            const selectedDocObj = doctors.find(d => d.id === bookingData.doctorId || d.name === bookingData.doctorName || d.email === bookingData.doctorId);
                                                            const isChanna = selectedDocObj && (
                                                                (selectedDocObj.name && selectedDocObj.name.toLowerCase().includes('channa')) ||
                                                                (selectedDocObj.email && selectedDocObj.email.toLowerCase().includes('channa'))
                                                            );
                                                            const isNimal = selectedDocObj && (
                                                                (selectedDocObj.name && selectedDocObj.name.toLowerCase().includes('nimal')) ||
                                                                (selectedDocObj.email && selectedDocObj.email.toLowerCase().includes('nimal'))
                                                            );

                                                            const shift1 = ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
                                                            const shift2 = ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];

                                                            const findDoctorSchedule = (docId, dateStr) => {
                                                                if (!docId || !dateStr || !globalSchedules) return undefined;
                                                                const keysToTry = [
                                                                    docId,
                                                                    String(docId),
                                                                    selectedDocObj?.id,
                                                                    selectedDocObj?.id ? String(selectedDocObj.id) : null,
                                                                    selectedDocObj?.email,
                                                                    selectedDocObj?.email ? selectedDocObj.email.toLowerCase() : null,
                                                                    selectedDocObj?.name
                                                                ].filter(Boolean);

                                                                for (const key of keysToTry) {
                                                                    if (globalSchedules[key] && globalSchedules[key][dateStr] !== undefined) {
                                                                        return globalSchedules[key][dateStr];
                                                                    }
                                                                }
                                                                return undefined;
                                                            };
                                                            const rawDaySched = findDoctorSchedule(bookingData.doctorId, bookingData.date);
                                                            const hasExplicitSched = rawDaySched !== undefined;

                                                            const defaultTimes = (isChanna || isNimal) ? shift1 : [...shift1, ...shift2];

                                                            let slotsToRender = isOffDutyDay
                                                                ? []
                                                                : (hasExplicitSched
                                                                    ? rawDaySched
                                                                    : defaultTimes.map(t => ({ time: t, booked: false })));

                                                            if ((isChanna || isNimal) && !isOffDutyDay && slotsToRender.length > 0) {
                                                                slotsToRender = slotsToRender.filter(s => shift1.includes(typeof s === 'string' ? s : s.time));
                                                            }

                                                            const checkPastSlot = (timeStr, dateStr) => {
                                                                if (!dateStr) return false;
                                                                const now = new Date();
                                                                const yyyy = now.getFullYear();
                                                                const mm = String(now.getMonth() + 1).padStart(2, '0');
                                                                const dd = String(now.getDate()).padStart(2, '0');
                                                                const todayStrFormatted = `${yyyy}-${mm}-${dd}`;
                                                                if (dateStr !== todayStrFormatted) return false;

                                                                const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                                                                if (!match) return false;
                                                                let [_, hStr, mStr, period] = match;
                                                                let hours = parseInt(hStr, 10);
                                                                const minutes = parseInt(mStr, 10);
                                                                if (period) {
                                                                    const p = period.toUpperCase();
                                                                    if (p === 'PM' && hours < 12) hours += 12;
                                                                    if (p === 'AM' && hours === 12) hours = 0;
                                                                }
                                                                const curH = now.getHours();
                                                                const curM = now.getMinutes();
                                                                if (hours < curH) return true;
                                                                if (hours === curH && minutes <= curM) return true;
                                                                return false;
                                                            };

                                                            if (slotsToRender.length === 0) {
                                                                return (
                                                                    <p style={{ gridColumn: '1 / -1', width: '100%', color: '#dc2626', fontWeight: 600, fontSize: '0.88rem', margin: '6px 0', background: '#fef2f2', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fca5a5' }}>
                                                                        ⚠️ Doctor is <strong>Off Duty</strong> on {dayName ? `${dayName}s` : 'this day'}. Working Duty Days: <strong>{activeWorkingDays.join(', ')}</strong>.
                                                                    </p>
                                                                );
                                                            }

                                                            if (!bookingData.timeSlot && slotsToRender.length > 0) {
                                                                const firstValid = slotsToRender.find(s => {
                                                                    const isB = typeof s === 'object' ? s.booked : false;
                                                                    const slotTime = typeof s === 'object' ? s.time : s;
                                                                    const isP = checkPastSlot(slotTime, bookingData.date);
                                                                    return !isB && !isP;
                                                                });
                                                                if (firstValid) {
                                                                    const slotTime = typeof firstValid === 'object' ? firstValid.time : firstValid;
                                                                    setTimeout(() => {
                                                                        setBookingData(prev => prev.timeSlot ? prev : { ...prev, timeSlot: slotTime });
                                                                    }, 0);
                                                                }
                                                            }

                                                            return slotsToRender.map((slotData) => {
                                                                const isBooked = typeof slotData === 'object' ? slotData.booked : false;
                                                                const slotTime = typeof slotData === 'object' ? slotData.time : slotData;
                                                                const isPast = checkPastSlot(slotTime, bookingData.date);
                                                                const isDisabled = isBooked || isPast;

                                                                return (
                                                                    <button
                                                                        key={slotTime}
                                                                        type="button"
                                                                        className={`time-slot-btn${bookingData.timeSlot === slotTime ? ' selected' : ''}`}
                                                                        onClick={() => !isDisabled && setBookingData({ ...bookingData, timeSlot: slotTime })}
                                                                        disabled={isDisabled}
                                                                        style={isDisabled ? { opacity: 0.45, cursor: 'not-allowed', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1' } : {}}
                                                                    >
                                                                        {slotTime}{isBooked ? ' (Booked)' : isPast ? ' (Passed)' : ''}
                                                                    </button>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="wizard-footer">
                                                <button type="button" className="btn-cancel" onClick={() => setBookingModalOpen(false)}>Cancel</button>
                                                <button
                                                    type="button"
                                                    className="btn-save"
                                                    onClick={() => setBookingStep(2)}
                                                    disabled={!bookingData.doctorId || !isDateSelectionValid || !bookingData.timeSlot || isOffDutyDay}
                                                    style={(!bookingData.doctorId || !isDateSelectionValid || !bookingData.timeSlot || isOffDutyDay) ? { opacity: 0.5, cursor: 'not-allowed', background: '#94a3b8' } : {}}
                                                >
                                                    Next: Select Pet & Service →
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* STEP 2: PET & SERVICE DETAILS */}
                                {bookingStep === 2 && (
                                    <div className="wizard-step-panel">
                                        <h3>Step 2: Select Pet & Service Details</h3>

                                        <div className="form-group">
                                            <label>Select Pet Profile *</label>
                                            {pets.length === 0 ? (
                                                <p className="no-pets-warn">⚠️ You have no registered pets. Please register a pet profile first!</p>
                                            ) : (
                                                <select
                                                    value={bookingData.petId}
                                                    onChange={(e) => setBookingData({ ...bookingData, petId: e.target.value })}
                                                    required
                                                >
                                                    <option value="" disabled>-- Select your pet --</option>
                                                    {pets.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            🐾 {p.name} ({p.species} - {p.breed})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label>Appointment / Service Type *</label>
                                            <select
                                                value={bookingData.serviceType}
                                                onChange={(e) => setBookingData({ ...bookingData, serviceType: e.target.value })}
                                            >
                                                <option value="General Consultation">General Wellness Consultation 🩺</option>
                                                <option value="Vaccination & Immunization">Vaccination & Immunization 💉</option>
                                                <option value="Veterinary Surgery">Veterinary Surgery & Procedures ✂️</option>
                                                <option value="Ophthalmology & Eye Care">Ophthalmology & Eye Care 👁️</option>
                                                <option value="Emergency & Critical Care">Emergency & Critical Care 🚑</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Additional Booking Notes / Medical Context (Optional)</label>
                                            <textarea
                                                placeholder="Specify any dietary habits, recent symptoms, or special care requirements..."
                                                value={bookingData.notes}
                                                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="wizard-footer">
                                            <button type="button" className="btn-cancel" onClick={() => setBookingStep(1)}>← Back</button>
                                            <button
                                                type="button"
                                                className="btn-save"
                                                disabled={pets.length === 0}
                                                onClick={() => setBookingStep(3)}
                                            >
                                                Next: Review Booking →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: REVIEW & SUBMIT */}
                                {bookingStep === 3 && (
                                    <div className="wizard-step-panel">
                                        <h3>Step 3: Review & Confirm Booking Request</h3>

                                        <div className="booking-summary-card">
                                            <div className="summary-row">
                                                <strong>Date & Time Slot:</strong>
                                                <span>📅 {bookingData.date} at {bookingData.timeSlot}</span>
                                            </div>
                                            <div className="summary-row">
                                                <strong>Pet Profile:</strong>
                                                <span>
                                                    🐾 {pets.find(p => p.id === bookingData.petId)?.name || 'Selected Pet'}
                                                </span>
                                            </div>
                                            <div className="summary-row">
                                                <strong>Requested Service:</strong>
                                                <span>{bookingData.serviceType}</span>
                                            </div>
                                            <div className="summary-row">
                                                <strong>Assigned Doctor:</strong>
                                                <span>🩺 {bookingData.doctorName || 'Not Selected'}</span>
                                            </div>
                                            {bookingData.notes && (
                                                <div className="summary-row">
                                                    <strong>Notes:</strong>
                                                    <span>{bookingData.notes}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="wizard-footer">
                                            <button type="button" className="btn-cancel" onClick={() => setBookingStep(2)}>← Back to Edit</button>
                                            <button type="submit" className="btn-save">Submit Appointment Request</button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
                {/* DELETE ACCOUNT CONFIRMATION MODAL */}
                {deleteModalOpen && (
                    <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1px solid #fecaca' }}>
                            <button className="modal-close-btn" onClick={() => setDeleteModalOpen(false)}>✕</button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                    ⚠️
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.25rem' }}>Delete Account Permanently?</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d' }}>This action cannot be undone.</p>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                                Are you sure you want to delete your Pet Owner account (<strong>{currentUser?.email}</strong>)? All registered pet data and appointment schedules will be erased immediately.
                            </p>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Type <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#dc2626' }}>DELETE</code> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={confirmDeleteText}
                                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 'bold' }}
                                />
                            </div>

                            <div className="form-actions-row" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setDeleteModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDeleteAccount}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: confirmDeleteText.trim().toUpperCase() === 'DELETE' ? '#dc2626' : '#fca5a5',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        cursor: confirmDeleteText.trim().toUpperCase() === 'DELETE' ? 'pointer' : 'not-allowed',
                                    }}
                                    disabled={confirmDeleteText.trim().toUpperCase() !== 'DELETE'}
                                >
                                    Confirm Account Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DEDICATED SUBPAGE: CENTRALIZED NOTIFICATION CENTER (US 1.27, US 1.28, US 1.29) */}
                {currentView === 'NOTIFICATIONS' && (
                    <section className="dedicated-subpage-section">
                        {/* Banner */}
                        <div className="notif-center-banner">
                            <div className="notif-banner-text">
                                <h1>Centralized Notification Center 🔔</h1>
                                <p>Stay updated on appointment approvals, medical reminders, and hospital service updates.</p>
                            </div>
                            <div className="notif-banner-actions">
                                {unreadNotifCount > 0 && (
                                    <button
                                        type="button"
                                        className="btn-banner-action"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        ✓ Mark All as Read ({unreadNotifCount})
                                    </button>
                                )}
                                {notifications.some(n => n.read) && (
                                    <button
                                        type="button"
                                        className="btn-banner-action danger"
                                        onClick={handleClearReadNotifications}
                                    >
                                        🗑️ Clear Read
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Toolbar with Filters & Search */}
                        <div className="notif-toolbar-card">
                            <div className="notif-filter-pills">
                                <button
                                    type="button"
                                    className={`filter-pill-btn ${notifFilter === 'ALL' ? 'active' : ''}`}
                                    onClick={() => setNotifFilter('ALL')}
                                >
                                    <Bell size={15} />
                                    <span>All</span>
                                    <span className="pill-count-tag">{notifications.length}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`filter-pill-btn ${notifFilter === 'UNREAD' ? 'active' : ''}`}
                                    onClick={() => setNotifFilter('UNREAD')}
                                >
                                    <span className="pill-unread-dot"></span>
                                    <span>Unread</span>
                                    <span className="pill-count-tag unread-tag">{unreadNotifCount}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`filter-pill-btn ${notifFilter === 'APPOINTMENTS' ? 'active' : ''}`}
                                    onClick={() => setNotifFilter('APPOINTMENTS')}
                                >
                                    <Calendar size={15} />
                                    <span>Appointments</span>
                                    <span className="pill-count-tag">{notifications.filter(n => n.type === 'APPOINTMENT').length}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`filter-pill-btn ${notifFilter === 'VACCINES' ? 'active' : ''}`}
                                    onClick={() => setNotifFilter('VACCINES')}
                                >
                                    <ShieldCheck size={15} />
                                    <span>Vaccines & Care</span>
                                    <span className="pill-count-tag">{notifications.filter(n => n.type === 'VACCINE').length}</span>
                                </button>

                                <button
                                    type="button"
                                    className={`filter-pill-btn ${notifFilter === 'SYSTEM' ? 'active' : ''}`}
                                    onClick={() => setNotifFilter('SYSTEM')}
                                >
                                    <Info size={15} />
                                    <span>System Alerts</span>
                                    <span className="pill-count-tag">{notifications.filter(n => n.type === 'SYSTEM' || n.type === 'PET_PROFILE').length}</span>
                                </button>
                            </div>

                            <div className="notif-search-wrap">
                                <Search size={16} className="notif-search-icon" color="#10b981" />
                                <input
                                    type="text"
                                    className="notif-search-input"
                                    placeholder="Search notifications..."
                                    value={notifSearch}
                                    onChange={(e) => setNotifSearch(e.target.value)}
                                />
                                {notifSearch && (
                                    <button type="button" className="btn-clear-search" onClick={() => setNotifSearch('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification Cards List */}
                        <div className="notif-cards-list">
                            {(() => {
                                const filtered = notifications.filter(n => {
                                    const matchesFilter =
                                        notifFilter === 'ALL' ? true :
                                            notifFilter === 'UNREAD' ? !n.read :
                                                notifFilter === 'APPOINTMENTS' ? n.type === 'APPOINTMENT' :
                                                    notifFilter === 'VACCINES' ? n.type === 'VACCINE' :
                                                        (n.type === 'SYSTEM' || n.type === 'PET_PROFILE');

                                    const query = notifSearch.toLowerCase().trim();
                                    const matchesSearch = !query ||
                                        (n.title && n.title.toLowerCase().includes(query)) ||
                                        (n.message && n.message.toLowerCase().includes(query));

                                    return matchesFilter && matchesSearch;
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="empty-pets-card" style={{ background: '#ffffff', borderRadius: '24px', padding: '48px 24px', textAlign: 'center' }}>
                                            <div className="empty-emoji">🔔</div>
                                            <h3>No notifications found</h3>
                                            <p>You have no {notifFilter !== 'ALL' ? notifFilter.toLowerCase() : ''} notifications matching your current filters.</p>
                                            {notifFilter !== 'ALL' && (
                                                <button type="button" className="btn-add-pet" onClick={() => { setNotifFilter('ALL'); setNotifSearch(''); }}>
                                                    View All Notifications
                                                </button>
                                            )}
                                        </div>
                                    );
                                }

                                return filtered.map((n) => {
                                    const isUnread = !n.read;
                                    const iconEmoji = n.type === 'APPOINTMENT' ? '📅' : n.type === 'VACCINE' ? '💉' : n.type === 'PET_PROFILE' ? '🐾' : '⚙️';
                                    const iconClass = n.type === 'APPOINTMENT' ? 'type-bg-appointment' : n.type === 'VACCINE' ? 'type-bg-vaccine' : n.type === 'PET_PROFILE' ? 'type-bg-pet' : 'type-bg-system';

                                    return (
                                        <div key={n.id} className={`notif-card-item ${isUnread ? 'unread' : ''}`}>
                                            <div className={`notif-type-icon-box ${iconClass}`}>
                                                {iconEmoji}
                                            </div>

                                            <div className="notif-card-body">
                                                <div className="notif-card-header-row">
                                                    <h4 className="notif-card-title">
                                                        {n.title}
                                                        {isUnread && (
                                                            <span style={{
                                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                color: '#ffffff',
                                                                padding: '3px 10px',
                                                                borderRadius: '12px',
                                                                fontSize: '0.72rem',
                                                                fontWeight: 900,
                                                                letterSpacing: '0.04em',
                                                                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                ⚡ UNREAD
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <span className="notif-type-pill" style={{ background: isUnread ? '#ecfdf5' : '#f1f5f9', color: isUnread ? '#059669' : '#64748b' }}>
                                                        {n.type}
                                                    </span>
                                                </div>

                                                <p className="notif-card-message">{n.message}</p>

                                                <div className="notif-card-meta-row">
                                                    <span className="notif-timestamp-tag">
                                                        🕒 {n.timestamp}
                                                    </span>

                                                    <div className="notif-actions-group">
                                                        {/* US 1.27 Detail View Button */}
                                                        <button
                                                            type="button"
                                                            className="btn-notif-action primary"
                                                            onClick={() => {
                                                                if (isUnread) handleMarkAsRead(n.id);
                                                                setSelectedNotifDetail(n);
                                                            }}
                                                        >
                                                            👁️ View Details
                                                        </button>

                                                        {/* US 1.28 Toggle Read/Unread */}
                                                        <button
                                                            type="button"
                                                            className="btn-notif-action"
                                                            onClick={() => handleToggleReadStatus(n.id)}
                                                        >
                                                            {isUnread ? '✓ Mark as Read' : '↺ Mark Unread'}
                                                        </button>

                                                        {/* US 1.29 Delete Button */}
                                                        <button
                                                            type="button"
                                                            className="btn-notif-action delete"
                                                            onClick={() => handleDeleteNotification(n.id)}
                                                            title="Delete notification"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </section>
                )}

                {/* NOTIFICATION DETAIL MODAL (US 1.27) */}
                {selectedNotifDetail && (
                    <div className="modal-overlay" onClick={() => setSelectedNotifDetail(null)}>
                        <div className="modal-content notif-detail-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className={`notif-type-icon-box ${selectedNotifDetail.type === 'APPOINTMENT' ? 'type-bg-appointment' : selectedNotifDetail.type === 'VACCINE' ? 'type-bg-vaccine' : 'type-bg-system'}`}>
                                        {selectedNotifDetail.type === 'APPOINTMENT' ? '📅' : selectedNotifDetail.type === 'VACCINE' ? '💉' : '⚙️'}
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                                            {selectedNotifDetail.type} NOTIFICATION
                                        </span>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                                            {selectedNotifDetail.title}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => setSelectedNotifDetail(null)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
                                    {selectedNotifDetail.message}
                                </p>
                                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Received: <strong>{selectedNotifDetail.timestamp}</strong></span>
                                    <span>Status: <strong style={{ color: selectedNotifDetail.read ? '#059669' : '#dc2626' }}>{selectedNotifDetail.read ? 'READ' : 'UNREAD'}</strong></span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                {selectedNotifDetail.type === 'APPOINTMENT' && (
                                    <button
                                        type="button"
                                        className="btn-add-pet"
                                        onClick={() => {
                                            setSelectedNotifDetail(null);
                                            setCurrentView('MY_APPOINTMENTS');
                                        }}
                                    >
                                        Go to Appointments →
                                    </button>
                                )}
                                {selectedNotifDetail.type === 'VACCINE' && (
                                    <button
                                        type="button"
                                        className="btn-add-pet"
                                        onClick={() => {
                                            setSelectedNotifDetail(null);
                                            setCurrentView('PETS_LIST');
                                        }}
                                    >
                                        Go to My Pets →
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                                    <button
                                        type="button"
                                        className="btn-notif-action delete"
                                        onClick={() => handleDeleteNotification(selectedNotifDetail.id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-save"
                                        onClick={() => setSelectedNotifDetail(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* APPOINTMENT BOOKING DETAILS MODAL */}
                {selectedApptDetail && (
                    <div className="modal-overlay" onClick={() => setSelectedApptDetail(null)}>
                        <div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: '640px',
                                width: '90%',
                                background: '#ffffff',
                                borderRadius: '24px',
                                padding: '32px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                border: '1px solid #e2e8f0',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                                            {selectedApptDetail.id}
                                        </span>
                                        <span className={`apt-status-chip ${selectedApptDetail.status}`}>
                                            {selectedApptDetail.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : selectedApptDetail.status === 'APPROVED' ? 'APPROVED' : selectedApptDetail.status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'}
                                        </span>
                                    </div>
                                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>
                                        Hospital Appointment Booking Details
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedApptDetail(null)}
                                    style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Main Details Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* REJECTION REASON CARD IF REJECTED */}
                                {(selectedApptDetail.status === 'REJECTED' || selectedApptDetail.rejectReason) && (
                                    <div style={{ background: '#fef2f2', borderRadius: '16px', padding: '20px', border: '1px solid #fecaca', boxShadow: '0 2px 10px rgba(239, 68, 68, 0.05)' }}>
                                        <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                                            ❌ Rejection Reason & Hospital Notice
                                        </h4>
                                        <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.94rem', fontWeight: 700, lineHeight: 1.5 }}>
                                            {selectedApptDetail.rejectReason || 'Hospital schedule full for requested time slot.'}
                                        </p>
                                        <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.4 }}>
                                            💡 <strong>Next Steps:</strong> You may request a new appointment for another date/time or select a different veterinarian from the Find a Doctor panel.
                                        </p>
                                    </div>
                                )}

                                {/* Card 1: Visit Schedule & Assigned Doctor */}
                                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📅 Visit Schedule & Doctor
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Date & Time</span>
                                            <strong style={{ color: '#0f172a', fontSize: '1rem' }}>📅 {selectedApptDetail.date}</strong>
                                            <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>⏰ {selectedApptDetail.timeSlot}</div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Assigned Specialist</span>
                                            <strong style={{ color: '#0f172a', fontSize: '1rem' }}>👨‍⚕️ {selectedApptDetail.doctorName || 'Assigned Doctor'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Service Category</span>
                                            <strong style={{ color: '#0f172a' }}>🩺 {selectedApptDetail.serviceType}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: Patient & Owner Profile */}
                                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        🐾 Patient & Owner Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Pet Patient Name</span>
                                            <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>🐾 {selectedApptDetail.petName}</strong>
                                            <span style={{ display: 'block', color: '#64748b', fontSize: '0.82rem' }}>Species: {selectedApptDetail.species || 'Pet'}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Registered Owner</span>
                                            <strong style={{ color: '#0f172a' }}>👤 {(!selectedApptDetail.ownerName || selectedApptDetail.ownerName === 'Not Specified') ? (currentUser?.name || 'Pet Owner') : selectedApptDetail.ownerName}</strong>
                                            <span style={{ display: 'block', color: '#64748b', fontSize: '0.82rem' }}>📞 {(!selectedApptDetail.ownerPhone || selectedApptDetail.ownerPhone === 'Not Specified') ? ((currentUser?.phone && currentUser.phone !== 'Not Specified') ? currentUser.phone : '0771234567') : selectedApptDetail.ownerPhone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 3: Consultation Reason & Clinical Notes */}
                                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📝 Visit Reason & Clinical Notes
                                    </h4>
                                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Stated Reason for Visit:</span>
                                        <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>{selectedApptDetail.reason || 'General Consultation'}</p>
                                    </div>
                                    {selectedApptDetail.diagnosis && (
                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                                            <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Doctor Diagnosis & RX Notes:</span>
                                            <p style={{ margin: 0, color: '#065f46', fontSize: '0.9rem', fontWeight: 600 }}>{selectedApptDetail.diagnosis}</p>
                                            {selectedApptDetail.prescription && (
                                                <p style={{ margin: '6px 0 0', color: '#047857', fontSize: '0.85rem' }}><strong>Prescription:</strong> {selectedApptDetail.prescription}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Card 4: Hospital Location & Instructions (Hidden for Rejected Appointments) */}
                                {selectedApptDetail.status !== 'REJECTED' && !selectedApptDetail.rejectReason && (
                                    <div style={{ background: '#eff6ff', borderRadius: '16px', padding: '16px 20px', border: '1px solid #bfdbfe' }}>
                                        <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            🏥 Hospital Arrival Instructions
                                        </h4>
                                        <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                                            <strong>Location:</strong> Sri Jayawardenapura Animal Hospital, No 34 Parliament Road, Ethul Kotte, Kotte.
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.83rem', color: '#2563eb' }}>
                                            💡 Please arrive 10-15 minutes before your scheduled slot. Bring your pet's vaccination booklet.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    onClick={() => setSelectedApptDetail(null)}
                                    style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }}
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {currentView === 'ADMISSIONS' && (
                    <PetOwnerAdmissionsPage hideHeader={true} />
                )}
                
                {(currentView === 'BILLING' || currentView === 'INVOICES') && (
                    <PetOwnerPortal initialView="invoices" hideHeader={true} />
                )}

                {currentView === 'PAYMENTS' && (
                    <PetOwnerPortal initialView="payments" hideHeader={true} />
                )}

                {currentView === 'CONSULTATIONS' && (
                    <section style={{ padding: '0' }}>
                        <PetOwnerConsultations />
                    </section>
                )}

                {currentView === 'MEDICAL_HISTORY' && (
                    <section style={{ padding: '0' }}>
                        <PetOwnerMedicalHistory />
                    </section>
                )}
            </main>
            </div>

            <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`} id="toast">{toast.message}</div>
        </div >
    );
}
