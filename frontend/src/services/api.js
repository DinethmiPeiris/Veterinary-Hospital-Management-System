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
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/approve`, {
            method: 'PUT',
        });
        const approvedUser = await res.json();
        
        // Auto-migrate orphaned pets AND appointments! 
        // When a PO-XXXX mock ID is approved into a real Mongo ID, we MUST update their data to match the new ID.
        try {
            if (approvedUser && approvedUser.id && String(approvedUser.id) !== String(id)) {
                // 1. Migrate Pets
                const pets = await this.getPets();
                const petsToMigrate = pets.filter(p => String(p.ownerId) === String(id));
                for (const p of petsToMigrate) {
                    await this.updatePet(p.id || p.petId, { ...p, ownerId: approvedUser.id });
                }
                
                // 2. Migrate Appointments
                const apptsRes = await fetch(`${API_BASE_URL}/appointments`);
                if (apptsRes.ok) {
                    const apptsRaw = await apptsRes.json();
                    const apptsArray = apptsRaw.data || apptsRaw;
                    if (Array.isArray(apptsArray)) {
                        const apptsToMigrate = apptsArray.filter(a => String(a.petOwnerId) === String(id) || String(a.ownerId) === String(id));
                        for (const a of apptsToMigrate) {
                            await this.updateAppointment(a.id, { 
                                ...a, 
                                petOwnerId: a.petOwnerId === id ? approvedUser.id : a.petOwnerId,
                                ownerId: a.ownerId === id ? approvedUser.id : a.ownerId 
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Failed to migrate data upon approval", e);
        }
        
        return approvedUser;
    },

    async rejectUser(id) {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/reject`, {
            method: 'PUT',
        });
        return res.json();
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
                        const known = new Set(doctors.map(d => String(d.email || '').toLowerCase()));
                        directory.forEach(d => {
                            if (!known.has(String(d.email || '').toLowerCase())) doctors.push(d);
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
            }).map(a => {
                if (a.status === 'COMPLETED' && (a.date && a.date > todayStr)) {
                    return { ...a, status: 'APPROVED' };
                }
                return a;
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

            // Apply strict future date reversion for local storage data
            let needsSave = false;
            appts = appts.map(a => {
                if (a.status === 'COMPLETED' && (a.date && a.date > todayStr)) {
                    needsSave = true;
                    return { ...a, status: 'APPROVED' };
                }
                return a;
            });

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
            // The backend endpoint is /api/v1/notifications/recipient/{recipientId}
            if (!userId) return null;
            const res = await fetch(`${API_BASE_URL}/notifications/recipient/${encodeURIComponent(userId)}`);
            if (res.ok) {
                const json = await res.json();
                // The backend returns an ApiResponse wrapper: { data: [...] }
                return json.data || json;
            }
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
            const res = await fetch(`${API_BASE_URL}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("Backend createNotification error", e);
        }
        return { id: 'NOTIF-' + Date.now(), ...data };
    }
};
