import { API_BASE_URL as BACKEND_URL } from '../config/api';

// Pet-owner portal endpoints and doctor workflow endpoints now uniformly use /api/v1
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

export const api = {
    // AUTH
    async register(data) {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async login(data) {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async forgotPassword(data) {
        const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Forgot password failed');
        }
        return res.json();
    },

    async resetPassword(data) {
        const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Reset password failed');
        }
        return res.json();
    },

    async changeDoctorPassword(data) {
        const res = await fetch(`${API_BASE_URL}/auth/doctor/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
             const errBody = await res.text().catch(() => '');
             throw new Error(`Failed to change password: ${errBody}`);
        }
        return res.json();
    },

    // ADMIN
    async getPendingUsers() {
        const res = await fetch(`${API_BASE_URL}/admin/users/pending`);
        return res.json();
    },

    async getAllUsers() {
        const res = await fetch(`${API_BASE_URL}/admin/users`);
        let users = await res.json();
        if (!Array.isArray(users)) users = [];
        
        try {
            const dirRes = await fetch(`${API_BASE_URL}/doctors`);
            if (dirRes.ok) {
                const directory = await dirRes.json();
                if (Array.isArray(directory)) {
                    const known = new Set(users.map(u => String(u.email || '').toLowerCase()));
                    directory.forEach(d => {
                        if (!known.has(String(d.email || '').toLowerCase())) {
                            users.push({ ...d, role: 'DOCTOR', status: d.status || 'ACTIVE' });
                        }
                    });
                }
            }
        } catch {}
        
        return users;
    },

    async createDoctorAccount(data) {
        const res = await fetch(`${API_BASE_URL}/admin/doctors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async approveUser(id) {
        const isEmail = String(id || '').includes('@');
        const url = isEmail
            ? `${API_BASE_URL}/admin/users/approve?email=${encodeURIComponent(id)}`
            : `${API_BASE_URL}/admin/users/${encodeURIComponent(id)}/approve`;
        const res = await fetch(url, {
            method: 'PUT',
        });
        const approvedUser = await res.json();

        if (!res.ok || !approvedUser || approvedUser.success === false) {
            throw new Error(approvedUser?.message || 'Failed to approve user in MongoDB');
        }

        // Migrate pets/appointments when a stale local PO-* id becomes the real Mongo id
        try {
            if (approvedUser.id && String(approvedUser.id) !== String(id)) {
                const pets = await this.getPets();
                const petsToMigrate = pets.filter((p) => String(p.ownerId) === String(id));
                for (const p of petsToMigrate) {
                    await this.updatePet(p.id || p.petId, { ...p, ownerId: approvedUser.id });
                }

                const apptsRes = await fetch(`${API_BASE_URL}/appointments`);
                if (apptsRes.ok) {
                    const apptsRaw = await apptsRes.json();
                    const apptsArray = apptsRaw.data || apptsRaw;
                    if (Array.isArray(apptsArray)) {
                        const apptsToMigrate = apptsArray.filter(
                            (a) => String(a.petOwnerId) === String(id) || String(a.ownerId) === String(id)
                        );
                        for (const a of apptsToMigrate) {
                            await this.updateAppointment(a.id, {
                                ...a,
                                petOwnerId: a.petOwnerId === id ? approvedUser.id : a.petOwnerId,
                                ownerId: a.ownerId === id ? approvedUser.id : a.ownerId,
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to migrate data upon approval', e);
        }

        return approvedUser;
    },

    async toggleUserStatus(id) {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/toggle-status`, {
            method: 'PUT',
        });
        return res.json();
    },

    async rejectUser(id) {
        const isEmail = String(id || '').includes('@');
        const url = isEmail
            ? `${API_BASE_URL}/admin/users/reject?email=${encodeURIComponent(id)}`
            : `${API_BASE_URL}/admin/users/${encodeURIComponent(id)}/reject`;
        const res = await fetch(url, {
            method: 'PUT',
        });
        const body = await res.json();
        if (!res.ok || !body || body.success === false) {
            throw new Error(body?.message || 'Failed to reject user in MongoDB');
        }
        return body;
    },

    async deleteUser(id) {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },


    // PETS
    async getPets(ownerId) {
        // Fetch all pets and let the caller do robust filtering (to handle email vs ID mismatches)
        const res = await fetch(`${API_BASE_URL}/pets`);
        let pets = await res.json();
        
        // Enhance pets with ownerEmail from appointments and cached users to fix missing linkage for legacy PO- IDs
        try {
            const ownerMap = {};
            
            // 1. Cross-reference cached users (this covers pets without appointments!)
            try {
                const cachedUsers = JSON.parse(localStorage.getItem('vhms_all_users_cache') || '[]');
                const regUsers = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]');
                const pendingUsers = JSON.parse(localStorage.getItem('vhms_pending_users') || '[]');
                
                [...cachedUsers, ...regUsers, ...pendingUsers].forEach(u => {
                    if (u.id && u.email) {
                        ownerMap[u.id] = u.email.toLowerCase();
                    }
                });
                
                // 1.5 Robust fallback for known orphaned legacy IDs
                const orphanedMap = {
                    'PO-7910': 'sishanhewa4@gmail.com',
                    'PO-2490': 'sishanhewa4@gmail.com',
                    'PO-7062': 'sishanhewa4@gmail.com'
                };
                Object.keys(orphanedMap).forEach(key => {
                    if (!ownerMap[key]) ownerMap[key] = orphanedMap[key];
                });
                
            } catch {}

            // 2. Cross-reference appointments as a fallback
            try {
                const apptRes = await fetch(`${API_BASE_URL}/appointments`);
                if (apptRes.ok) {
                    const apptsRaw = await apptRes.json();
                    const apptsArray = apptsRaw.data || apptsRaw;
                    if (Array.isArray(apptsArray)) {
                        apptsArray.forEach(a => {
                            if (a.petOwnerId && a.petOwnerEmail && !ownerMap[a.petOwnerId]) {
                                ownerMap[a.petOwnerId] = a.petOwnerEmail.toLowerCase();
                            }
                        });
                    }
                }
            } catch {}
            
            const petsArray = pets.data || pets;
            if (Array.isArray(petsArray)) {
                petsArray.forEach(p => {
                    if (p.ownerId && ownerMap[p.ownerId] && !p.ownerEmail) {
                        p.ownerEmail = ownerMap[p.ownerId];
                    }
                });
                return petsArray;
            }
        } catch {}
        
        return Array.isArray(pets) ? pets : (pets.data || []);
    },

    async addPet(data) {
        const res = await fetch(`${API_BASE_URL}/pets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            throw new Error(`Failed to add pet (${res.status}): ${errBody}`);
        }
        return res.json();
    },

    async updatePet(id, data) {
        const res = await fetch(`${API_BASE_URL}/pets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            throw new Error(`Failed to update pet (${res.status}): ${errBody}`);
        }
        return res.json();
    },

    async deletePet(id) {
        const res = await fetch(`${API_BASE_URL}/pets/${id}`, {
            method: 'DELETE',
        });
        return res.ok;
    },

    async getDoctors() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${API_BASE_URL}/admin/users`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const users = await res.json();
            let doctors = Array.isArray(users) ? users.filter(u => u.role === 'DOCTOR') : [];

            // Also include doctors registered through the doctor workflow (doctors collection)
            try {
                const dirRes = await fetch(`${API_BASE_URL}/doctors`);
                if (dirRes.ok) {
                    const directory = await dirRes.json();
                    if (Array.isArray(directory)) {
                        directory.forEach(d => {
                            const dEmail = String(d.email || '').toLowerCase();
                            const existing = doctors.find(u => String(u.email || '').toLowerCase() === dEmail);
                            if (existing) {
                                if (d.specialization) existing.specialization = d.specialization;
                                if (d.availableServices && d.availableServices.length > 0) {
                                    existing.availableServices = d.availableServices;
                                    existing.services = d.availableServices;
                                }
                                if (d.availableSlots && d.availableSlots.length > 0) existing.availableSlots = d.availableSlots;
                                if (d.availableHours) existing.availableHours = d.availableHours;
                                if (d.workingDays) existing.workingDays = d.workingDays;
                                if (d.staffId) existing.staffId = d.staffId;
                                if (d.bio) existing.bio = d.bio;
                                if (d.experience) existing.experience = d.experience;
                                if (d.status && d.status !== 'default') existing.status = d.status;
                            } else {
                                doctors.push(d);
                            }
                        });
                    }
                }
            } catch { }
            return doctors;
        } catch {
            return [];
        }
    },

    async getAppointments(ownerId) {
        let backendData = null;
        try {
            const url = ownerId ? `${API_BASE_URL}/legacy/appointments/owner/${ownerId}` : `${API_BASE_URL}/legacy/appointments`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    backendData = data;
                }
            }
        } catch (e) {
            console.warn("Backend appointments fetch failed, using local storage fallback", e);
        }

        const todayStr = new Date().toISOString().split('T')[0];

        if (backendData) {
            // Apply strict future date reversion for DB data
            let cleanedBackend = backendData.filter(a => {
                const isMock = String(a.doctorName || '').includes('Dr. Smith') || (a.date && String(a.date).length > 20);
                return !isMock;
            });

            if (ownerId) {
                cleanedBackend = cleanedBackend.filter(a => a.ownerId === ownerId || a.petOwnerId === ownerId || a.petOwnerEmail === ownerId);
            }
            return cleanedBackend;
        }

        let appts = [];
        try {
            appts = JSON.parse(localStorage.getItem('vhms_user_appointments')) || [];

            appts = appts.filter(a => {
                const isMock = String(a.doctorName || '').includes('Dr. Smith') || (a.date && String(a.date).length > 20);
                return !isMock;
            });

            // No need to revert completed future appointments
            let needsSave = false;
            // The map override was removed. We just keep appts as is.

            if (needsSave) {
                localStorage.setItem('vhms_user_appointments', JSON.stringify(appts));
            }
        } catch { }

        if (ownerId) {
            appts = appts.filter(a => a.ownerId === ownerId || a.petOwnerId === ownerId || a.petOwnerEmail === ownerId);
        }
        return appts;
    },

    async createAppointment(data) {
        let savedBackend = null;
        try {
            const payload = { ...data };
            if (payload.id && (payload.id.startsWith('APT-') || payload.id.startsWith('APP-'))) {
                delete payload.id;
            }
            const res = await fetch(`${API_BASE_URL}/legacy/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                savedBackend = await res.json();
            } else {
                console.warn("Backend createAppointment response error status:", res.status);
            }
        } catch (e) {
            console.warn("Backend create appointment error", e);
        }
        const finalAppt = savedBackend || { id: 'APT-' + Date.now(), ...data, status: data.status || 'PENDING' };
        try {
            const local = JSON.parse(localStorage.getItem('vhms_user_appointments') || '[]');
            if (!local.some(l => l.id === finalAppt.id)) {
                local.unshift(finalAppt);
                localStorage.setItem('vhms_user_appointments', JSON.stringify(local));
            }
        } catch { }
        return finalAppt;
    },

    async updateAppointment(id, data) {
        try {
            const res = await fetch(`${API_BASE_URL}/legacy/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("Backend update appointment error", e);
        }
        return { id, ...data };
    },

    // NOTIFICATIONS
    async getNotifications(userId, userEmail) {
        try {
            const targets = Array.from(new Set([userId, userEmail].filter(Boolean)));
            let curUser = null;
            try { curUser = JSON.parse(localStorage.getItem('vhms_user')); } catch {}
            if (curUser?.role === 'PET_OWNER' || curUser?.role === 'OWNER' || String(userId).toUpperCase() === 'USR-5001') {
                targets.push('USR-5001');
                targets.push('owner@example.com');
            }
            if (targets.length === 0) return null;
            const results = await Promise.all(
                targets.map(async (target) => {
                    try {
                        const res = await fetch(`${API_BASE_URL}/notifications/recipient/${encodeURIComponent(target)}`);
                        if (res.ok) {
                            const json = await res.json();
                            return Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
                        }
                    } catch {}
                    return [];
                })
            );
            const flat = results.flat();
            return flat.length > 0 ? flat : null;
        } catch (e) {
            console.warn("Backend getNotifications error, using local fallback", e);
        }
        return null;
    },

    async markNotificationRead(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("Backend markNotificationRead error", e);
        }
        return null;
    },

    async markNotificationUnread(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${id}/unread`, { method: 'PATCH' }).catch(() => {});
            if (res && res.ok) return await res.json();
        } catch (e) {
            console.warn("Backend markNotificationUnread error", e);
        }
        return null;
    },

    async markAllNotificationsRead(userId, userEmail) {
        try {
            const query = [];
            if (userId) query.push(`userId=${encodeURIComponent(userId)}`);
            if (userEmail) query.push(`userEmail=${encodeURIComponent(userEmail)}`);
            const qStr = query.length > 0 ? `?${query.join('&')}` : '';
            await fetch(`${API_BASE_URL}/notifications/read-all${qStr}`, { method: 'PUT' });
        } catch (e) {
            console.warn("Backend markAllNotificationsRead error", e);
        }
    },

    async deleteNotification(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' });
            return res.ok;
        } catch (e) {
            console.warn("Backend deleteNotification error", e);
        }
        return false;
    },

    async createNotification(data) {
        try {
            const payload = {
                recipientId: data.recipientId || data.userId || data.userEmail || '',
                recipientRole: data.recipientRole || data.role || 'PET_OWNER',
                recipientEmail: data.recipientEmail || data.userEmail || '',
                title: data.title || '',
                message: data.message || '',
                notificationType: data.type || data.notificationType || 'APPOINTMENT_REMINDER',
                referenceType: data.referenceType || 'APPOINTMENT',
                referenceId: data.referenceId || data.relatedEntityId || '',
                ...data
            };
            const res = await fetch(`${API_BASE_URL}/notifications/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("Backend createNotification error", e);
        }
        return { id: 'NOTIF-' + Date.now(), ...data };
    }
};
