import React, { useState, useEffect } from 'react';

export default function DoctorScheduleManager({
    email,
    name,
    doctorProfile
}) {
    const [globalSchedules, setGlobalSchedules] = useState({});
    const [doctorWorkingDays, setDoctorWorkingDays] = useState({});

    // Core states
    const [manageScheduleDate, setManageScheduleDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [customTime, setCustomTime] = useState('');

    // Bulk Setup specific features
    const [bulkScheduleDays, setBulkScheduleDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    const [bulkSchedulePreset, setBulkSchedulePreset] = useState('MORNING_ONLY');
    const [showScheduleGenModal, setShowScheduleGenModal] = useState(false);

    // Toast
    const [toast, setToast] = useState({ message: '', type: '', show: false });
    const showToast = (message, type = 'success') => {
        setToast({ message, type, show: true });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    };

    const manageScheduleDocId = email;

    // Mocks for Admin dependencies
    const registeredDoctors = [
        { id: email, email: email, name: name, availableHours: doctorProfile?.availableHours || '' }
    ];

    // Stub to drop viewScheduleDate
    const setViewScheduleDate = () => { };
    // Stub to drop setCurrentView 
    const setCurrentView = () => { };

    useEffect(() => {
        try {
            const stored = localStorage.getItem('vhms_schedules');
            if (stored) setGlobalSchedules(JSON.parse(stored));

            const storedDays = localStorage.getItem('vhms_doctor_working_days');
            if (storedDays) setDoctorWorkingDays(JSON.parse(storedDays));
        } catch { }
    }, []);

    // LOGIC BLOCK
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

        const docObj = registeredDoctors.find(d => d.id === manageScheduleDocId || d.email === manageScheduleDocId || String(d.id) === String(manageScheduleDocId));
        const isShift1Only = isShift1OnlyDoc(docObj);

        const shift1 = ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
        const shift2 = ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];
        const fullDaySlots = isShift1Only ? shift1 : [...shift1, ...shift2];

        let targetTimes = [];
        if (presetType === 'SHIFT1' || presetType === 'MORNING') targetTimes = shift1;
        else if (presetType === 'SHIFT2' || presetType === 'AFTERNOON') targetTimes = isShift1Only ? [] : shift2;
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


    // End Logic
    return (
        <div style={{ marginTop: '20px' }}>
            {toast.show && (
                <div className={`toast-notification ${toast.type}`}>
                    {toast.message}
                </div>
            )}
            <section className="modern-section">
                <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 className="section-heading">📅 Doctor Schedule Management</h2>
                        <p className="section-sub">Configure active working dates and explicit booking time blocks for medical staff. Settings apply system-wide instantly.</p>
                    </div>

                </div>

                <div className="glass-form-card" style={{ margin: '0 0 24px 0' }}>
                    <div className="form-grid-2">

                        <div className="form-group">
                            <label>Operative Date *</label>
                            <input
                                type="date"
                                className="search-input-modern"
                                style={{ height: '42px' }}
                                value={manageScheduleDate}
                                onChange={e => setManageScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-form-card">
                    {!manageScheduleDate ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🕒</span>
                            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>No Schedule Active</h3>
                            <p style={{ margin: 0 }}>Please select an <strong>Operative Date</strong> above to view and modify time slots.</p>
                        </div>
                    ) : (
                        <>
                            {/* WORKING DAYS OF THE WEEK SELECTOR */}
                            <div style={{ marginBottom: '24px', padding: '16px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>📆 Weekly Duty Days for Selected Doctor:</strong>
                                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Select active duty days. Multi-day bulk allocation will automatically skip unchecked off-duty days.</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newObj = { ...doctorWorkingDays, [manageScheduleDocId]: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] };
                                                setDoctorWorkingDays(newObj);
                                                localStorage.setItem('vhms_doctor_working_days', JSON.stringify(newObj));
                                            }}
                                            style={{ padding: '4px 10px', fontSize: '0.76rem', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, color: '#334155' }}
                                        >
                                            Mon - Fri (Weekdays)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newObj = { ...doctorWorkingDays, [manageScheduleDocId]: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
                                                setDoctorWorkingDays(newObj);
                                                localStorage.setItem('vhms_doctor_working_days', JSON.stringify(newObj));
                                            }}
                                            style={{ padding: '4px 10px', fontSize: '0.76rem', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, color: '#334155' }}
                                        >
                                            All 7 Days
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                        const currentDays = doctorWorkingDays[manageScheduleDocId] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                        const isSelected = currentDays.includes(day);

                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleWorkingDay(day)}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '10px',
                                                    border: isSelected ? '1px solid #10b981' : '1px solid #cbd5e1',
                                                    background: isSelected ? '#dcfce7' : '#ffffff',
                                                    color: isSelected ? '#15803d' : '#64748b',
                                                    fontWeight: 700,
                                                    fontSize: '0.84rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <span>{isSelected ? '✓' : '✕'}</span>
                                                <span>{day}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Active Time Slots</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                                            Click a time chip below to toggle availability, or use 1-Click Presets for quick shift allocation.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '6px 12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                        <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>Custom Time:</span>
                                        <input
                                            type="time"
                                            className="search-input-modern"
                                            style={{ height: '34px', width: '125px', padding: '0 8px', fontSize: '0.88rem', borderRadius: '8px' }}
                                            value={customTime}
                                            onChange={e => setCustomTime(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomTime}
                                            style={{
                                                height: '34px',
                                                padding: '0 16px',
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                color: '#ffffff',
                                                borderRadius: '10px',
                                                fontWeight: 700,
                                                fontSize: '0.82rem',
                                                cursor: customTime ? 'pointer' : 'not-allowed',
                                                border: 'none',
                                                boxShadow: customTime ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none',
                                                opacity: customTime ? 1 : 0.6
                                            }}
                                            disabled={!customTime}
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* 1-CLICK SHIFT PRESETS BAR */}
                                {(() => {
                                    const docObj = registeredDoctors.find(d => d.id === manageScheduleDocId || d.email === manageScheduleDocId);
                                    const isShift1Only = isShift1OnlyDoc(docObj);

                                    return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                                                ⚡ 1-Click Presets:
                                            </span>
                                            {isShift1Only ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyShiftPreset('SHIFT1')}
                                                    style={{ padding: '8px 18px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                >
                                                    Select All Slots (11 AM - 2 PM)
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyShiftPreset('SHIFT1')}
                                                        style={{ padding: '8px 16px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                    >
                                                        Shift 1 (11 AM - 2 PM)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyShiftPreset('SHIFT2')}
                                                        style={{ padding: '8px 16px', borderRadius: '12px', background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                    >
                                                        Shift 2 (3 PM - 8 PM)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyShiftPreset('FULL_DAY')}
                                                        style={{ padding: '8px 16px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                    >
                                                        Full Day Schedule
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleApplyShiftPreset('CLEAR')}
                                                style={{ padding: '8px 16px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', marginLeft: 'auto', transition: 'all 0.2s ease' }}
                                            >
                                                Clear Unbooked
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* TIME SLOT CHIPS GRID */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                                {(() => {
                                    const currentDaySlots = (globalSchedules[manageScheduleDocId] && globalSchedules[manageScheduleDocId][manageScheduleDate]) || [];
                                    const activeTimes = currentDaySlots.map(s => s.time);

                                    const docObj = registeredDoctors.find(d => d.id === manageScheduleDocId || d.email === manageScheduleDocId);
                                    const isShift1Only = isShift1OnlyDoc(docObj);

                                    const shift1 = ['11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
                                    const shift2 = ['03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];

                                    const baseTimes = isShift1Only ? shift1 : [...shift1, ...shift2];

                                    const displayTimes = Array.from(new Set([...baseTimes, ...activeTimes])).sort((a, b) => {
                                        const convert = t => {
                                            let [hm, ampm] = t.split(' ');
                                            let [h, min] = hm.split(':').map(Number);
                                            if (ampm === 'PM' && h !== 12) h += 12;
                                            if (ampm === 'AM' && h === 12) h = 0;
                                            return h * 60 + min;
                                        };
                                        return convert(a) - convert(b);
                                    });

                                    return displayTimes.map(timeSlot => {
                                        const slotData = currentDaySlots.find(s => s.time === timeSlot);
                                        const isActive = !!slotData;
                                        const isBooked = slotData && slotData.booked;

                                        return (
                                            <button
                                                key={timeSlot}
                                                onClick={() => handleToggleSlot(timeSlot)}
                                                disabled={isBooked}
                                                style={{
                                                    padding: '12px 14px',
                                                    borderRadius: '14px',
                                                    border: isBooked ? '1px solid #e2e8f0' : (isActive ? 'none' : '1px solid #e2e8f0'),
                                                    background: isBooked ? '#f1f5f9' : (isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ffffff'),
                                                    color: isBooked ? '#94a3b8' : (isActive ? '#ffffff' : '#334155'),
                                                    fontWeight: 700,
                                                    fontSize: '0.88rem',
                                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isActive && !isBooked ? '0 4px 14px rgba(16, 185, 129, 0.25)' : '0 2px 4px rgba(0,0,0,0.02)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justify: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <span>{timeSlot}</span>
                                                {isBooked && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>🔒</span>}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>

                            {((globalSchedules[manageScheduleDocId] && globalSchedules[manageScheduleDocId][manageScheduleDate]) || []).some(s => s.booked) && (
                                <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', color: '#92400e', padding: '14px 18px', borderRadius: '16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span>🔒</span>
                                    <span><strong>Note:</strong> Time slots marked with a lock (🔒) have already been booked by pet owners and cannot be disabled.</span>
                                </div>
                            )}
                        </>
                    )}
                    {/* SAVE SCHEDULE & BULK APPLY ACTION BUTTONS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>⚡ Quick Multi-Day Allocation:</span>
                            <button
                                type="button"
                                onClick={() => handleApplyRangeSchedule(7)}
                                style={{ padding: '7px 14px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                title="Apply this schedule layout to the next 7 consecutive days starting from operative date"
                            >
                                📅 Apply Next 7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApplyRangeSchedule(30)}
                                style={{ padding: '7px 14px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                title="Apply this schedule layout to the next 30 consecutive days starting from operative date"
                            >
                                🗓️ Apply Whole Month (30 Days)
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveSchedule}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 18px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>💾</span> Save Schedule
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

