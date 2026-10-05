import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  FileCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Eye,
  RefreshCw,
  XCircle,
  FileText,
  User,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  CreditCard,
  Download,
  ExternalLink
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
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// Fallback seed online orders
const SEED_ONLINE_ORDERS = [
  {
    id: 1,
    orderNumber: 'ORD-2024-88901',
    createdAt: '2024-02-14T09:30:00',
    customerId: 1,
    customerName: 'Sahan Jayaweera',
    customerEmail: 'sahan.jayaweera@pharmacare.lk',
    customerPhone: '+94 77 123 4567',
    status: 'CONFIRMED',
    totalAmount: 50.50,
    shippingAddress: 'No. 25, Kandy Road, Kelaniya, 11600',
    requiresPrescription: true,
    prescriptionStatus: 'APPROVED',
    items: [
      { id: 1, productName: 'Amoxicillin 500mg', quantity: 2, unitPrice: 18.50, totalPrice: 37.00 },
      { id: 2, productName: 'Ibuprofen 400mg', quantity: 1, unitPrice: 7.99, totalPrice: 7.99 }
    ]
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-88902',
    createdAt: '2024-02-14T10:15:00',
    customerId: 2,
    customerName: 'Kusuma Ranjanee',
    customerEmail: 'kusuma.ranjanee@pharmacare.lk',
    customerPhone: '+94 71 234 5678',
    status: 'AWAITING_PRESCRIPTION',
    totalAmount: 32.00,
    shippingAddress: 'No. 87, Peradeniya Road, Kandy, 20000',
    requiresPrescription: true,
    prescriptionStatus: 'PENDING',
    items: [
      { id: 3, productName: 'Atorvastatin 20mg', quantity: 1, unitPrice: 32.00, totalPrice: 32.00 }
    ]
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-88903',
    createdAt: '2024-02-14T11:00:00',
    customerId: 3,
    customerName: 'Matheesha Sahan',
    customerEmail: 'matheesha.sahan@pharmacare.lk',
    customerPhone: '+94 76 345 6789',
    status: 'PROCESSING',
    totalAmount: 15.98,
    shippingAddress: 'No. 112, Colombo Road, Gampaha, 11000',
    requiresPrescription: false,
    prescriptionStatus: 'NOT_REQUIRED',
    items: [
      { id: 4, productName: 'Ibuprofen 400mg', quantity: 2, unitPrice: 7.99, totalPrice: 15.98 }
    ]
  }
];

// Fallback seed prescriptions
const SEED_PRESCRIPTIONS = [
  {
    id: 1,
    orderId: 2,
    orderNumber: 'ORD-2024-88902',
    customerId: 2,
    customerName: 'Kusuma Ranjanee',
    originalFilename: 'rx_atorvastatin_kusuma_ranjanee.pdf',
    filePath: '/uploads/prescriptions/rx_atorvastatin_kusuma_ranjanee.pdf',
    status: 'PENDING',
    uploadedAt: '2024-02-14T10:16:00',
    notes: 'Prescription issued by Dr. Ranjith Perera, MBBS for 90-day supply.'
  },
  {
    id: 2,
    orderId: 1,
    orderNumber: 'ORD-2024-88901',
    customerId: 1,
    customerName: 'Sahan Jayaweera',
    originalFilename: 'amox_sahan_jayaweera.jpg',
    filePath: '/uploads/prescriptions/amox_sahan_jayaweera.jpg',
    status: 'APPROVED',
    reviewedBy: 'pharmacist_admin',
    reviewedAt: '2024-02-14T09:45:00',
    uploadedAt: '2024-02-14T09:31:00',
    notes: 'Verified valid doctor signature and SLMC registration number.'
  }
];

export default function OnlineOrders() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'prescriptions', 'payments'

  // Data
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [paymentOrders, setPaymentOrders] = useState([]); // orders with PENDING_PAYMENT
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0
  });

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailModal, setOrderDetailModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
  const [paymentReviewModal, setPaymentReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [paymentReviewNotes, setPaymentReviewNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load Orders
  const loadOrders = async (page = 0) => {
    try {
      setLoading(true);
      const data = await salesService.getAllOrders(page, pagination.size);
      if (data?.content && data.content.length > 0) {
        setOrders(data.content);
        setPagination({
          page: data.number || 0,
          size: data.size || 10,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || data.content.length
        });
      } else {
        setOrders(SEED_ONLINE_ORDERS);
        setPagination({
          page: 0,
          size: 10,
          totalPages: 1,
          totalElements: SEED_ONLINE_ORDERS.length
        });
      }
    } catch (err) {
      console.warn('Orders API error, using seed orders:', err);
      setOrders(SEED_ONLINE_ORDERS);
      setPagination({
        page: 0,
        size: 10,
        totalPages: 1,
        totalElements: SEED_ONLINE_ORDERS.length
      });
    } finally {
      setLoading(false);
    }
  };

  // Load Prescriptions
  const loadPrescriptions = async () => {
    try {
      const data = await salesService.getAllPrescriptions();
      setPrescriptions(data && data.length > 0 ? data : SEED_PRESCRIPTIONS);
    } catch (err) {
      console.warn('Prescriptions API error, using seed:', err);
      setPrescriptions(SEED_PRESCRIPTIONS);
    }
  };

  // Load orders pending payment review (Bank/Card)
  const loadPaymentOrders = async () => {
    try {
      const data = await salesService.getOrdersByStatus('PENDING_PAYMENT');
      setPaymentOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Payment orders load error:', err);
      setPaymentOrders([]);
    }
  };

  useEffect(() => {
    loadOrders(0);
    loadPrescriptions();
    loadPaymentOrders();
  }, []);

  // Review payment handler (approve/reject)
  const handleReviewPayment = async (approved) => {
    if (!selectedPaymentOrder) return;
    try {
      setUpdatingStatus(true);
      const status = approved ? 'APPROVED' : 'REJECTED';
      const notes = paymentReviewNotes || (approved ? 'Payment verified and approved.' : 'Payment rejected.');
      await salesService.reviewPayment(selectedPaymentOrder.id, { status, reviewNotes: notes });
      toast.success(`Payment ${approved ? 'approved' : 'rejected'}.`);
      setPaymentReviewModal(false);
      loadPaymentOrders();
      loadOrders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review payment.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open a file URL in a new tab (authed via token in URL is not feasible; open inline)
  const openFile = (url) => {
    const token = localStorage.getItem('pharmacy_token');
    // Fetch the file with auth header and open as blob URL
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      })
      .catch(() => toast.error('Could not open file.'));
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        ord.orderNumber?.toLowerCase().includes(q) ||
        ord.customerName?.toLowerCase().includes(q) ||
        ord.shippingAddress?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || ord.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Order Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="teal">Confirmed</Badge>;
      case 'PROCESSING':
        return <Badge variant="blue">Processing</Badge>;
      case 'READY_FOR_DELIVERY':
        return <Badge variant="purple">Ready for Delivery</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="warning">Out for Delivery</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'AWAITING_PRESCRIPTION':
        return <Badge variant="warning">Awaiting Rx Review</Badge>;
      case 'PENDING_PAYMENT':
        return <Badge variant="gray">Pending Payment</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (newStatus) => {
    if (!selectedOrder) return;
    try {
      setUpdatingStatus(true);
      const updatedOrder = await salesService.updateOrderStatus(selectedOrder.id, newStatus);
      toast.success(`Order status updated to ${newStatus}.`);

      const updated = updatedOrder || { ...selectedOrder, status: newStatus };
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));
    } catch (err) {
      console.error('Order status API failed:', err);
      const msg = err.response?.data?.message || 'Failed to update order status.';
      toast.error(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Review Prescription Handler
  const handleReviewPrescription = async (approved) => {
    if (!selectedPrescription) return;
    try {
      setUpdatingStatus(true);
      const newStatus = approved ? 'APPROVED' : 'REJECTED';
      const notes = reviewNotes || (approved ? 'Prescription verified and approved.' : 'Prescription rejected by pharmacist.');
      const reviewed = await salesService.reviewPrescription(selectedPrescription.id, {
        status: newStatus,
        reviewNotes: notes
      });

      toast.success(`Prescription ${approved ? 'Approved' : 'Rejected'}.`);

      // Update state
      const updated = reviewed || {
        ...selectedPrescription,
        status: newStatus,
        reviewedByName: user?.username || 'pharmacist',
        reviewNotes: notes
      };
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === selectedPrescription.id ? updated : p))
      );
      setPrescriptionModal(false);
      // Reload orders to reflect possible status cascade (e.g. AWAITING_PRESCRIPTION -> CONFIRMED)
      loadOrders(pagination.page);
    } catch (err) {
      console.error('Prescription review API error:', err);
      const msg = err.response?.data?.message || 'Failed to review prescription.';
      toast.error(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div>
          <div className="module-title-row">
            <h1 className="module-title">Online Orders & Prescriptions</h1>
            <Badge variant="teal">{orders.length} Active Orders</Badge>
          </div>
          <p className="module-subtitle">
            Manage online prescription fulfillment, review uploaded doctor scripts, and dispatch customer orders.
          </p>
        </div>

        <div className="module-actions">
          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={() => {
              loadOrders(pagination.page);
              loadPrescriptions();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-slate-200)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'orders' ? '2px solid var(--color-teal-600)' : '2px solid transparent',
            color: activeTab === 'orders' ? 'var(--color-teal-700)' : 'var(--color-slate-500)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShoppingBag size={16} />
          Online Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'prescriptions' ? '2px solid var(--color-teal-600)' : '2px solid transparent',
            color: activeTab === 'prescriptions' ? 'var(--color-teal-700)' : 'var(--color-slate-500)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileCheck size={16} />
          Doctor Prescriptions ({prescriptions.filter((p) => p.status === 'PENDING_REVIEW').length} Pending)
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'payments' ? '2px solid var(--color-teal-600)' : '2px solid transparent',
            color: activeTab === 'payments' ? 'var(--color-teal-700)' : 'var(--color-slate-500)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CreditCard size={16} />
          Payment Slips ({paymentOrders.length} Pending)
        </button>
      </div>

      {/* ================= TAB 1: ONLINE ORDERS ================= */}
      {activeTab === 'orders' && (
        <>
          {/* Quick Metrics */}
          <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Total Web Orders
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                    {orders.length}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Awaiting Rx Review
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>
                    {orders.filter((o) => o.status === 'AWAITING_PRESCRIPTION').length}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Ready for Delivery
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
                    {orders.filter((o) => o.status === 'READY_FOR_DELIVERY').length}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Orders Table Card */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
                  <Input
                    placeholder="Search by order #, client, or address..."
                    icon={<Search size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <select
                    className="form-control"
                    style={{ width: 'auto', minWidth: '180px', fontSize: '0.875rem' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Order Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="AWAITING_PRESCRIPTION">Awaiting Prescription</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardBody style={{ padding: 0 }}>
              {loading ? (
                <LoadingSpinner text="Loading online orders..." />
              ) : filteredOrders.length === 0 ? (
                <EmptyState
                  icon={<ShoppingBag size={36} />}
                  title="No orders found"
                  message="No customer web orders match your search or filter."
                />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Prescription</th>
                        <th>Delivery Destination</th>
                        <th>Total Amount</th>
                        <th>Workflow Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--color-teal-700)' }}>
                              {ord.orderNumber}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-slate-800)', fontSize: '0.875rem' }}>
                                {ord.customerName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                                {ord.customerPhone || ord.customerEmail}
                              </div>
                            </div>
                          </td>
                          <td>
                            {ord.requiresPrescription ? (
                              <Badge
                                variant={ord.prescriptionStatus === 'APPROVED' ? 'success' : 'warning'}
                              >
                                {ord.prescriptionStatus || 'Rx Required'}
                              </Badge>
                            ) : (
                              <Badge variant="gray">No Rx</Badge>
                            )}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-700)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ord.fulfillmentType === 'STORE_PICKUP' ? (
                              <span style={{ color: '#0369a1', fontWeight: 700 }}>🏪 Store Pickup</span>
                            ) : (
                              ord.deliveryAddress || ord.shippingAddress || 'Home Delivery'
                            )}
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-slate-900)' }}>
                              {formatCurrency(ord.totalAmount)}
                            </span>
                          </td>
                          <td>{renderStatusBadge(ord.status)}</td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Eye size={14} />}
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setOrderDetailModal(true);
                                }}
                              >
                                View Order
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

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              onPageChange={(p) => loadOrders(p)}
            />
          </Card>
        </>
      )}

      {/* ================= TAB 2: PRESCRIPTION REVIEWS ================= */}
      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-slate-900)' }}>
                  Doctor Prescription Verification Queue
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                  Legally mandatory pharmacist inspection and authorization of patient uploaded medical scripts.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {prescriptions.length === 0 ? (
              <EmptyState
                icon={<FileCheck size={36} />}
                title="No prescription scripts uploaded"
                message="Prescriptions uploaded by patients for Rx-required medications will appear here."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Order Link</th>
                      <th>Prescription File</th>
                      <th>Upload Date</th>
                      <th>Status</th>
                      <th>Reviewer</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                            {p.customerName || `Patient #${p.customerId}`}
                          </div>
                        </td>
                        <td>
                          <Badge variant="teal">{p.orderNumber || `Order #${p.orderId}`}</Badge>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                            <FileText size={14} color="var(--color-teal-600)" />
                            {p.originalFilename}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {p.uploadedAt ? new Date(p.uploadedAt).toLocaleString() : 'Recent'}
                        </td>
                        <td>
                          {p.status === 'APPROVED' ? (
                            <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                              Approved
                            </Badge>
                          ) : p.status === 'REJECTED' ? (
                            <Badge variant="danger" icon={<XCircle size={12} />}>
                              Rejected
                            </Badge>
                          ) : (
                            <Badge variant="warning" icon={<Clock size={12} />}>
                              Pending Review
                            </Badge>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {p.reviewedByName || p.reviewedBy || '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            {p.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<ExternalLink size={13} />}
                                onClick={() => openFile(salesService.getPrescriptionFileUrl(p.id))}
                                title="View uploaded file"
                              >
                                File
                              </Button>
                            )}
                            <Button
                              variant={p.status === 'PENDING_REVIEW' ? 'teal' : 'outline'}
                              size="sm"
                              icon={<FileCheck size={14} />}
                              onClick={() => {
                                setSelectedPrescription(p);
                                setReviewNotes(p.reviewNotes || p.notes || '');
                                setPrescriptionModal(true);
                              }}
                            >
                              {p.status === 'PENDING_REVIEW' ? 'Inspect & Authorize' : 'View Script'}
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

      {/* ================= TAB 3: PAYMENT SLIP REVIEWS ================= */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-slate-900)' }}>
                  Bank / Card Payment Slip Review Queue
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                  Verify uploaded bank transfer or card payment receipts before confirming orders.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={14} />}
                onClick={loadPaymentOrders}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {paymentOrders.length === 0 ? (
              <EmptyState
                icon={<CreditCard size={36} />}
                title="No pending payment slips"
                message="Orders paid by Bank/Card transfer that are awaiting slip verification will appear here."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order Number</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Payment Method</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--color-teal-700)' }}>
                            {ord.orderNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-slate-800)' }}>
                            {ord.customerName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                            {ord.customerEmail}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td>
                          <Badge variant="blue">{ord.paymentMethod || 'BANK_TRANSFER'}</Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<ExternalLink size={13} />}
                              onClick={() => openFile(salesService.getPaymentSlipUrl(ord.id))}
                            >
                              View Slip
                            </Button>
                            <Button
                              variant="teal"
                              size="sm"
                              icon={<CreditCard size={14} />}
                              onClick={() => {
                                setSelectedPaymentOrder(ord);
                                setPaymentReviewNotes('');
                                setPaymentReviewModal(true);
                              }}
                            >
                              Review
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

      {/* ================= MODAL: ORDER DETAILS & STATUS UPDATE ================= */}
      <Modal
        isOpen={orderDetailModal}
        onClose={() => setOrderDetailModal(false)}
        title={selectedOrder ? `Order Details: ${selectedOrder.orderNumber}` : 'Order Details'}
        size="lg"
      >
        {selectedOrder && (
          <div>
            {/* Top Customer Info Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, var(--color-slate-50), var(--color-teal-50))',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                marginBottom: '1.5rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-slate-800)' }}>
                    {selectedOrder.customerName}
                  </span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                  Email: {selectedOrder.customerEmail} | Phone: {selectedOrder.customerPhone}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginTop: '0.2rem' }}>
                  {selectedOrder.fulfillmentType === 'STORE_PICKUP' ? (
                    <span>Fulfilment: <strong style={{ color: '#0369a1' }}>🏪 Store Pickup</strong> (PharmaCare Pro Main Branch)</span>
                  ) : (
                    <span>Delivery Address: <strong>{selectedOrder.deliveryAddress || selectedOrder.shippingAddress || 'N/A'}</strong></span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>Order Total</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-teal-800)' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>

            {/* Itemized Order Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--color-slate-800)' }}>
                Prescription & Medication Items
              </h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                          {item.productName}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status Workflow Selector */}
            <div style={{ background: 'var(--color-slate-50)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-slate-200)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-slate-800)', marginBottom: '0.5rem' }}>
                Advance Order Workflow Status
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(
                  (st) => (
                    <Button
                      key={st}
                      variant={selectedOrder.status === st ? 'teal' : 'outline'}
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateOrderStatus(st)}
                    >
                      {st.replace(/_/g, ' ')}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: PRESCRIPTION SCRIPT REVIEW ================= */}
      <Modal
        isOpen={prescriptionModal}
        onClose={() => setPrescriptionModal(false)}
        title={selectedPrescription ? `Pharmacist Prescription Inspection: ${selectedPrescription.orderNumber || 'Standalone'}` : 'Prescription Review'}
        size="md"
      >
        {selectedPrescription && (
          <div>
            <div style={{ padding: '1rem', background: 'var(--color-slate-50)', borderRadius: '8px', border: '1px solid var(--color-slate-200)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Patient:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{selectedPrescription.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Script File:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-teal-700)' }}>{selectedPrescription.originalFilename}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Current Status:</span>
                <Badge variant={selectedPrescription.status === 'APPROVED' ? 'success' : selectedPrescription.status === 'REJECTED' ? 'danger' : 'warning'}>
                  {selectedPrescription.status}
                </Badge>
              </div>
              {selectedPrescription.id && (
                <div style={{ marginTop: '0.75rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ExternalLink size={13} />}
                    onClick={() => openFile(salesService.getPrescriptionFileUrl(selectedPrescription.id))}
                  >
                    Open Prescription File
                  </Button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Pharmacist Verification Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Verify doctor license, dosage instructions, and refill parameters..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button
                variant="outline"
                type="button"
                onClick={() => setPrescriptionModal(false)}
                disabled={updatingStatus}
              >
                Close
              </Button>
              {selectedPrescription.status !== 'APPROVED' && selectedPrescription.status !== 'REJECTED' && (
                <>
                  <Button
                    variant="danger"
                    icon={<XCircle size={16} />}
                    loading={updatingStatus}
                    onClick={() => handleReviewPrescription(false)}
                  >
                    Reject Script
                  </Button>
                  <Button
                    variant="teal"
                    icon={<CheckCircle2 size={16} />}
                    loading={updatingStatus}
                    onClick={() => handleReviewPrescription(true)}
                  >
                    Approve Script
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: PAYMENT SLIP REVIEW ================= */}
      <Modal
        isOpen={paymentReviewModal}
        onClose={() => setPaymentReviewModal(false)}
        title={selectedPaymentOrder ? `Payment Review: ${selectedPaymentOrder.orderNumber}` : 'Payment Review'}
        size="md"
      >
        {selectedPaymentOrder && (
          <div>
            <div style={{ padding: '1rem', background: 'var(--color-slate-50)', borderRadius: '8px', border: '1px solid var(--color-slate-200)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Customer:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{selectedPaymentOrder.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Order Total:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-teal-700)' }}>{formatCurrency(selectedPaymentOrder.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Payment Method:</span>
                <Badge variant="blue">{selectedPaymentOrder.paymentMethod}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink size={13} />}
                onClick={() => openFile(salesService.getPaymentSlipUrl(selectedPaymentOrder.id))}
              >
                View Uploaded Payment Slip
              </Button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Review Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Confirm bank reference number, amount, and account details..."
                value={paymentReviewNotes}
                onChange={(e) => setPaymentReviewNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" onClick={() => setPaymentReviewModal(false)} disabled={updatingStatus}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={<XCircle size={16} />}
                loading={updatingStatus}
                onClick={() => handleReviewPayment(false)}
              >
                Reject Payment
              </Button>
              <Button
                variant="teal"
                icon={<CheckCircle2 size={16} />}
                loading={updatingStatus}
                onClick={() => handleReviewPayment(true)}
              >
                Approve Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
