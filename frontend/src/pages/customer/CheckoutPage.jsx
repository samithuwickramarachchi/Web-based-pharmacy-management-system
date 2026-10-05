import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  Check,
  Lock,
  Package,
  Store,
  MapPin,
  Clock,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import customerService from '../../services/customerService';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatUtils';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, finalTotal, discountAmount, appliedCoupon, requiresPrescription, clearCart } = useCart();
  const { toast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fulfilment State: 'DELIVERY' | 'STORE_PICKUP'
  const [fulfillmentType, setFulfillmentType] = useState('DELIVERY');

  // Form State
  const [selectedAddressMode, setSelectedAddressMode] = useState('SAVED'); // 'SAVED' | 'NEW'
  const [selectedSavedAddress, setSelectedSavedAddress] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'BANK_TRANSFER' | 'CARD'
  const [orderNotes, setOrderNotes] = useState('');

  // Prescription File
  const [rxFile, setRxFile] = useState(null);
  const [rxFileError, setRxFileError] = useState('');
  const rxInputRef = useRef(null);

  // Bank Transfer Slip
  const [slipFile, setSlipFile] = useState(null);
  const [slipFileError, setSlipFileError] = useState('');
  const slipInputRef = useRef(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Load customer profile & addresses
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      setLoadingProfile(true);
      customerService.getMe()
        .then((data) => {
          if (!isMounted) return;
          setCustomer(data);
          setContactPhone(data.phone || '');

          // Check if there are saved addresses
          if (data.addresses && data.addresses.length > 0) {
            const def = data.addresses.find((a) => a.isDefault) || data.addresses[0];
            const formatted = `${def.addressLine1}${def.addressLine2 ? ', ' + def.addressLine2 : ''}, ${def.city}`;
            setSelectedSavedAddress(formatted);
            setSelectedAddressMode('SAVED');
          } else {
            setSelectedAddressMode('NEW');
          }
        })
        .catch(() => {
          setSelectedAddressMode('NEW');
        })
        .finally(() => {
          if (isMounted) setLoadingProfile(false);
        });
    } else {
      setLoadingProfile(false);
      setSelectedAddressMode('NEW');
    }

    return () => { isMounted = false; };
  }, [isAuthenticated]);

  // Delivery fee (Store Pickup is always FREE; Delivery is FREE for orders >= Rs. 2000, else Rs. 250)
  const deliveryFee = fulfillmentType === 'STORE_PICKUP' ? 0 : ((cart.totalAmount || 0) >= 2000 ? 0 : 250);
  const grandTotal = finalTotal + (cart.items.length > 0 ? deliveryFee : 0);

  // Redirect to login if unauthenticated
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center', background: '#ffffff', padding: '2.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <Lock size={44} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Customer Login Required</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
          Please sign in to your customer account to finalize your order, record your loyalty points, and track delivery progress.
        </p>
        <Link
          to="/login"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
        >
          Sign In to Continue Checkout
        </Link>
      </div>
    );
  }

  // If cart is empty and no placed order
  if (cart.items.length === 0 && !placedOrder) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2>No Items in Checkout</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0 1.5rem' }}>
          Your cart is currently empty. Please add items from our pharmacy catalog first.
        </p>
        <Link to="/products" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
          Browse Medicines
        </Link>
      </div>
    );
  }

  // ── Successful Order Screen ────────────────────────────────────────────────
  if (placedOrder) {
    return (
      <div style={{ maxWidth: '640px', margin: '3rem auto', background: '#ffffff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', padding: '3rem 2.5rem', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Check size={36} strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
          Thank You! Your Order is Placed
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
          Order <strong>#{placedOrder.orderNumber}</strong> has been received by our pharmacy staff.
        </p>

        <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span>Order Number:</span>
            <strong>{placedOrder.orderNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span>Total Amount:</span>
            <strong style={{ color: 'var(--color-primary-active)' }}>{formatCurrency(placedOrder.totalAmount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span>Payment Method:</span>
            <strong>{placedOrder.paymentMethod}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span>Fulfilment:</span>
            <strong style={{ color: placedOrder.fulfillmentType === 'STORE_PICKUP' ? '#0369a1' : '#059669' }}>
              {placedOrder.fulfillmentType === 'STORE_PICKUP' ? '🏪 Store Pickup' : '🚚 Home Delivery'}
            </strong>
          </div>
          {placedOrder.fulfillmentType !== 'STORE_PICKUP' && placedOrder.deliveryAddress && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Delivery Address:</span>
              <strong style={{ maxWidth: '60%', textAlign: 'right' }}>{placedOrder.deliveryAddress}</strong>
            </div>
          )}
          {placedOrder.fulfillmentType === 'STORE_PICKUP' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Pickup Location:</span>
              <strong style={{ maxWidth: '60%', textAlign: 'right' }}>PharmaCare Pro — Main Branch</strong>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            to="/account?tab=orders"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
          >
            Track Order Progress
          </Link>
          <Link
            to="/products"
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ── Place Order Handler ────────────────────────────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Validate delivery address — only required for DELIVERY orders
    let finalAddress = '';
    if (fulfillmentType === 'DELIVERY') {
      finalAddress = selectedAddressMode === 'SAVED' ? selectedSavedAddress : newAddressText.trim();
      if (!finalAddress) {
        toast.error('Please provide a complete delivery address.');
        return;
      }
    }

    // Validate prescription if required
    if (requiresPrescription && !rxFile) {
      setRxFileError('A doctor prescription file is required for the scheduled medicines in your cart.');
      toast.error('Please upload your prescription document before proceeding.');
      return;
    }

    if (rxFile) {
      const rxErr = validateFile(rxFile);
      if (rxErr) {
        setRxFileError(rxErr);
        return;
      }
    }

    if (slipFile) {
      const slipErr = validateFile(slipFile);
      if (slipErr) {
        setSlipFileError(slipErr);
        return;
      }
    }

    // Customer ID resolution
    const resolvedCustomerId = customer?.id || user?.customerId || (user?.roles?.includes('CUSTOMER') ? user.id : null);

    // Map frontend payment method labels to backend enum values
    const paymentMethodMap = {
      COD: 'CASH_ON_DELIVERY',
      BANK_TRANSFER: 'BANK_CARD_TRANSACTION',
      CARD: 'BANK_CARD_TRANSACTION',
    };

    const orderPayload = {
      customerId: resolvedCustomerId,
      fulfillmentType: fulfillmentType,
      deliveryAddress: fulfillmentType === 'DELIVERY' ? finalAddress : undefined,
      paymentMethod: paymentMethodMap[paymentMethod] || paymentMethod,
      notes: orderNotes.trim() || undefined,
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      couponCode: appliedCoupon?.code || undefined,
    };

    try {
      setSubmitting(true);
      let orderRes;

      if (rxFile) {
        orderRes = await salesService.createOrderWithPrescription(orderPayload, rxFile);
      } else {
        orderRes = await salesService.createOrder(orderPayload);
      }

      // If bank slip attached, upload it directly to order
      if (slipFile && orderRes?.id) {
        try {
          await salesService.uploadPaymentSlip(orderRes.id, slipFile);
        } catch (slipErr) {
          console.warn('Could not auto-attach slip:', slipErr);
          toast.warning('Order created, but payment slip upload failed. You can re-upload it from your Order History.');
        }
      }

      // Success
      toast.success('Order placed successfully!');
      setPlacedOrder(orderRes);
      clearCart();
    } catch (err) {
      console.error('Order creation failed:', err);
      toast.error(err.response?.data?.message || 'Could not place order. Please review your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
          <Link to="/" style={{ color: 'var(--color-primary)' }}>Home</Link> / <Link to="/cart" style={{ color: 'var(--color-primary)' }}>Cart</Link> / <span>Checkout</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
          Secure Checkout
        </h1>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div className="checkout-view-container">
          {/* Left Column: Form Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* 0. Order Fulfilment Card */}
            <div style={{ background: '#ffffff', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Package size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>1. Order Fulfilment</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Delivery Option */}
                <label
                  style={{
                    padding: '1.1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${fulfillmentType === 'DELIVERY' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: fulfillmentType === 'DELIVERY' ? 'var(--color-primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="fulfillmentType"
                    value="DELIVERY"
                    checked={fulfillmentType === 'DELIVERY'}
                    onChange={() => setFulfillmentType('DELIVERY')}
                    style={{ marginTop: '3px', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Truck size={16} color={fulfillmentType === 'DELIVERY' ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                      <strong style={{ fontSize: '0.95rem' }}>Home Delivery</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {(cart.totalAmount || 0) >= 2000 ? 'FREE delivery (order ≥ Rs. 2,000)' : 'Rs. 250 delivery fee'}
                    </span>
                  </div>
                </label>

                {/* Store Pickup Option */}
                <label
                  style={{
                    padding: '1.1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${fulfillmentType === 'STORE_PICKUP' ? '#0369a1' : 'var(--color-border)'}`,
                    background: fulfillmentType === 'STORE_PICKUP' ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="fulfillmentType"
                    value="STORE_PICKUP"
                    checked={fulfillmentType === 'STORE_PICKUP'}
                    onChange={() => setFulfillmentType('STORE_PICKUP')}
                    style={{ marginTop: '3px', accentColor: '#0369a1' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Store size={16} color={fulfillmentType === 'STORE_PICKUP' ? '#0369a1' : 'var(--color-text-muted)'} />
                      <strong style={{ fontSize: '0.95rem' }}>Store Pickup</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>FREE — collect at our pharmacy</span>
                  </div>
                </label>
              </div>

              {/* Store info banner when Store Pickup is chosen */}
              {fulfillmentType === 'STORE_PICKUP' && (
                <div style={{ marginTop: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '0.9rem 1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontWeight: 700, color: '#1d4ed8' }}>
                    <MapPin size={14} /> PharmaCare Pro — Main Branch
                  </div>
                  <div style={{ color: '#374151', lineHeight: '1.6' }}>
                    <div><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />Mon-Sat: 8:00 AM - 9:00 PM | Sun: 9:00 AM - 6:00 PM</div>
                    <div><Phone size={12} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />+94 11 234 5678</div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: Delivery Address - only shown for DELIVERY */}
            {fulfillmentType === 'DELIVERY' && (
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <MapPin size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>2. Delivery Address</h3>
              </div>

              {customer?.addresses && customer.addresses.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="addrMode"
                      checked={selectedAddressMode === 'SAVED'}
                      onChange={() => setSelectedAddressMode('SAVED')}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    Use Saved Address
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="addrMode"
                      checked={selectedAddressMode === 'NEW'}
                      onChange={() => setSelectedAddressMode('NEW')}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    Deliver to a New Address
                  </label>
                </div>
              )}

              {selectedAddressMode === 'SAVED' && customer?.addresses && customer.addresses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customer.addresses.map((addr) => {
                    const formatted = `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}`;
                    return (
                      <label
                        key={addr.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${selectedSavedAddress === formatted ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: selectedSavedAddress === formatted ? 'var(--color-primary-light)' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="savedAddrChoice"
                          value={formatted}
                          checked={selectedSavedAddress === formatted}
                          onChange={(e) => setSelectedSavedAddress(e.target.value)}
                          style={{ marginTop: '3px', accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <strong style={{ fontSize: '0.9rem', display: 'block' }}>{addr.addressType || 'Delivery Address'}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{formatted}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <textarea
                    rows={3}
                    placeholder="Enter complete street address, building/apartment, city, postal code..."
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    required={selectedAddressMode === 'NEW'}
                  />
                </div>
              )}
            </div>
            )}

            {/* 2. Payment Method Card */}
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <CreditCard size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{fulfillmentType === 'DELIVERY' ? '3. Payment Method' : '2. Payment Method'}</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Cash on delivery */}
                <label
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${paymentMethod === 'COD' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: paymentMethod === 'COD' ? 'var(--color-primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.925rem', display: 'block' }}>
                      {fulfillmentType === 'STORE_PICKUP' ? 'Pay at Counter (Pickup)' : 'Cash on Delivery'}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {fulfillmentType === 'STORE_PICKUP' ? 'Pay cash or card when collecting items' : 'Pay cash when package arrives'}
                    </span>
                  </div>
                </label>

                {/* Bank Transfer */}
                <label
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${paymentMethod === 'BANK_TRANSFER' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: paymentMethod === 'BANK_TRANSFER' ? 'var(--color-primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.925rem', display: 'block' }}>Bank Transfer</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Transfer via Online / Branch slip</span>
                  </div>
                </label>
              </div>

              {/* Bank Details & Slip Upload when Bank Transfer is chosen */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Building size={16} color="var(--color-primary)" />
                    <strong style={{ fontSize: '0.9rem' }}>Pharmacy Direct Account Details:</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                    <div><strong>Bank:</strong> Commercial Bank of Ceylon</div>
                    <div><strong>Account Name:</strong> PharmaCare Pro Pvt Ltd</div>
                    <div><strong>Account Number:</strong> 1002 9845 2310</div>
                    <div><strong>Branch:</strong> Colombo 03 Super Branch</div>
                  </div>

                  {/* Bank Slip Upload */}
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                      Upload Payment Slip / Receipt (Optional now, can also upload after transfer)
                    </label>
                    <div
                      onClick={() => slipInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--color-slate-300)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: slipFile ? 'var(--color-teal-50)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={20} color={slipFile ? 'var(--color-teal-600)' : 'var(--color-slate-400)'} />
                      <div style={{ flex: 1, fontSize: '0.85rem' }}>
                        {slipFile ? (
                          <span style={{ color: 'var(--color-primary-active)', fontWeight: 600 }}>
                            {slipFile.name} ({(slipFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            Click to upload deposit slip / transfer screenshot (PDF, JPG, PNG)
                          </span>
                        )}
                      </div>
                      {slipFile && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSlipFile(null); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red-500)' }}
                        >
                          <XCircle size={18} />
                        </button>
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
                            setSlipFileError('');
                          }
                        }}
                      />
                    </div>
                    {slipFileError && (
                      <p style={{ color: 'var(--color-red-600)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {slipFileError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Doctor's Prescription Upload (Required if cart has Rx items) */}
            <div
              style={{
                background: '#ffffff',
                border: requiresPrescription ? '2px solid #fecaca' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <FileText size={20} color={requiresPrescription ? '#dc2626' : 'var(--color-primary)'} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {fulfillmentType === 'DELIVERY' ? "4. Doctor's Prescription" : "3. Doctor's Prescription"} {requiresPrescription ? <span style={{ color: '#dc2626' }}>(Required)</span> : '(Optional)'}
                </h3>
              </div>

              {requiresPrescription && (
                <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.825rem', color: '#991b1b' }}>
                  <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                  Your cart contains regulated prescription medicines. Please upload a clear photo or scan of your doctor's prescription so our pharmacists can verify it before dispatch.
                </div>
              )}

              <div
                onClick={() => rxInputRef.current?.click()}
                style={{
                  border: `2px dashed ${rxFileError ? '#f87171' : rxFile ? 'var(--color-primary)' : 'var(--color-slate-300)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: rxFile ? 'var(--color-primary-light)' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <Upload size={22} color={rxFile ? 'var(--color-primary)' : 'var(--color-slate-400)'} />
                <div style={{ flex: 1, fontSize: '0.875rem' }}>
                  {rxFile ? (
                    <span style={{ color: 'var(--color-primary-active)', fontWeight: 700 }}>
                      {rxFile.name} ({(rxFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Click to upload prescription document (PDF, JPG, PNG — max {MAX_FILE_SIZE_MB}MB)
                    </span>
                  )}
                </div>
                {rxFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRxFile(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red-500)' }}
                  >
                    <XCircle size={18} />
                  </button>
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
                      setRxFileError('');
                    }
                  }}
                />
              </div>
              {rxFileError && (
                <p style={{ color: 'var(--color-red-600)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {rxFileError}
                </p>
              )}
            </div>

            {/* 4. Notes / Instructions */}
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-xs)' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                {fulfillmentType === 'STORE_PICKUP' ? 'Store Pickup Notes / Pharmacist Instructions (Optional)' : 'Delivery Instructions / Notes for Pharmacist (Optional)'}
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Leave with security, call upon arrival, patient allergies..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* Right Column: Order Review & Placement */}
          <div className="order-summary-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>
              Review Your Order
            </h3>

            {/* Fulfilment Mode Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.85rem', backgroundColor: fulfillmentType === 'STORE_PICKUP' ? '#eff6ff' : 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: `1.5px solid ${fulfillmentType === 'STORE_PICKUP' ? '#bfdbfe' : 'var(--color-border)'}` }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Fulfilment:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: fulfillmentType === 'STORE_PICKUP' ? '#1d4ed8' : '#059669' }}>
                {fulfillmentType === 'STORE_PICKUP' ? '🏪 Store Pickup' : '🚚 Home Delivery'}
              </span>
            </div>

            {/* Items Summary list */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              {cart.items.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{i.productName}</span>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>
                      Qty: {i.quantity} × {formatCurrency(i.unitPrice)}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {formatCurrency(i.subtotal || i.unitPrice * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="summary-row">
              <span>Items Total:</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(cart.totalAmount)}</span>
            </div>

            {/* Discount */}
            {discountAmount > 0 && (
              <div className="summary-row" style={{ color: '#059669' }}>
                <span>Discount ({appliedCoupon?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {/* Delivery fee */}
            <div className="summary-row">
              <span>{fulfillmentType === 'STORE_PICKUP' ? 'Fulfilment Charge:' : 'Delivery Fee:'}</span>
              <span style={{ fontWeight: 700, color: deliveryFee === 0 ? '#059669' : 'inherit' }}>
                {fulfillmentType === 'STORE_PICKUP' ? 'FREE (Store Pickup)' : (deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee))}
              </span>
            </div>

            {/* Grand Total */}
            <div className="summary-row total">
              <span>Final Total:</span>
              <span style={{ color: 'var(--color-primary-active)' }}>{formatCurrency(grandTotal)}</span>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '1.05rem',
                marginTop: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {submitting ? 'Placing Order...' : 'Confirm & Place Order'} <ArrowRight size={18} />
            </button>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <Link to="/cart" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                ← Edit Shopping Cart
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
