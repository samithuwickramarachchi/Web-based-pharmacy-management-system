import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Package,
  FileText,
  MessageSquare,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Eye,
  Filter,
  ShieldCheck,
  Send,
  Lock,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import customerService from '../../services/customerService';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatUtils';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

function validateFile(file) {
  if (!file) return null;
  if (file.size > MAX_FILE_SIZE_BYTES) return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  if (!ALLOWED_TYPES.includes(file.type)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTS.includes(`.${ext}`)) {
      return 'Unsupported file type. Please use PDF, JPG, or PNG.';
    }
  }
  return null;
}

function OrderStatusBadge({ status }) {
  const s = status || 'CONFIRMED';
  const badgeMap = {
    CONFIRMED: { bg: '#eff6ff', color: '#1d4ed8', label: 'Confirmed' },
    PROCESSING: { bg: '#f0fdfa', color: '#0f766e', label: 'Processing' },
    READY_FOR_DELIVERY: { bg: '#faf5ff', color: '#7e22ce', label: 'Ready for Dispatch' },
    OUT_FOR_DELIVERY: { bg: '#fffbeb', color: '#b45309', label: 'Out for Delivery' },
    DELIVERED: { bg: '#ecfdf5', color: '#047857', label: 'Delivered' },
    AWAITING_PRESCRIPTION: { bg: '#fef2f2', color: '#b91c1c', label: 'Awaiting Prescription' },
    PENDING_PAYMENT: { bg: '#f8fafc', color: '#475569', label: 'Pending Payment Slip' },
    CANCELLED: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' },
  };

  const style = badgeMap[s] || { bg: '#f1f5f9', color: '#475569', label: s };

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem'
      }}
    >
      {style.label}
    </span>
  );
}

export default function CustomerAccount() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const activeTab = searchParams.get('tab') || 'orders'; // 'orders' | 'prescriptions' | 'support' | 'profile'

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Orders State ─────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Payment slip upload modal for pending payment orders
  const [slipOrder, setSlipOrder] = useState(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [slipError, setSlipError] = useState('');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const slipInputRef = useRef(null);

  // ── Prescriptions State ──────────────────────────────────────────────────
  const [prescriptions, setPrescriptions] = useState([]);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxFile, setRxFile] = useState(null);
  const [rxError, setRxError] = useState('');
  const [uploadingRx, setUploadingRx] = useState(false);
  const rxInputRef = useRef(null);

  // ── Support State ────────────────────────────────────────────────────────
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // ── Profile & Address Form State ─────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    addressType: 'HOME',
    isDefault: false
  });

  // ── Password Change State ────────────────────────────────────────────────
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPass, setChangingPass] = useState(false);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function loadCustomer() {
      try {
        setLoading(true);
        const data = await customerService.getMe();
        if (isMounted && data) {
          setCustomer(data);
          setProfileForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || ''
          });
        }
      } catch (err) {
        console.warn('Failed to load customer profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCustomer();
    return () => { isMounted = false; };
  }, []);

  // Load orders when customer is resolved or tab is orders
  useEffect(() => {
    if (customer?.id && activeTab === 'orders') {
      loadOrders();
    }
  }, [customer?.id, activeTab]);

  // Load prescriptions when tab is prescriptions
  useEffect(() => {
    if (customer?.id && activeTab === 'prescriptions') {
      loadPrescriptions();
    }
  }, [customer?.id, activeTab]);

  // Load support messages when tab is support
  useEffect(() => {
    if (activeTab === 'support') {
      loadSupportMessages();
    }
  }, [activeTab]);

  const loadOrders = async (start = startDate, end = endDate) => {
    if (!customer?.id) return;
    try {
      setOrdersLoading(true);
      const params = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      const data = await salesService.getOrdersByCustomer(customer.id, params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load orders:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPrescriptions = async () => {
    if (!customer?.id) return;
    try {
      setRxLoading(true);
      const data = await salesService.getPrescriptionsByCustomer(customer.id);
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load prescriptions:', err);
      setPrescriptions([]);
    } finally {
      setRxLoading(false);
    }
  };

  const loadSupportMessages = async () => {
    try {
      setSupportLoading(true);
      const data = await customerService.getMySupportMessages();
      setSupportMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load support messages:', err);
      setSupportMessages([]);
    } finally {
      setSupportLoading(false);
    }
  };

  // ── Open prescription or slip file ───────────────────────────────────────
  const openSecureFile = (url) => {
    const token = localStorage.getItem('pharmacy_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      })
      .catch(() => toast.error('Could not preview file.'));
  };

  // ── Handle Standalone Prescription Upload ────────────────────────────────
  const handleUploadRx = async (e) => {
    e.preventDefault();
    if (!rxFile) {
      setRxError('Please select a file to upload.');
      return;
    }
    const err = validateFile(rxFile);
    if (err) {
      setRxError(err);
      return;
    }

    try {
      setUploadingRx(true);
      await salesService.uploadPrescriptionFile(rxFile, null, customer.id);
      toast.success('Prescription uploaded successfully! Under review by pharmacist.');
      setRxModalOpen(false);
      setRxFile(null);
      loadPrescriptions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Prescription upload failed.');
    } finally {
      setUploadingRx(false);
    }
  };

  // ── Handle Payment Slip Upload ───────────────────────────────────────────
  const handleUploadSlip = async (e) => {
    e.preventDefault();
    if (!slipFile || !slipOrder) {
      setSlipError('Please select a slip file.');
      return;
    }
    const err = validateFile(slipFile);
    if (err) {
      setSlipError(err);
      return;
    }

    try {
      setUploadingSlip(true);
      await salesService.uploadPaymentSlip(slipOrder.id, slipFile);
      toast.success('Payment slip uploaded! Staff will verify and update your order status.');
      setSlipModalOpen(false);
      setSlipFile(null);
      loadOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment slip upload failed.');
    } finally {
      setUploadingSlip(false);
    }
  };

  // ── Handle Support Message Submission ────────────────────────────────────
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast.error('Please enter both subject and message.');
      return;
    }

    try {
      setSubmittingSupport(true);
      await customerService.submitSupportMessage({
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
      });
      toast.success('Support message submitted! A pharmacist will reply shortly.');
      setSupportSubject('');
      setSupportMessage('');
      loadSupportMessages();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit support message.');
    } finally {
      setSubmittingSupport(false);
    }
  };

  // ── Handle Profile Update ────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!customer?.id) return;
    try {
      setUpdatingProfile(true);
      const updated = await customerService.updateProfile(customer.id, profileForm);
      setCustomer((prev) => ({ ...prev, ...updated }));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ── Handle Password Change ───────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!customer?.id) return;
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    try {
      setChangingPass(true);
      await customerService.changePassword(customer.id, {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPass(false);
    }
  };

  // ── Handle Add Address ───────────────────────────────────────────────────
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!customer?.id) return;
    try {
      const added = await customerService.addAddress(customer.id, newAddress);
      setCustomer((prev) => ({
        ...prev,
        addresses: [...(prev.addresses || []), added]
      }));
      toast.success('Address added successfully!');
      setAddressModalOpen(false);
      setNewAddress({ addressLine1: '', addressLine2: '', city: '', postalCode: '', addressType: 'HOME', isDefault: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address.');
    }
  };

  const handleSetDefaultAddress = async (addrId) => {
    if (!customer?.id) return;
    try {
      await customerService.setDefaultAddress(customer.id, addrId);
      setCustomer((prev) => ({
        ...prev,
        addresses: prev.addresses.map((a) => ({ ...a, isDefault: a.id === addrId }))
      }));
      toast.success('Default address updated.');
    } catch (err) {
      toast.error('Failed to set default address.');
    }
  };

  const handleDeleteAddress = async (addrId) => {
    if (!customer?.id) return;
    try {
      await customerService.deleteAddress(customer.id, addrId);
      setCustomer((prev) => ({
        ...prev,
        addresses: prev.addresses.filter((a) => a.id !== addrId)
      }));
      toast.success('Address removed.');
    } catch (err) {
      toast.error('Failed to remove address.');
    }
  };

  // Loyalty calculations
  const points = customer?.loyaltyPoints || 0;
  const rawTier = customer?.membershipTier || 'Standard';
  const normTier = rawTier.toUpperCase();
  const tierClass = normTier === 'GOLD' ? 'tier-card-gold' : normTier === 'SILVER' ? 'tier-card-silver' : 'tier-card-standard';
  const nextTierPoints = normTier === 'STANDARD' ? 100 : normTier === 'SILVER' ? 500 : 500;
  const progressPercent = normTier === 'GOLD' ? 100 : Math.min(100, Math.round((points / nextTierPoints) * 100));
  const pointsToNext = normTier === 'STANDARD' ? Math.max(0, 100 - points) : normTier === 'SILVER' ? Math.max(0, 500 - points) : 0;
  const tierLabel = normTier === 'GOLD' ? 'Gold VIP' : normTier === 'SILVER' ? 'Silver' : 'Standard';
  const tierColor = normTier === 'GOLD' ? '#d97706' : normTier === 'SILVER' ? '#475569' : 'var(--color-primary)';
  const tierSubtext = normTier === 'GOLD' ? 'Highest VIP Tier Achieved' : normTier === 'SILVER' ? '100+ Points Accrued' : 'Standard Member (0–99 pts)';
  const pointsToNextText = normTier === 'GOLD'
    ? 'Gold VIP Status Active — You have unlocked maximum tier rewards!'
    : normTier === 'SILVER'
    ? `${pointsToNext} points needed to reach Gold VIP (500 pts)`
    : `${pointsToNext} points needed to reach Silver (100 pts)`;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <LoadingSpinner size="lg" text="Loading customer account..." />
      </div>
    );
  }

  return (
    <div>
      {/* ── Loyalty & Membership Banner ───────────────────────────────────── */}
      <div className={`loyalty-banner-card ${tierClass}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              <Award size={14} /> {tierLabel} Member
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
              {customer?.firstName ? `${customer.firstName} ${customer.lastName || ''}` : user?.username}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>Membership ID: <strong>{customer?.membershipId || 'Generating...'}</strong></span>
              <span>Account Email: <strong>{customer?.email || user?.email}</strong></span>
            </div>
          </div>

          {/* Points Counter Box */}
          <div style={{ textAlign: 'right', background: 'rgba(0, 0, 0, 0.25)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(4px)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.75)' }}>
              Loyalty Points
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fde047', lineHeight: '1.1' }}>
              {points}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)' }}>
              1 pt per RS 100 spent
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)' }}>
            <span>
              {normTier === 'GOLD' ? 'Highest Tier Achieved (Gold VIP)' : `Progress to ${normTier === 'STANDARD' ? 'Silver (100 pts)' : 'Gold (500 pts)'}`}
            </span>
            <span>{points} / {nextTierPoints} pts</span>
          </div>
          <div className="loyalty-progress-track">
            <div className="loyalty-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── Main Tabbed Layout ────────────────────────────────────────────── */}
      <div className="account-hub-grid">
        {/* Left Navigation Card */}
        <div className="account-sidebar-card">
          <div className="account-user-header">
            <div className="account-avatar-large">
              {(customer?.firstName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {customer?.firstName || user?.username}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {customer?.email || user?.email}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              onClick={() => setSearchParams({ tab: 'orders' })}
              className={`customer-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: activeTab === 'orders' ? 'var(--color-primary-light)' : 'none', color: activeTab === 'orders' ? 'var(--color-primary-active)' : 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0.65rem 0.85rem' }}
            >
              <Package size={18} /> My Orders & Tracking
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'prescriptions' })}
              className={`customer-nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: activeTab === 'prescriptions' ? 'var(--color-primary-light)' : 'none', color: activeTab === 'prescriptions' ? 'var(--color-primary-active)' : 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0.65rem 0.85rem' }}
            >
              <FileText size={18} /> Doctor Prescriptions
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'loyalty' })}
              className={`customer-nav-link ${activeTab === 'loyalty' ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: activeTab === 'loyalty' ? 'var(--color-primary-light)' : 'none', color: activeTab === 'loyalty' ? 'var(--color-primary-active)' : 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0.65rem 0.85rem' }}
            >
              <Award size={18} /> Loyalty & Rewards
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'support' })}
              className={`customer-nav-link ${activeTab === 'support' ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: activeTab === 'support' ? 'var(--color-primary-light)' : 'none', color: activeTab === 'support' ? 'var(--color-primary-active)' : 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0.65rem 0.85rem' }}
            >
              <MessageSquare size={18} /> Contact Pharmacist
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'profile' })}
              className={`customer-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: activeTab === 'profile' ? 'var(--color-primary-light)' : 'none', color: activeTab === 'profile' ? 'var(--color-primary-active)' : 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0.65rem 0.85rem' }}
            >
              <User size={18} /> Profile & Addresses
            </button>
          </div>
        </div>

        {/* Right Content Panel */}
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-xs)' }}>
          {/* ════ TAB 1: ORDERS & TRACKING ════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Order History & Tracking</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    View past purchases, track active deliveries, and manage payment slips.
                  </p>
                </div>
              </div>

              {/* Date Filter Bar */}
              <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: '#ffffff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.85rem', background: '#ffffff' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadOrders(startDate, endDate)}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  <Filter size={14} /> Filter
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate(''); loadOrders('', ''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-red-600)', fontWeight: 600 }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Orders List */}
              {ordersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <LoadingSpinner size="md" text="Loading orders..." />
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No orders found"
                  description={startDate || endDate ? "No orders found within the selected date range." : "You haven't placed any orders yet."}
                  actionText="Browse Medicines"
                  onAction={() => setSearchParams({})}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        border: '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                            #{order.orderNumber}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '0.75rem' }}>
                            {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <OrderStatusBadge status={order.orderStatus || order.status} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <span>Total: <strong style={{ color: 'var(--color-primary-active)' }}>{formatCurrency(order.totalAmount)}</strong></span>
                          <span style={{ color: 'var(--color-text-muted)' }}>Payment: {order.paymentMethod}</span>
                          <span style={{
                            padding: '0.15rem 0.55rem',
                            borderRadius: '9999px',
                            backgroundColor: order.fulfillmentType === 'STORE_PICKUP' ? '#eff6ff' : '#ecfdf5',
                            color: order.fulfillmentType === 'STORE_PICKUP' ? '#1d4ed8' : '#047857',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {order.fulfillmentType === 'STORE_PICKUP' ? '🏪 Store Pickup' : '🚚 Home Delivery'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {/* Upload slip button if pending payment */}
                          {(order.orderStatus === 'PENDING_PAYMENT' || order.status === 'PENDING_PAYMENT') && (
                            <button
                              onClick={() => { setSlipOrder(order); setSlipModalOpen(true); }}
                              className="btn btn-warning"
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Upload size={14} /> Upload Payment Slip
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedOrder(order); setOrderModalOpen(true); }}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Eye size={14} /> View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 2: PRESCRIPTIONS ════════════════════════════════════ */}
          {activeTab === 'prescriptions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Doctor's Prescriptions</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Upload and manage your medical prescriptions for pharmacist review.
                  </p>
                </div>
                <button
                  onClick={() => setRxModalOpen(true)}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
                >
                  <Plus size={16} /> Upload New Prescription
                </button>
              </div>

              {rxLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <LoadingSpinner size="md" text="Loading prescriptions..." />
                </div>
              ) : prescriptions.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No prescriptions uploaded"
                  description="Upload a photo or scan of your doctor's prescription to request medicine fulfillment."
                  actionText="Upload Prescription Now"
                  onAction={() => setRxModalOpen(true)}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      style={{
                        border: '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <FileText size={18} color="var(--color-primary)" />
                          <strong style={{ fontSize: '0.95rem' }}>{rx.fileName || `Prescription #${rx.id}`}</strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          Uploaded: {rx.uploadedAt ? new Date(rx.uploadedAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {rx.status === 'APPROVED' ? (
                          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} /> Approved
                          </span>
                        ) : rx.status === 'REJECTED' ? (
                          <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <XCircle size={13} /> Rejected
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={13} /> Under Review
                          </span>
                        )}

                        <button
                          onClick={() => openSecureFile(salesService.getPrescriptionFileUrl(rx.id))}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <ExternalLink size={14} /> View File
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 3: LOYALTY & REWARDS ════════════════════════════════ */}
          {activeTab === 'loyalty' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Loyalty Rewards & Membership</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Track your points, check tier progression, and unlock exclusive healthcare benefits.
                  </p>
                </div>
                <Link
                  to="/products"
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Package size={16} /> Shop & Earn Points
                </Link>
              </div>

              {/* ── Summary Stat Cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Membership ID
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-800)', fontFamily: 'monospace' }}>
                    {customer?.membershipId || 'MEM-PENDING'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Active Account
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Membership Tier
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tierColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={20} /> {tierLabel}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                    {tierSubtext}
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Current Loyalty Points
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary-active)' }}>
                    {points} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>PTS</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                    1 pt per RS 100 spent
                  </div>
                </div>
              </div>

              {/* ── Progress Toward Next Tier ── */}
              <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-slate-900)' }}>
                      Progress Toward Next Tier
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      {pointsToNextText}
                    </p>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary-active)' }}>
                    {points} / {nextTierPoints} PTS ({progressPercent}%)
                  </div>
                </div>

                <div style={{ width: '100%', height: '10px', background: 'var(--color-slate-200)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--color-primary) 0%, #0d9488 100%)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ color: normTier === 'STANDARD' ? 'var(--color-primary)' : 'inherit' }}>Standard</strong>
                    <div>0 – 99 pts</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ color: normTier === 'SILVER' ? '#475569' : 'inherit' }}>Silver</strong>
                    <div>100 – 499 pts</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: normTier === 'GOLD' ? '#d97706' : 'inherit' }}>Gold VIP</strong>
                    <div>500+ pts</div>
                  </div>
                </div>
              </div>

              {/* ── Membership Tier Comparison & Privileges ── */}
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                Membership Tiers & Benefits
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {/* Standard Card */}
                <div style={{ border: normTier === 'STANDARD' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: normTier === 'STANDARD' ? 'var(--color-primary-light)' : '#ffffff', position: 'relative' }}>
                  {normTier === 'STANDARD' && (
                    <span style={{ position: 'absolute', top: '-10px', right: '12px', background: 'var(--color-primary)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
                      Current Tier
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-slate-800)', marginBottom: '0.25rem' }}>
                    Standard Tier
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    0 – 99 points
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="var(--color-primary)" /> 1 pt per RS 100 spent</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="var(--color-primary)" /> Prescription review & management</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="var(--color-primary)" /> Standard delivery dispatch</li>
                  </ul>
                </div>

                {/* Silver Card */}
                <div style={{ border: normTier === 'SILVER' ? '2px solid #475569' : '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: normTier === 'SILVER' ? '#f8fafc' : '#ffffff', position: 'relative' }}>
                  {normTier === 'SILVER' && (
                    <span style={{ position: 'absolute', top: '-10px', right: '12px', background: '#475569', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
                      Current Tier
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#334155', marginBottom: '0.25rem' }}>
                    Silver Tier
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    100 – 499 points
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#0d9488" /> All Standard benefits</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#0d9488" /> Priority pharmacy preparation</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#0d9488" /> Exclusive seasonal discount codes</li>
                  </ul>
                </div>

                {/* Gold VIP Card */}
                <div style={{ border: normTier === 'GOLD' ? '2px solid #d97706' : '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: normTier === 'GOLD' ? '#fffbeb' : '#ffffff', position: 'relative' }}>
                  {normTier === 'GOLD' && (
                    <span style={{ position: 'absolute', top: '-10px', right: '12px', background: '#d97706', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
                      Current Tier
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#92400e', marginBottom: '0.25rem' }}>
                    Gold VIP Tier
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    500+ points
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--color-text-main)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#d97706" /> All Silver benefits</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#d97706" /> Maximum promotional discount eligibility</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} color="#d97706" /> Priority 24/7 pharmacist support</li>
                  </ul>
                </div>
              </div>

              {/* ── Program Rules & Point Calculations ── */}
              <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-slate-800)' }}>
                  How Point Earning & Progression Works
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  <div>
                    <strong style={{ color: 'var(--color-text-main)', display: 'block', marginBottom: '0.25rem' }}>1. Earning Formula</strong>
                    Earn 1 loyalty point for every full RS 100 spent on completed orders.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-main)', display: 'block', marginBottom: '0.25rem' }}>2. Credited Upon Delivery</strong>
                    Points are automatically credited to your account as soon as the order status changes to DELIVERED.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-main)', display: 'block', marginBottom: '0.25rem' }}>3. Automatic Tier Advancement</strong>
                    Reach 100 points for Silver tier, and 500 points to unlock Gold VIP status.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 4: SUPPORT & CONTACT US ══════════════════════════════ */}
          {activeTab === 'support' && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pharmacist Advisory & Support</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Have questions about dosage, interactions, or orders? Send a secure message directly to our on-duty pharmacists.
                </p>
              </div>

              {/* Inquiry Submission Form */}
              <form onSubmit={handleSupportSubmit} style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Send a New Message</h4>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Subject / Concern
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Medicine dosage inquiry, Delivery status query, Prescription doubt"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem', background: '#ffffff' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    Message Details
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about your query or medication..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem', background: '#ffffff', fontFamily: 'inherit' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingSupport}
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={15} /> {submittingSupport ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </form>

              {/* Past Messages List */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Your Message History</h4>
              {supportLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                  <LoadingSpinner size="sm" text="Loading message history..." />
                </div>
              ) : supportMessages.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No past support inquiries found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {supportMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
                    >
                      {/* Customer's original message */}
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{msg.subject}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                          {msg.message}
                        </p>
                      </div>

                      {/* Staff reply bubble */}
                      {msg.replyText ? (
                        <div style={{
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                          borderTop: '1px solid #bbf7d0',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          gap: '0.75rem'
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, color: '#fff', fontSize: '0.7rem', fontWeight: 700
                          }}>Rx</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>
                                PharmaCare Pro — {msg.repliedByName || 'Pharmacist'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                {msg.replyAt ? new Date(msg.replyAt).toLocaleString() : ''}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#064e3b', lineHeight: '1.55', whiteSpace: 'pre-wrap', margin: 0 }}>
                              {msg.replyText}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          background: '#f8fafc',
                          borderTop: '1px dashed #e2e8f0',
                          padding: '0.65rem 1.25rem',
                          fontSize: '0.775rem',
                          color: 'var(--color-text-muted)',
                          fontStyle: 'italic',
                          display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Awaiting reply from our pharmacist team
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ════ TAB 4: PROFILE & ADDRESSES ══════════════════════════════ */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Profile & Saved Addresses</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Manage personal contact information and delivery destinations.
                </p>
              </div>

              {/* Personal Details Form */}
              <form onSubmit={handleProfileSubmit} style={{ marginBottom: '2.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Personal Contact Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Email Address (read-only)</label>
                    <input
                      type="text"
                      value={customer?.email || ''}
                      disabled
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem', background: 'var(--color-bg-subtle)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
                >
                  {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>

              {/* Saved Delivery Addresses */}
              <div style={{ marginBottom: '2.5rem', paddingTop: '1.75rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Saved Delivery Addresses</h4>
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                  >
                    <Plus size={14} /> Add New Address
                  </button>
                </div>

                {customer?.addresses && customer.addresses.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {customer.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        style={{
                          border: `1.5px solid ${addr.isDefault ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem',
                          position: 'relative'
                        }}
                      >
                        {addr.isDefault && (
                          <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-active)', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)' }}>
                            DEFAULT
                          </span>
                        )}
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                          {addr.addressType || 'Address'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                          {addr.addressLine1}<br />
                          {addr.addressLine2 && <>{addr.addressLine2}<br /></>}
                          {addr.city}{addr.postalCode ? ` - ${addr.postalCode}` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red-600)', fontSize: '0.78rem', fontWeight: 600, marginLeft: 'auto' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    No delivery addresses saved yet.
                  </p>
                )}
              </div>

              {/* Change Password Form */}
              <form onSubmit={handlePasswordSubmit} style={{ paddingTop: '1.75rem', borderTop: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Change Security Password</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Current Password</label>
                    <input
                      type="password"
                      value={passForm.currentPassword}
                      onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>New Password</label>
                    <input
                      type="password"
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem' }}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
                >
                  {changingPass ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Order Details ─────────────────────────────────────────── */}
      {orderModalOpen && selectedOrder && (
        <Modal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          title={`Order #${selectedOrder.orderNumber}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Status:</span>{' '}
                <OrderStatusBadge status={selectedOrder.orderStatus || selectedOrder.status} />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Placed: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : ''}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Items Ordered</h4>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: idx < (selectedOrder.items.length - 1) ? '1px solid var(--color-border)' : 'none', fontSize: '0.875rem' }}>
                    <div>
                      <strong>{item.productName}</strong>
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    <strong>{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: 'var(--color-bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <div>
                <strong>Fulfilment:</strong>
                <p style={{ color: selectedOrder.fulfillmentType === 'STORE_PICKUP' ? '#1d4ed8' : '#047857', fontWeight: 700, marginTop: '0.25rem' }}>
                  {selectedOrder.fulfillmentType === 'STORE_PICKUP' ? '🏪 Store Pickup' : '🚚 Home Delivery'}
                </p>
              </div>
              <div>
                <strong>{selectedOrder.fulfillmentType === 'STORE_PICKUP' ? 'Pickup Location:' : 'Delivery Address:'}</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {selectedOrder.fulfillmentType === 'STORE_PICKUP' ? 'PharmaCare Pro — Main Branch' : (selectedOrder.deliveryAddress || 'N/A')}
                </p>
              </div>
              <div>
                <strong>Payment Method:</strong>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{selectedOrder.paymentMethod}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Order Amount:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-active)' }}>
                {formatCurrency(selectedOrder.totalAmount)}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Payment Slip Upload ───────────────────────────────────── */}
      {slipModalOpen && (
        <Modal
          isOpen={slipModalOpen}
          onClose={() => { setSlipModalOpen(false); setSlipFile(null); }}
          title={`Upload Bank Transfer Slip for Order #${slipOrder?.orderNumber}`}
        >
          <form onSubmit={handleUploadSlip}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Please upload a clear screenshot or scan of your bank deposit slip or online transfer receipt so our staff can verify and confirm your order.
            </p>

            <div
              onClick={() => slipInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-slate-300)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: slipFile ? 'var(--color-teal-50)' : 'var(--color-bg-subtle)',
                marginBottom: '1rem'
              }}
            >
              <Upload size={28} color="var(--color-primary)" style={{ margin: '0 auto 0.5rem' }} />
              {slipFile ? (
                <div style={{ fontWeight: 700, color: 'var(--color-primary-active)', fontSize: '0.9rem' }}>
                  {slipFile.name} ({(slipFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Click to select file (PDF, JPG, PNG — max {MAX_FILE_SIZE_MB}MB)
                </div>
              )}
              <input
                ref={slipInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setSlipFile(f);
                    setSlipError('');
                  }
                }}
              />
            </div>

            {slipError && (
              <p style={{ color: 'var(--color-red-600)', fontSize: '0.8rem', marginBottom: '1rem' }}>{slipError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setSlipModalOpen(false); setSlipFile(null); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingSlip || !slipFile}
                className="btn btn-primary"
              >
                {uploadingSlip ? 'Uploading...' : 'Submit Payment Slip'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Standalone Prescription Upload ────────────────────────── */}
      {rxModalOpen && (
        <Modal
          isOpen={rxModalOpen}
          onClose={() => { setRxModalOpen(false); setRxFile(null); }}
          title="Upload Doctor's Prescription"
        >
          <form onSubmit={handleUploadRx}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Upload your doctor's valid prescription. Our certified pharmacists will review the medication and reach out to complete your order.
            </p>

            <div
              onClick={() => rxInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-slate-300)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: rxFile ? 'var(--color-teal-50)' : 'var(--color-bg-subtle)',
                marginBottom: '1rem'
              }}
            >
              <FileText size={28} color="var(--color-primary)" style={{ margin: '0 auto 0.5rem' }} />
              {rxFile ? (
                <div style={{ fontWeight: 700, color: 'var(--color-primary-active)', fontSize: '0.9rem' }}>
                  {rxFile.name} ({(rxFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Click to choose file (PDF, JPG, PNG — max {MAX_FILE_SIZE_MB}MB)
                </div>
              )}
              <input
                ref={rxInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setRxFile(f);
                    setRxError('');
                  }
                }}
              />
            </div>

            {rxError && (
              <p style={{ color: 'var(--color-red-600)', fontSize: '0.8rem', marginBottom: '1rem' }}>{rxError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setRxModalOpen(false); setRxFile(null); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingRx || !rxFile}
                className="btn btn-primary"
              >
                {uploadingRx ? 'Uploading...' : 'Submit Prescription'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Add Address ───────────────────────────────────────────── */}
      {addressModalOpen && (
        <Modal
          isOpen={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          title="Add New Delivery Address"
        >
          <form onSubmit={handleAddAddress}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Address Label
                </label>
                <select
                  value={newAddress.addressType}
                  onChange={(e) => setNewAddress({ ...newAddress, addressType: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                >
                  <option value="HOME">Home</option>
                  <option value="WORK">Work / Office</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Address Line 1
                </label>
                <input
                  type="text"
                  placeholder="Street number, road, building..."
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Apartment, suite, unit..."
                  value={newAddress.addressLine2}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>City</label>
                  <input
                    type="text"
                    placeholder="Colombo, Kandy, Galle..."
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Postal Code</label>
                  <input
                    type="text"
                    placeholder="00300"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                Set as default delivery address
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Address
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
