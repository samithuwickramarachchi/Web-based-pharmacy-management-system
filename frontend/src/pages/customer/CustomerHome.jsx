import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Award,
  Clock,
  ArrowRight,
  ShoppingCart,
  FileText,
  Tag,
  Sparkles,
  Pill,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy
} from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import promotionService from '../../services/promotionService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatUtils';
import { getProductImageUrl } from '../../utils/productImageUtil';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CustomerHome() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        setLoading(true);
        const [prodRes, catRes, promoRes] = await Promise.allSettled([
          inventoryService.getProducts(0, 12),
          inventoryService.getCategories(),
          promotionService.getActive(),
        ]);

        if (!isMounted) return;

        if (prodRes.status === 'fulfilled' && prodRes.value) {
          const list = prodRes.value.content || (Array.isArray(prodRes.value) ? prodRes.value : []);
          setProducts(list);
        }

        if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
          setCategories(catRes.value);
        }

        if (promoRes.status === 'fulfilled' && Array.isArray(promoRes.value)) {
          setPromotions(promoRes.value);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => { isMounted = false; };
  }, []);

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    try {
      setAddingId(product.id);
      await addToCart(product, 1);
    } finally {
      setAddingId(null);
    }
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied coupon code ${code} to clipboard!`);
  };

  // Popular category icons fallback
  const getCategoryIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('vitamin') || n.includes('supplement')) return <Sparkles size={24} />;
    if (n.includes('heart') || n.includes('cardio')) return <HeartPulse size={24} />;
    if (n.includes('first aid')) return <Activity size={24} />;
    return <Pill size={24} />;
  };

  return (
    <div>
      {/* ── Modern Hero Section ────────────────────────────────────────────── */}
      <section className="customer-hero">
        <div className="customer-hero-content">
          <div className="hero-pill-badge">
            <ShieldCheck size={14} /> Licensed NMRA Community Pharmacy
          </div>
          <h1 className="customer-hero-title">
            Your Health, Our Priority.<br />Genuine Medicines Delivered.
          </h1>
          <p className="customer-hero-subtitle">
            Order certified pharmaceutical medicines, vitamins, and healthcare essentials from registered pharmacists. Enjoy express doorstep delivery and loyalty rewards on every purchase.
          </p>
          <div className="customer-hero-cta">
            <Link
              to="/products"
              className="btn btn-primary"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-primary-active)',
                fontWeight: 700,
                padding: '0.75rem 1.6rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Browse Medicines <ArrowRight size={18} />
            </Link>
            <Link
              to="/account?tab=prescriptions"
              className="btn"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 600,
                padding: '0.75rem 1.4rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <FileText size={18} /> Upload Prescription
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Pillars Bar ────────────────────────────────────────────── */}
      <div className="trust-bar">
        <div className="trust-card">
          <div className="trust-icon-box">
            <Truck size={22} />
          </div>
          <div className="trust-text">
            <h4>Fast Delivery</h4>
            <p>Direct to your home or office</p>
          </div>
        </div>
        <div className="trust-card">
          <div className="trust-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div className="trust-text">
            <h4>100% Genuine</h4>
            <p>Direct from verified manufacturers</p>
          </div>
        </div>
        <Link
          to="/account?tab=loyalty"
          className="trust-card"
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          title="View Loyalty Rewards & Membership Privileges"
        >
          <div className="trust-icon-box" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Award size={22} />
          </div>
          <div className="trust-text">
            <h4>Loyalty Rewards</h4>
            <p>Earn 1 pt per RS 100 spent</p>
          </div>
        </Link>
        <Link
          to="/account?tab=support"
          className="trust-card"
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          title="Contact Pharmacist Advisory"
        >
          <div className="trust-icon-box">
            <Clock size={22} />
          </div>
          <div className="trust-text">
            <h4>24/7 Support</h4>
            <p>Pharmacist advisory on call</p>
          </div>
        </Link>
      </div>

      {/* ── Active Promotions Banner ─────────────────────────────────────── */}
      {promotions.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <div className="section-header-row">
            <div>
              <h2 className="section-header-title">Special Offers & Coupons</h2>
              <p className="section-header-subtitle">Apply these discount codes during checkout to save on your orders</p>
            </div>
          </div>
          <div className="promo-cards-row">
            {promotions.slice(0, 3).map((promo) => (
              <div key={promo.id} className="promo-coupon-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <Tag size={16} color="var(--color-primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{promo.name}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {promo.description || `${promo.discountValue}% discount on orders`}
                  </p>
                  {promo.minOrderAmount > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', display: 'block', marginTop: '0.2rem' }}>
                      Min order: {formatCurrency(promo.minOrderAmount)}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="coupon-code-badge">{promo.couponCode}</div>
                  <button
                    onClick={() => copyCouponCode(promo.couponCode)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      marginTop: '0.35rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}
                  >
                    <Copy size={12} /> Copy Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Shop by Category ─────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div style={{ marginBottom: '3.5rem' }}>
          <div className="section-header-row">
            <div>
              <h2 className="section-header-title">Browse by Category</h2>
              <p className="section-header-subtitle">Find the health essentials and treatments you need</p>
            </div>
            <Link
              to="/products"
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="category-grid">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => navigate(`/products?category=${cat.id}`)}
              >
                <div className="category-card-icon">
                  {getCategoryIcon(cat.name)}
                </div>
                <div className="category-card-title">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Featured & Popular Medicines ─────────────────────────────────── */}
      <div>
        <div className="section-header-row">
          <div>
            <h2 className="section-header-title">Popular Healthcare Products</h2>
            <p className="section-header-subtitle">High-demand medicines and daily wellness essentials</p>
          </div>
          <Link
            to="/products"
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            Explore Catalog <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <LoadingSpinner size="lg" text="Loading pharmaceutical products..." />
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
            No products available at the moment.
          </div>
        ) : (
          <div className="product-grid">
            {products.slice(0, 8).map((product) => {
              const inStock = product.totalStock !== undefined ? product.totalStock > 0 : true;
              const isLowStock = product.totalStock > 0 && product.totalStock <= 5;
              const imgUrl = getProductImageUrl(product);

              return (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/products/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-card-image-wrap">
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="product-card-image"
                      loading="lazy"
                    />
                    {product.requiresPrescription ? (
                      <span className="rx-badge" title="Prescription required by law">
                        <Pill size={12} /> Rx Required
                      </span>
                    ) : (
                      <span className="otc-badge">OTC Item</span>
                    )}
                  </div>

                  <div className="product-card-body">
                    <div className="product-card-category">
                      {product.categoryName || 'Medicine'}
                    </div>
                    <h3 className="product-card-title">{product.name}</h3>
                    <div className="product-card-dosage">
                      {product.dosageInfo || (product.unit ? `Unit: ${product.unit}` : 'Standard pack')}
                    </div>

                    <div className="product-card-stock-row">
                      {inStock ? (
                        isLowStock ? (
                          <span className="stock-tag low-stock">
                            <AlertCircle size={13} /> Only {product.totalStock} left
                          </span>
                        ) : (
                          <span className="stock-tag in-stock">
                            <CheckCircle2 size={13} /> In Stock
                          </span>
                        )
                      ) : (
                        <span className="stock-tag out-stock">
                          <AlertCircle size={13} /> Out of Stock
                        </span>
                      )}
                    </div>

                    <div className="product-card-footer">
                      <div className="product-card-price">
                        {formatCurrency(product.sellingPrice)}
                      </div>
                      <button
                        className="btn btn-primary"
                        disabled={!inStock || addingId === product.id}
                        onClick={(e) => handleAddToCart(e, product)}
                        style={{
                          borderRadius: 'var(--radius-full)',
                          padding: '0.45rem 0.9rem',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <ShoppingCart size={15} />
                        {addingId === product.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Prescription Upload Banner Callout ──────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
          border: '1.5px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-active)', marginBottom: '0.5rem' }}>
            Have a Doctor's Prescription?
          </h3>
          <p style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Simply upload a photo or scan of your doctor's prescription. Our certified pharmacists will review the items, prepare your medicine, and arrange secure doorstep delivery.
          </p>
        </div>
        <Link
          to="/account?tab=prescriptions"
          className="btn btn-primary"
          style={{
            padding: '0.75rem 1.75rem',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <FileText size={18} /> Upload Prescription Now
        </Link>
      </div>
    </div>
  );
}
