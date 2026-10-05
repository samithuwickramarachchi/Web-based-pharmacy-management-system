import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Pill,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  HeartHandshake,
  Plus,
  Minus,
  Truck
} from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatUtils';
import { getProductImageUrl } from '../../utils/productImageUtil';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await inventoryService.getProductById(id);
        if (isMounted) setProduct(data);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) loadProduct();
    return () => { isMounted = false; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    const maxStock = product.totalStock !== undefined ? product.totalStock : 0;
    if (quantity > maxStock) {
      toast.error(`Only ${maxStock} units are currently available.`);
      return;
    }
    try {
      setAdding(true);
      await addToCart(product, quantity);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
        <LoadingSpinner size="lg" text="Loading medicine details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2 style={{ marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          The requested medicine or product could not be located in our inventory.
        </p>
        <Link to="/products" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
          Back to Medicines Catalog
        </Link>
      </div>
    );
  }

  const inStock = product.totalStock !== undefined ? product.totalStock > 0 : true;
  const isLowStock = product.totalStock > 0 && product.totalStock <= 5;
  const imgUrl = getProductImageUrl(product);

  return (
    <div>
      {/* ── Breadcrumb & Back Link ────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--color-slate-300)' }}>/</span>
        <Link to="/products" style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
          Medicines
        </Link>
        <span style={{ color: 'var(--color-slate-300)' }}>/</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{product.categoryName || 'Product'}</span>
      </div>

      {/* ── Main Product Detail Card ─────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 440px) 1fr',
          gap: '3rem',
          marginBottom: '3rem'
        }}
      >
        {/* Left: Product Image Box */}
        <div>
          <div
            style={{
              width: '100%',
              height: '380px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <img
              src={imgUrl}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {product.requiresPrescription ? (
              <span
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: '#991b1b',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Pill size={14} /> Prescription Required (Rx)
              </span>
            ) : (
              <span
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: '#065f46',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Over The Counter (OTC)
              </span>
            )}
          </div>

          {/* Trust points under photo */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <ShieldCheck size={18} color="var(--color-primary)" />
              <span>100% Genuine Pharmacy Supply</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <HeartHandshake size={18} color="var(--color-primary)" />
              <span>Inspected by Licensed Pharmacists</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <Truck size={18} color="var(--color-primary)" />
              <span>Doorstep Delivery Island-Wide</span>
            </div>
          </div>
        </div>

        {/* Right: Product Attributes & Purchase Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            {product.categoryName || 'Pharmaceutical'}
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem', lineHeight: '1.25' }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            {product.sku && <span>SKU: <strong>{product.sku}</strong></span>}
            {product.manufacturerName && <span>Manufacturer: <strong>{product.manufacturerName}</strong></span>}
          </div>

          {/* Prescription Alert Banner */}
          {product.requiresPrescription && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.9rem' }}>
                  Doctor's Prescription Required
                </strong>
                <span style={{ fontSize: '0.825rem', color: '#7f1d1d' }}>
                  This is a Schedule prescription medication. You will be prompted to upload your doctor's prescription during checkout before staff confirmation.
                </span>
              </div>
            </div>
          )}

          {/* Pricing Row */}
          <div style={{ margin: '1rem 0 1.5rem', display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary-active)', fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(product.sellingPrice)}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              per {product.unit || 'unit'}
            </span>
          </div>

          {/* Stock Tag */}
          <div style={{ marginBottom: '1.5rem' }}>
            {inStock ? (
              isLowStock ? (
                <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={16} /> Only {product.totalStock} left in stock - order soon (Available: {product.totalStock})
                </span>
              ) : (
                <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> In Stock &bull; Available: {product.totalStock} units
                </span>
              )
            ) : (
              <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} /> Currently Out of Stock
              </span>
            )}
          </div>

          {/* Dosage & Clinical Info */}
          {(product.dosageInfo || product.description) && (
            <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.75rem' }}>
              {product.dosageInfo && (
                <div style={{ marginBottom: '0.65rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-main)', display: 'block' }}>
                    Dosage & Administration:
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {product.dosageInfo}
                  </span>
                </div>
              )}
              {product.description && (
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-main)', display: 'block' }}>
                    Indications & Information:
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                    {product.description}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Row: Quantity + Add to Cart */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Quantity Selector */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem',
                background: '#ffffff'
              }}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || !inStock}
                style={{
                  width: '36px',
                  height: '36px',
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
                <Minus size={16} />
              </button>
              <span style={{ width: '40px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => {
                  const maxStock = product.totalStock !== undefined ? product.totalStock : 0;
                  if (q >= maxStock) return q;
                  return q + 1;
                })}
                disabled={!inStock || (product.totalStock !== undefined && quantity >= product.totalStock)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'none',
                  cursor: (!inStock || (product.totalStock !== undefined && quantity >= product.totalStock)) ? 'not-allowed' : 'pointer',
                  opacity: (!inStock || (product.totalStock !== undefined && quantity >= product.totalStock)) ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-main)'
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              className="btn btn-primary"
              disabled={!inStock || adding}
              onClick={handleAddToCart}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <ShoppingCart size={18} />
              {adding ? 'Adding to Cart...' : 'Add to Cart'}
            </button>

            {/* Direct Buy / Cart Checkout */}
            <button
              className="btn btn-secondary"
              disabled={!inStock}
              onClick={handleBuyNow}
              style={{
                padding: '0.75rem 1.4rem',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
