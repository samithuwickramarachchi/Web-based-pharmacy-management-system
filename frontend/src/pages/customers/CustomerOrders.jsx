import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  ClipboardList,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Truck,
  Package,
  ExternalLink,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

function FilePickerSection({ label, helpText, file, onFileChange, error, accept = '.pdf,.jpg,.jpeg,.png', id }) {
  const inputRef = useRef(null);
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label className="input-label">{label}</label>
      {helpText && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', marginBottom: '0.4rem' }}>{helpText}</p>
      )}
      <div
        style={{
          border: `2px dashed ${error ? 'var(--color-red-400)' : 'var(--color-slate-300)'}`,
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: file ? 'var(--color-teal-50)' : 'var(--color-slate-50)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={20} color={file ? 'var(--color-teal-600)' : 'var(--color-slate-400)'} />
        <div style={{ flex: 1 }}>
          {file ? (
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-teal-700)' }}>
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          ) : (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)' }}>
              Click to select a file (PDF, JPG, PNG — max {MAX_FILE_SIZE_MB} MB)
            </span>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFileChange(null); inputRef.current.value = ''; }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red-500)' }}
          >
            <XCircle size={16} />
          </button>
        )}
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChange(f);
          }}
        />
      </div>
      {error && <p style={{ fontSize: '0.8rem', color: 'var(--color-red-600)', marginTop: '0.25rem' }}>{error}</p>}
    </div>
  );
}

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
  switch (status) {
    case 'CONFIRMED':      return <Badge variant="teal">Confirmed</Badge>;
    case 'PROCESSING':     return <Badge variant="blue">Processing</Badge>;
    case 'READY_FOR_DELIVERY': return <Badge variant="purple">Ready for Delivery</Badge>;
    case 'OUT_FOR_DELIVERY':   return <Badge variant="warning">Out for Delivery</Badge>;
    case 'DELIVERED':      return <Badge variant="success">Delivered</Badge>;
    case 'AWAITING_PRESCRIPTION': return <Badge variant="warning">Awaiting Rx Review</Badge>;
    case 'PENDING_PAYMENT':    return <Badge variant="gray">Pending Payment</Badge>;
    case 'CANCELLED':      return <Badge variant="danger">Cancelled</Badge>;
    default:               return <Badge variant="gray">{status}</Badge>;
  }
}

function PrescriptionStatusBadge({ status }) {
  switch (status) {
    case 'APPROVED':       return <Badge variant="success" icon={<CheckCircle2 size={11} />}>Approved</Badge>;
    case 'REJECTED':       return <Badge variant="danger" icon={<XCircle size={11} />}>Rejected</Badge>;
    case 'PENDING_REVIEW': return <Badge variant="warning" icon={<Clock size={11} />}>Under Review</Badge>;
    default:               return null;
  }
}

export default function CustomerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'prescriptions' | 'new-order'

  const [customerId, setCustomerId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailModal, setOrderDetailModal] = useState(false);

  // Payment slip upload modal (for PENDING_PAYMENT orders)
  const [slipOrder, setSlipOrder] = useState(null);
  const [slipUploadModal, setSlipUploadModal] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [slipFileError, setSlipFileError] = useState('');
  const [uploadingSlip, setUploadingSlip] = useState(false);

  // Standalone prescription upload modal
  const [rxUploadModal, setRxUploadModal] = useState(false);
  const [rxFile, setRxFile] = useState(null);
  const [rxFileError, setRxFileError] = useState('');
  const [uploadingRx, setUploadingRx] = useState(false);

  // New order form
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: '',
    paymentMethod: 'COD',
    notes: '',
  });
  const [rxFile_order, setRxFile_order] = useState(null);
  const [rxFileError_order, setRxFileError_order] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);

  // ── Resolve customerId from user profile ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    // The profile object may carry a customerId directly or we fetch it
    if (user.customerId) {
      setCustomerId(user.customerId);
    } else if (user.id) {
      // fallback: use a consistent identifier; the backend resolves the customer
      // from the JWT principal, not from the payload, so we just pass user.id as hint
      setCustomerId(user.id);
    }
  }, [user]);

  // ── Load data when customerId is available ────────────────────────────────
  useEffect(() => {
    if (!customerId) return;
    loadOrders();
    loadPrescriptions();
    loadCart();
  }, [customerId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await salesService.getOrdersByCustomer(customerId);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const data = await salesService.getPrescriptionsByCustomer(customerId);
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load prescriptions:', err);
      setPrescriptions([]);
    }
  };

  const loadCart = async () => {
    try {
      setCartLoading(true);
      const data = await salesService.getCart?.(customerId);
      if (data?.items) {
        setCartItems(data.items);
        setRequiresPrescription(data.items.some((i) => i.requiresPrescription));
      }
    } catch {
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  };

  // ── Open file using auth token ────────────────────────────────────────────
  const openFile = (url) => {
    const token = localStorage.getItem('pharmacy_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      })
      .catch(() => toast.error('Could not open file.'));
  };

  // ── Upload payment slip ───────────────────────────────────────────────────
  const handleSlipUpload = async () => {
    const err = validateFile(slipFile);
    if (!slipFile) { setSlipFileError('Please select a file.'); return; }
    if (err) { setSlipFileError(err); return; }
    try {
      setUploadingSlip(true);
      await salesService.uploadPaymentSlip(slipOrder.id, slipFile);
      toast.success('Payment slip uploaded! Staff will review and confirm your order shortly.');
      setSlipUploadModal(false);
      setSlipFile(null);
      loadOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed.');
    } finally {
      setUploadingSlip(false);
    }
  };

  // ── Upload standalone prescription ────────────────────────────────────────
  const handleStandaloneRxUpload = async () => {
    const err = validateFile(rxFile);
    if (!rxFile) { setRxFileError('Please select a prescription file.'); return; }
    if (err) { setRxFileError(err); return; }
    try {
      setUploadingRx(true);
      await salesService.uploadPrescriptionFile(rxFile, null, customerId);
      toast.success('Prescription uploaded successfully and is now under review.');
      setRxUploadModal(false);
      setRxFile(null);
      loadPrescriptions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed.');
    } finally {
      setUploadingRx(false);
    }
  };

  // ── Place new order ───────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!orderForm.deliveryAddress.trim()) {
      toast.error('Please enter a delivery address.');
      return;
    }
    if (requiresPrescription && !rxFile_order) {
      setRxFileError_order('A prescription file is required for one or more items in your cart.');
      return;
    }
    if (rxFile_order) {
      const fileErr = validateFile(rxFile_order);
      if (fileErr) { setRxFileError_order(fileErr); return; }
    }

    const needsBank = orderForm.paymentMethod === 'BANK_TRANSFER' || orderForm.paymentMethod === 'CARD';

    try {
      setCreatingOrder(true);
      const orderPayload = {
        customerId,
        deliveryAddress: orderForm.deliveryAddress,
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes,
      };

      let createdOrder;
      if (rxFile_order) {
        createdOrder = await salesService.createOrderWithPrescription(orderPayload, rxFile_order);
      } else {
        const response = await salesService.createOrder
          ? await salesService.createOrder(orderPayload)
          : await salesService.createOrderWithPrescription(orderPayload, null);
        createdOrder = response;
      }

      toast.success('Order placed successfully!');

      if (needsBank && createdOrder?.id) {
        toast.info('Please upload your payment slip to confirm the order.');
        setSlipOrder(createdOrder);
        setSlipFile(null);
        setSlipUploadModal(true);
      }

      setOrderForm({ deliveryAddress: '', paymentMethod: 'COD', notes: '' });
      setRxFile_order(null);
      setActiveTab('orders');
      loadOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not place order.');
    } finally {
      setCreatingOrder(false);
    }
  };

  // ── Salesservice.createOrder shim (JSON path) ─────────────────────────────
  if (!salesService.createOrder) {
    salesService.createOrder = async (data) => {
      const { default: api } = await import('../../services/api');
      const res = await api.post('/orders', data);
      return res.data;
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cartTotal = cartItems.reduce((s, i) => s + (i.subtotal || i.totalPrice || 0), 0);

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div>
          <div className="module-title-row">
            <h1 className="module-title">My Orders & Prescriptions</h1>
            <Badge variant="teal">{orders.length} Orders</Badge>
          </div>
          <p className="module-subtitle">
            Track your orders, upload payment receipts, and manage your prescription documents.
          </p>
        </div>
        <div className="module-actions">
          <Button
            variant="teal"
            icon={<Plus size={16} />}
            onClick={() => setActiveTab('new-order')}
          >
            Place New Order
          </Button>
          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={() => { loadOrders(); loadPrescriptions(); }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-slate-200)', marginBottom: '1.5rem' }}>
        {[
          { key: 'orders', label: `My Orders (${orders.length})`, icon: <ClipboardList size={16} /> },
          { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: <FileText size={16} /> },
          { key: 'new-order', label: 'Place New Order', icon: <ShoppingCart size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid var(--color-teal-600)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--color-teal-700)' : 'var(--color-slate-500)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== TAB: MY ORDERS ========== */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-slate-900)' }}>Order History</h3>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {loading ? (
              <LoadingSpinner text="Loading your orders..." />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={<Package size={36} />}
                title="No orders yet"
                message="Your order history will appear here once you place an order."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Prescription</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--color-teal-700)' }}>
                            {ord.orderNumber}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(ord.totalAmount)}</td>
                        <td>
                          <Badge variant="gray">{ord.paymentMethod || 'COD'}</Badge>
                        </td>
                        <td>
                          {ord.requiresPrescription ? (
                            <PrescriptionStatusBadge status={ord.prescriptionStatus || 'PENDING_REVIEW'} />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>—</span>
                          )}
                        </td>
                        <td><OrderStatusBadge status={ord.status} /></td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelectedOrder(ord); setOrderDetailModal(true); }}
                            >
                              View
                            </Button>
                            {ord.status === 'PENDING_PAYMENT' && (
                              <Button
                                variant="teal"
                                size="sm"
                                icon={<Upload size={13} />}
                                onClick={() => { setSlipOrder(ord); setSlipFile(null); setSlipFileError(''); setSlipUploadModal(true); }}
                              >
                                Upload Slip
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========== TAB: PRESCRIPTIONS ========== */}
      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-slate-900)' }}>
                  My Prescriptions
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                  All prescriptions you have uploaded for your orders.
                </p>
              </div>
              <Button
                variant="teal"
                size="sm"
                icon={<Upload size={14} />}
                onClick={() => { setRxFile(null); setRxFileError(''); setRxUploadModal(true); }}
              >
                Upload Prescription
              </Button>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {prescriptions.length === 0 ? (
              <EmptyState
                icon={<FileText size={36} />}
                title="No prescriptions on file"
                message="Prescriptions you upload for Rx-required medications will appear here."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Linked Order</th>
                      <th>Uploaded</th>
                      <th>Status</th>
                      <th>Pharmacist Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                            <FileText size={14} color="var(--color-teal-600)" />
                            {rx.originalFilename || rx.fileName || 'Prescription'}
                          </span>
                        </td>
                        <td>
                          {rx.orderNumber
                            ? <Badge variant="teal">{rx.orderNumber}</Badge>
                            : <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>Standalone</span>}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {rx.uploadedAt ? new Date(rx.uploadedAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td><PrescriptionStatusBadge status={rx.status} /></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rx.reviewNotes || rx.notes || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<ExternalLink size={13} />}
                              onClick={() => openFile(salesService.getPrescriptionFileUrl(rx.id))}
                            >
                              View File
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========== TAB: PLACE NEW ORDER ========== */}
      {activeTab === 'new-order' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Cart Summary */}
          <Card>
            <CardHeader>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-slate-900)' }}>
                <ShoppingCart size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
                Your Cart
              </h3>
            </CardHeader>
            <CardBody>
              {cartLoading ? (
                <LoadingSpinner text="Loading cart..." />
              ) : cartItems.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart size={32} />}
                  title="Your cart is empty"
                  message="Add products to your cart before placing an order."
                />
              ) : (
                <>
                  {cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 0',
                        borderBottom: '1px solid var(--color-slate-100)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {item.productName}
                          {item.requiresPrescription && (
                            <Badge variant="warning" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>Rx</Badge>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
                          Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {formatCurrency(item.subtotal || item.totalPrice || 0)}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', fontWeight: 700, fontSize: '1rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-teal-700)' }}>{formatCurrency(cartTotal)}</span>
                  </div>
                  {requiresPrescription && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e' }}>
                        One or more items require a valid prescription. Please upload your prescription file below before placing this order.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          {/* Order Form */}
          <Card>
            <CardHeader>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-slate-900)' }}>Order Details</h3>
            </CardHeader>
            <CardBody>
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Delivery Address *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Enter your full delivery address..."
                  value={orderForm.deliveryAddress}
                  onChange={(e) => setOrderForm((p) => ({ ...p, deliveryAddress: e.target.value }))}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Payment Method *</label>
                <select
                  className="form-control"
                  value={orderForm.paymentMethod}
                  onChange={(e) => setOrderForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card Payment</option>
                </select>
              </div>

              {(orderForm.paymentMethod === 'BANK_TRANSFER' || orderForm.paymentMethod === 'CARD') && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '6px', border: '1px solid #93c5fd', display: 'flex', gap: '0.5rem' }}>
                  <Info size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e40af' }}>
                    After placing this order you will be prompted to upload your payment slip. Your order will be confirmed once staff verifies the payment.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Notes (optional)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Any special instructions..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* Prescription upload section (shown if cart has Rx items) */}
              {requiresPrescription && (
                <FilePickerSection
                  id="rx-file-order"
                  label="Prescription File *"
                  helpText="A valid prescription from a licensed physician is required for one or more items in your cart."
                  file={rxFile_order}
                  onFileChange={(f) => { setRxFile_order(f); setRxFileError_order(''); }}
                  error={rxFileError_order}
                />
              )}

              <Button
                variant="teal"
                onClick={handlePlaceOrder}
                loading={creatingOrder}
                disabled={cartItems.length === 0 || creatingOrder}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Place Order
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========== MODAL: ORDER DETAIL ========== */}
      <Modal
        isOpen={orderDetailModal}
        onClose={() => setOrderDetailModal(false)}
        title={selectedOrder ? `Order: ${selectedOrder.orderNumber}` : 'Order Details'}
        size="lg"
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'linear-gradient(135deg, var(--color-slate-50), var(--color-teal-50))',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-slate-800)', marginBottom: '0.25rem' }}>
                  {selectedOrder.orderNumber}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                  {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : ''}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>Order Total</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-teal-800)' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-slate-700)' }}>Items</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.requiresPrescription && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-slate-50)', borderRadius: '6px', border: '1px solid var(--color-slate-200)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Prescription Status</div>
                <PrescriptionStatusBadge status={selectedOrder.prescriptionStatus || 'PENDING_REVIEW'} />
              </div>
            )}

            {selectedOrder.status === 'PENDING_PAYMENT' && (
              <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Please upload your payment receipt to confirm this order.
                </div>
                <Button
                  variant="teal"
                  size="sm"
                  icon={<Upload size={13} />}
                  onClick={() => {
                    setOrderDetailModal(false);
                    setSlipOrder(selectedOrder);
                    setSlipFile(null);
                    setSlipFileError('');
                    setSlipUploadModal(true);
                  }}
                >
                  Upload Slip
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========== MODAL: PAYMENT SLIP UPLOAD ========== */}
      <Modal
        isOpen={slipUploadModal}
        onClose={() => setSlipUploadModal(false)}
        title={slipOrder ? `Upload Payment Slip: ${slipOrder.orderNumber}` : 'Upload Payment Slip'}
        size="sm"
      >
        {slipOrder && (
          <div>
            <div style={{ padding: '0.75rem', background: 'var(--color-slate-50)', borderRadius: '6px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Order:</span>
                <span style={{ fontWeight: 700 }}>{slipOrder.orderNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Amount to pay:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-teal-700)' }}>{formatCurrency(slipOrder.totalAmount)}</span>
              </div>
            </div>

            <FilePickerSection
              id="slip-file"
              label="Payment Receipt / Slip *"
              helpText="Upload a screenshot or scan of your bank transfer confirmation or payment receipt (PDF, JPG, PNG — max 5 MB)."
              file={slipFile}
              onFileChange={(f) => { setSlipFile(f); setSlipFileError(''); }}
              error={slipFileError}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" onClick={() => setSlipUploadModal(false)} disabled={uploadingSlip}>
                Cancel
              </Button>
              <Button
                variant="teal"
                icon={<Upload size={16} />}
                loading={uploadingSlip}
                onClick={handleSlipUpload}
              >
                Submit Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========== MODAL: STANDALONE PRESCRIPTION UPLOAD ========== */}
      <Modal
        isOpen={rxUploadModal}
        onClose={() => setRxUploadModal(false)}
        title="Upload Prescription"
        size="sm"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', marginBottom: '1rem' }}>
            Upload a prescription from your doctor. It will be reviewed by our pharmacist before it can be applied to a prescription-required order.
          </p>

          <FilePickerSection
            id="rx-file-standalone"
            label="Prescription File *"
            helpText="Accepted formats: PDF, JPG, PNG. Maximum size: 5 MB."
            file={rxFile}
            onFileChange={(f) => { setRxFile(f); setRxFileError(''); }}
            error={rxFileError}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="outline" onClick={() => setRxUploadModal(false)} disabled={uploadingRx}>
              Cancel
            </Button>
            <Button
              variant="teal"
              icon={<Upload size={16} />}
              loading={uploadingRx}
              onClick={handleStandaloneRxUpload}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
