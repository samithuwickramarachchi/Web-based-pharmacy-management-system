import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Package, AlertTriangle, Info, Clock } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationService';

/**
 * NotificationPanel
 * A self-contained bell-button + dropdown panel that:
 *  1. Shows a live unread count badge on the Bell icon.
 *  2. Opens/closes a dropdown panel on click.
 *  3. Fetches notifications from GET /api/notifications.
 *  4. Marks individual or all notifications read via the backend.
 *  5. Closes when the user clicks outside the panel.
 */
export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // ─── Fetch unread count (for the badge) ──────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch {
      // Silently fail — badge just stays at last known value
    }
  }, []);

  // ─── Fetch all notifications (when panel opens) ───────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30 seconds while mounted
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Fetch full list whenever the panel is opened
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleToggle = () => setOpen((prev) => !prev);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const typeIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':      return <AlertTriangle size={14} style={{ color: '#f59e0b' }} />;
      case 'EXPIRY_WARNING': return <Clock size={14} style={{ color: '#ef4444' }} />;
      case 'NEW_ORDER':      return <Package size={14} style={{ color: '#3b82f6' }} />;
      default:               return <Info size={14} style={{ color: '#6b7280' }} />;
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        className="icon-button"
        title="Notifications"
        onClick={handleToggle}
        aria-label="Toggle notifications panel"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="icon-button-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          {/* Header */}
          <div className="notif-panel-header">
            <span className="notif-panel-title">
              Notifications
              {unreadCount > 0 && (
                <span className="notif-count-pill">{unreadCount} unread</span>
              )}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  className="notif-mark-all-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                className="icon-button"
                style={{ width: 28, height: 28, border: 'none' }}
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="notif-panel-body">
            {loading ? (
              <div className="notif-empty">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <span>No notifications yet</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item${n.isRead ? '' : ' notif-item--unread'}`}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  role={!n.isRead ? 'button' : undefined}
                  tabIndex={!n.isRead ? 0 : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && !n.isRead && handleMarkRead(n.id)}
                >
                  <div className="notif-item-icon">{typeIcon(n.type)}</div>
                  <div className="notif-item-content">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
