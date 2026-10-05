import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  ShieldCheck,
  Pill,
  CheckCircle2,
  X
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatUtils';
import { getProductImageUrl } from '../../utils/productImageUtil';
import EmptyState from '../../components/common/EmptyState';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    discountAmount,
    finalTotal,
    requiresPrescription,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCodeInput.trim());
      setCouponCodeInput('');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const deliveryFee = (cart.totalAmount || 0) >= 2000 ? 0 : 250;
  const grandTotal = finalTotal + (cart.items.length > 0 ? deliveryFee : 0);

  if (cart.items.length === 0) {
    return (
      <div style={{ padding: '3rem 0' }}>
        <EmptyState
          icon={ShoppingCart}
          title="Your Shopping Cart is Empty"
          description="You haven't added any medicines or healthcare products to your cart yet."
          actionText="Browse Medicines Catalog"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  return (
    <div>
      {/* ── Breadcrumb & Title ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
          <Link to="/" style={{ color: 'var(--color-primary)' }}>Home</Link> / <span>Shopping Cart</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={clearCart}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-red-600)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Trash2 size={15} /> Clear All Items
          </button>
        </div>
      </div>

      {/* ── Prescription Requirement Notice ──────────────────────────────── */}
      {requiresPrescription && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1.5px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          <Pill size={22} color="#dc2626" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', color: '#991b1b', lineHeight: '1.4' }}>
            <strong>Prescription items detected:</strong> One or more items in your cart require a valid prescription. You will be requested to upload your prescription document during checkout.
          </span>
        </div>
      )}

      {/* ── Main Cart View Grid ───────────────────────────────────────────── */}
      <div className="cart-view-container">
        {/* Left: Cart Items List */}
        <div className="cart-items-card">
          {cart.items.map((item) => {
            const imgUrl = getProductImageUrl({
              id: item.productId,
              name: item.productName,
              categoryName: item.categoryName
            });

            return (
              <div key={item.id} className="cart-item-row">
                {/* Thumbnail */}
                <img
                  src={imgUrl}
                  alt={item.productName}
                  className="cart-item-thumb"
                />

                {/* Info */}
                <div>
                  <Link
                    to={`/products/${item.productId}`}
                    style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.2rem' }}
                  >
                    {item.productName}
                  </Link>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {item.productSku && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        SKU: {item.productSku}
                      </span>
                    )}
                    {item.requiresPrescription && (
                      <span className="rx-badge" style={{ position: 'static', padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>
                        Rx
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-primary-active)', fontWeight: 600, marginTop: '0.35rem' }}>
                    {formatCurrency(item.unitPrice)} each
                  </div>
                  {item.availableStock !== undefined && item.availableStock !== null && (
                    <div style={{ fontSize: '0.75rem', color: item.quantity >= item.availableStock ? '#dc2626' : 'var(--color-text-muted)', marginTop: '0.2rem', fontWeight: 500 }}>
                      Available: {item.availableStock} units
                    </div>
                  )}
                </div>

                {/* Quantity Controls */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.15rem',
                    background: '#ffffff'
                  }}
                >
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-main)'
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ width: '32px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.availableStock !== undefined && item.availableStock !== null && item.quantity >= item.availableStock}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'none',
                      cursor: (item.availableStock !== undefined && item.availableStock !== null && item.quantity >= item.availableStock) ? 'not-allowed' : 'pointer',
                      opacity: (item.availableStock !== undefined && item.availableStock !== null && item.quantity >= item.availableStock) ? 0.4 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-main)'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal */}
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-active)', minWidth: '95px', textAlign: 'right' }}>
                  {formatCurrency(item.subtotal || item.unitPrice * item.quantity)}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  title="Remove item"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-slate-400)',
                    padding: '0.35rem'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
            <Link
              to="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-primary)'
              }}
            >
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="order-summary-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
            Order Summary
          </h3>

          {/* Subtotal */}
          <div className="summary-row">
            <span>Items Subtotal:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
              {formatCurrency(cart.totalAmount)}
            </span>
          </div>

          {/* Coupon / Discount section */}
          {appliedCoupon ? (
            <div className="summary-row" style={{ color: '#059669' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={15} /> Coupon ({appliedCoupon.code}):
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>
                  -{formatCurrency(discountAmount)}
                </span>
                <button
                  onClick={removeCoupon}
                  title="Remove coupon"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red-500)', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} style={{ margin: '1rem 0' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Enter promo coupon code"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponCodeInput.trim()}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}
                >
                  Apply
                </button>
              </div>
            </form>
          )}

          {/* Delivery Fee */}
          <div className="summary-row">
            <span>Estimated Delivery:</span>
            <span style={{ fontWeight: 700, color: deliveryFee === 0 ? '#059669' : 'var(--color-text-main)' }}>
              {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
            </span>
          </div>

          {deliveryFee > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Add {formatCurrency(Math.max(0, 2000 - cart.totalAmount))} more for Free Delivery
            </div>
          )}

          {/* Grand Total */}
          <div className="summary-row total">
            <span>Total:</span>
            <span style={{ color: 'var(--color-primary-active)' }}>
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Proceed Button */}
          <button
            onClick={() => navigate('/checkout')}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '1rem',
              fontWeight: 800,
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          {/* Trust Guarantees */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--color-primary)" /> Secure SSL Encrypted Checkout
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--color-primary)" /> 100% Genuine Pharmacy Certified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
