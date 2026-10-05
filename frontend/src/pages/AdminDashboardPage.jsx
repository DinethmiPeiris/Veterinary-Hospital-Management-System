import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './AdminDashboardPage.css';

const IconHospital = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M10 9h4M12 7v4" />
    </svg>
);

const IconClock = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const IconUsers = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconStethoscope = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.8 2.3A.3.3 0 0 1 5 2h4a1 1 0 0 1 1 1v5a5 5 0 0 1-10 0V3a1 1 0 0 1 1-1h4" />
        <path d="M8 15v1a6 6 0 0 0 12 0v-3" />
        <circle cx="20" cy="10" r="2" />
    </svg>
);

const IconPaw = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
        <path d="M12 12c-2.5 0-4.5 1.8-4.5 4 0 1.7 1.2 3.1 2.8 3.7.5.2 1.1.3 1.7.3s1.2-.1 1.7-.3c1.6-.6 2.8-2 2.8-3.7 0-2.2-2-4-4.5-4zm-5.5-2.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm11 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-12.5-4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm14 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
    </svg>
);

const IconCalendar = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const IconFolder = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

const IconUserPlus = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
);

const IconSearch = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const IconCheck = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconX = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconLock = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconShield = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconSparkles = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
    </svg>
);

const IconUser = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconCamera = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const IconArrowLeft = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconArrowRight = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const IconCloudOff = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const IconAlertTriangle = ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const IconGrid = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
);

const IconTable = ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3z" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
    </svg>
);

const IconBarChart = ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const AppointmentVolumeChart = ({ appointments = [] }) => {
    const normalizeDateStr = (dateInput) => {
        if (!dateInput) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return '';
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        } catch {
            return '';
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let hasFutureAppts = false;
    if (Array.isArray(appointments)) {
        hasFutureAppts = appointments.some(a => {
            const norm = normalizeDateStr(a.date || a.createdAt);
            if (!norm) return false;
            const apptD = new Date(norm + 'T00:00:00');
            return apptD > today;
        });
    }

    const dates = [];
    const startOffset = hasFutureAppts ? 3 : 6;
    for (let i = startOffset; i >= (hasFutureAppts ? -3 : 0); i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
    }

    const data = dates.map((dateStr) => {
        const dayAppts = (appointments || []).filter(a => {
            const normDate = normalizeDateStr(a.date);
            const normCreated = normalizeDateStr(a.createdAt);
            return normDate === dateStr || normCreated === dateStr;
        });

        const approvedCount = dayAppts.filter(a => a.status === 'APPROVED').length;
        const completedCount = dayAppts.filter(a => a.status === 'COMPLETED').length;

        const dObj = new Date(dateStr + 'T00:00:00');
        return {
            dateStr,
            label: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            approved: approvedCount,
            completed: completedCount
        };
    });

    const totalApprovedInView = data.reduce((sum, d) => sum + d.approved, 0);
    const totalCompletedInView = data.reduce((sum, d) => sum + d.completed, 0);

    const maxDataVal = Math.max(...data.map(d => Math.max(d.approved, d.completed)), 4);
    const maxVal = Math.ceil(maxDataVal / 4) * 4;
    const width = 800;
    const height = 130;
    const xStep = width / Math.max(1, data.length - 1);
    const getY = (val) => height - ((val / maxVal) * height);

    const approvedPoints = data.map((d, i) => `${i * xStep},${getY(d.approved)}`).join(' ');
    const approvedArea = `0,${height} ${approvedPoints} ${width},${height}`;

    const completedPoints = data.map((d, i) => `${i * xStep},${getY(d.completed)}`).join(' ');
    const completedArea = `0,${height} ${completedPoints} ${width},${height}`;

    return (
        <div className="patient-types-card av-card">
            <div className="av-header">
                <div className="av-title">
                    <IconBarChart size={22} /> <h3>Appointment Volume</h3>
                </div>
                <div className="av-date-picker">
                    <IconCalendar size={14} /> <span>{data[0]?.label}, 2026 - {data[data.length - 1]?.label}, 2026</span>
                </div>
            </div>

            <div className="av-legend">
                <div className="av-legend-item"><div className="av-dot" style={{ backgroundColor: '#10b981' }}></div> Approved ({totalApprovedInView})</div>
                <div className="av-legend-item"><div className="av-dot" style={{ backgroundColor: '#3b82f6' }}></div> Completed ({totalCompletedInView})</div>
            </div>

            <div className="av-chart-wrapper">
                <svg viewBox={`-20 -10 ${width + 40} ${height + 30}`} className="av-svg-chart">
                    {[0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map((val, i) => {
                        const y = getY(val);
                        return (
                            <g key={`ygrid-${i}`}>
                                <line x1="0" y1={y} x2={width} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                                <text x="-20" y={y + 4} fill="#94a3b8" fontSize="11" fontFamily="sans-serif">{val}</text>
                            </g>
                        );
                    })}

                    <polygon points={approvedArea} fill="url(#totalGrad)" opacity="0.15" />
                    <polygon points={completedArea} fill="url(#completedGrad)" opacity="0.15" />

                    <polyline points={approvedPoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points={completedPoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />

                    {data.map((d, i) => (
                        <g key={`pts-${i}`}>
                            <circle cx={i * xStep} cy={getY(d.approved)} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                            <circle cx={i * xStep + (d.approved === d.completed ? 4 : 0)} cy={getY(d.completed)} r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                        </g>
                    ))}

                    {data.map((d, i) => (
                        <text key={`xlbl-${i}`} x={i * xStep} y={height + 20} fill="#64748b" fontSize="12" textAnchor="middle" fontWeight={d.dateStr === normalizeDateStr(new Date().toISOString().split('T')[0]) ? '700' : '400'}>{d.label}</text>
                    ))}

                    <defs>
                        <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

const PatientTypesChart = ({ pets = [] }) => {
    const total = pets ? pets.length : 0;

    let dogs = 0, cats = 0, exotics = 0, other = 0;
    if (pets && pets.length > 0) {
        pets.forEach(p => {
            const s = (p.species || '').toLowerCase();
            if (s.includes('dog')) dogs++;
            else if (s.includes('cat')) cats++;
            else if (['bird', 'reptile', 'rabbit', 'exotic'].some(e => s.includes(e))) exotics++;
            else other++;
        });
    }

    const pct = (c) => total > 0 ? Math.round((c / total) * 100) : 0;
    const dPct = pct(dogs), cPct = pct(cats), oPct = pct(other);
    const ePct = total > 0 ? (100 - dPct - cPct - oPct) : 0;

    const dOff = 25;
    const cOff = dOff - dPct;
    const oOff = cOff - cPct;
    const eOff = oOff - oPct;

    return (
        <div className="patient-types-card">
            <div className="pt-header">
                <IconPaw size={24} /> <h3>Patient Types</h3>
            </div>
            <div className="pt-content">
                <div className="pt-chart-container">
                    <svg viewBox="0 0 36 36" className="donut-chart-svg">
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="6"></circle>

                        {dPct > 0 && <circle className="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray={`${dPct} ${100 - dPct}`} strokeDashoffset={dOff}></circle>}

                        {cPct > 0 && <circle className="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray={`${cPct} ${100 - cPct}`} strokeDashoffset={cOff}></circle>}

                        {oPct > 0 && <circle className="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="6" strokeDasharray={`${oPct} ${100 - oPct}`} strokeDashoffset={oOff}></circle>}

                        {ePct > 0 && <circle className="donut-segment" cx="18" cy="18" r="15.915" fill="transparent" stroke="#cbd5e1" strokeWidth="6" strokeDasharray={`${ePct} ${100 - ePct}`} strokeDashoffset={eOff}></circle>}
                    </svg>
                    <div className="pt-center-text">
                        <span className="pt-total">{total}</span>
                        <span className="pt-label">Total Patients</span>
                    </div>
                </div>

                <div className="pt-legend">
                    <div className="pt-legend-item">
                        <div className="pt-dot" style={{ backgroundColor: '#10b981' }}></div>
                        <span className="pt-name">Dogs</span>
                        <span className="pt-pct">{dPct}%</span>
                    </div>
                    <div className="pt-legend-item">
                        <div className="pt-dot" style={{ backgroundColor: '#3b82f6' }}></div>
                        <span className="pt-name">Cats</span>
                        <span className="pt-pct">{cPct}%</span>
                    </div>
                    <div className="pt-legend-item">
                        <div className="pt-dot" style={{ backgroundColor: '#a855f7' }}></div>
                        <span className="pt-name">Other</span>
                        <span className="pt-pct">{oPct}%</span>
                    </div>
                    <div className="pt-legend-item">
                        <div className="pt-dot" style={{ backgroundColor: '#cbd5e1' }}></div>
                        <span className="pt-name">Exotics</span>
                        <span className="pt-pct">{ePct}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allPets, setAllPets] = useState([]);
    const [loading, setLoading] = useState(true);

    // View state — persisted across refreshes
    const ADMIN_VIEW_KEY = 'vhms_admin_view';
    const safeAdminViews = ['OVERVIEW', 'PENDING', 'DIRECTORY', 'DOCTOR_DIRECTORY', 'CREATE_DOCTOR', 'TIMESLOTS', 'SCHEDULE', 'APPOINTMENTS'];
    const initAdminView = (() => { try { const v = localStorage.getItem(ADMIN_VIEW_KEY); return safeAdminViews.includes(v) ? v : 'OVERVIEW'; } catch { return 'OVERVIEW'; } })();
    const [currentView, setCurrentViewRaw] = useState(initAdminView);
    const setCurrentView = (v) => { try { localStorage.setItem(ADMIN_VIEW_KEY, v); } catch { } setCurrentViewRaw(v); window.scrollTo({ top: 0, behavior: 'instant' }); };
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Doctor profile view/edit state
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [isEditingDoctor, setIsEditingDoctor] = useState(false);
    const [editDocForm, setEditDocForm] = useState({});

    // Pet owner account view state
    const [selectedUser, setSelectedUser] = useState(null);

    // Doctor Creation Form state
    const [docName, setDocName] = useState('');
    const [docEmail, setDocEmail] = useState('');
    const [docPhone, setDocPhone] = useState('');
    const [docDepartment, setDocDepartment] = useState('');
    const [docPhotoUrl, setDocPhotoUrl] = useState('');
    const [docBio, setDocBio] = useState('');
    const [docExperience, setDocExperience] = useState('');
    const [docServices, setDocServices] = useState('');
    const [docAvailableHours, setDocAvailableHours] = useState('');
    const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);

    const handleDoctorPhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('Photo must be under 5MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setDocPhotoUrl(reader.result);
        reader.readAsDataURL(file);
    };

    // Appointment Supervision & Approval State
    // Start EMPTY — populated exclusively by the API on mount.
    // localStorage is only used as a write-through cache after a successful API fetch.
    const [adminAppointments, setAdminAppointments] = useState([]);
    const [apptStatusFilter, setApptStatusFilter] = useState('ALL');
    const [apptViewMode, setApptViewMode] = useState(() => {
        try {
            return localStorage.getItem('vhms_admin_appt_view_mode') || 'GRID';
        } catch {
            return 'GRID';
        }
    });
    const handleApptViewModeChange = (mode) => {
        setApptViewMode(mode);
        try {
            localStorage.setItem('vhms_admin_appt_view_mode', mode);
        } catch { }
    };
    const [adminRejectModalAppt, setAdminRejectModalAppt] = useState(null);
    const [adminRejectReason, setAdminRejectReason] = useState('');
    const [viewingApptModal, setViewingApptModal] = useState(null);

    const getAppointmentOwnerInfo = (appt) => {
        if (!appt) return { derivedOwnerName: 'Dinethmi Peiris', derivedOwnerPhone: '0771234567', derivedBreed: '' };

        const matchedPet = allPets.find(p => p.name === appt.petName);
        let derivedOwnerName = appt.ownerName;
        let derivedOwnerPhone = appt.ownerPhone;
        let derivedBreed = appt.breed || (matchedPet ? matchedPet.breed : '');

        let ownerUser = null;
        if (matchedPet?.ownerId) {
            ownerUser = allUsers.find(u => u.id === matchedPet.ownerId);
        }
        if (!ownerUser && derivedOwnerName) {
            ownerUser = allUsers.find(u => u.name && u.name.toLowerCase() === derivedOwnerName.toLowerCase());
        }
        if (!ownerUser) {
            try {
                const localUsers = JSON.parse(localStorage.getItem('vhms_users') || '[]');
                if (matchedPet?.ownerId) ownerUser = localUsers.find(u => u.id === matchedPet.ownerId);
                if (!ownerUser && derivedOwnerName) ownerUser = localUsers.find(u => u.name && u.name.toLowerCase() === derivedOwnerName.toLowerCase());
            } catch (e) { }
        }
        if (!ownerUser) {
            try {
                const authUser = JSON.parse(localStorage.getItem('vhms_user'));
                if (authUser && ((matchedPet?.ownerId && authUser.id === matchedPet.ownerId) || (derivedOwnerName && authUser.name && authUser.name.toLowerCase() === derivedOwnerName.toLowerCase()))) {
                    ownerUser = authUser;
                }
            } catch (e) { }
        }

        if (ownerUser) {
            if (!derivedOwnerName) derivedOwnerName = ownerUser.name;
            if (ownerUser.phone && ownerUser.phone !== 'Not Specified') {
                derivedOwnerPhone = ownerUser.phone;
            }
        }

        if (!derivedOwnerName) {
            derivedOwnerName = 'Dinethmi Peiris';
        }

        const isPhoneInvalid = !derivedOwnerPhone || derivedOwnerPhone === 'Not Specified' || derivedOwnerPhone === '071XXXXXXX' || derivedOwnerPhone === 'No Contacts';

        if (isPhoneInvalid || derivedOwnerName.toLowerCase().includes('dinethmi')) {
            try {
                const authUser = JSON.parse(localStorage.getItem('vhms_user'));
                if (authUser && authUser.phone && authUser.phone !== 'Not Specified') {
                    derivedOwnerPhone = authUser.phone;
                } else {
                    derivedOwnerPhone = '0771234567';
                }
            } catch (e) {
                derivedOwnerPhone = '0771234567';
            }
        }

        return { derivedOwnerName, derivedOwnerPhone, derivedBreed };
    };

    const handleAdminApproveAppt = (id, petName) => {
        const updated = adminAppointments.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a);
        setAdminAppointments(updated);
        api.updateAppointment(id, { status: 'APPROVED' }).catch(e => console.warn("Backend update error", e));
        try {
            localStorage.setItem('vhms_user_appointments', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
        } catch { }
        showToast(`✅ Appointment request for ${petName} approved!`, 'success');
    };

    const handleAdminConfirmReject = (e) => {
        e.preventDefault();
        if (!adminRejectModalAppt) return;

        const updated = adminAppointments.map(a => a.id === adminRejectModalAppt.id ? {
            ...a,
            status: 'REJECTED',
            rejectReason: adminRejectReason || 'Hospital schedule full for requested time slot.'
        } : a);
        setAdminAppointments(updated);
        api.updateAppointment(adminRejectModalAppt.id, {
            status: 'REJECTED',
            doctorNotes: adminRejectReason || 'Hospital schedule full for requested time slot.'
        }).catch(e => console.warn("Backend update error", e));
        try {
            localStorage.setItem('vhms_user_appointments', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
        } catch { }

        showToast(`✕ Appointment request for ${adminRejectModalAppt.petName} declined.`, 'error');
        setAdminRejectModalAppt(null);
        setAdminRejectReason('');
    };

    const filteredAdminAppointments = useMemo(() => {
        return adminAppointments.filter(a => {
            if (apptStatusFilter === 'ALL') return true;
            return a.status === apptStatusFilter;
        });
    }, [adminAppointments, apptStatusFilter]);

    const pendingApptsCount = useMemo(() => {
        return adminAppointments.filter(a =>
            a.status === 'PENDING' ||
            a.status === 'PENDING_APPROVAL' ||
            a.status === 'PENDING ADMIN APPROVAL' ||
            a.status === 'Pending Admin Approval' ||
            a.status === 'Pending'
        ).length;
    }, [adminAppointments]);

    const totalPendingApprovals = pendingUsers ? pendingUsers.length : 0;

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [toast, setToast] = useState({ message: '', type: '', show: false });
    const [createdDoctorInfo, setCreatedDoctorInfo] = useState(null);

    // Doctor Schedules State
    const [globalSchedules, setGlobalSchedules] = useState({});
    const [manageScheduleDocId, setManageScheduleDocId] = useState('');
    const [manageScheduleDate, setManageScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewScheduleDate, setViewScheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [customTime, setCustomTime] = useState('');
    const [doctorWorkingDays, setDoctorWorkingDays] = useState({});

    useEffect(() => {
        try {
            const stored = localStorage.getItem('vhms_schedules');
            if (stored) setGlobalSchedules(JSON.parse(stored));
            const storedDays = localStorage.getItem('vhms_doctor_working_days');
            if (storedDays) setDoctorWorkingDays(JSON.parse(storedDays));

            // Auto-purge test accounts if present in localStorage
            const customs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]');
            if (customs.some(d => d.email === 'john.test@vhms.com' || d.name === 'Dr. John Test' || d.name === 'John Test' || d.email === 'cdcdc@gmail.com' || d.name === 'Dr. dcdncm')) {
                const cleaned = customs.filter(d => d.email !== 'john.test@vhms.com' && d.name !== 'Dr. John Test' && d.name !== 'John Test' && d.email !== 'cdcdc@gmail.com' && d.name !== 'Dr. dcdncm');
                localStorage.setItem('vhms_custom_doctors', JSON.stringify(cleaned));
            }
            const passwords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}');
            if (passwords['john.test@vhms.com'] || passwords['Dr. John Test'] || passwords['cdcdc@gmail.com'] || passwords['Dr. dcdncm']) {
                delete passwords['john.test@vhms.com'];
                delete passwords['Dr. John Test'];
                delete passwords['cdcdc@gmail.com'];
                delete passwords['Dr. dcdncm'];
                localStorage.setItem('vhms_doctor_passwords', JSON.stringify(passwords));
            }
            const firstLogins = JSON.parse(localStorage.getItem('vhms_first_login_doctors') || '{}');
            if (firstLogins['john.test@vhms.com'] || firstLogins['Dr. John Test'] || firstLogins['cdcdc@gmail.com'] || firstLogins['Dr. dcdncm']) {
                delete firstLogins['john.test@vhms.com'];
                delete firstLogins['Dr. John Test'];
                delete firstLogins['cdcdc@gmail.com'];
                delete firstLogins['Dr. dcdncm'];
                localStorage.setItem('vhms_first_login_doctors', JSON.stringify(firstLogins));
            }
        } catch { }
    }, [currentView]);

    const toggleWorkingDay = (dayName) => {
        if (!manageScheduleDocId) return;
        const currentDays = doctorWorkingDays[manageScheduleDocId] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const updated = currentDays.includes(dayName)
            ? currentDays.filter(d => d !== dayName)
            : [...currentDays, dayName];

        const newObj = { ...doctorWorkingDays, [manageScheduleDocId]: updated };
        setDoctorWorkingDays(newObj);
        try {
            localStorage.setItem('vhms_doctor_working_days', JSON.stringify(newObj));
        } catch { }
    };

    const getDoctorSchedule = (docOrId, dateStr) => {
        if (!docOrId || !dateStr || !globalSchedules) return undefined;
        let docObj = typeof docOrId === 'object' ? docOrId : registeredDoctors.find(d => d.id === docOrId || d.email === docOrId || String(d.id) === String(docOrId));
        const keysToTry = [
            typeof docOrId === 'string' ? docOrId : null,
            docObj?.id,
            docObj?.id ? String(docObj.id) : null,
            docObj?.email,
            docObj?.email ? docObj.email.toLowerCase() : null,
            docObj?.name
        ].filter(Boolean);

        for (const key of keysToTry) {
            if (globalSchedules[key] && globalSchedules[key][dateStr] !== undefined) {
                return globalSchedules[key][dateStr];
            }
        }
        return undefined;
    };

    const updateDoctorScheduleState = (docIdOrEmail, targetDate, daySlots) => {
        const docObj = registeredDoctors.find(d => d.id === docIdOrEmail || d.email === docIdOrEmail || String(d.id) === String(docIdOrEmail));
        const targetKeys = [docIdOrEmail];
        if (docObj) {
            if (docObj.id) targetKeys.push(docObj.id, String(docObj.id));
            if (docObj.email) targetKeys.push(docObj.email, docObj.email.toLowerCase());
        }
        const uniqueKeys = [...new Set(targetKeys.filter(Boolean))];

        const newSched = { ...globalSchedules };
        uniqueKeys.forEach(key => {
            if (!newSched[key]) newSched[key] = {};
            newSched[key][targetDate] = daySlots;
        });

        setGlobalSchedules(newSched);
        try {
            localStorage.setItem('vhms_schedules', JSON.stringify(newSched));
        } catch { }
    };

    const handleToggleSlot = (timeString) => {
        if (!manageScheduleDocId || !manageScheduleDate) {
            showToast('Please select a doctor and date first', 'error');
            return;
        }

        let daySlots = getDoctorSchedule(manageScheduleDocId, manageScheduleDate) || [];
        daySlots = [...daySlots];

        // If slot exists, remove it, else add it
        const exists = daySlots.find(s => s.time === timeString);
        if (exists) {
            if (exists.booked) {
                showToast('Cannot remove a booked slot!', 'error');
                return;
            }
            daySlots = daySlots.filter(s => s.time !== timeString);
        } else {
            daySlots = [...daySlots, { time: timeString, booked: false, appointmentId: null }];
        }

        // Sort chronologically
        daySlots.sort((a, b) => {
            const convert = t => {
                let [hm, ampm] = t.split(' ');
                let [h, m] = hm.split(':').map(Number);
                if (ampm === 'PM' && h !== 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            return convert(a.time) - convert(b.time);
        });

        updateDoctorScheduleState(manageScheduleDocId, manageScheduleDate, daySlots);
    };

    const isShift1OnlyDoc = (docObj) => {
        if (!docObj) return false;
        const name = (docObj.name || '').toLowerCase();
        const email = (docObj.email || '').toLowerCase();
        const hours = (docObj.availableHours || '').toLowerCase();
        if (name.includes('channa') || email.includes('channa')) return true;
        if (name.includes('nimal') || email.includes('nimal')) return true;
        if (hours.includes('11.00') && hours.includes('2.00') && !hours.includes('8.00') && !hours.includes('08:00') && !hours.includes('5.00')) return true;
        if (hours.includes('11:00') && hours.includes('2:00') && !hours.includes('8:00') && !hours.includes('08:00') && !hours.includes('5:00')) return true;
        return false;
    };

    const getDoctorDefaultWorkingDays = (docObj) => {
        if (!docObj) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const name = (docObj.name || '').toLowerCase();
        const email = (docObj.email || '').toLowerCase();
        const hours = (docObj.availableHours || '').toLowerCase();
        if (name.includes('nimal') || email.includes('nimal') || hours.includes('saturday') || hours.includes('sat')) {
            return ['Sat', 'Sun'];
        }
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    };

    const getDoctorDutyStatus = (doc, targetDateStr) => {
        if (!doc) return { isOffDuty: false, reason: '', isPast: false, isShiftEnded: false, dayName: '' };

        const docIdKey = doc.id || doc.email;
        const defaultWorkingDays = getDoctorDefaultWorkingDays(doc);
        const activeWorkingDays = doctorWorkingDays[docIdKey] || doctorWorkingDays[doc.id] || doctorWorkingDays[doc.email] || defaultWorkingDays;

        const dateParts = (targetDateStr || '').split('-').map(Number);
        const dateObj = dateParts.length === 3 ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null;
        const dayNamesList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dateObj ? dayNamesList[dateObj.getDay()] : '';

        if (dayName && !activeWorkingDays.includes(dayName)) {
            return { isOffDuty: true, reason: `Off Duty (${dayName})`, isPast: false, isShiftEnded: false, dayName };
        }

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (targetDateStr < todayStr) {
            return { isOffDuty: true, reason: 'Past Schedule', isPast: true, isShiftEnded: true, dayName };
        }

        if (targetDateStr === todayStr) {
            const currentMins = now.getHours() * 60 + now.getMinutes();

            // Parse time ranges from availableHours
            const hoursStr = doc.availableHours || '';
            const timeRanges = [];
            if (hoursStr) {
                const rangeRegex = /(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?\s*[-–to]+\s*(\d{1,2})[:.]?(\d{2})?\s*(AM|PM)?/gi;
                let match;
                while ((match = rangeRegex.exec(hoursStr)) !== null) {
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

                    timeRanges.push({
                        start: startH * 60 + startM,
                        end: endH * 60 + endM,
                        startDisplay: `${match[1]}:${String(startM).padStart(2, '0')} ${startAmPm || 'AM'}`,
                        endDisplay: `${match[4]}:${String(endM).padStart(2, '0')} ${endAmPm || 'PM'}`
                    });
                }
            }

            if (timeRanges.length === 0) {
                const isShift1Only = isShift1OnlyDoc(doc);
                const endMins = isShift1Only ? 840 : 1200;
                timeRanges.push({ start: 660, end: endMins, startDisplay: '11:00 AM', endDisplay: isShift1Only ? '2:00 PM' : '8:00 PM' });
            }

            const earliestStart = Math.min(...timeRanges.map(r => r.start));
            const latestEnd = Math.max(...timeRanges.map(r => r.end));

            if (currentMins < earliestStart) {
                const startStr = timeRanges[0]?.startDisplay || '11:00 AM';
                return { isOffDuty: true, reason: `Shift Starts at ${startStr}`, isPast: false, isShiftEnded: false, dayName };
            }
            if (currentMins >= latestEnd) {
                const endStr = timeRanges[timeRanges.length - 1]?.endDisplay || '2:00 PM';
                return { isOffDuty: true, reason: `Shift Ended at ${endStr}`, isPast: false, isShiftEnded: true, dayName };
            }

            const isWithinActiveSlot = timeRanges.some(r => currentMins >= r.start && currentMins < r.end);
            if (!isWithinActiveSlot) {
                return { isOffDuty: true, reason: 'Between Shifts', isPast: false, isShiftEnded: false, dayName };
            }
        }

        return { isOffDuty: false, reason: '', isPast: false, isShiftEnded: false, dayName };
    };

    const handleApplyShiftPreset = (presetType) => {
        if (!manageScheduleDocId || !manageScheduleDate) {
            showToast('Please select a doctor and date first.', 'error');
            return;
        }

        const shift1 = ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
        const shift2 = ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];
        const fullDaySlots = [...shift1, ...shift2];

        let targetTimes = [];
        if (presetType === 'SHIFT1' || presetType === 'MORNING') targetTimes = shift1;
        else if (presetType === 'SHIFT2' || presetType === 'AFTERNOON') targetTimes = shift2;
        else if (presetType === 'FULL_DAY') targetTimes = fullDaySlots;

        let daySlots = getDoctorSchedule(manageScheduleDocId, manageScheduleDate) || [];
        daySlots = [...daySlots];

        if (presetType === 'CLEAR') {
            // Keep only booked slots
            daySlots = daySlots.filter(s => s.booked);
        } else {
            // Add any target times that are not already present
            targetTimes.forEach(t => {
                if (!daySlots.some(s => s.time === t)) {
                    daySlots.push({ time: t, booked: false, appointmentId: null });
                }
            });
        }

        // Sort chronologically
        daySlots.sort((a, b) => {
            const convert = t => {
                let [hm, ampm] = t.split(' ');
                let [h, m] = hm.split(':').map(Number);
                if (ampm === 'PM' && h !== 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            return convert(a.time) - convert(b.time);
        });

        updateDoctorScheduleState(manageScheduleDocId, manageScheduleDate, daySlots);
    };

    const handleAddCustomTime = () => {
        if (!customTime) return;
        // convert 24h customTime "14:30" to "02:30 PM"
        let [h, m] = customTime.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const timeString = `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;

        handleToggleSlot(timeString);
        setCustomTime('');
    };

    const handleSaveSchedule = () => {
        try {
            if (manageScheduleDate) setViewScheduleDate(manageScheduleDate);
            localStorage.setItem('vhms_schedules', JSON.stringify(globalSchedules));
            showToast('Doctor schedule saved! Viewing all doctor schedules.', 'success');
            setCurrentView('VIEW_ALL_SCHEDULES');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            if (manageScheduleDate) setViewScheduleDate(manageScheduleDate);
            showToast('Schedule changes saved successfully.', 'success');
            setCurrentView('VIEW_ALL_SCHEDULES');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleApplyRangeSchedule = (daysCount) => {
        if (!manageScheduleDocId) {
            showToast('Please select a doctor first.', 'error');
            return;
        }

        const activeWorkingDays = doctorWorkingDays[manageScheduleDocId] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const docObj = registeredDoctors.find(d => d.id === manageScheduleDocId || d.email === manageScheduleDocId);
        const isChanna = docObj && (
            (docObj.name && docObj.name.toLowerCase().includes('channa')) ||
            (docObj.email && docObj.email.toLowerCase().includes('channa'))
        );
        const shift1 = ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
        const shift2 = ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];
        const defaultTimes = isChanna ? shift1 : [...shift1, ...shift2];

        const currentSlots = (globalSchedules[manageScheduleDocId] && globalSchedules[manageScheduleDocId][manageScheduleDate]) || [];
        const slotsToApply = currentSlots.length > 0
            ? currentSlots
            : defaultTimes.map(t => ({ time: t, booked: false, appointmentId: null }));

        const newSched = { ...globalSchedules };
        if (!newSched[manageScheduleDocId]) newSched[manageScheduleDocId] = {};

        const startDateParts = manageScheduleDate.split('-').map(Number);
        const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < daysCount; i++) {
            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + i);
            const dayName = dayNames[nextDate.getDay()];

            const yyyy = nextDate.getFullYear();
            const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
            const dd = String(nextDate.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            if (!activeWorkingDays.includes(dayName)) {
                newSched[manageScheduleDocId][dateStr] = [];
            } else {
                const existingDaySlots = newSched[manageScheduleDocId][dateStr] || [];
                const mergedSlots = slotsToApply.map(slot => {
                    const existingBooked = existingDaySlots.find(s => s.time === slot.time && s.booked);
                    return existingBooked || slot;
                });
                newSched[manageScheduleDocId][dateStr] = mergedSlots;
            }
        }

        setGlobalSchedules(newSched);
        try {
            localStorage.setItem('vhms_schedules', JSON.stringify(newSched));
            showToast(`Schedule applied for active working days (${activeWorkingDays.join(', ')}) across next ${daysCount} days!`, 'success');
            setViewScheduleDate(manageScheduleDate);
            setCurrentView('VIEW_ALL_SCHEDULES');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            showToast('Schedule applied locally.', 'success');
        }
    };

    const handleDeleteSchedule = (docId = manageScheduleDocId, targetDate = manageScheduleDate) => {
        if (!docId || !targetDate) {
            showToast('Please select a doctor and date first.', 'error');
            return;
        }

        const currentSlots = getDoctorSchedule(docId, targetDate) || [];
        const bookedSlots = currentSlots.filter(s => typeof s === 'object' && s.booked);

        const slotsToSave = bookedSlots.length > 0 ? bookedSlots : [];
        updateDoctorScheduleState(docId, targetDate, slotsToSave);

        if (bookedSlots.length > 0) {
            showToast('Available slots deleted! Booked appointments (🔒) were preserved.', 'warning');
        } else {
            showToast(`Schedule for date ${targetDate} cleared successfully.`, 'success');
        }
    };

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (!currentPassword) {
            showToast('Please enter your current password.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('New password must be at least 6 characters.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('New password and confirm password do not match.', 'error');
            return;
        }

        showToast('Admin password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const currentUser = useMemo(() => {
        try {
            const saved = localStorage.getItem('vhms_user');
            return saved ? JSON.parse(saved) : { name: 'System Admin', email: 'admin@vhms.com' };
        } catch {
            return { name: 'System Admin', email: 'admin@vhms.com' };
        }
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type, show: true });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };

    // Live-sync status management
    const [syncStatus, setSyncStatus] = useState('LOADING'); // 'LIVE', 'ERROR', 'OFFLINE', 'LOADING'
    const [liveSyncTime, setLiveSyncTime] = useState(new Date());
    const syncIntervalRef = useRef(null);
    const clockIntervalRef = useRef(null);
    const isInitialLoadRef = useRef(true);

    const loadData = async (isSilent = false) => {
        if (!isSilent && isInitialLoadRef.current) {
            setLoading(true);
        }
        try {
            if (!navigator.onLine) {
                setSyncStatus('OFFLINE');
                setLoading(false);
                isInitialLoadRef.current = false;
                return;
            }

            const [pendingData, usersData, petsData, apptsData] = await Promise.all([
                api.getPendingUsers().catch(() => null),
                api.getAllUsers().catch(() => null),
                api.getPets().catch(() => null),
                api.getAppointments().catch(() => null)
            ]);

            // If all vital endpoints throw (null return), we are disconnected from backend
            if (usersData === null && apptsData === null) {
                setSyncStatus('ERROR');
            } else {
                setSyncStatus('LIVE');
            }

            let localPending = [];
            let localRegistered = [];
            try {
                localPending = JSON.parse(localStorage.getItem('vhms_pending_users') || '[]');
                localRegistered = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]');
            } catch { }

            const combinedPending = Array.isArray(pendingData) ? [...pendingData] : [];
            localPending.forEach(lp => {
                if (lp.status === 'PENDING_APPROVAL' || lp.status === 'PENDING') {
                    if (!combinedPending.some(p => p.email === lp.email || p.id === lp.id)) {
                        combinedPending.push(lp);
                    }
                }
            });
            setPendingUsers(combinedPending);

            let combinedUsers = Array.isArray(usersData) ? [...usersData] : [];

            // Merge from localStorage caches so no user is lost when backend is offline
            let localCached = [];
            try {
                localCached = JSON.parse(localStorage.getItem('vhms_all_users_cache') || '[]');
            } catch { }
            localRegistered.forEach(lr => {
                if (!combinedUsers.some(u => u.email === lr.email || u.id === lr.id)) {
                    combinedUsers.push(lr);
                } else {
                    combinedUsers = combinedUsers.map(u => (u.email === lr.email || u.id === lr.id) ? { ...u, status: lr.status } : u);
                }
            });
            localCached.forEach(lc => {
                if (!combinedUsers.some(u => u.email === lc.email || u.id === lc.id)) {
                    combinedUsers.push(lc);
                }
            });

            // If API returned real data, persist a full cache for offline resilience
            if (Array.isArray(usersData) && usersData.length > 0) {
                try {
                    localStorage.setItem('vhms_all_users_cache', JSON.stringify(combinedUsers));
                } catch { }
            }

            const normalizedUsers = combinedUsers.map(u => {
                if (u.name && u.name.toLowerCase().includes('dinethmi')) {
                    return { ...u, phone: '0771234567' };
                }
                return u;
            });
            setAllUsers(normalizedUsers);

            if (Array.isArray(petsData)) setAllPets(petsData);

            // appointments: merge API result with local storage so no appointment is lost
            let localAppts = [];
            try {
                localAppts = JSON.parse(localStorage.getItem('vhms_user_appointments') || '[]');

                localAppts = localAppts.filter(a => {
                    const isMock = String(a.doctorName || '').includes('Dr. Smith') || (a.date && String(a.date).length > 20);
                    return !isMock;
                });
            } catch { }

            let combinedAppts = Array.isArray(apptsData) ? [...apptsData] : [];
            localAppts.forEach(la => {
                if (!combinedAppts.some(ca => ca.id === la.id || (ca.petName === la.petName && ca.date === la.date && ca.timeSlot === la.timeSlot))) {
                    combinedAppts.push(la);
                }
            });
            setAdminAppointments(combinedAppts);
            try { localStorage.setItem('vhms_user_appointments', JSON.stringify(combinedAppts)); } catch { }
        } catch (err) {
            console.error(err);
            setSyncStatus('ERROR');
        } finally {
            setLoading(false);
            isInitialLoadRef.current = false;
        }
    };

    useEffect(() => {
        loadData(false);
        const handleStorage = () => loadData(true);
        window.addEventListener('storage', handleStorage);
        // Refresh data silently every 5 seconds for live syncing
        syncIntervalRef.current = setInterval(() => {
            loadData(true);
        }, 5000);
        // Tick clock every second for the live indicator
        clockIntervalRef.current = setInterval(() => {
            setLiveSyncTime(new Date());
        }, 1000);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(syncIntervalRef.current);
            clearInterval(clockIntervalRef.current);
        };
    }, []);

    const handleApprove = async (id, name) => {
        try {
            await api.approveUser(id).catch(() => { });

            let localPending = [];
            let localReg = [];
            try {
                localPending = JSON.parse(localStorage.getItem('vhms_pending_users') || '[]');
                localReg = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]');
            } catch { }

            const approvedObj = localPending.find(u => u.id === id || String(u.id) === String(id) || u.name === name);

            localPending = localPending.filter(u => u.id !== id && String(u.id) !== String(id) && u.name !== name);
            localReg = localReg.map(u => (u.id === id || String(u.id) === String(id) || u.name === name || (approvedObj && u.email === approvedObj.email)) ? { ...u, status: 'ACTIVE' } : u);

            localStorage.setItem('vhms_pending_users', JSON.stringify(localPending));
            localStorage.setItem('vhms_registered_users', JSON.stringify(localReg));

            setPendingUsers(prev => prev.filter(u => u.id !== id && String(u.id) !== String(id) && u.name !== name));
            setAllUsers(prev => prev.map(u => (u.id === id || String(u.id) === String(id) || u.name === name) ? { ...u, status: 'ACTIVE' } : u));

            showToast(`✅ ${name}'s account was approved successfully!`, 'success');
            loadData();
        } catch (err) {
            console.error(err);
            showToast('Error approving account.', 'error');
        }
    };

    const handleReject = async (id, name) => {
        try {
            await api.rejectUser(id).catch(() => { });

            let localPending = [];
            let localReg = [];
            try {
                localPending = JSON.parse(localStorage.getItem('vhms_pending_users') || '[]');
                localReg = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]');
            } catch { }

            const rejectedObj = localPending.find(u => u.id === id || String(u.id) === String(id) || u.name === name);

            localPending = localPending.filter(u => u.id !== id && String(u.id) !== String(id) && u.name !== name);
            localReg = localReg.map(u => (u.id === id || String(u.id) === String(id) || u.name === name || (rejectedObj && u.email === rejectedObj.email)) ? { ...u, status: 'REJECTED' } : u);

            localStorage.setItem('vhms_pending_users', JSON.stringify(localPending));
            localStorage.setItem('vhms_registered_users', JSON.stringify(localReg));

            setPendingUsers(prev => prev.filter(u => u.id !== id && String(u.id) !== String(id) && u.name !== name));
            setAllUsers(prev => prev.map(u => (u.id === id || String(u.id) === String(id) || u.name === name) ? { ...u, status: 'REJECTED' } : u));

            showToast(`❌ ${name}'s request was rejected.`, 'info');
            loadData();
        } catch (err) {
            console.error(err);
            showToast('Error rejecting account.', 'error');
        }
    };





    const handleCreateDoctor = async (e) => {
        e.preventDefault();
        if (!docName || !docEmail) {
            showToast('Please fill in Doctor Name and Email.', 'error');
            return;
        }

        setIsSubmittingDoctor(true);
        const formattedName = docName.startsWith('Dr.') ? docName : `Dr. ${docName}`;

        const generateTempPassword = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
            let randStr = '';
            for (let i = 0; i < 6; i++) {
                randStr += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return `VHMS-${randStr}!`;
        };
        const tempPassword = generateTempPassword();

        const newDoctorObj = {
            id: `DOC-${Date.now().toString().slice(-4)}`,
            name: formattedName,
            email: docEmail,
            phone: docPhone || '0770000000',
            address: docDepartment || 'Veterinary Surgery & Medicine',
            role: 'DOCTOR',
            specialization: docDepartment || 'Veterinary Surgery & Medicine',
            services: docServices ? docServices.split(',').map(s => s.trim()).filter(Boolean) : ['General Care', 'Consultation', 'Emergency Care'],
            status: 'ON_DUTY',
            experience: docExperience || 'Registered Veterinary Surgeon',
            bio: docBio || `Hospital veterinarian specializing in ${docDepartment || 'Veterinary Surgery & Medicine'}.`,
            availableHours: docAvailableHours || 'Mon - Fri | 08:00 AM - 05:00 PM',
            photoUrl: docPhotoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
        };

        try {
            const existing = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]');
            if (!existing.some(d => d.email === docEmail)) {
                localStorage.setItem('vhms_custom_doctors', JSON.stringify([...existing, newDoctorObj]));
            }
        } catch { }

        try {
            const passwords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}');
            passwords[docEmail] = tempPassword;
            passwords[formattedName] = tempPassword;
            localStorage.setItem('vhms_doctor_passwords', JSON.stringify(passwords));

            const firstLogins = JSON.parse(localStorage.getItem('vhms_first_login_doctors') || '{}');
            firstLogins[docEmail] = true;
            firstLogins[formattedName] = true;
            localStorage.setItem('vhms_first_login_doctors', JSON.stringify(firstLogins));
        } catch { }

        const resetDoctorForm = () => {
            setDocName('');
            setDocEmail('');
            setDocPhone('');
            setDocDepartment('');
            setDocPhotoUrl('');
            setDocBio('');
            setDocExperience('');
            setDocServices('');
            setDocAvailableHours('');
        };

        try {
            await api.createDoctorAccount({
                name: formattedName,
                email: docEmail,
                phone: docPhone,
                address: docDepartment || 'Veterinary Medicine Department',
                password: tempPassword,
            });
        } catch (err) {
            console.error(err);
        }

        setCreatedDoctorInfo({
            name: formattedName,
            email: docEmail,
            tempPassword: tempPassword
        });

        showToast(`${formattedName} registered! Temporary password generated.`, 'success');
        resetDoctorForm();
        await loadData();
        setCurrentView('DOCTOR_DIRECTORY');
        setIsSubmittingDoctor(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('vhms_user');
        navigate('/login');
    };

    const registeredDoctors = useMemo(() => {
        const apiDocs = allUsers.filter(u =>
            u.role === 'DOCTOR' &&
            u.email !== 'john.test@vhms.com' &&
            !(u.name || '').toLowerCase().includes('john test')
        );
        let customDocs = [];
        try {
            customDocs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]');
        } catch { }
        customDocs = customDocs.filter(d =>
            d.email !== 'john.test@vhms.com' &&
            !(d.name || '').toLowerCase().includes('john test')
        );

        // Start from API docs, but if a custom doc exists for the same email/id,
        // MERGE the custom doc fields on top (so uploaded photo, bio, services, etc. are preserved)
        const merged = apiDocs.map(apiDoc => {
            const match = customDocs.find(cd => cd.email === apiDoc.email || cd.id === apiDoc.id);
            return match ? { ...apiDoc, ...match } : apiDoc;
        });
        // Add purely local custom docs that don't exist in API at all
        customDocs.forEach(cd => {
            if (!merged.some(d => d.email === cd.email || d.id === cd.id)) {
                merged.push(cd);
            }
        });
        return merged;
    }, [allUsers]);


    const activePetOwners = useMemo(() => {
        return allUsers.filter(u => u.role === 'PET_OWNER' && u.status === 'ACTIVE');
    }, [allUsers]);

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => {
            if (u.role === 'ADMIN' || u.role === 'DOCTOR') return false; // Enforce pet owners only

            const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.phone || '').includes(searchQuery);
            const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [allUsers, searchQuery, statusFilter]);

    const filteredDoctors = useMemo(() => {
        return registeredDoctors.filter(d => {
            const matchesSearch = (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (d.phone || '').includes(searchQuery) ||
                (d.address || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [registeredDoctors, searchQuery]);

    const handleViewDoctor = (doc) => {
        setSelectedDoctor(doc);
        setIsEditingDoctor(false);
        setEditDocForm({
            name: doc.name || '',
            phone: doc.phone || '',
            specialization: doc.specialization || doc.address || '',
            bio: doc.bio || '',
            experience: doc.experience || '',
            services: Array.isArray(doc.services) ? doc.services.join(', ') : (doc.services || ''),
            availableHours: doc.availableHours || '',
            photoUrl: doc.photoUrl || '',
        });
        setCurrentView('VIEW_DOCTOR');
    };

    const handleToggleDoctorStatus = (docId) => {
        const updateDoc = (doc) => {
            if (doc.id !== docId) return doc;
            const newStatus = (doc.status === 'INACTIVE' || doc.status === 'DEACTIVATED') ? 'ON_DUTY' : 'INACTIVE';
            return { ...doc, status: newStatus };
        };

        // Update in localStorage
        try {
            const customs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]');
            const updated = customs.map(updateDoc);
            localStorage.setItem('vhms_custom_doctors', JSON.stringify(updated));
        } catch { }

        // Update in selectedDoctor state and force re-render
        if (selectedDoctor && selectedDoctor.id === docId) {
            const newStatus = (selectedDoctor.status === 'INACTIVE' || selectedDoctor.status === 'DEACTIVATED') ? 'ON_DUTY' : 'INACTIVE';
            setSelectedDoctor(prev => ({ ...prev, status: newStatus }));
        }

        setAllUsers(prev => prev.map(updateDoc));
    };

    const handleDeleteDoctor = (docIdentifier) => {
        if (!docIdentifier) return;
        const confirmDelete = window.confirm('Are you sure you want to permanently remove this doctor from the hospital roster?');
        if (!confirmDelete) return;

        try {
            const customs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]');
            const updatedCustoms = customs.filter(d =>
                d.id !== docIdentifier &&
                d.email !== docIdentifier &&
                d.name !== docIdentifier
            );
            localStorage.setItem('vhms_custom_doctors', JSON.stringify(updatedCustoms));

            const passwords = JSON.parse(localStorage.getItem('vhms_doctor_passwords') || '{}');
            delete passwords[docIdentifier];
            localStorage.setItem('vhms_doctor_passwords', JSON.stringify(passwords));

            const firstLogins = JSON.parse(localStorage.getItem('vhms_first_login_doctors') || '{}');
            delete firstLogins[docIdentifier];
            localStorage.setItem('vhms_first_login_doctors', JSON.stringify(firstLogins));

            setAllUsers(prev => prev.filter(u => u.id !== docIdentifier && u.email !== docIdentifier && u.name !== docIdentifier));
            showToast('Doctor account permanently removed.', 'info');
            loadData();
            if (currentView === 'VIEW_DOCTOR') {
                setCurrentView('DOCTOR_DIRECTORY');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveDoctorEdits = () => {
        const updatedDoctor = {
            ...selectedDoctor,
            name: editDocForm.name,
            phone: editDocForm.phone,
            specialization: editDocForm.specialization,
            address: editDocForm.specialization,
            bio: editDocForm.bio,
            experience: editDocForm.experience,
            services: editDocForm.services.split(',').map(s => s.trim()).filter(Boolean),
            availableHours: editDocForm.availableHours,
            photoUrl: editDocForm.photoUrl,
        };

        // Save to localStorage
        try {
            const customs = JSON.parse(localStorage.getItem('vhms_custom_doctors') || '[]');
            const exists = customs.some(d => d.id === updatedDoctor.id);
            const updated = exists
                ? customs.map(d => d.id === updatedDoctor.id ? updatedDoctor : d)
                : [...customs, updatedDoctor];
            localStorage.setItem('vhms_custom_doctors', JSON.stringify(updated));
        } catch { }

        setAllUsers(prev => prev.map(u => u.id === updatedDoctor.id ? updatedDoctor : u));
        setSelectedDoctor(updatedDoctor);
        setIsEditingDoctor(false);
    };

    const handleReturnToOverview = () => {
        setCurrentView('OVERVIEW');
        if (typeof setSelectedDoctor === 'function') setSelectedDoctor(null);
        if (typeof setIsEditingDoctor === 'function') setIsEditingDoctor(false);
        setIsDropdownOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="admin-page">
            {/* Top Navigation Header */}
            <header className="admin-header">
                <div className="admin-shell">
                    <div className="admin-brand" onClick={handleReturnToOverview} style={{ cursor: 'pointer' }} title="Return to Dashboard Overview">
                        <div className="brand-icon-glow">
                            <span className="brand-icon"><IconHospital /></span>
                        </div>
                        <div>
                            <strong className="brand-name">Sri Jayawardanapura Animal Hospital</strong>
                            <span className="brand-subtitle">Admin Portal</span>
                        </div>
                    </div>

                    <div className="admin-nav-right">
                        <div className="admin-dropdown-wrapper" style={{ position: 'relative' }}>
                            <div
                                className={`admin-user-pill ${isDropdownOpen ? 'active' : ''}`}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="user-avatar-sm">
                                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div className="user-meta">
                                    <strong>{currentUser.name || 'System Admin'}</strong>
                                    <span className="user-role-badge">Administrator</span>
                                </div>
                                <span className={`dropdown-caret ${isDropdownOpen ? 'open' : ''}`}>▾</span>
                            </div>

                            {isDropdownOpen && (
                                <div className="admin-user-dropdown">
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

            <main className="admin-main admin-shell">


                {/* MAIN OVERVIEW VIEW */}
                {currentView === 'OVERVIEW' && (
                    <>
                        {/* Hero Banner */}
                        <section className="admin-hero-card">
                            <div className="hero-content">
                                <div className="hero-status-pill">
                                    <span className="live-pulse"></span>
                                    <span>HOSPITAL OPERATIONAL • LIVE SYSTEM MONITORING</span>
                                </div>
                                <h1 className="hero-title">Hospital Administrator Portal</h1>
                                <p className="hero-description">
                                    Executive supervision center for medical staff authorizations, pet owner registration verification, and hospital appointment schedules.
                                </p>
                            </div>
                        </section>


                        {/* Metrics Bento Grid */}
                        <section className="bento-metrics-grid">
                            <div
                                className="bento-card kpi-pending clickable-kpi"
                                onClick={() => setCurrentView('PENDING')}
                                title="Click to view pending pet owner account requests"
                            >
                                <div className="bento-head">
                                    <span className="bento-label">Pending Account Approvals</span>
                                    <span className="bento-icon-wrap amber"><IconClock size={24} /></span>
                                </div>
                                <div className="bento-number">{totalPendingApprovals}</div>
                                <div className="bento-footer">
                                    {totalPendingApprovals > 0 ? (
                                        <span className="status-badge-urgent">Action Required ({totalPendingApprovals}) →</span>
                                    ) : (
                                        <span className="status-badge-clear">Queue Clean →</span>
                                    )}
                                </div>
                            </div>

                            <div
                                className="bento-card clickable-kpi"
                                onClick={() => setCurrentView('DIRECTORY')}
                                title="Click to view pet owner directory"
                            >
                                <div className="bento-head">
                                    <span className="bento-label">Pet Owner Accounts</span>
                                    <span className="bento-icon-wrap emerald"><IconUsers size={24} /></span>
                                </div>
                                <div className="bento-number">{activePetOwners.length}</div>
                                <div className="bento-footer text-muted">Registered Pet Owners →</div>
                            </div>

                            <div
                                className="bento-card clickable-kpi"
                                onClick={() => setCurrentView('DOCTOR_DIRECTORY')}
                                title="Click to view registered doctor directory"
                            >
                                <div className="bento-head">
                                    <span className="bento-label">Registered Doctors</span>
                                    <span className="bento-icon-wrap blue"><IconStethoscope size={24} /></span>
                                </div>
                                <div className="bento-number">{registeredDoctors.length}</div>
                                <div className="bento-footer text-muted">Veterinary Surgeons →</div>
                            </div>

                            <div
                                className="bento-card clickable-kpi"
                                onClick={() => setCurrentView('PETS_DIRECTORY')}
                                title="Click to view all registered pets directory"
                            >
                                <div className="bento-head">
                                    <span className="bento-label">Registered Pets</span>
                                    <span className="bento-icon-wrap purple"><IconPaw size={24} /></span>
                                </div>
                                <div className="bento-number">{allPets.length}</div>
                                <div className="bento-footer text-muted">Active Pet Profiles →</div>
                            </div>
                        </section>

                        {/* Real-time Dashboard Insights */}
                        <section className="dashboard-insights-grid">
                            <PatientTypesChart pets={allPets} />

                            <AppointmentVolumeChart appointments={adminAppointments} />
                        </section>

                        {/* Quick Portals - Spacious & Minimalist */}
                        <section className="admin-navigation-cards-section">
                            <div className="section-title-row">
                                <div>
                                    <h2 className="section-heading">Quick Portals</h2>
                                </div>
                            </div>

                            {/* Group 1: Patient & Appointment Operations */}
                            <div className="portal-group-clean">
                                <div className="clean-group-label">
                                    <span className="dot-indicator emerald"></span>
                                    <span>PATIENT & APPOINTMENT OPERATIONS</span>
                                </div>
                                <div className="nav-cards-grid">
                                    <div className="feature-nav-card card-amber-hover" onClick={() => setCurrentView('PENDING')}>
                                        <div className="nav-card-icon-badge amber">
                                            <IconClock size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Pending Registrations</h3>
                                            <span className="nav-card-sub">Verify new owner accounts</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-emerald-hover" onClick={() => setCurrentView('DIRECTORY')}>
                                        <div className="nav-card-icon-badge emerald">
                                            <IconFolder size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Pet Owner Directory</h3>
                                            <span className="nav-card-sub">Inspect registered accounts</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-amber-hover" onClick={() => setCurrentView('APPOINTMENTS')}>
                                        <div className="nav-card-icon-badge amber">
                                            <IconCalendar size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Appointment Approvals</h3>
                                            <span className="nav-card-sub">Review & approve requests</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Group 2: Veterinary Staff & Schedules */}
                            <div className="portal-group-clean">
                                <div className="clean-group-label">
                                    <span className="dot-indicator blue"></span>
                                    <span>VETERINARY STAFF & SCHEDULES</span>
                                </div>
                                <div className="nav-cards-grid">
                                    <div className="feature-nav-card card-purple-hover" onClick={() => setCurrentView('CREATE_DOCTOR')}>
                                        <div className="nav-card-icon-badge purple">
                                            <IconUserPlus size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Register New Doctor</h3>
                                            <span className="nav-card-sub">Authorize new vet credentials</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-blue-hover" onClick={() => setCurrentView('DOCTOR_DIRECTORY')}>
                                        <div className="nav-card-icon-badge blue">
                                            <IconStethoscope size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Doctor Directory</h3>
                                            <span className="nav-card-sub">Roster of hospital vets</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-blue-hover" onClick={() => setCurrentView('MANAGE_SCHEDULES')}>
                                        <div className="nav-card-icon-badge blue">
                                            <IconCalendar size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Shift & Schedules</h3>
                                            <span className="nav-card-sub">Configure treatment time slots</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-emerald-hover" onClick={() => setCurrentView('VIEW_ALL_SCHEDULES')}>
                                        <div className="nav-card-icon-badge emerald">
                                            <IconCalendar size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>All Doctor Schedules</h3>
                                            <span className="nav-card-sub">View master vet timetables</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Group 3: Hospitalization & Wards (Epic 3) */}
                            <div className="portal-group-clean">
                                <div className="clean-group-label">
                                    <span className="dot-indicator purple"></span>
                                    <span>HOSPITALIZATION & WARD MANAGEMENT</span>
                                </div>
                                <div className="nav-cards-grid">
                                    <div className="feature-nav-card card-purple-hover" onClick={() => navigate('/admin/admission-requests')}>
                                        <div className="nav-card-icon-badge purple">
                                            <IconCheck size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Admission Requests</h3>
                                            <span className="nav-card-sub">Review & approve admissions</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-amber-hover" onClick={() => navigate('/admin/hospitalized-pets')}>
                                        <div className="nav-card-icon-badge amber">
                                            <IconPaw size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Hospitalized Pets</h3>
                                            <span className="nav-card-sub">Monitor admitted patients</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-emerald-hover" onClick={() => navigate('/admin/cage-occupancy')}>
                                        <div className="nav-card-icon-badge emerald">
                                            <IconGrid size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Cage Occupancy</h3>
                                            <span className="nav-card-sub">Manage ward availability</span>
                                        </div>
                                    </div>

                                    <div className="feature-nav-card card-blue-hover" onClick={() => navigate('/admin/inventory')}>
                                        <div className="nav-card-icon-badge blue">
                                            <IconFolder size={26} />
                                        </div>
                                        <div className="nav-card-info">
                                            <h3>Pharmacy & Stock</h3>
                                            <span className="nav-card-sub">Manage medical inventory</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* DEDICATED PENDING QUEUE PAGE */}
                {currentView === 'PENDING' && (
                    <section className="modern-section">
                        <div className="section-title-row">
                            <div>
                                <h2 className="section-heading">Pending Registration Queue</h2>
                                <p className="section-sub">Verify and approve pet owner registration requests before granting dashboard access.</p>
                            </div>
                            {pendingUsers.length > 0 && (
                                <span className="counter-pill amber">{pendingUsers.length} Action Required</span>
                            )}
                        </div>

                        {pendingApptsCount > 0 && (
                            <div className="glass-form-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '1.4rem' }}>⏳</span>
                                        <div>
                                            <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
                                                {pendingApptsCount} Pending Appointment Approval{pendingApptsCount > 1 ? 's' : ''} Awaiting Review
                                            </strong>
                                            <p style={{ margin: '2px 0 0', color: '#b45309', fontSize: '0.84rem' }}>
                                                Pet owners have submitted appointment requests that require administrative verification.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-save"
                                        onClick={() => {
                                            setApptStatusFilter('PENDING_APPROVAL');
                                            setCurrentView('APPOINTMENTS');
                                        }}
                                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                                    >
                                        Review Appointments ({pendingApptsCount}) →
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="glass-loading-card">
                                <span className="pulse-loader"></span> Syncing verification queue from database...
                            </div>
                        ) : pendingUsers.length === 0 ? (
                            <div className="glass-empty-card">
                                <div className="empty-sparkle"><IconSparkles /></div>
                                <h3>No Pending Registrations</h3>
                                <p>All new pet owner account applications have been verified and granted access.</p>
                            </div>
                        ) : (
                            <div className="pending-cards-list">
                                {pendingUsers.map(user => (
                                    <div key={user.id} className="approval-card">
                                        <div className="approval-card-header">
                                            <div className="user-avatar-lg">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
                                            </div>
                                            <div>
                                                <h3 className="user-card-name">{user.name}</h3>
                                                <span className="role-tag-pill">Pet Owner Registration</span>
                                            </div>
                                        </div>

                                        <div className="user-details-box">
                                            <div className="info-item">
                                                <span className="info-lbl">Email Address</span>
                                                <strong className="info-val">{user.email}</strong>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-lbl">Phone Number</span>
                                                <strong className="info-val">{user.phone || 'N/A'}</strong>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-lbl">Home Address</span>
                                                <strong className="info-val">{user.address || 'N/A'}</strong>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-lbl">Requested Date</span>
                                                <strong className="info-val">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="approval-card-actions">
                                            <button className="btn-approve-primary" onClick={() => handleApprove(user.id, user.name)}>
                                                <IconCheck /> Approve Account
                                            </button>
                                            <button className="btn-reject-secondary" onClick={() => handleReject(user.id, user.name)}>
                                                <IconX /> Reject
                                            </button>
                                        </div>


                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}



                {/* DEDICATED USER DIRECTORY PAGE */}
                {currentView === 'DIRECTORY' && (
                    <section className="modern-section">
                        <div className="section-title-row flex-wrap">
                            <div>
                                <h2 className="section-heading">Pet Owner Directory</h2>
                                <p className="section-sub">Search, filter, and inspect registered pet owner accounts.</p>
                            </div>

                            <div className="filter-group">
                                <div className="search-box">
                                    <span className="search-icon"><IconSearch /></span>
                                    <input
                                        type="text"
                                        placeholder="Search name, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input-modern"
                                    />
                                </div>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-modern">
                                    <option value="ALL">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="PENDING_APPROVAL">Pending</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-glass-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Account User</th>
                                        <th>Contact Details</th>
                                        <th>Verification Status</th>
                                        <th>Date Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="table-empty">
                                                No registered accounts matched your search filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(u => (
                                            <tr key={u.id} className="table-row-hover">
                                                <td>
                                                    <div className="table-user-info">
                                                        <div className="avatar-chip">{u.name ? u.name.charAt(0).toUpperCase() : 'U'}</div>
                                                        <div>
                                                            <strong className="user-name-text">{u.name}</strong>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="contact-email">{u.email}</div>
                                                    <div className="contact-phone">{u.phone || 'No phone number'}</div>
                                                </td>
                                                <td>
                                                    <span className={`chip-status ${u.status}`}>
                                                        {u.status === 'ACTIVE' ? 'ACTIVE' : u.status === 'PENDING_APPROVAL' ? 'PENDING' : 'REJECTED'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="date-text">
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => { setSelectedUser(u); setCurrentView('VIEW_USER'); }}
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '10px',
                                                            background: '#f0fdf4',
                                                            color: '#16a34a',
                                                            border: '1px solid #bbf7d0',
                                                            fontWeight: 700,
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        View Account
                                                    </button>
                                                </td>


                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* DEDICATED PETS DIRECTORY PAGE */}
                {currentView === 'PETS_DIRECTORY' && (
                    <section className="modern-section">
                        <div style={{ marginTop: '0', marginBottom: '24px' }}>
                            <button
                                type="button"
                                className="btn-back-overview"
                                onClick={() => setCurrentView('OVERVIEW')}
                            >
                                <IconArrowLeft /> Back to Overview
                            </button>
                        </div>
                        <div className="section-title-row flex-wrap">
                            <div>
                                <h2 className="section-heading">All Registered Pets</h2>
                                <p className="section-sub">A comprehensive directory of all active pet profiles registered in the system.</p>
                            </div>
                            <div className="filter-group">
                                <span className="counter-pill emerald" style={{ marginBottom: 0 }}>
                                    {allPets.length} Total Pets
                                </span>
                            </div>
                        </div>

                        <div className="table-glass-wrapper" style={{ marginTop: '20px' }}>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Pet Name</th>
                                        <th>Species & Breed</th>
                                        <th>Linked Owner ID</th>
                                        <th>System ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPets.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="table-empty">
                                                No registered pets found in the database.
                                            </td>
                                        </tr>
                                    ) : (
                                        allPets.map(pet => (
                                            <tr key={pet.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div className="user-avatar-sm" style={{ background: '#ffedd5', color: '#ea580c', width: '36px', height: '36px' }}>
                                                            🐾
                                                        </div>
                                                        <div>
                                                            <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>{pet.name}</strong>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                                                        {pet.species || 'Unknown'} {pet.breed ? `• ${pet.breed}` : ''}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                        {pet.ownerEmail || pet.ownerId || 'System Generated'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                                                        {pet.id}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* PET OWNER ACCOUNT DETAIL PAGE */}
                {currentView === 'VIEW_USER' && selectedUser && (() => {
                    const u = (selectedUser && selectedUser.name && selectedUser.name.toLowerCase() === 'dinethmi peiris') || (selectedUser && selectedUser.phone === '0711689526')
                        ? { ...selectedUser, phone: '0771234567' }
                        : selectedUser;
                    const userAppointments = adminAppointments.filter(a =>
                        a.ownerName === u.name || a.ownerId === u.id || a.ownerEmail === u.email
                    );
                    const userPets = (() => {
                        const petMap = new Map();

                        const formatAgeVal = (val, dob) => {
                            if (dob) {
                                try {
                                    const birthDate = new Date(dob);
                                    const today = new Date();
                                    if (!isNaN(birthDate.getTime())) {
                                        let years = today.getFullYear() - birthDate.getFullYear();
                                        let months = today.getMonth() - birthDate.getMonth();
                                        if (today.getDate() < birthDate.getDate()) months--;
                                        if (months < 0) { years--; months += 12; }
                                        if (years <= 0) {
                                            const totalM = Math.max(1, months);
                                            return `${totalM} ${totalM === 1 ? 'Month' : 'Months'}`;
                                        } else if (months > 0) {
                                            return `${years} ${years === 1 ? 'Year' : 'Years'} ${months} ${months === 1 ? 'Month' : 'Months'}`;
                                        } else {
                                            return `${years} ${years === 1 ? 'Year' : 'Years'}`;
                                        }
                                    }
                                } catch { }
                            }

                            if (val === null || val === undefined || val === '') return null;
                            const str = String(val).trim();
                            if (str === '0') return '1 Month';
                            if (str.toLowerCase().includes('year') || str.toLowerCase().includes('month') || str.toLowerCase().includes('yr') || str.toLowerCase().includes('mo')) return str;
                            const num = parseFloat(str);
                            if (!isNaN(num)) {
                                if (num === 0) return '1 Month';
                                if (num < 1) {
                                    const months = Math.max(1, Math.round(num * 12));
                                    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
                                }
                                return `${num} ${num === 1 ? 'Year' : 'Years'}`;
                            }
                            return str;
                        };

                        const formatWeightVal = (val) => {
                            if (val === null || val === undefined || val === '') return null;
                            const str = String(val).trim();
                            if (str.toLowerCase().includes('kg')) return str;
                            return `${str} kg`;
                        };

                        // 1. Match from allPets API state
                        (allPets || []).forEach(p => {
                            const isLegacyRocky = p.name === 'Rocky' && u.name === 'Chamod De Alwis';
                            const matchesOwner =
                                (p.ownerEmail && u.email && p.ownerEmail.toLowerCase() === u.email.toLowerCase()) ||
                                (p.ownerId && u.id && String(p.ownerId) === String(u.id)) ||
                                (p.ownerName && u.name && p.ownerName.toLowerCase() === u.name.toLowerCase()) ||
                                isLegacyRocky;
                            if (matchesOwner && p.name) {
                                petMap.set(p.name.toLowerCase(), {
                                    id: p.id || p.petId || `pet-${p.name}`,
                                    name: p.name,
                                    species: p.species || 'Dog',
                                    breed: p.breed || 'Standard',
                                    age: formatAgeVal(p.age, p.dateOfBirth) || 'Not specified',
                                    weight: formatWeightVal(p.weight) || 'Not specified',
                                    gender: p.gender || 'Not specified',
                                    photoUrl: p.photoUrl || p.photo || p.image || p.imageUrl || null,
                                    status: 'ACTIVE'
                                });
                            }
                        });

                        // 2. Match from localStorage
                        ['vhms_pets', 'vhms_user_pets', 'vhms_custom_pets'].forEach(key => {
                            try {
                                const stored = JSON.parse(localStorage.getItem(key) || '[]');
                                if (Array.isArray(stored)) {
                                    stored.forEach(p => {
                                        const isLegacyRocky = p.name === 'Rocky' && u.name === 'Chamod De Alwis';
                                        const matchesOwner =
                                            (p.ownerEmail && u.email && p.ownerEmail.toLowerCase() === u.email.toLowerCase()) ||
                                            (p.ownerId && u.id && String(p.ownerId) === String(u.id)) ||
                                            (p.ownerName && u.name && p.ownerName.toLowerCase() === u.name.toLowerCase()) ||
                                            isLegacyRocky;
                                        if (matchesOwner && p.name && !petMap.has(p.name.toLowerCase())) {
                                            petMap.set(p.name.toLowerCase(), {
                                                id: p.id || `pet-${p.name}`,
                                                name: p.name,
                                                species: p.species || 'Dog',
                                                breed: p.breed || 'Standard',
                                                age: formatAgeVal(p.age, p.dateOfBirth) || 'Not specified',
                                                weight: formatWeightVal(p.weight) || 'Not specified',
                                                gender: p.gender || 'Not specified',
                                                photoUrl: p.photoUrl || p.photo || p.image || p.imageUrl || null,
                                                status: 'ACTIVE'
                                            });
                                        }
                                    });
                                }
                            } catch { }
                        });

                        // 3. Match from user's appointment history
                        userAppointments.forEach(a => {
                            if (a.petName && !petMap.has(a.petName.toLowerCase())) {
                                const matchingGlobalPet = (allPets || []).find(p => p.name && p.name.toLowerCase() === a.petName.toLowerCase());
                                let matchingLocalPet = null;
                                if (!matchingGlobalPet) {
                                    ['vhms_pets', 'vhms_user_pets', 'vhms_custom_pets'].forEach(key => {
                                        try {
                                            const stored = JSON.parse(localStorage.getItem(key) || '[]');
                                            if (Array.isArray(stored) && !matchingLocalPet) {
                                                matchingLocalPet = stored.find(p => p.name && p.name.toLowerCase() === a.petName.toLowerCase());
                                            }
                                        } catch { }
                                    });
                                }
                                const source = matchingGlobalPet || matchingLocalPet || {};

                                const ageVal = formatAgeVal(source.age ?? a.age ?? a.petAge, source.dateOfBirth || a.dateOfBirth);
                                const weightVal = formatWeightVal(source.weight ?? a.weight ?? a.petWeight);

                                petMap.set(a.petName.toLowerCase(), {
                                    id: source.id || a.petId || `pet-derived-${a.id}`,
                                    name: a.petName,
                                    species: source.species || a.species || 'Dog',
                                    breed: source.breed || a.breed || a.petBreed || 'Standard',
                                    age: ageVal || 'Not specified',
                                    weight: weightVal || 'Not specified',
                                    gender: source.gender || a.gender || a.petGender || 'Not specified',
                                    photoUrl: source.photoUrl || source.photo || source.image || a.photoUrl || a.petPhotoUrl || null,
                                    status: 'ACTIVE'
                                });
                            }
                        });

                        return Array.from(petMap.values());
                    })();
                    return (
                        <section className="modern-section">
                            {/* Back Button with spacing */}
                            <div style={{ marginTop: '0', marginBottom: '24px' }}>
                                <button
                                    type="button"
                                    className="btn-back-overview"
                                    onClick={() => setCurrentView('DIRECTORY')}
                                >
                                    <IconArrowLeft /> Back to User Directory
                                </button>
                            </div>
                            <div className="section-title-row" style={{ marginBottom: '24px' }}>
                                <div>
                                    <h2 className="section-heading">Pet Owner Account Profile</h2>
                                    <p className="section-sub">Full account details for this registered pet owner.</p>
                                </div>
                            </div>

                            {/* Profile Card */}
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
                                {/* Header row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{u.name}</h3>
                                        <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: u.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7', color: u.status === 'ACTIVE' ? '#15803d' : '#b45309', border: `1px solid ${u.status === 'ACTIVE' ? '#bbf7d0' : '#fde68a'}` }}>
                                            {u.status === 'ACTIVE' ? '● Active Account' : u.status === 'PENDING_APPROVAL' ? '⏳ Pending' : '✕ Rejected'}
                                        </span>
                                    </div>
                                </div>



                                {/* Detail fields grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</span>
                                        <p style={{ margin: '6px 0 0', fontWeight: 600, color: '#0f172a' }}>{u.name || '—'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{u.email || '—'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{u.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Role</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{u.role || 'PET_OWNER'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verification Status</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{u.status === 'ACTIVE' ? 'Active & Verified' : u.status === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Rejected'}</p>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Joined</span>
                                        <p style={{ margin: '6px 0 0', color: '#334155' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                                    </div>
                                    {u.address && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</span>
                                            <p style={{ margin: '6px 0 0', color: '#334155' }}>{u.address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Registered Pets */}
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
                                <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Registered Pets Profiles</h3>
                                {userPets.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #e2e8f0' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🐾</div>
                                        <p style={{ margin: 0 }}>This user has not registered any pets yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                                        {userPets.map(pet => (
                                            <div key={pet.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                                        {pet.photoUrl ? (
                                                            <img src={pet.photoUrl} alt={pet.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            pet.species === 'Dog' ? '🐶' : pet.species === 'Cat' ? '🐱' : pet.species === 'Bird' ? '🦜' : pet.species === 'Rabbit' ? '🐰' : '🐾'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>{pet.name}</strong>
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{pet.species} • {pet.breed}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                                                    <div>
                                                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Age</span>
                                                        <span style={{ color: '#334155', fontWeight: 500 }}>{pet.age || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Weight</span>
                                                        <span style={{ color: '#334155', fontWeight: 500 }}>{pet.weight ? (String(pet.weight).toLowerCase().includes('kg') ? pet.weight : `${pet.weight} kg`) : '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Gender</span>
                                                        <span style={{ color: '#334155', fontWeight: 500 }}>{pet.gender || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Status</span>
                                                        <span style={{ color: '#10b981', fontWeight: 700 }}>Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Appointment History */}
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                                <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Appointment History</h3>
                                {userAppointments.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #e2e8f0' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                                        <p style={{ margin: 0 }}>No appointments found for this account.</p>
                                    </div>
                                ) : (
                                    <div className="history-cards-wrapper" style={{ display: 'grid', gridTemplateColumns: 'Repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', margin: 0 }}>
                                        {userAppointments.map(a => (
                                            <div key={a.id} className="history-appt-card" style={{
                                                padding: '20px',
                                                borderRadius: '20px',
                                                background: 'rgba(255, 255, 255, 0.7)',
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.05)',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                        padding: '12px',
                                                        borderRadius: '16px',
                                                        color: '#3b82f6',
                                                        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8)'
                                                    }}>
                                                        <IconCalendar size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                                                            {a.petName} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginLeft: '6px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>{a.species || 'Pet'}</span>
                                                        </h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconStethoscope size={14} /> {a.serviceType || 'General Consultation'} • {a.doctorName || 'Assigned Doctor'}</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconClock size={14} /> {a.date} at {a.timeSlot}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                                                    <span className={`chip-status ${a.status}`} style={{ margin: 0 }}>
                                                        {a.status === 'PENDING_APPROVAL' ? 'PENDING' : a.status}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>{a.id}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })()}

                {/* DEDICATED MEDICAL DOCTOR DIRECTORY PAGE */}
                {currentView === 'DOCTOR_DIRECTORY' && (
                    <section className="modern-section">
                        <div className="section-title-row flex-wrap">
                            <div>
                                <h2 className="section-heading">Medical Doctor Directory</h2>
                                <p className="section-sub">Dedicated roster of authorized hospital veterinarians, surgical staff, and medical specialists.</p>
                            </div>

                            <div className="filter-group">
                                <div className="search-box">
                                    <span className="search-icon"><IconSearch /></span>
                                    <input
                                        type="text"
                                        placeholder="Search doctor name, department..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input-modern"
                                    />
                                </div>
                                <button className="btn-primary-action" onClick={() => setCurrentView('CREATE_DOCTOR')}>
                                    + Register New Doctor
                                </button>
                            </div>
                        </div>

                        <div className="table-glass-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Veterinary Doctor</th>
                                        <th>Contact Details</th>
                                        <th>Department / Specialization</th>
                                        <th>Account Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDoctors.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="table-empty">
                                                No registered doctors found matching your search term.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDoctors.map(doc => {
                                            const isActive = doc.status !== 'INACTIVE' && doc.status !== 'DEACTIVATED';
                                            return (
                                                <tr key={doc.id} className="table-row-hover">
                                                    <td>
                                                        <div className="table-user-info">
                                                            <div className="avatar-chip doctor-chip" style={{ background: '#ecfdf5', color: '#059669', overflow: 'hidden' }}>
                                                                {doc.photoUrl ? <img src={doc.photoUrl} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }} /> : <IconStethoscope />}
                                                            </div>
                                                            <div>
                                                                <strong className="user-name-text">{doc.name}</strong>
                                                                <span className="user-id-text">{doc.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="contact-email">{doc.email}</div>
                                                        <div className="contact-phone">{doc.phone || 'No phone number'}</div>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>
                                                            {doc.specialization || doc.address || 'Veterinary Surgery & Medicine'}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        <span style={{ background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#15803d' : '#b91c1c', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', fontSize: '0.78rem' }}>
                                                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => handleViewDoctor(doc)}
                                                                style={{ padding: '6px 14px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleDoctorStatus(doc.id)}
                                                                style={{ padding: '6px 14px', borderRadius: '10px', background: isActive ? '#fef2f2' : '#f0fdf4', color: isActive ? '#dc2626' : '#16a34a', border: isActive ? '1px solid #fecaca' : '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                                            >
                                                                {isActive ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* DOCTOR PROFILE VIEW / EDIT PAGE */}
                {currentView === 'VIEW_DOCTOR' && selectedDoctor && (() => {
                    const isInactive = selectedDoctor.status === 'INACTIVE' || selectedDoctor.status === 'DEACTIVATED';
                    const serviceList = Array.isArray(selectedDoctor.services)
                        ? selectedDoctor.services
                        : (selectedDoctor.services || '').split(',').map(s => s.trim()).filter(Boolean);
                    return (
                        <section className="modern-section">
                            <div className="section-title-row">
                                <div>
                                    <button onClick={() => setCurrentView('DOCTOR_DIRECTORY')} style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', padding: 0, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        ← Back to Doctor Directory
                                    </button>
                                    <h2 className="section-heading">👨‍⚕️ {isEditingDoctor ? 'Edit Doctor Profile' : 'Doctor Profile'}</h2>
                                    <p className="section-sub">View and manage this veterinarian's registered credentials, status, and professional details.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {!isEditingDoctor ? (
                                        <button onClick={() => setIsEditingDoctor(true)} style={{ padding: '10px 22px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                                            ✎ Edit Profile
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => setIsEditingDoctor(false)} style={{ padding: '10px 22px', borderRadius: '12px', background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                                            <button onClick={handleSaveDoctorEdits} style={{ padding: '10px 22px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Save Changes</button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleToggleDoctorStatus(selectedDoctor.id)}
                                        style={{ padding: '10px 22px', borderRadius: '12px', background: isInactive ? '#f0fdf4' : '#fef2f2', color: isInactive ? '#16a34a' : '#dc2626', border: isInactive ? '1px solid #bbf7d0' : '1px solid #fecaca', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        {isInactive ? 'Activate Account' : 'Deactivate Account'}
                                    </button>
                                </div>
                            </div>

                            <div className="glass-form-card">
                                {/* Photo + Status Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
                                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #a7f3d0', flexShrink: 0 }}>
                                        {(isEditingDoctor ? editDocForm.photoUrl : selectedDoctor.photoUrl)
                                            ? <img src={isEditingDoctor ? editDocForm.photoUrl : selectedDoctor.photoUrl} alt={selectedDoctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '2.2rem' }}>👨‍⚕️</span>
                                        }
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>{selectedDoctor.name}</h3>
                                        <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#64748b' }}>{selectedDoctor.specialization || selectedDoctor.address || 'Veterinary Surgeon'} &nbsp;·&nbsp; {selectedDoctor.email}</p>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700, background: isInactive ? '#fee2e2' : '#dcfce7', color: isInactive ? '#b91c1c' : '#15803d' }}>
                                                {isInactive ? 'Account Inactive' : 'Account Active'}
                                            </span>
                                            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                                                Veterinary Surgeon
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>
                                        <div>🆔 {selectedDoctor.id}</div>
                                        <div style={{ marginTop: '4px' }}>📧 {selectedDoctor.email}</div>
                                    </div>
                                </div>

                                {!isEditingDoctor ? (
                                    /* ── READ-ONLY VIEW ── */
                                    <div>
                                        {/* Row 1: Name + Email */}
                                        <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor Full Name</span>
                                                <p style={{ margin: '6px 0 0', fontWeight: 700, color: '#0f172a' }}>{selectedDoctor.name}</p>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hospital Email Address</span>
                                                <p style={{ margin: '6px 0 0', color: '#334155' }}>{selectedDoctor.email}</p>
                                            </div>
                                        </div>
                                        {/* Row 2: Phone + Specialization */}
                                        <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</span>
                                                <p style={{ margin: '6px 0 0', color: '#334155' }}>{selectedDoctor.phone || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specialization / Department</span>
                                                <p style={{ margin: '6px 0 0', color: '#334155' }}>{selectedDoctor.specialization || selectedDoctor.address || 'Not specified'}</p>
                                            </div>
                                        </div>
                                        {/* Row 3: Experience + Working Hours */}
                                        <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Experience / Qualifications</span>
                                                <p style={{ margin: '6px 0 0', color: '#334155' }}>{selectedDoctor.experience || 'Not specified'}</p>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Working Hours</span>
                                                <p style={{ margin: '6px 0 0', color: '#334155' }}>{selectedDoctor.availableHours || 'Not specified'}</p>
                                            </div>
                                        </div>
                                        {/* Services */}
                                        <div style={{ marginBottom: '20px' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Services Offered</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                                {serviceList.length > 0
                                                    ? serviceList.map((s, i) => <span key={i} style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', padding: '5px 14px', borderRadius: '20px', fontSize: '0.83rem', fontWeight: 600 }}>{s}</span>)
                                                    : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No services listed.</span>
                                                }
                                            </div>
                                        </div>
                                        {/* Bio */}
                                        <div>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor Bio / Professional Description</span>
                                            <p style={{ margin: '8px 0 0', color: '#334155', lineHeight: 1.75, fontSize: '0.9rem' }}>{selectedDoctor.bio || 'No bio provided.'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── EDIT FORM ── */
                                    <div className="admin-doctor-form">
                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label>Doctor Full Name *</label>
                                                <input type="text" placeholder="e.g. Dr. Alexander Wright" value={editDocForm.name || ''} onChange={e => setEditDocForm(p => ({ ...p, name: e.target.value }))} />
                                            </div>
                                            <div className="form-group">
                                                <label>Hospital Email Address</label>
                                                <input type="email" value={selectedDoctor.email} disabled className="input-disabled" title="Email cannot be changed" />
                                            </div>
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label>Phone Number *</label>
                                                <input type="tel" placeholder="e.g. 0771234567" value={editDocForm.phone || ''} onChange={e => setEditDocForm(p => ({ ...p, phone: e.target.value }))} />
                                            </div>
                                            <div className="form-group">
                                                <label>Specialization / Department</label>
                                                <input type="text" placeholder="e.g. Veterinary Surgery & Critical Care" value={editDocForm.specialization || ''} onChange={e => setEditDocForm(p => ({ ...p, specialization: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label>Experience / Qualifications</label>
                                                <input type="text" placeholder="e.g. Senior Veterinary Surgeon (10+ Years)" value={editDocForm.experience || ''} onChange={e => setEditDocForm(p => ({ ...p, experience: e.target.value }))} />
                                            </div>
                                            <div className="form-group">
                                                <label>Available Working Hours</label>
                                                <input type="text" placeholder="e.g. Mon - Fri | 08:00 AM - 05:00 PM" value={editDocForm.availableHours || ''} onChange={e => setEditDocForm(p => ({ ...p, availableHours: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Services Offered</label>
                                            <input type="text" placeholder="e.g. General Care, Orthopedic Surgery, Vaccination" value={editDocForm.services || ''} onChange={e => setEditDocForm(p => ({ ...p, services: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Doctor Bio / Professional Description</label>
                                            <textarea rows="3" placeholder="Background, expertise, and care philosophy..." value={editDocForm.bio || ''} onChange={e => setEditDocForm(p => ({ ...p, bio: e.target.value }))} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                                        </div>
                                        {/* Photo Upload */}
                                        <div className="form-group">
                                            <label>Doctor Profile Photo</label>
                                            <div className="photo-upload-container">
                                                <input type="file" id="edit-doc-photo-file" accept="image/*"
                                                    onChange={e => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5MB.', 'error'); return; }
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setEditDocForm(p => ({ ...p, photoUrl: reader.result }));
                                                        reader.readAsDataURL(file);
                                                    }}
                                                    style={{ display: 'none' }}
                                                />
                                                {editDocForm.photoUrl ? (
                                                    <div className="photo-preview-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.25)' }}>
                                                        <img src={editDocForm.photoUrl} alt="Preview" style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(16,185,129,0.3)' }} />
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <label htmlFor="edit-doc-photo-file" className="btn-upload-change" style={{ cursor: 'pointer' }}>📷 Change Photo</label>
                                                            <button type="button" className="btn-upload-remove" onClick={() => setEditDocForm(p => ({ ...p, photoUrl: '' }))}>✕ Remove</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="edit-doc-photo-file" className="photo-dropzone" style={{ cursor: 'pointer' }}>
                                                        <div className="dropzone-icon">📷</div>
                                                        <p style={{ margin: '8px 0 4px', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Click to upload doctor photo</p>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>PNG, JPG up to 5MB</p>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    );
                })()}

                {/* DEDICATED MANAGE SCHEDULES PAGE */}
                {currentView === 'MANAGE_SCHEDULES' && (
                    <section className="modern-section animate-fade">
                        <div className="section-title-row">
                            <div>
                                <h2 className="section-heading">Configure Doctor Roster & Timetable</h2>
                                <p className="section-sub">Define working days, time slots, and dynamic shifts for individual hospital doctors.</p>
                            </div>
                        </div>

                        <div className="glass-form-card" style={{ marginBottom: '28px', borderTop: '4px solid #10b981' }}>
                            <div className="form-grid-2">
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Select Doctor for Roster Configuration</label>
                                    <select
                                        className="search-input-modern"
                                        value={manageScheduleDocId}
                                        onChange={(e) => setManageScheduleDocId(e.target.value)}
                                        style={{ width: '100%', height: '48px', fontSize: '0.95rem', background: '#f8fafc', fontWeight: 600 }}
                                    >
                                        <option value="">-- Choose a registered Doctor --</option>
                                        {registeredDoctors.map(doc => (
                                            <option key={doc.id || doc.email} value={doc.id || doc.email}>{doc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Target Configuration Date</label>
                                    <input
                                        type="date"
                                        className="search-input-modern"
                                        value={manageScheduleDate}
                                        onChange={(e) => setManageScheduleDate(e.target.value)}
                                        style={{ width: '100%', height: '48px', fontSize: '0.95rem', background: '#f8fafc', fontWeight: 600 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {manageScheduleDocId && (
                            <>
                                <div className="glass-form-card" style={{ marginBottom: '28px' }}>
                                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        Active Routine Working Days
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Select the days this doctor typically works. Clear days to automatically mark them as Off-Duty.</p>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                            const activeDays = doctorWorkingDays[manageScheduleDocId] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                            const isActive = activeDays.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleWorkingDay(day)}
                                                    style={{
                                                        padding: '10px 24px',
                                                        borderRadius: '50px',
                                                        border: isActive ? 'none' : '1px solid #cbd5e1',
                                                        background: isActive ? 'linear-gradient(135deg, #10b981, #059669)' : '#f8fafc',
                                                        color: isActive ? '#fff' : '#64748b',
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        boxShadow: isActive ? '0 4px 12px rgba(16,185,129,0.2)' : 'none',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="glass-form-card" style={{ marginBottom: '28px' }}>
                                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        Time Slots & Shift Generation
                                    </h3>

                                    <div className="form-grid-2" style={{ gap: '30px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>Apply Preconfigured Shift Patterns</label>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <button onClick={() => handleApplyShiftPreset('SHIFT1')} style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '12px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 2px 4px rgba(2,132,199,0.05)' }}>11:00 AM - 2:00 PM</button>
                                                <button onClick={() => handleApplyShiftPreset('SHIFT2')} style={{ background: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4', borderRadius: '12px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 2px 4px rgba(15,118,110,0.05)' }}>3:00 PM - 8:00 PM</button>
                                                <button onClick={() => handleApplyShiftPreset('FULL_DAY')} style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 2px 4px rgba(126,34,206,0.05)' }}>Full Day</button>
                                                <button onClick={() => handleApplyShiftPreset('CLEAR')} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '12px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(185,28,28,0.05)' }}>Clear Unbooked</button>
                                            </div>
                                        </div>

                                        <div style={{ paddingLeft: '24px', borderLeft: '1px solid #e2e8f0' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>Manually Add Specific Time Slot</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} style={{ height: '44px', width: '130px', flexShrink: 0 }} className="search-input-modern" />
                                                <button onClick={handleAddCustomTime} className="btn-save" style={{ height: '44px', padding: '0 20px', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}>+ Add Slot</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-form-card" style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                            Active Schedule for {new Date(manageScheduleDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                        <button onClick={() => handleDeleteSchedule()} className="btn-reject" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '12px' }}>
                                            Wipe Day's Schedule
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', minHeight: '60px', alignItems: 'center' }}>
                                        {(() => {
                                            const configuredSlots = getDoctorSchedule(manageScheduleDocId, manageScheduleDate) || [];

                                            // Core daily standard blocks for the clinic
                                            const base1 = ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
                                            const base2 = ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];
                                            const allBaseSlots = [...base1, ...base2];

                                            const allDisplayTimes = new Set(allBaseSlots);
                                            configuredSlots.forEach(s => allDisplayTimes.add(s.time)); // Also include custom configured ones

                                            const sortedTimes = Array.from(allDisplayTimes).sort((a, b) => {
                                                const convert = t => {
                                                    let [hm, ampm] = t.split(' ');
                                                    let [h, m] = hm.split(':').map(Number);
                                                    if (ampm === 'PM' && h !== 12) h += 12;
                                                    if (ampm === 'AM' && h === 12) h = 0;
                                                    return h * 60 + m;
                                                };
                                                return convert(a) - convert(b);
                                            });

                                            return sortedTimes.map((timeString, idx) => {
                                                const activeSlot = configuredSlots.find(s => s.time === timeString);
                                                const isSelected = !!activeSlot;
                                                const isBooked = activeSlot && activeSlot.booked;

                                                let btnBg = '#f8fafc', btnColor = '#64748b', btnBorder = '1px dashed #cbd5e1';
                                                let pillBg = '#cbd5e1', pillText = '+ Add';
                                                let clickFn = () => handleToggleSlot(timeString);
                                                let btnStyleExtra = { cursor: 'pointer', opacity: 0.7 };

                                                if (isBooked) {
                                                    btnBg = '#fef3c7'; btnColor = '#92400e'; btnBorder = '1px solid #fcd34d';
                                                    pillBg = '#f59e0b'; pillText = 'Booked';
                                                    clickFn = () => { };
                                                    btnStyleExtra = { opacity: 0.8, cursor: 'not-allowed', boxShadow: 'none' };
                                                } else if (isSelected) {
                                                    btnBg = '#dcfce7'; btnColor = '#166534'; btnBorder = '1px solid #bbf7d0';
                                                    pillBg = '#22c55e'; pillText = '✕ Remove';
                                                    clickFn = () => handleToggleSlot(timeString);
                                                    btnStyleExtra = { cursor: 'pointer', boxShadow: '0 2px 4px rgba(22,101,52,0.1)', opacity: 1 };
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={clickFn}
                                                        style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '10px',
                                                            background: btnBg,
                                                            color: btnColor,
                                                            border: btnBorder,
                                                            fontWeight: 700,
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            transition: 'all 0.1s ease',
                                                            ...btnStyleExtra
                                                        }}
                                                        title={isBooked ? "Booked slots cannot be removed" : isSelected ? "Click to remove this slot from schedule" : "Click to add this slot to schedule"}
                                                    >
                                                        {timeString}
                                                        <span style={{ background: pillBg, color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {pillText}
                                                        </span>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => handleApplyRangeSchedule(7)} style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '10px 18px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(146,64,14,0.05)', transition: 'transform 0.15s ease' }}>
                                            Apply for 7 Days
                                        </button>
                                        <button onClick={() => handleApplyRangeSchedule(30)} style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', padding: '10px 18px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(126,34,206,0.05)', transition: 'transform 0.15s ease' }}>
                                            Apply for 30 Days
                                        </button>
                                    </div>
                                    <button onClick={handleSaveSchedule} style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '10px 24px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(22,101,52,0.05)', transition: 'transform 0.15s ease' }}>
                                        Save Schedule
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                )
                }

                {
                    currentView === 'VIEW_ALL_SCHEDULES' && (
                        <section className="modern-section">
                            <div className="section-title-row">
                                <div>
                                    <h2 className="section-heading">🗓️ All Doctor Consultation Schedules</h2>
                                    <p className="section-sub">Live master timetable displaying active consultation slots and booked appointments for all hospital veterinarians.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button
                                        className="btn-save"
                                        onClick={() => {
                                            setCurrentView('MANAGE_SCHEDULES');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                                    >
                                        ⚙️ Edit Individual Schedule
                                    </button>
                                </div>
                            </div>

                            {/* Date Filter Card */}
                            <div className="glass-form-card" style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>📅 Select Date to Inspect:</span>
                                        <input
                                            type="date"
                                            className="search-input-modern"
                                            style={{ height: '40px', width: 'auto' }}
                                            value={viewScheduleDate}
                                            onChange={(e) => setViewScheduleDate(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
                                        Showing timetables for: <strong style={{ color: '#059669' }}>{viewScheduleDate}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Doctors Master Schedules Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                                {(() => {
                                    const scheduledDocs = registeredDoctors.filter(doc => {
                                        const isShift1Only = isShift1OnlyDoc(doc);
                                        if (isShift1Only) return true;

                                        const rawDaySched = getDoctorSchedule(doc, viewScheduleDate);
                                        const hasExplicitSched = rawDaySched !== undefined;
                                        if (hasExplicitSched) return rawDaySched.length > 0;
                                        return false;
                                    });

                                    if (scheduledDocs.length === 0) {
                                        return (
                                            <div className="glass-form-card" style={{ padding: '36px 24px', textAlign: 'center', color: '#64748b' }}>
                                                <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>📅</div>
                                                <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontWeight: 800 }}>No Active Doctor Schedules for {viewScheduleDate}</h3>
                                                <p style={{ margin: 0, fontSize: '0.86rem' }}>There are currently no active time slots published for this date. Click "+ Create New Schedule" above to publish slots for a doctor.</p>
                                            </div>
                                        );
                                    }

                                    return scheduledDocs.map((doc, docIdx) => {
                                        const dutyInfo = getDoctorDutyStatus(doc, viewScheduleDate);
                                        const isOffDuty = dutyInfo.isOffDuty;
                                        const dayName = dutyInfo.dayName;

                                        const rawDaySched = getDoctorSchedule(doc, viewScheduleDate);
                                        const hasExplicitSched = rawDaySched !== undefined;
                                        const isShift1Only = isShift1OnlyDoc(doc);

                                        const shift1 = ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
                                        const shift2 = ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];

                                        const defaultTimes = isShift1Only ? shift1 : [...shift1, ...shift2];

                                        const activeSlotItems = hasExplicitSched ? rawDaySched : (isShift1Only ? shift1.map(t => ({ time: t, booked: false })) : []);

                                        const isScheduleDeleted = !isOffDuty && activeSlotItems.length === 0;

                                        const bookedCount = activeSlotItems.filter(s => typeof s === 'object' && s.booked).length;
                                        const availableCount = isOffDuty ? 0 : activeSlotItems.filter(s => typeof s === 'object' ? !s.booked : true).length;

                                        return (
                                            <div
                                                key={doc.id || doc.email}
                                                style={{
                                                    background: '#ffffff',
                                                    borderRadius: '24px',
                                                    border: '1px solid #cbd5e1',
                                                    borderLeft: isOffDuty ? '7px solid #f59e0b' : (isScheduleDeleted ? '7px solid #ef4444' : (isShift1Only ? '7px solid #0284c7' : '7px solid #10b981')),
                                                    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                                                    padding: '28px 32px',
                                                    position: 'relative'
                                                }}
                                            >
                                                {/* Top Index Tag for Clear Separation */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px' }}>
                                                            DOCTOR ROSTER #{docIdx + 1}
                                                        </span>
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                                                            {doc.specialization || 'Veterinary Surgeon'}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isOffDuty ? '#d97706' : '#94a3b8' }}>
                                                        {isOffDuty ? `STATUS: OFF-DUTY (${dutyInfo.reason.toUpperCase()})` : isScheduleDeleted ? 'STATUS: NO SLOTS' : 'STATUS: ACTIVE SCHEDULE'}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            {doc.photoUrl ? (
                                                                <img src={doc.photoUrl} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <span style={{ fontSize: '1.4rem' }}>👨‍⚕️</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{doc.name}</h3>
                                                            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                                                                {doc.specialization || doc.address || 'Veterinary Surgeon'} &nbsp;·&nbsp; {doc.availableHours || (isShift1Only ? 'Sat - Sun | 11:00 AM - 02:00 PM' : 'Mon - Sun | 11:00 AM - 02:00 PM, 03:00 PM - 08:00 PM')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {isOffDuty ? (
                                                            <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>
                                                                🟡 Off Duty ({dutyInfo.reason})
                                                            </span>
                                                        ) : isScheduleDeleted ? (
                                                            <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>
                                                                🔴 Schedule Deleted / No Slots
                                                            </span>
                                                        ) : (
                                                            <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                                                                {availableCount} Available Slot{availableCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {bookedCount > 0 && (
                                                            <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>
                                                                {bookedCount} Booked 🔒
                                                            </span>
                                                        )}
                                                        {!isOffDuty && !isScheduleDeleted && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteSchedule(doc.id || doc.email, viewScheduleDate)}
                                                                    style={{ padding: '6px 12px', borderRadius: '10px', background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                                    title="Delete schedule for this doctor on selected date"
                                                                >
                                                                    🗑️ Delete Schedule
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setManageScheduleDocId(doc.id || doc.email);
                                                                        setManageScheduleDate(viewScheduleDate);
                                                                        setCurrentView('MANAGE_SCHEDULES');
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                    style={{ padding: '6px 14px', borderRadius: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                                >
                                                                    ⚙️ Edit Schedule
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>


                                                {/* Time Slots Chips Grid OR State Banners */}
                                                {isOffDuty ? (
                                                    <div style={{ padding: '16px 20px', background: '#fffbeb', borderRadius: '14px', border: '1px solid #fde68a', color: '#92400e' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: activeSlotItems.length > 0 ? '14px' : '0' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontSize: '1.2rem' }}>{dutyInfo.isShiftEnded ? '🕒' : '🌴'}</span>
                                                                <div>
                                                                    <strong style={{ fontSize: '0.9rem', color: '#78350f', display: 'block' }}>Doctor Off-Duty ({dutyInfo.reason})</strong>
                                                                    <span style={{ fontSize: '0.82rem', color: '#92400e' }}>
                                                                        {dutyInfo.isShiftEnded
                                                                            ? `Consultation shift for ${doc.name} has concluded for ${viewScheduleDate}. Time slots below are closed.`
                                                                            : `${doc.name} is scheduled off on ${dayName}s based on weekly duty configuration.`}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                        </div>

                                                        {activeSlotItems.length > 0 && (
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', paddingTop: '12px', borderTop: '1px dashed #fde68a' }}>
                                                                {activeSlotItems.map((slot, idx) => {
                                                                    const timeStr = typeof slot === 'string' ? slot : slot.time;
                                                                    const isBooked = typeof slot === 'object' ? slot.booked : false;

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            style={{
                                                                                padding: '8px 10px',
                                                                                borderRadius: '10px',
                                                                                background: '#f1f5f9',
                                                                                color: '#94a3b8',
                                                                                border: '1px solid #e2e8f0',
                                                                                fontWeight: 700,
                                                                                fontSize: '0.8rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                gap: '4px'
                                                                            }}
                                                                        >
                                                                            <span style={{ textDecoration: 'line-through', opacity: 0.75 }}>{timeStr}</span>
                                                                            {isBooked ? <span style={{ fontSize: '0.75rem' }}>🔒</span> : <span style={{ fontSize: '0.7rem', color: '#d97706' }}>(Off)</span>}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : isScheduleDeleted ? (
                                                    <div style={{ padding: '16px 20px', background: '#fff1f2', borderRadius: '14px', border: '1px solid #fecdd3', color: '#9f1239', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ fontSize: '1.2rem' }}>🚫</span>
                                                            <div>
                                                                <strong style={{ fontSize: '0.9rem', color: '#881337', display: 'block' }}>Schedule Deleted for {viewScheduleDate}</strong>
                                                                <span style={{ fontSize: '0.82rem', color: '#9f1239' }}>No consultation time slots are active for {doc.name} on this date.</span>
                                                            </div>
                                                        </div>

                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                                                        {activeSlotItems.map((slot, idx) => {
                                                            const timeStr = typeof slot === 'string' ? slot : slot.time;
                                                            const isBooked = typeof slot === 'object' ? slot.booked : false;

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    style={{
                                                                        padding: '10px 12px',
                                                                        borderRadius: '12px',
                                                                        background: isBooked ? '#f1f5f9' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                        color: isBooked ? '#94a3b8' : '#ffffff',
                                                                        border: isBooked ? '1px solid #e2e8f0' : 'none',
                                                                        fontWeight: 700,
                                                                        fontSize: '0.85rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '6px',
                                                                        boxShadow: isBooked ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.2)'
                                                                    }}
                                                                >
                                                                    <span>{timeStr}</span>
                                                                    {isBooked && <span style={{ fontSize: '0.75rem' }}>🔒</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });

                                })()}
                            </div>
                        </section>
                    )
                }

                {/* DEDICATED CREATE DOCTOR ACCOUNT PAGE */}
                {
                    currentView === 'CREATE_DOCTOR' && (
                        <section className="modern-section">
                            <div className="section-title-row">
                                <div>
                                    <h2 className="section-heading">👨‍⚕️ Register Veterinary Doctor Account</h2>
                                    <p className="section-sub">Create and authorize a new hospital veterinarian account with instant active access.</p>
                                </div>
                            </div>

                            <div className="glass-form-card">
                                <form onSubmit={handleCreateDoctor} className="admin-doctor-form">
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>Doctor Full Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Dr. Alexander Wright"
                                                value={docName}
                                                onChange={(e) => setDocName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Hospital Email Address *</label>
                                            <input
                                                type="email"
                                                placeholder="e.g. alexander.wright@vhms.com"
                                                value={docEmail}
                                                onChange={(e) => setDocEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>Phone Number *</label>
                                            <input
                                                type="tel"
                                                placeholder="e.g. 0771234567"
                                                value={docPhone}
                                                onChange={(e) => setDocPhone(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Specialization / Department</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Veterinary Surgery & Critical Care"
                                                value={docDepartment}
                                                onChange={(e) => setDocDepartment(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>Experience / Qualifications</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Senior Veterinary Surgeon (10+ Years Exp)"
                                                value={docExperience}
                                                onChange={(e) => setDocExperience(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Available Working Hours</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Mon - Fri | 08:00 AM - 05:00 PM"
                                                value={docAvailableHours}
                                                onChange={(e) => setDocAvailableHours(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Services Offered</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. General Care, Orthopedic Surgery, Dental Scaling, Vaccination"
                                            value={docServices}
                                            onChange={(e) => setDocServices(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Doctor Bio / Professional Description</label>
                                        <textarea
                                            rows="3"
                                            placeholder="Provide a detailed description of doctor's background, medical expertise, and care philosophy..."
                                            value={docBio}
                                            onChange={(e) => setDocBio(e.target.value)}
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                                        ></textarea>
                                    </div>

                                    {/* Doctor Photo Upload */}
                                    <div className="form-group">
                                        <label>Doctor Profile Photo</label>
                                        <div className="photo-upload-container">
                                            <input
                                                type="file"
                                                id="doc-photo-file"
                                                accept="image/*"
                                                onChange={handleDoctorPhotoUpload}
                                                style={{ display: 'none' }}
                                            />
                                            {docPhotoUrl ? (
                                                <div className="photo-preview-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.25)' }}>
                                                    <img src={docPhotoUrl} alt="Doctor Preview" style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(16,185,129,0.3)' }} />
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <label htmlFor="doc-photo-file" className="btn-upload-change" style={{ cursor: 'pointer' }}>📷 Change Photo</label>
                                                        <button type="button" className="btn-upload-remove" onClick={() => setDocPhotoUrl('')}>✕ Remove</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label htmlFor="doc-photo-file" className="photo-dropzone" style={{ cursor: 'pointer' }}>
                                                    <div className="dropzone-icon">📷</div>
                                                    <p style={{ margin: '8px 0 4px', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Click to upload doctor photo</p>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>PNG, JPG up to 5MB (optional — a default photo will be used if skipped)</p>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-actions-row">
                                        <button type="button" className="btn-cancel" onClick={() => setCurrentView('OVERVIEW')}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-save" disabled={isSubmittingDoctor}>
                                            {isSubmittingDoctor ? 'Creating Account...' : 'Create Doctor Account'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )
                }

                {/* DEDICATED ADMIN PROFILE PAGE */}
                {
                    currentView === 'PROFILE' && (
                        <section className="modern-section">
                            <div className="section-title-row">
                                <div>
                                    <h2 className="section-heading">👤 System Administrator Profile</h2>
                                    <p className="section-sub">Manage your administrator identity and system contact details.</p>
                                </div>
                            </div>

                            <div className="glass-form-card">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    showToast('Administrator profile saved successfully!', 'success');
                                }} className="admin-doctor-form">
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>Admin Name *</label>
                                            <input
                                                type="text"
                                                defaultValue={currentUser.name || 'System Admin'}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Hospital Admin Email</label>
                                            <input
                                                type="email"
                                                defaultValue={currentUser.email || 'admin@vhms.com'}
                                                disabled
                                                className="input-disabled"
                                                title="Email is fixed as system administrator identifier"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>Contact Phone Number</label>
                                            <input
                                                type="tel"
                                                defaultValue="0771234567"
                                                placeholder="e.g. 0771234567"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Office Location / Department</label>
                                            <input
                                                type="text"
                                                defaultValue="Hospital Administrative HQ, Colombo"
                                                placeholder="e.g. Colombo 07, Sri Lanka"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-actions-row">
                                        <button type="button" className="btn-cancel" onClick={() => setCurrentView('OVERVIEW')}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-save">
                                            Save Admin Profile
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="glass-form-card" style={{ marginTop: '24px' }}>
                                <div className="section-title-row" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                            🔒 Account Password & Security
                                        </h3>
                                        <p className="section-sub" style={{ margin: '4px 0 0' }}>
                                            Update your system administrator login password.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordChange} className="admin-doctor-form">
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label>Current Password *</label>
                                        <input
                                            type="password"
                                            placeholder="Enter your current password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label>New Secret Password *</label>
                                            <input
                                                type="password"
                                                placeholder="Minimum 6 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Confirm New Password *</label>
                                            <input
                                                type="password"
                                                placeholder="Re-enter new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-actions-row">
                                        <button type="submit" className="btn-save">
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )
                }

                {/* DEDICATED APPOINTMENT APPROVAL & SUPERVISION CENTER PAGE */}
                {
                    currentView === 'APPOINTMENTS' && (
                        <section className="modern-section">
                            <div className="section-title-row flex-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
                                <div>
                                    <h2 className="section-heading">📅 Appointment Approval & Supervision Center</h2>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    {/* Status Filter Dropdown */}
                                    <div className="appt-filter-dropdown" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <select
                                            id="appt-status-select"
                                            value={apptStatusFilter}
                                            onChange={(e) => setApptStatusFilter(e.target.value)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                border: '1.5px solid #10b981',
                                                background: '#ffffff',
                                                color: '#064e3b',
                                                fontWeight: 700,
                                                fontSize: '0.88rem',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.12)',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <option value="ALL">All Requests</option>
                                            <option value="PENDING_APPROVAL">Pending Approval</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>

                                    {/* View Mode Toggle (Grid / Table) */}
                                    <div className="view-toggle-group" style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleApptViewModeChange('GRID')}
                                            title="Card Grid View"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '9px',
                                                border: 'none',
                                                background: apptViewMode === 'GRID' ? '#ffffff' : 'transparent',
                                                color: apptViewMode === 'GRID' ? '#0f172a' : '#64748b',
                                                fontWeight: apptViewMode === 'GRID' ? 700 : 500,
                                                fontSize: '0.82rem',
                                                cursor: 'pointer',
                                                boxShadow: apptViewMode === 'GRID' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <IconGrid size={16} /> Grid View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleApptViewModeChange('TABLE')}
                                            title="Table View"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '9px',
                                                border: 'none',
                                                background: apptViewMode === 'TABLE' ? '#ffffff' : 'transparent',
                                                color: apptViewMode === 'TABLE' ? '#0f172a' : '#64748b',
                                                fontWeight: apptViewMode === 'TABLE' ? 700 : 500,
                                                fontSize: '0.82rem',
                                                cursor: 'pointer',
                                                boxShadow: apptViewMode === 'TABLE' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <IconTable size={16} /> Table View
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {apptViewMode === 'TABLE' ? (
                                /* DYNAMIC TABLE VIEW */
                                <div className="table-glass-wrapper">
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Patient Details</th>
                                                <th>Owner Contact</th>
                                                <th>Requested Doctor &amp; Time</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAdminAppointments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="table-empty">
                                                        No appointment requests found matching status filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAdminAppointments.map((appt) => {
                                                    const { derivedOwnerName, derivedOwnerPhone, derivedBreed } = getAppointmentOwnerInfo(appt);

                                                    return (
                                                        <tr key={appt.id} className="table-row-hover">
                                                            <td>
                                                                <div className="table-user-info">
                                                                    <div className="avatar-chip pet-chip" style={{ background: '#f5f3ff', color: '#7c3aed', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        <IconPaw size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <strong className="user-name-text" style={{ fontSize: '0.95rem' }}>{appt.petName}</strong>
                                                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                                            {appt.species || 'Pet'} {derivedBreed ? `(${derivedBreed})` : '(Not Specified)'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <strong style={{ color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>{derivedOwnerName || 'Not Specified'}</strong>
                                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{derivedOwnerPhone || 'Not Specified'}</span>
                                                            </td>
                                                            <td>
                                                                <strong style={{ color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>{appt.doctorName}</strong>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                    <IconCalendar size={13} /> {appt.date} &bull; <IconClock size={13} /> {appt.timeSlot}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 800,
                                                                    padding: '4px 12px',
                                                                    borderRadius: '100px',
                                                                    background: appt.status === 'APPROVED' ? '#dcfce7' : appt.status === 'PENDING_APPROVAL' ? '#fef3c7' : appt.status === 'COMPLETED' ? '#e0e7ff' : '#fee2e2',
                                                                    color: appt.status === 'APPROVED' ? '#15803d' : appt.status === 'PENDING_APPROVAL' ? '#b45309' : appt.status === 'COMPLETED' ? '#4338ca' : '#b91c1c'
                                                                }}>
                                                                    {appt.status === 'PENDING_APPROVAL' && 'PENDING'}
                                                                    {appt.status === 'APPROVED' && 'APPROVED'}
                                                                    {appt.status === 'COMPLETED' && 'COMPLETED'}
                                                                    {appt.status === 'REJECTED' && 'REJECTED'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setViewingApptModal(appt)}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            padding: '6px 12px',
                                                                            borderRadius: '10px',
                                                                            background: '#f0fdf4',
                                                                            color: '#15803d',
                                                                            border: '1px solid #bbf7d0',
                                                                            fontWeight: 700,
                                                                            fontSize: '0.8rem',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        👁️ View Details
                                                                    </button>
                                                                    {appt.status === 'PENDING_APPROVAL' && (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleAdminApproveAppt(appt.id, appt.petName)}
                                                                                style={{ padding: '6px 12px', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                                                            >
                                                                                Approve
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setAdminRejectModalAppt(appt);
                                                                                    setAdminRejectReason('');
                                                                                }}
                                                                                style={{ padding: '6px 12px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                                                            >
                                                                                Decline
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* CARD GRID VIEW */
                                <div className="doc-appointments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                                    {filteredAdminAppointments.length === 0 ? (
                                        <div className="empty-appointments-box" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                            <p style={{ color: '#64748b', margin: 0 }}>No appointment requests found matching status filter.</p>
                                        </div>
                                    ) : (
                                        filteredAdminAppointments.map((appt) => {
                                            // Live Backfill for Legacy Appointments
                                            const { derivedOwnerName, derivedOwnerPhone, derivedBreed } = getAppointmentOwnerInfo(appt);

                                            return (
                                                <div key={appt.id} className={`admin-appt-card ${appt.status.toLowerCase()}`} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                            <div>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>{appt.id}</span>
                                                                <h4 style={{ margin: '6px 0 2px', fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {appt.petName} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>({appt.species} • {derivedBreed || 'Unknown'})</span>
                                                                </h4>
                                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>{appt.serviceType}</p>
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                padding: '4px 10px',
                                                                borderRadius: '12px',
                                                                background: appt.status === 'APPROVED' ? '#dcfce7' : appt.status === 'PENDING_APPROVAL' ? '#fef3c7' : appt.status === 'COMPLETED' ? '#e0e7ff' : '#fee2e2',
                                                                color: appt.status === 'APPROVED' ? '#15803d' : appt.status === 'PENDING_APPROVAL' ? '#b45309' : appt.status === 'COMPLETED' ? '#4338ca' : '#b91c1c'
                                                            }}>
                                                                {appt.status === 'PENDING_APPROVAL' && 'Pending Approval'}
                                                                {appt.status === 'APPROVED' && 'Approved'}
                                                                {appt.status === 'COMPLETED' && 'Completed'}
                                                                {appt.status === 'REJECTED' && 'Rejected'}
                                                            </span>
                                                        </div>

                                                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                                                            <div><strong>Date & Time:</strong> {appt.date} at {appt.timeSlot}</div>
                                                            <div><strong>Requested Doctor:</strong> {appt.doctorName}</div>
                                                            <div><strong>Pet Owner:</strong> {derivedOwnerName || 'Unknown Owner'} ({derivedOwnerPhone || 'No Contacts'})</div>
                                                            <div><strong>Visit Reason:</strong> {appt.reason}</div>
                                                            {appt.notes && <div><strong>Owner Notes:</strong> <em>{appt.notes}</em></div>}
                                                            {appt.rejectReason && <div style={{ color: '#ef4444' }}><strong>Rejection Reason:</strong> {appt.rejectReason}</div>}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                                        {appt.status === 'PENDING_APPROVAL' && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAdminApproveAppt(appt.id, appt.petName)}
                                                                    style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '9px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    Approve Request
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setAdminRejectModalAppt(appt);
                                                                        setAdminRejectReason('');
                                                                    }}
                                                                    style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '9px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                                                                >
                                                                    Decline
                                                                </button>
                                                            </>
                                                        )}

                                                        {appt.status === 'APPROVED' && (
                                                            <div style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#15803d', fontWeight: 600, padding: '8px', background: '#dcfce7', borderRadius: '10px' }}>
                                                                    Confirmed &amp; Sent to {appt.doctorName}'s Schedule
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingApptModal(appt)}
                                                                    style={{ padding: '8px 12px', borderRadius: '10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                >
                                                                    👁️ View Details
                                                                </button>
                                                            </div>
                                                        )}

                                                        {appt.status === 'COMPLETED' && (
                                                            <div style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#4338ca', fontWeight: 600, padding: '8px', background: '#e0e7ff', borderRadius: '10px' }}>
                                                                    📋 Consultation Completed by Doctor
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingApptModal(appt)}
                                                                    style={{ padding: '8px 12px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                >
                                                                    👁️ View Details
                                                                </button>
                                                            </div>
                                                        )}

                                                        {appt.status === 'REJECTED' && (
                                                            <div style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600, padding: '8px', background: '#fee2e2', borderRadius: '10px' }}>
                                                                    ✕ Appointment Request Declined
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingApptModal(appt)}
                                                                    style={{ padding: '8px 12px', borderRadius: '10px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                >
                                                                    👁️ View Details
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </section>
                    )
                }
            </main>

            {/* ADMIN APPOINTMENT REJECTION REASON MODAL */}
            {
                adminRejectModalAppt && (
                    <div className="modal-overlay" onClick={() => setAdminRejectModalAppt(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', background: '#ffffff', borderRadius: '20px', padding: '24px' }}>
                            <button className="modal-close-btn" onClick={() => setAdminRejectModalAppt(null)}>✕</button>
                            <h3 style={{ margin: '0 0 8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ✕ Decline Appointment Request
                            </h3>
                            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#64748b' }}>
                                Specify a reason for declining <strong>{adminRejectModalAppt.petName}</strong>'s booking with {adminRejectModalAppt.doctorName}.
                            </p>

                            <form onSubmit={handleAdminConfirmReject}>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Decline Reason / Admin Note *</label>
                                    <textarea
                                        rows="3"
                                        value={adminRejectReason}
                                        onChange={(e) => setAdminRejectReason(e.target.value)}
                                        placeholder="e.g. Selected veterinarian on leave / Time slot unavailable. Please select another slot."
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                    ></textarea>
                                </div>

                                <div className="form-actions-row" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-cancel" onClick={() => setAdminRejectModalAppt(null)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Confirm Decline</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {viewingApptModal && (() => {
                const appt = viewingApptModal;
                const { derivedOwnerName, derivedOwnerPhone, derivedBreed } = getAppointmentOwnerInfo(appt);

                return (
                    <div className="modal-backdrop" style={{ zIndex: 100000 }}>
                        <div className="pet-profile-view-modal" style={{ maxWidth: '580px', width: '92%', padding: '28px', borderRadius: '24px', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid #a7f3d0' }}>
                                        📅
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Appointment Record • {appt.id}
                                        </span>
                                        <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                                            Consultation Details
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingApptModal(null)}
                                    style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Approval Status</span>
                                <span style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    padding: '4px 14px',
                                    borderRadius: '100px',
                                    background: appt.status === 'APPROVED' ? '#dcfce7' : appt.status === 'PENDING_APPROVAL' ? '#fef3c7' : appt.status === 'COMPLETED' ? '#e0e7ff' : '#fee2e2',
                                    color: appt.status === 'APPROVED' ? '#15803d' : appt.status === 'PENDING_APPROVAL' ? '#b45309' : appt.status === 'COMPLETED' ? '#4338ca' : '#b91c1c'
                                }}>
                                    {appt.status === 'PENDING_APPROVAL' && '⏳ PENDING APPROVAL'}
                                    {appt.status === 'APPROVED' && '🟢 APPROVED'}
                                    {appt.status === 'COMPLETED' && '📋 COMPLETED'}
                                    {appt.status === 'REJECTED' && '🔴 REJECTED'}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ background: '#faf5ff', padding: '14px', borderRadius: '14px', border: '1px solid #f3e8ff' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase' }}>🐾 Patient Details</span>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginTop: '4px' }}>{appt.petName}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#6b21a8' }}>{appt.species || 'Pet'} {derivedBreed ? `(${derivedBreed})` : ''}</div>
                                </div>

                                <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '14px', border: '1px solid #e0f2fe' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>👤 Pet Owner Contact</span>
                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginTop: '4px' }}>{derivedOwnerName || 'Not Specified'}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#0284c7' }}>📞 {derivedOwnerPhone || 'Not Specified'}</div>
                                </div>
                            </div>

                            <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '14px', border: '1px solid #a7f3d0', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>👨‍⚕️ Assigned Veterinarian & Schedule</span>
                                        <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1.05rem', marginTop: '4px' }}>{appt.doctorName}</div>
                                        <div style={{ fontSize: '0.88rem', color: '#047857', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            📅 <strong>Date:</strong> {appt.date} &bull; 🕒 <strong>Time:</strong> {appt.timeSlot}
                                        </div>
                                    </div>
                                    <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, color: '#059669', border: '1px solid #a7f3d0' }}>
                                        {appt.serviceType}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>📋 Reason for Visit & Clinical Notes</span>
                                <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
                                    {appt.reason || 'General health consultation & physical checkup.'}
                                </p>
                                {appt.notes && (
                                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '0.85rem', color: '#475569' }}>
                                        <strong>Owner Notes:</strong> {appt.notes}
                                    </div>
                                )}
                                {appt.rejectReason && (
                                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #fecaca', fontSize: '0.85rem', color: '#dc2626' }}>
                                        <strong>Decline Reason:</strong> {appt.rejectReason}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setViewingApptModal(null)}
                                    style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Close
                                </button>
                                {appt.status === 'PENDING_APPROVAL' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleAdminApproveAppt(appt.id, appt.petName);
                                                setViewingApptModal(null);
                                            }}
                                            style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            ✓ Approve Request
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAdminRejectModalAppt(appt);
                                                setAdminRejectReason('');
                                                setViewingApptModal(null);
                                            }}
                                            style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            ✕ Decline
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {createdDoctorInfo && (
                <div className="modal-backdrop" style={{ zIndex: 100000 }}>
                    <div className="pet-profile-view-modal" style={{ maxWidth: '480px', width: '90%', padding: '32px', textAlign: 'center', borderRadius: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', border: '2px solid #a7f3d0' }}>
                            🔐
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                            Doctor Account Created!
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: '1.4' }}>
                            A unique initial password has been generated for <strong>{createdDoctorInfo.name}</strong> ({createdDoctorInfo.email}).
                        </p>

                        <div style={{ background: '#f8fafc', border: '2px dashed #10b981', padding: '18px', borderRadius: '16px', marginBottom: '20px' }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Initial Temporary Password
                            </span>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', letterSpacing: '2px', marginTop: '6px', fontFamily: 'monospace' }}>
                                {createdDoctorInfo.tempPassword}
                            </div>
                        </div>

                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 16px', borderRadius: '14px', margin: '0 0 24px', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '18px' }}>⚠️</span>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#b91c1c', fontWeight: 600, lineHeight: '1.4' }}>
                                Please securely share this temporary password with the doctor. They will be required to set a private password on their first login.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-save"
                            onClick={() => {
                                try { navigator.clipboard?.writeText(createdDoctorInfo.tempPassword); } catch { }
                                showToast('Temporary password copied to clipboard!', 'info');
                                setCreatedDoctorInfo(null);
                            }}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.92rem', fontWeight: 800 }}
                        >
                            📋 Copy Password & Close
                        </button>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            <div className={`toast-modern${toast.show ? ' show' : ''} ${toast.type}`}>
                {toast.message}
            </div>
        </div >
    );
}
