import API_BASE_URL from './apiConfig';

const fetchWithTimeout = async (url, options = {}, timeoutMs = 2000) => {
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

const getLocalNotifications = (recipientId) => {
  try {
    const list = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
    return list.filter((n) => !recipientId || n.recipientId === recipientId || n.recipientId === 'ALL');
  } catch (e) {
    return [];
  }
};

const extractRefId = (n) => {
  if (!n) return '';
  if (n.appointmentNumber && String(n.appointmentNumber).startsWith('APT-')) return String(n.appointmentNumber).toUpperCase();
  if (n.invoiceNumber && String(n.invoiceNumber).startsWith('INV-')) return String(n.invoiceNumber).toUpperCase();
  if (n.referenceId && /^(?:APT|INV|PAY|BILL)-\d+/i.test(n.referenceId)) return String(n.referenceId).toUpperCase();
  if (n.appointmentId && /^(?:APT|INV|PAY|BILL)-\d+/i.test(n.appointmentId)) return String(n.appointmentId).toUpperCase();

  const text = `${n.title || ''} ${n.message || ''}`;
  const match = text.match(/\b(?:APT|INV|PAY|BILL)-\d+\b/i) || text.match(/\b(?:APT|INV|PAY|BILL)-[A-Z0-9-]+\b/i);
  if (match) return match[0].toUpperCase();

  if (n.referenceId && !n.referenceId.startsWith('note-') && !n.referenceId.startsWith('NOTIF-')) {
    return String(n.referenceId).trim().toUpperCase();
  }
  return '';
};

const extractAppointmentKey = (n) => {
  if (!n) return '';
  const text = `${n.title || ''} ${n.message || ''}`;
  const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  const timeMatch = text.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/) || text.match(/\d{1,2}:\d{2}/);
  const petMatch = text.match(/(?:for|patient)\s+([A-Za-z0-9]+)/i);

  const date = dateMatch ? dateMatch[0] : '';
  const time = timeMatch ? timeMatch[0].replace(/\s+/g, '') : '';
  const pet = petMatch ? petMatch[1].toLowerCase() : '';

  if (date || pet || time) {
    return `${pet}_${date}_${time}`;
  }
  return '';
};

const getNotificationCategory = (n) => {
  if (!n) return '';
  const text = `${n.title || ''} ${n.message || ''} ${n.type || ''} ${n.notificationType || ''}`.toLowerCase();
  if (text.includes('expired') || text.includes('no-show')) return 'EXPIRED';
  if (text.includes('cancel') || text.includes('declined') || text.includes('reject')) return 'CANCELLED';
  if (text.includes('reschedule') || text.includes('resubmit')) return 'RESCHEDULED';
  if (text.includes('assign') || text.includes('allocat')) return 'ASSIGNED';
  if (text.includes('confirm') || text.includes('approved')) return 'CONFIRMED';
  if (text.includes('completed') || text.includes('finished')) return 'COMPLETED';
  if (text.includes('payment') || text.includes('paid')) return 'PAYMENT';
  if (text.includes('reminder') || text.includes('remind')) return 'REMINDER';
  if (text.includes('invoice') || text.includes('bill')) return 'INVOICE';
  return (n.title || '').trim().toLowerCase();
};

export const parseNotificationTime = (dateVal) => {
  if (!dateVal) return 0;
  if (Array.isArray(dateVal)) {
    return new Date(dateVal[0], (dateVal[1] || 1) - 1, dateVal[2] || 1, dateVal[3] || 0, dateVal[4] || 0, dateVal[5] || 0).getTime();
  }
  const t = new Date(dateVal).getTime();
  return isNaN(t) ? 0 : t;
};

const cleanText = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const isNotificationDuplicate = (a, b) => {
  if (!a || !b) return false;
  if (a.id && b.id && String(a.id) === String(b.id)) return true;

  // Must belong to the same recipient (or ALL)
  const recA = String(a.recipientId || '').toUpperCase();
  const recB = String(b.recipientId || '').toUpperCase();
  if (recA && recB && recA !== recB && recA !== 'ALL' && recB !== 'ALL') {
    return false;
  }

  const catA = getNotificationCategory(a);
  const catB = getNotificationCategory(b);
  if (catA !== catB) {
    const isAssignConfirm =
      (catA === 'ASSIGNED' && catB === 'CONFIRMED') ||
      (catA === 'CONFIRMED' && catB === 'ASSIGNED');
    if (!isAssignConfirm) return false;
  }

  const timeA = parseNotificationTime(a.sentAt || a.createdAt);
  const timeB = parseNotificationTime(b.sentAt || b.createdAt);

  // If both have timestamps, they must occur within 20 seconds of each other
  if (timeA > 0 && timeB > 0) {
    const timeDiffMs = Math.abs(timeA - timeB);
    if (timeDiffMs > 20000) {
      return false;
    }
  }

  const refA = extractRefId(a);
  const refB = extractRefId(b);

  const keyA = extractAppointmentKey(a);
  const keyB = extractAppointmentKey(b);

  // 1. Same reference ID (e.g. APT-0012)
  if (refA && refB && refA === refB) {
    return true;
  }

  // 2. Same appointment signature (pet_date_slot)
  if (keyA && keyB && keyA === keyB && keyA.length > 3) {
    return true;
  }

  // 3. Identical normalized message text
  const msgA = cleanText(a.message);
  const msgB = cleanText(b.message);
  if (msgA && msgB && msgA === msgB) {
    return true;
  }

  return false;
};

export const notificationService = {
  // Get notifications for recipient (Pet Owner / Doctor / Admin)
  async getNotifications(recipientId) {
    let remoteList = [];
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/recipient/${recipientId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) remoteList = json.data;
      }
    } catch (e) {}

    const localList = getLocalNotifications(recipientId);

    // Get set of explicitly read IDs (cleanse any corrupted wildcard keys)
    let readIds = new Set();
    try {
      const storedRead = JSON.parse(localStorage.getItem('vhms_read_notification_ids') || '[]');
      const cleanStored = Array.isArray(storedRead) ? storedRead.filter((id) => id && !String(id).startsWith('ref_') && !String(id).startsWith('sig_')) : [];
      readIds = new Set(cleanStored);
      if (cleanStored.length !== storedRead.length) {
        localStorage.setItem('vhms_read_notification_ids', JSON.stringify(cleanStored));
      }
    } catch (e) {}

    // Put remote notifications first (they are authoritative), then local ones
    const allNotifications = [...remoteList, ...localList];
    const deduplicated = [];

    allNotifications.forEach((item) => {
      if (!item) return;

      const isExplicitlyRead = Boolean(item.id && readIds.has(item.id));
      const itemIsRead = isExplicitlyRead || Boolean(item.read === true || item.isRead === true);

      const existingIdx = deduplicated.findIndex((existing) => isNotificationDuplicate(existing, item));

      if (existingIdx === -1) {
        deduplicated.push({
          ...item,
          read: itemIsRead,
          isRead: itemIsRead,
        });
      } else {
        const existing = deduplicated[existingIdx];
        const existingIsExplicitlyRead = Boolean(existing.id && readIds.has(existing.id));
        const existingIsRead = existingIsExplicitlyRead || Boolean(existing.read === true || existing.isRead === true);

        // Keep unread if either is a fresh unread notification and neither was explicitly marked read in readIds
        const finalRead = (existingIsExplicitlyRead || isExplicitlyRead)
          ? true
          : (existingIsRead && itemIsRead);

        const isExistingDbId = existing.id && !existing.id.startsWith('note-') && !existing.id.startsWith('NOTIF-') && !existing.id.startsWith('notif-');
        const isItemDbId = item.id && !item.id.startsWith('note-') && !item.id.startsWith('NOTIF-') && !item.id.startsWith('notif-');
        const finalId = isItemDbId ? item.id : (isExistingDbId ? existing.id : (existing.id || item.id));
        const finalSentAt = existing.sentAt || item.sentAt || existing.createdAt || item.createdAt;

        const finalTitle = (existing.title && existing.title.length >= (item.title || '').length) ? existing.title : item.title;
        const finalMsg = (existing.message && existing.message.length >= (item.message || '').length) ? existing.message : item.message;

        deduplicated[existingIdx] = {
          ...item,
          ...existing,
          id: finalId,
          title: finalTitle,
          message: finalMsg,
          sentAt: finalSentAt,
          read: finalRead,
          isRead: finalRead,
        };
      }
    });

    // Auto-clean local storage to permanently remove duplicate records
    try {
      const storedLocal = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
      if (Array.isArray(storedLocal)) {
        const cleanedLocal = [];
        storedLocal.forEach((loc) => {
          if (!loc) return;
          const isDup = cleanedLocal.some((c) => isNotificationDuplicate(c, loc));
          if (!isDup) cleanedLocal.push(loc);
        });
        if (cleanedLocal.length !== storedLocal.length) {
          localStorage.setItem('vhms_epic4_notifications', JSON.stringify(cleanedLocal));
        }
      }
    } catch (e) {}

    return { success: true, data: deduplicated };
  },

  async getUnreadNotifications(recipientId) {
    const all = await this.getNotifications(recipientId);
    const unread = (all.data || []).filter((n) => !n.read && !n.isRead);
    return { success: true, data: unread };
  },

  async getUnreadCount(recipientId) {
    const unread = await this.getUnreadNotifications(recipientId);
    return { success: true, data: (unread.data || []).length };
  },

  async sendNotification(notificationData) {
    const list = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
    const localId = 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const newNotif = {
      id: localId,
      recipientId: notificationData.recipientId || 'USR-5001',
      recipientRole: notificationData.recipientRole || 'PET_OWNER',
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'PAYMENT_REMINDER',
      notificationType: notificationData.notificationType || notificationData.type || 'PAYMENT_REMINDER',
      referenceType: notificationData.referenceType || 'INVOICE',
      referenceId: notificationData.referenceId || '',
      isRead: false,
      read: false,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    localStorage.setItem('vhms_epic4_notifications', JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('vhms_notifications_changed'));

    // Also attempt to post to backend
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.id) {
          const curList = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
          const target = curList.find((n) => n.id === localId);
          if (target) {
            target.id = json.data.id;
            localStorage.setItem('vhms_epic4_notifications', JSON.stringify(curList));
          }
        }
      }
    } catch (e) {}

    return { success: true, data: newNotif };
  },

  async markAsRead(notificationId, optionalNotification = null) {
    try {
      const storedRead = JSON.parse(localStorage.getItem('vhms_read_notification_ids') || '[]');
      const set = new Set(storedRead.filter((id) => id && !String(id).startsWith('ref_') && !String(id).startsWith('sig_')));
      if (notificationId) set.add(notificationId);
      if (optionalNotification && optionalNotification.id) {
        set.add(optionalNotification.id);
      }
      localStorage.setItem('vhms_read_notification_ids', JSON.stringify(Array.from(set)));

      const list = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
      let updated = false;
      list.forEach((n) => {
        if (
          (notificationId && n.id === notificationId) ||
          (optionalNotification && (
            (optionalNotification.id && n.id === optionalNotification.id) ||
            (n.title === optionalNotification.title && n.message === optionalNotification.message)
          ))
        ) {
          n.read = true;
          n.isRead = true;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('vhms_epic4_notifications', JSON.stringify(list));
      }
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vhms_notifications_changed'));
    } catch (e) {}

    // Also notify backend if valid remote ID
    try {
      const targetId = optionalNotification?.id || notificationId;
      if (targetId && !targetId.startsWith('note-') && !targetId.startsWith('NOTIF-') && !targetId.startsWith('notif-')) {
        await fetchWithTimeout(`${API_BASE_URL}/notifications/${targetId}/read`, {
          method: 'PATCH',
        });
      }
    } catch (e) {}

    return { success: true };
  },

  async markAllAsRead(recipientId) {
    try {
      const all = await this.getNotifications(recipientId);
      const storedRead = JSON.parse(localStorage.getItem('vhms_read_notification_ids') || '[]');
      const set = new Set(storedRead.filter((id) => id && !String(id).startsWith('ref_') && !String(id).startsWith('sig_')));
      (all.data || []).forEach((n) => {
        if (n.id) set.add(n.id);
      });
      localStorage.setItem('vhms_read_notification_ids', JSON.stringify(Array.from(set)));

      const list = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
      list.forEach((n) => {
        if (!recipientId || n.recipientId === recipientId || n.recipientId === 'ALL') {
          n.read = true;
          n.isRead = true;
        }
      });
      localStorage.setItem('vhms_epic4_notifications', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vhms_notifications_changed'));
    } catch (e) {}

    // Update backend unread notifications
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/unread/${recipientId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          for (const item of json.data) {
            fetchWithTimeout(`${API_BASE_URL}/notifications/${item.id}/read`, { method: 'PATCH' }).catch(() => {});
          }
        }
      }
    } catch (e) {}

    return { success: true };
  },
};
