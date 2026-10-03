import { useState, useEffect, useRef } from 'react';
import { notificationService, parseNotificationTime } from '../../services/notificationService';

const formatSentDate = (dateVal) => {
  if (!dateVal) return '';
  if (Array.isArray(dateVal)) {
    const d = new Date(dateVal[0], (dateVal[1] || 1) - 1, dateVal[2] || 1, dateVal[3] || 0, dateVal[4] || 0, dateVal[5] || 0);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleString();
};

export default function NotificationBell({ recipientId = 'USR-5001' }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const bellContainerRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 2000);
    const handleUpdate = () => loadNotifications();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('vhms_notifications_changed', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('vhms_notifications_changed', handleUpdate);
    };
  }, [recipientId]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (bellContainerRef.current && !bellContainerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getNotifications(recipientId);
      if (res && res.success && Array.isArray(res.data)) {
        const sortedNotifications = [...res.data].sort((a, b) => {
          const tA = parseNotificationTime(a.sentAt || a.createdAt);
          const tB = parseNotificationTime(b.sentAt || b.createdAt);
          return tB - tA;
        });
        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.filter((n) => n.read !== true && n.isRead !== true).length);
      }
    } catch (e) {
      console.warn('Notifications not yet loaded:', e);
    }
  };

  const handleToggleOpen = (e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleMarkRead = async (notification) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id || (n.title === notification.title && n.message === notification.message)
          ? { ...n, read: true, isRead: true }
          : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setSelectedNotification({ ...notification, read: true, isRead: true });
    await notificationService.markAsRead(notification.id, notification);
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, isRead: true }))
    );
    await notificationService.markAllAsRead(recipientId);
    await loadNotifications();
  };

  return (
    <div ref={bellContainerRef} style={{ position: 'relative' }}>
      <button
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleToggleOpen}
        title="Notifications & Alerts"
        style={{ position: 'relative', cursor: 'pointer' }}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            width: '350px',
            maxHeight: '430px',
            overflowY: 'auto',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
            border: '1px solid #e2e8f0',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Notifications</h4>
              {unreadCount > 0 && (
                <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 ? (
              <button
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }}
              >
                ✓ Mark all read
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>All caught up</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '1.5rem 0' }}>
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => {
              const isRead = Boolean(n.read === true || n.isRead === true);
              return (
                <div
                  key={n.id || (n.title + n.sentAt)}
                  onClick={() => handleMarkRead(n)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: isRead ? '#ffffff' : '#f0f7ff',
                    border: isRead ? '1px solid #e2e8f0' : '1px solid #bfdbfe',
                    borderLeft: isRead ? '1px solid #e2e8f0' : '4px solid #2563eb',
                    marginBottom: '0.55rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ fontWeight: isRead ? '600' : '700', color: '#0f172a', paddingRight: '8px' }}>
                      {n.title}
                    </div>
                    {!isRead && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        background: '#2563eb', 
                        color: '#ffffff', 
                        padding: '0.15rem 0.45rem', 
                        borderRadius: '9999px', 
                        fontWeight: '800', 
                        letterSpacing: '0.5px',
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(37,99,235,0.3)'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    color: isRead ? '#64748b' : '#334155', 
                    fontSize: '0.8rem', 
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                    <span>{formatSentDate(n.sentAt || n.createdAt)}</span>
                    {!isRead && (
                      <span style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.7rem' }}>Click to read</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedNotification && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setSelectedNotification(null)}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🔔</span>
              <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedNotification.title}</h3>
            </div>
            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {selectedNotification.message}
            </p>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              Received: {formatSentDate(selectedNotification.sentAt || selectedNotification.createdAt)}
            </div>
            <button 
              onClick={() => setSelectedNotification(null)}
              style={{
                width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#2563eb'}
              onMouseOut={(e) => e.target.style.background = '#3b82f6'}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
