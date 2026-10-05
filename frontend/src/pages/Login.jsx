import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole } from '../utils/roleUtils';
import { Cross, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export function Login() {
  const location = useLocation();
  const registeredEmail = location.state?.registeredEmail || '';
  const [username, setUsername] = useState(registeredEmail || 'admin');
  const [password, setPassword] = useState(registeredEmail ? '' : 'password');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(
    location.state?.registeredSuccess ? 'Account created successfully! Please sign in below.' : ''
  );
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await login(username.trim(), password);
      const isCustomer = hasAnyRole(result?.user, ['CUSTOMER']);
      const stateFrom = location.state?.from?.pathname;

      if (stateFrom && stateFrom !== '/dashboard') {
        navigate(stateFrom, { replace: true });
      } else if (isCustomer) {
        navigate('/', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Background glowing effects */}
      <div className="login-bg-orb-1" />
      <div className="login-bg-orb-2" />

      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-brand-icon">
            <Cross size={28} strokeWidth={2.6} />
          </div>
          <h1 className="login-title">PharmaCare Pro</h1>
          <p className="login-subtitle">
            Sign in to access pharmacy ERP & dispensary management
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-alert" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username, Customer Email or Staff ID
            </label>
            <div className="input-with-icon">
              <User size={18} className="input-icon-left" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="e.g. customer@example.com or admin"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (successMsg) setSuccessMsg('');
                }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => setError('Password Reset: Please contact your pharmacy administrator or support team to reset your password.')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.78rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon-left" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Customer Registration Callout */}
        <div
          style={{
            marginTop: '18px',
            padding: '12px 14px',
            background: 'var(--color-primary-light)',
            border: '1.5px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--color-primary-active)' }}>
            New customer?{' '}
          </span>
          <Link
            to="/register"
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-primary-active)',
              fontWeight: 800,
              textDecoration: 'underline',
            }}
          >
            Create Customer Account / Register
          </Link>
        </div>

        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Link
            to="/"
            style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            ← Return to Pharmacy Storefront
          </Link>
        </div>

        {/* Professional Pharmacy Visual Section */}
        <div className="login-pharmacy-visual" aria-hidden="true">
          <div className="pharmacy-visual-banner">
            <svg
              className="pharmacy-visual-svg"
              viewBox="0 0 360 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>
                <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="capsuleTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="capsuleWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <linearGradient id="tabletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="glowG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ccfbf1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f0fdfa" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Soft background aura */}
              <rect x="0" y="0" width="360" height="110" rx="14" fill="url(#glowG)" />

              {/* Medicine Bottle */}
              <g transform="translate(24, 14)">
                {/* Bottle Cap */}
                <rect x="18" y="2" width="28" height="10" rx="3" fill="url(#capGrad)" />
                <rect x="15" y="10" width="34" height="4" rx="2" fill="#475569" />
                {/* Bottle Body */}
                <rect x="10" y="14" width="44" height="66" rx="8" fill="url(#bottleGrad)" />
                <path d="M10 24 C10 16 16 14 24 14 L40 14 C48 14 54 16 54 24 Z" fill="#0b7268" opacity="0.3" />
                {/* Measurement Markings */}
                <line x1="14" y1="30" x2="20" y2="30" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="14" y1="40" x2="24" y2="40" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="50" x2="20" y2="50" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="14" y1="60" x2="24" y2="60" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" />
                {/* Rx / Cross Label */}
                <rect x="23" y="32" width="26" height="34" rx="4" fill="#ffffff" />
                <rect x="33" y="40" width="6" height="18" rx="1.5" fill="#0d9488" />
                <rect x="27" y="46" width="18" height="6" rx="1.5" fill="#0d9488" />
                {/* Gloss Sheen */}
                <path d="M48 20 L50 20 C51 20 52 21 52 23 L52 72 C52 74 51 75 50 75 L48 75 Z" fill="#ffffff" opacity="0.25" />
              </g>

              {/* Blister Pack / Tablet Strip */}
              <g transform="translate(94, 20)">
                <rect x="0" y="0" width="42" height="68" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                {/* 6 foil pill pockets */}
                <circle cx="13" cy="18" r="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="29" cy="18" r="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="13" cy="36" r="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="29" cy="36" r="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="13" cy="54" r="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="29" cy="54" r="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                {/* Foil highlights */}
                <path d="M10 16 A 5 5 0 0 1 15 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M26 16 A 5 5 0 0 1 31 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M10 34 A 5 5 0 0 1 15 32" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M26 34 A 5 5 0 0 1 31 32" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </g>

              {/* Capsule (Two-tone diagonal) */}
              <g transform="translate(150, 48) rotate(-28)">
                <rect x="0" y="0" width="18" height="20" rx="9" fill="url(#capsuleTeal)" />
                <rect x="0" y="18" width="18" height="20" rx="9" fill="url(#capsuleWhite)" stroke="#e2e8f0" strokeWidth="0.5" />
                {/* Dividing ring */}
                <line x1="0" y1="19" x2="18" y2="19" stroke="#047857" strokeWidth="1" />
                {/* Specular highlight */}
                <path d="M4 6 L4 32" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              </g>

              {/* Scored Tablet / Round Pill */}
              <g transform="translate(182, 58)">
                <circle cx="14" cy="14" r="14" fill="url(#tabletGrad)" stroke="#94a3b8" strokeWidth="1" />
                <line x1="4" y1="14" x2="24" y2="14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                {/* Specular curve */}
                <path d="M6 9 A 10 10 0 0 1 20 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
              </g>

              {/* Mini second capsule */}
              <g transform="translate(180, 24) rotate(42)">
                <rect x="0" y="0" width="12" height="14" rx="6" fill="#38bdf8" />
                <rect x="0" y="13" width="12" height="14" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
                <line x1="0" y1="13.5" x2="12" y2="13.5" stroke="#0284c7" strokeWidth="0.8" />
                <path d="M3 4 L3 22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </g>

              {/* Healthcare & Dispensary Text / Tagline */}
              <g transform="translate(222, 28)">
                <text x="0" y="16" fontFamily="var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" fontSize="11" fontWeight="700" fill="#0f766e" letterSpacing="0.02em">
                  DISPENSARY SUITE
                </text>
                <text x="0" y="32" fontFamily="var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" fontSize="9" fontWeight="600" fill="#334155">
                  Pharmacy Care &
                </text>
                <text x="0" y="44" fontFamily="var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" fontSize="9" fontWeight="600" fill="#334155">
                  Prescription System
                </text>
                
                {/* Verified pill badge */}
                <rect x="0" y="52" width="108" height="18" rx="9" fill="#0d9488" fillOpacity="0.12" stroke="#0d9488" strokeWidth="0.8" />
                <circle cx="8" cy="61" r="3" fill="#0d9488" />
                <text x="16" y="64" fontFamily="var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" fontSize="7.5" fontWeight="700" fill="#0d9488">
                  GMP • BATCH MONITORED
                </text>
              </g>
            </svg>
          </div>

          <div className="pharmacy-visual-features">
            <span className="pharmacy-feature-item">
              <span className="feature-dot"></span>
              Secure Dispensary
            </span>
            <span className="pharmacy-feature-item">
              <span className="feature-dot"></span>
              Real-Time Stock
            </span>
            <span className="pharmacy-feature-item">
              <span className="feature-dot"></span>
              Prescription Order Flow
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
