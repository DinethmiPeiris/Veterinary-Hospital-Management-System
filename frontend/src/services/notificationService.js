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

export const mapNotificationType = (type, title = '', message = '') => {
  const t = String(type || '').toUpperCase();
  const text = `${t} ${title} ${message}`.toUpperCase();

  if (t === 'INVOICE_GENERATED' || text.includes('INVOICE GENERATED') || text.includes('NEW MEDICAL BILL') || text.includes('NEW INVOICE')) {
    return 'INVOICE_GENERATED';
  }
  if (t === 'PAYMENT_REMINDER' || text.includes('PAYMENT REMINDER') || text.includes('ONLINE PAYMENT DUE') || text.includes('REMIND ONLINE PAY') || text.includes('PAY ONLINE')) {
    return 'PAYMENT_REMINDER';
  }
  if (t === 'PAYMENT_RECEIVED' || t === 'PAYMENT_SUCCESS' || text.includes('PAYMENT RECEIVED')) {
    return 'PAYMENT_RECEIVED';
  }
  if (t === 'PAYMENT_FAILED' || text.includes('PAYMENT FAILED')) {
    return 'PAYMENT_FAILED';
  }
  if (text.includes('HOSPITALIZATION RECOMMENDED') || text.includes('DISCHARGE RECOMMENDED') || text.includes('DISCHARGE REQUEST') || text.includes('REQUESTING DISCHARGE')) {
    return 'HOSPITALIZATION_RECOMMENDED';
  }
  if (text.includes('HOSPITALIZATION APPROVED') || text.includes('ADMISSION APPROVED') || text.includes('PET DISCHARGED') || text.includes('DISCHARGE CONFIRMED') || text.includes('DISCHARGE') || text.includes('DISCHARGED')) {
    return 'HOSPITALIZATION_APPROVED';
  }
  if (text.includes('HOSPITALIZATION REJECTED') || text.includes('ADMISSION REJECTED')) {
    return 'HOSPITALIZATION_REJECTED';
  }
  if (t === 'APPOINTMENT_CONFIRMED' || text.includes('APPOINTMENT CONFIRMED')) {
    return 'APPOINTMENT_CONFIRMED';
  }
  if (t === 'APPOINTMENT_CANCELLED' || text.includes('APPOINTMENT CANCELLED')) {
    return 'APPOINTMENT_CANCELLED';
  }
  if (t === 'APPOINTMENT_REJECTED' || text.includes('APPOINTMENT DECLINED') || text.includes('REJECTED')) {
    return 'APPOINTMENT_REJECTED';
  }
  if (t === 'APPOINTMENT_RESCHEDULED' || text.includes('RESCHEDULED')) {
    return 'APPOINTMENT_RESCHEDULED';
  }
  if (t === 'APPOINTMENT_ASSIGNED' || text.includes('ASSIGNED')) {
    return 'APPOINTMENT_ASSIGNED';
  }
  if (t === 'APPOINTMENT_REQUESTED' || text.includes('REQUESTED')) {
    return 'APPOINTMENT_REQUESTED';
  }
  if (text.includes('INVOICE') || text.includes('BILL')) {
    return 'INVOICE_GENERATED';
  }
  if (text.includes('PAYMENT') || text.includes('REMIND')) {
    return 'PAYMENT_REMINDER';
  }
  return 'APPOINTMENT_REMINDER';
};

const getLocalNotifications = (recipientId) => {
  try {
    let curUser = null;
    try { curUser = JSON.parse(localStorage.getItem('vhms_user')); } catch (e) {}

    const curAliases = new Set([
      recipientId && String(recipientId).toLowerCase(),
      curUser?.id && String(curUser.id).toLowerCase(),
      curUser?._id && String(curUser._id).toLowerCase(),
      curUser?.userId && String(curUser.userId).toLowerCase(),
      curUser?.email && String(curUser.email).toLowerCase(),
    ].filter(Boolean));

    const isPetOwner = curUser?.role === 'PET_OWNER' || curUser?.role === 'OWNER' || String(recipientId).toLowerCase() === 'usr-5001' || String(recipientId).toLowerCase() === 'owner@example.com';
    if (isPetOwner) {
      curAliases.add('usr-5001');
      curAliases.add('owner@example.com');
    }

    const list = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
    return list.filter((n) => {
      if (!n) return false;
      const rec = String(n.recipientId || '').toLowerCase();
      const recEmail = String(n.recipientEmail || n.userEmail || '').toLowerCase();
      if (rec === 'all') return true;
      if (curAliases.has(rec) || (recEmail && curAliases.has(recEmail))) return true;
      if (isPetOwner && (n.recipientRole === 'PET_OWNER' || n.referenceType === 'INVOICE' || String(n.type || n.notificationType || '').includes('INVOICE') || String(n.type || n.notificationType || '').includes('PAYMENT'))) {
        return true;
      }
      return false;
    });
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
      const targets = new Set();
      if (recipientId) targets.add(String(recipientId));
      let curUser = null;
      try { curUser = JSON.parse(localStorage.getItem('vhms_user')); } catch (e) {}
      if (curUser) {
        if (curUser.id) targets.add(String(curUser.id));
        if (curUser._id) targets.add(String(curUser._id));
        if (curUser.userId) targets.add(String(curUser.userId));
        if (curUser.email) targets.add(String(curUser.email));
      }
      if (curUser?.role === 'PET_OWNER' || curUser?.role === 'OWNER' || String(recipientId).toLowerCase() === 'usr-5001') {
        targets.add('USR-5001');
      }

      const results = await Promise.all(
        Array.from(targets).map((target) =>
          fetchWithTimeout(`${API_BASE_URL}/notifications/recipient/${encodeURIComponent(target)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => (json && json.success && Array.isArray(json.data) ? json.data : []))
            .catch(() => [])
        )
      );
      remoteList = results.flat();
    } catch (e) {}

    const localList = getLocalNotifications(recipientId);

    // Get set of explicitly read and unread IDs
    let readIds = new Set();
    let unreadIds = new Set();
    try {
      const storedRead = JSON.parse(localStorage.getItem('vhms_read_notification_ids') || '[]');
      const cleanStored = Array.isArray(storedRead) ? storedRead.filter((id) => id && !String(id).startsWith('ref_') && !String(id).startsWith('sig_')) : [];
      readIds = new Set(cleanStored.map(String));
      if (cleanStored.length !== storedRead.length) {
        localStorage.setItem('vhms_read_notification_ids', JSON.stringify(cleanStored));
      }

      const storedUnread = JSON.parse(localStorage.getItem('vhms_unread_notification_ids') || '[]');
      if (Array.isArray(storedUnread)) {
        unreadIds = new Set(storedUnread.map(String));
      }
    } catch (e) {}

    // Put remote notifications first (they are authoritative), then local ones
    const allNotifications = [...remoteList, ...localList];
    const deduplicated = [];

    allNotifications.forEach((item) => {
      if (!item) return;

      const isExplicitlyUnread = Boolean(item.id && unreadIds.has(String(item.id)));
      const isExplicitlyRead = Boolean(item.id && readIds.has(String(item.id)));
      const itemIsRead = isExplicitlyUnread ? false : (isExplicitlyRead || Boolean(item.read === true || item.isRead === true));

      const existingIdx = deduplicated.findIndex((existing) => isNotificationDuplicate(existing, item));

      if (existingIdx === -1) {
        deduplicated.push({
          ...item,
          read: itemIsRead,
          isRead: itemIsRead,
        });
      } else {
        const existing = deduplicated[existingIdx];
        const existingIsExplicitlyUnread = Boolean(existing.id && unreadIds.has(String(existing.id)));
        const existingIsExplicitlyRead = Boolean(existing.id && readIds.has(String(existing.id)));
        const existingIsRead = existingIsExplicitlyUnread ? false : (existingIsExplicitlyRead || Boolean(existing.read === true || existing.isRead === true));

        let finalRead = false;
        if (existingIsExplicitlyUnread || isExplicitlyUnread) {
          finalRead = false;
        } else if (existingIsExplicitlyRead || isExplicitlyRead) {
          finalRead = true;
        } else {
          // If either local or remote marks it as read, preserve it as read (do not revert to unread)
          finalRead = Boolean(existingIsRead || itemIsRead);
        }

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
    if (!notificationData?.recipientId) {
      return { success: false, message: 'recipientId is required' };
    }

    const validType = mapNotificationType(
      notificationData.notificationType || notificationData.type,
      notificationData.title,
      notificationData.message
    );

    const list = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
    const localId = 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const newNotif = {
      id: localId,
      recipientId: notificationData.recipientId,
      recipientEmail: notificationData.recipientEmail || '',
      recipientRole: notificationData.recipientRole || 'PET_OWNER',
      title: notificationData.title,
      message: notificationData.message,
      type: validType,
      notificationType: validType,
      referenceType: notificationData.referenceType || 'INVOICE',
      referenceId: notificationData.referenceId || '',
      isRead: false,
      read: false,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    localStorage.setItem('vhms_epic4_notifications', JSON.stringify(list));
    
    // Save to recipientId's specific bucket and alias buckets
    const targetKeys = new Set([`vhms_notifications_${notificationData.recipientId}`]);
    if (notificationData.recipientEmail) {
      targetKeys.add(`vhms_notifications_${notificationData.recipientEmail}`);
    }

    const isPetOwnerNotif = notificationData.recipientRole === 'PET_OWNER' ||
      String(notificationData.recipientId).startsWith('USR-') ||
      validType.includes('INVOICE') ||
      validType.includes('PAYMENT') ||
      validType.includes('HOSPITALIZ') ||
      validType.includes('DISCHARGE') ||
      notificationData.referenceType === 'HOSPITALIZATION' ||
      notificationData.referenceType === 'ADMISSION';

    if (isPetOwnerNotif) {
      targetKeys.add('vhms_notifications_USR-5001');
      targetKeys.add('vhms_notifications_usr-5001');
      targetKeys.add('vhms_notifications_owner@example.com');
    }

    let extraRegisteredOwner = null;
    try {
      const regUsers = JSON.parse(localStorage.getItem('vhms_registered_users') || '[]');
      const cachedUsers = JSON.parse(localStorage.getItem('vhms_all_users_cache') || '[]');
      const curUser = JSON.parse(localStorage.getItem('vhms_user') || 'null');
      const allUsers = [...regUsers, ...cachedUsers, ...(curUser ? [curUser] : [])];
      
      allUsers.forEach(u => {
        if (!u) return;
        const matchesUser = 
          (u.id && String(u.id) === String(notificationData.recipientId)) ||
          (u._id && String(u._id) === String(notificationData.recipientId)) ||
          (u.email && String(u.email).toLowerCase() === String(notificationData.recipientId).toLowerCase()) ||
          (notificationData.recipientEmail && u.email && String(u.email).toLowerCase() === String(notificationData.recipientEmail).toLowerCase()) ||
          (isPetOwnerNotif && (u.role === 'PET_OWNER' || u.role === 'OWNER'));

        if (matchesUser) {
          if (u.id) targetKeys.add(`vhms_notifications_${u.id}`);
          if (u._id) targetKeys.add(`vhms_notifications_${u._id}`);
          if (u.email) targetKeys.add(`vhms_notifications_${u.email}`);
          if (isPetOwnerNotif && !extraRegisteredOwner && (u.id || u._id)) {
            extraRegisteredOwner = u;
          }
        }
      });
    } catch (e) {}

    targetKeys.forEach(userKey => {
      try {
        const userList = JSON.parse(localStorage.getItem(userKey) || '[]');
        userList.unshift(newNotif);
        localStorage.setItem(userKey, JSON.stringify(userList));
      } catch (e) {}
    });

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('vhms_notifications_changed'));
    window.dispatchEvent(new CustomEvent('vhms_invoices_changed'));

    // Post to backend with clean payload (omit sentAt so Jackson does not throw DateTimeParseException)
    try {
      const backendPayload = {
        recipientId: String(newNotif.recipientId),
        recipientRole: newNotif.recipientRole || 'PET_OWNER',
        recipientEmail: newNotif.recipientEmail || '',
        recipientPhone: newNotif.recipientPhone || '',
        notificationType: validType,
        title: newNotif.title,
        message: newNotif.message,
        referenceType: newNotif.referenceType || 'INVOICE',
        referenceId: newNotif.referenceId || '',
        isRead: false,
      };

      const res = await fetchWithTimeout(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
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

      // If sent to generic USR-5001 and we found a real registered pet owner, also post to their ID on backend
      if (extraRegisteredOwner && String(newNotif.recipientId) === 'USR-5001' && (extraRegisteredOwner.id || extraRegisteredOwner._id)) {
        const realId = String(extraRegisteredOwner.id || extraRegisteredOwner._id);
        fetchWithTimeout(`${API_BASE_URL}/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...backendPayload,
            recipientId: realId,
            recipientEmail: extraRegisteredOwner.email || backendPayload.recipientEmail,
          }),
        }).catch(() => {});
      }
    } catch (e) {}

    return { success: true, data: newNotif };
  },

  async markAsRead(notificationId, optionalNotification = null) {
    try {
      const storedRead = JSON.parse(localStorage.getItem('vhms_read_notification_ids') || '[]');
      const set = new Set(storedRead.map(String).filter((id) => id && !id.startsWith('ref_') && !id.startsWith('sig_')));
      if (notificationId) set.add(String(notificationId));
      if (optionalNotification && optionalNotification.id) {
        set.add(String(optionalNotification.id));
      }
      localStorage.setItem('vhms_read_notification_ids', JSON.stringify(Array.from(set)));

      // Remove from unreadIds
      const storedUnread = JSON.parse(localStorage.getItem('vhms_unread_notification_ids') || '[]');
      const unreadFiltered = storedUnread.filter(id => id !== String(notificationId) && (!optionalNotification?.id || id !== String(optionalNotification.id)));
      localStorage.setItem('vhms_unread_notification_ids', JSON.stringify(unreadFiltered));

      const updateList = (list) => {
        let changed = false;
        list.forEach((n) => {
          if (!n) return;
          const match =
            (notificationId && String(n.id) === String(notificationId)) ||
            (optionalNotification && (
              (optionalNotification.id && String(n.id) === String(optionalNotification.id)) ||
              (n.title === optionalNotification.title && n.message === optionalNotification.message)
            ));
          if (match) {
            n.read = true;
            n.isRead = true;
            changed = true;
          }
        });
        return changed;
      };

      const epicList = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
      if (updateList(epicList)) {
        localStorage.setItem('vhms_epic4_notifications', JSON.stringify(epicList));
      }

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('vhms_notifications_')) {
          try {
            const bucket = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(bucket) && updateList(bucket)) {
              localStorage.setItem(k, JSON.stringify(bucket));
            }
          } catch (e) {}
        }
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

  async markAsUnread(notificationId, optionalNotification = null) {
    try {
      // Add to unreadIds
      const storedUnread = JSON.parse(localStorage.getItem('vhms_unread_notification_ids') || '[]');
      const unreadSet = new Set(storedUnread.map(String));
      if (notificationId) unreadSet.add(String(notificationId));
      if (optionalNotification && optionalNotification.id) {
        unreadSet.add(String(optionalNotification.id));
      }
      localStorage.setItem('vhms_unread_notification_ids', JSON.stringify(Array.from(unreadSet)));

      // Remove from readIds
      const storedRead = JSON.parse(localStorage.getItem('vhms_read_notification_ids') || '[]');
      const readFiltered = storedRead.filter(id => id !== String(notificationId) && (!optionalNotification?.id || id !== String(optionalNotification.id)));
      localStorage.setItem('vhms_read_notification_ids', JSON.stringify(readFiltered));

      const updateList = (list) => {
        let changed = false;
        list.forEach((n) => {
          if (!n) return;
          const match =
            (notificationId && String(n.id) === String(notificationId)) ||
            (optionalNotification && (
              (optionalNotification.id && String(n.id) === String(optionalNotification.id)) ||
              (n.title === optionalNotification.title && n.message === optionalNotification.message)
            ));
          if (match) {
            n.read = false;
            n.isRead = false;
            changed = true;
          }
        });
        return changed;
      };

      const epicList = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
      if (updateList(epicList)) {
        localStorage.setItem('vhms_epic4_notifications', JSON.stringify(epicList));
      }

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('vhms_notifications_')) {
          try {
            const bucket = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(bucket) && updateList(bucket)) {
              localStorage.setItem(k, JSON.stringify(bucket));
            }
          } catch (e) {}
        }
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vhms_notifications_changed'));
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
        if (recipientId && String(n.recipientId || '') === String(recipientId)) {
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

  async deleteNotification(notificationId) {
    try {
      const list = JSON.parse(localStorage.getItem('vhms_epic4_notifications') || '[]');
      const filtered = list.filter((n) => n.id !== notificationId);
      localStorage.setItem('vhms_epic4_notifications', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('vhms_notifications_changed'));
    } catch (e) {}
    return { success: true };
  },
};
