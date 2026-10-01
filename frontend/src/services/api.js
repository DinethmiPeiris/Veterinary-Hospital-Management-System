const API_BASE_URL = 'http://localhost:8080/api';

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
        return res.json();
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
        return res.json();
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
        const url = ownerId ? `${API_BASE_URL}/pets?ownerId=${ownerId}` : `${API_BASE_URL}/pets`;
        const res = await fetch(url);
        return res.json();
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
            if (Array.isArray(users)) {
                return users.filter(u => u.role === 'DOCTOR');
            }
            return [];
        } catch {
            return [];
        }
    },

    async getAppointments(ownerId) {
        let backendData = null;
        try {
            const url = ownerId ? `${API_BASE_URL}/appointments/owner/${ownerId}` : `${API_BASE_URL}/appointments`;
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
            const res = await fetch(`${API_BASE_URL}/appointments`, {
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
            const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
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
            const query = [];
            if (userId) query.push(`userId=${encodeURIComponent(userId)}`);
            if (userEmail) query.push(`userEmail=${encodeURIComponent(userEmail)}`);
            const qStr = query.length > 0 ? `?${query.join('&')}` : '';
            const res = await fetch(`${API_BASE_URL}/notifications${qStr}`);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            console.warn("Backend getNotifications error, using local fallback", e);
        }
        return null;
    },

    async markNotificationRead(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PUT' });
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
