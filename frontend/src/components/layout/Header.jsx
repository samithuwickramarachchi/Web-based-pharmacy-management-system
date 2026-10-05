import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, LogOut, ShieldCheck } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-search">
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search medicines, orders, customers (Ctrl+K)..."
          />
        </div>
      </div>

      <div className="header-right">
        {/* Branch / Status Indicator */}
        <div className="header-badge-status">
          <span className="status-dot"></span>
          <span>Dispensary #1 • Online</span>
        </div>

        {/* Notifications Panel (live badge + dropdown) */}
        <NotificationPanel />

        {/* User profile role pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={16} color="var(--color-primary)" />
          <span>{user?.username}</span>
        </div>

        {/* Logout Button */}
        <button
          className="icon-button"
          onClick={logout}
          title="Sign out of PharmaCare Pro"
          style={{ color: 'var(--color-danger)' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
