import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Cross,
  Lock,
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!formData.name.trim()) {
      return 'Please enter your full name.';
    }
    if (formData.name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }
    if (!formData.email.trim()) {
      return 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!formData.phone.trim()) {
      return 'Please enter your contact phone number.';
    }
    if (formData.phone.trim().length < 7) {
      return 'Please enter a valid phone number (at least 7 digits).';
    }
    if (!formData.password) {
      return 'Please enter a password.';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    if (!passwordRegex.test(formData.password)) {
      return 'Password must contain at least one letter and one number.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || undefined,
        password: formData.password,
      };

      await authService.register(payload);

      toast.success('Account created successfully! Please sign in with your credentials.');
      navigate('/login', {
        replace: true,
        state: { registeredEmail: payload.email, registeredSuccess: true },
      });
    } catch (err) {
      console.error('Registration failed:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please check your information and try again.';
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

      <div className="login-card" style={{ maxWidth: '520px' }}>
        {/* Brand Header */}
        <div className="login-header" style={{ marginBottom: '24px' }}>
          <div className="login-brand-icon">
            <Cross size={28} strokeWidth={2.6} />
          </div>
          <h1 className="login-title" style={{ fontSize: '1.5rem' }}>Create Customer Account</h1>
          <p className="login-subtitle">
            Sign up for PharmaCare Pro to order medicines, earn loyalty points, and track deliveries.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="login-alert" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name *</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon-left" />
              <input
                id="reg-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Kasun Perera"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email & Phone in 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address *</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon-left" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number *</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon-left" />
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="077 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Address (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-address">Delivery Address (Optional)</label>
            <div className="input-with-icon">
              <MapPin size={18} className="input-icon-left" />
              <input
                id="reg-address"
                name="address"
                type="text"
                className="form-input"
                placeholder="Street address, city (can be added later)"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password & Confirm Password in 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password *</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min 8 chars, 1 letter, 1 number"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password *</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon-left" />
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Password visibility toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-8px' }}>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPassword ? 'Hide Passwords' : 'Show Passwords'}
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              8+ chars, letter & number
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-btn-primary"
            disabled={loading}
            style={{ marginTop: '6px' }}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Customer Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Switch to Login Link */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
            >
              Sign In here
            </Link>
          </p>
          <div style={{ marginTop: '10px' }}>
            <Link
              to="/"
              style={{ fontSize: '0.8125rem', color: 'var(--color-text-subtle)', textDecoration: 'none' }}
            >
              ← Return to Pharmacy Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
