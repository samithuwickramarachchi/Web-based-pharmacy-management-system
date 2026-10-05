import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Percent,
  DollarSign,
  Copy,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
  Eye,
  X,
  ToggleLeft,
  ToggleRight,
  Info,
  Package
} from 'lucide-react';
import promotionService from '../../services/promotionService';
import inventoryService from '../../services/inventoryService';
import { formatCurrency } from '../../utils/formatUtils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function PromotionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const isManagerOrAdmin =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('ROLE_ADMIN') ||
    user?.roles?.includes('PROMOTION_MANAGER') ||
    user?.roles?.includes('ROLE_PROMOTION_MANAGER');

  const isAdmin =
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('ROLE_ADMIN');

  // Data
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0
  });

  // Modal States
  const [promoModal, setPromoModal] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [viewPromo, setViewPromo] = useState(null);
  const [toggleConfirm, setToggleConfirm] = useState(null); // { promo, activate }

  // Form
  const emptyForm = {
    name: '',
    description: '',
    couponCode: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '0.00',
    maxDiscountCap: '',
    maxTotalUses: '',
    maxUsesPerCustomer: '1',
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    appliesToAllProducts: true,
    isActive: true,
    eligibleProductIds: []
  };
  const [promoForm, setPromoForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Interactive Coupon Validator Sandbox State
  const [testCode, setTestCode] = useState('WELCOME10');
  const [testOrderAmount, setTestOrderAmount] = useState('50.00');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Load Promotions
  const loadPromotions = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      const data = await promotionService.getAll(page, pagination.size);
      if (data?.content) {
        setPromotions(data.content);
        setPagination({
          page: data.number ?? 0,
          size: data.size ?? 10,
          totalPages: data.totalPages ?? 1,
          totalElements: data.totalElements ?? data.content.length
        });
      }
    } catch (err) {
      console.error('Promotions API error:', err);
      toast.error('Failed to load promotion campaigns.');
    } finally {
      setLoading(false);
    }
  }, [pagination.size, toast]);

  // Load products for eligibility picker
  const loadProducts = useCallback(async () => {
    try {
      const data = await inventoryService.getProducts(0, 500);
      if (data?.content) setAllProducts(data.content);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadPromotions(0);
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered Promotions (client-side search across current page)
  const filteredPromos = useMemo(() => {
    if (!searchQuery.trim()) return promotions;
    const q = searchQuery.toLowerCase();
    return promotions.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.couponCode?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [promotions, searchQuery]);

  // Copy Coupon Code
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied!`);
  };

  // ─── Coupon Sandbox Validator ─────────────────────────────────────────────────

  const handleTestValidation = async (e) => {
    e.preventDefault();
    if (!testCode.trim()) { toast.warning('Enter a coupon code to test.'); return; }
    const orderAmt = parseFloat(testOrderAmount);
    if (isNaN(orderAmt) || orderAmt <= 0) { toast.warning('Order amount must be a positive number.'); return; }

    try {
      setValidating(true);
      setValidationResult(null);
      const res = await promotionService.validateCoupon({
        couponCode: testCode.trim().toUpperCase(),
        orderAmount: orderAmt,
        customerId: null
      });
      // Backend returns: { valid, promotionId, couponCode, discountType, discountValue, calculatedDiscount, finalAmount, message }
      setValidationResult({
        isValid: res.valid ?? res.isValid ?? false,
        promotionName: res.promotionId ? `Promotion #${res.promotionId}` : '',
        discountAmount: Number(res.calculatedDiscount ?? res.discountAmount ?? 0),
        finalAmount: Number(res.finalAmount ?? orderAmt),
        message: res.message || (res.valid ? 'Coupon applied successfully.' : 'Invalid coupon.')
      });
    } catch (err) {
      // API error or 400: show backend message if available
      const msg = err?.response?.data?.message || err?.message || 'Coupon validation failed.';
      setValidationResult({
        isValid: false,
        discountAmount: 0,
        finalAmount: orderAmt,
        message: msg
      });
    } finally {
      setValidating(false);
    }
  };

  // ─── Create / Edit Modal ──────────────────────────────────────────────────────

  const handleOpenCreatePromo = () => {
    setCurrentPromo(null);
    setPromoForm({
      ...emptyForm,
      couponCode: `SAVE${Math.floor(10 + Math.random() * 90)}`,
      discountValue: '10',
      minOrderAmount: '20.00',
      maxDiscountCap: '15.00',
      maxTotalUses: '100',
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    });
    setFormError('');
    setPromoModal(true);
  };

  const handleOpenEditPromo = (promo) => {
    setCurrentPromo(promo);
    setPromoForm({
      name: promo.name || '',
      description: promo.description || '',
      couponCode: promo.couponCode || '',
      discountType: promo.discountType || 'PERCENTAGE',
      discountValue: String(promo.discountValue || ''),
      minOrderAmount: String(promo.minOrderAmount || '0.00'),
      maxDiscountCap: String(promo.maxDiscountCap || ''),
      maxTotalUses: String(promo.maxTotalUses || ''),
      maxUsesPerCustomer: String(promo.maxUsesPerCustomer || '1'),
      validFrom: promo.validFrom ? promo.validFrom.slice(0, 16) : new Date().toISOString().slice(0, 16),
      validUntil: promo.validUntil ? promo.validUntil.slice(0, 16) : '',
      appliesToAllProducts: promo.appliesToAllProducts ?? true,
      isActive: promo.isActive ?? true,
      eligibleProductIds: promo.eligibleProductIds ? [...promo.eligibleProductIds] : []
    });
    setFormError('');
    setPromoModal(true);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!promoForm.name.trim() || !promoForm.couponCode.trim() || !promoForm.discountValue) {
      setFormError('Name, coupon code, and discount value are required.');
      return;
    }
    const dv = Number(promoForm.discountValue);
    if (isNaN(dv) || dv <= 0) { setFormError('Discount value must be a positive number.'); return; }
    if (promoForm.discountType === 'PERCENTAGE' && dv > 100) { setFormError('Percentage discount cannot exceed 100%.'); return; }

    try {
      setSubmitting(true);
      // Build validFrom/validUntil: datetime-local gives "YYYY-MM-DDTHH:mm"; append seconds for ISO
      const toISO = (dt) => dt ? (dt.length === 16 ? `${dt}:00` : dt) : new Date().toISOString();
      const payload = {
        name: promoForm.name.trim(),
        description: promoForm.description.trim(),
        couponCode: promoForm.couponCode.toUpperCase().trim(),
        discountType: promoForm.discountType,
        discountValue: dv,
        minOrderAmount: promoForm.minOrderAmount ? Number(promoForm.minOrderAmount) : 0,
        maxDiscountCap: promoForm.maxDiscountCap ? Number(promoForm.maxDiscountCap) : null,
        maxTotalUses: promoForm.maxTotalUses ? Number(promoForm.maxTotalUses) : null,
        maxUsesPerCustomer: Number(promoForm.maxUsesPerCustomer || 1),
        validFrom: toISO(promoForm.validFrom),
        validUntil: toISO(promoForm.validUntil),
        appliesToAllProducts: promoForm.appliesToAllProducts,
        isActive: promoForm.isActive,
        eligibleProductIds: promoForm.appliesToAllProducts ? [] : promoForm.eligibleProductIds
      };

      if (currentPromo) {
        const updated = await promotionService.update(currentPromo.id, payload);
        toast.success(`Promotion "${payload.name}" updated.`);
        setPromotions((prev) =>
          prev.map((p) => (p.id === currentPromo.id ? { ...p, ...updated } : p))
        );
      } else {
        const res = await promotionService.create(payload);
        toast.success(`Promotion "${payload.name}" created.`);
        setPromotions((prev) => [res, ...prev]);
      }
      setPromoModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save promotion.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete / Deactivate ──────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await promotionService.delete(deleteConfirm.id);
      toast.success(`Promotion "${deleteConfirm.name}" deactivated.`);
      setPromotions((prev) =>
        prev.map((p) => p.id === deleteConfirm.id ? { ...p, isActive: false } : p)
      );
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to deactivate promotion.';
      toast.error(msg);
    }
    setDeleteConfirm(null);
  };

  // ─── Activate / Deactivate Toggle (via PUT) ───────────────────────────────────

  const handleToggleActive = async () => {
    if (!toggleConfirm) return;
    const { promo, activate } = toggleConfirm;
    try {
      const toISO = (dt) => dt ? (dt.length === 16 ? `${dt}:00` : dt) : new Date().toISOString();
      const payload = {
        name: promo.name,
        description: promo.description,
        couponCode: promo.couponCode,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        minOrderAmount: Number(promo.minOrderAmount || 0),
        maxDiscountCap: promo.maxDiscountCap ? Number(promo.maxDiscountCap) : null,
        maxTotalUses: promo.maxTotalUses ? Number(promo.maxTotalUses) : null,
        maxUsesPerCustomer: Number(promo.maxUsesPerCustomer || 1),
        validFrom: toISO(promo.validFrom),
        validUntil: toISO(promo.validUntil),
        appliesToAllProducts: promo.appliesToAllProducts,
        isActive: activate,
        eligibleProductIds: promo.eligibleProductIds || []
      };
      const updated = await promotionService.update(promo.id, payload);
      toast.success(`Promotion "${promo.name}" ${activate ? 'activated' : 'deactivated'}.`);
      setPromotions((prev) =>
        prev.map((p) => p.id === promo.id ? { ...p, ...updated, isActive: activate } : p)
      );
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update promotion status.';
      toast.error(msg);
    }
    setToggleConfirm(null);
  };

  // ─── View Details ─────────────────────────────────────────────────────────────

  const handleViewPromo = async (promo) => {
    setViewPromo(promo);
    setViewModal(true);
    // Optionally refresh detail from backend
    try {
      const detail = await promotionService.getById(promo.id);
      setViewPromo(detail);
    } catch { /* use cached */ }
  };

  // ─── Product Picker Helpers ───────────────────────────────────────────────────

  const toggleEligibleProduct = (productId) => {
    setPromoForm((prev) => {
      const ids = prev.eligibleProductIds || [];
      if (ids.includes(productId)) {
        return { ...prev, eligibleProductIds: ids.filter((id) => id !== productId) };
      }
      return { ...prev, eligibleProductIds: [...ids, productId] };
    });
  };

  // ─── UI Helpers ───────────────────────────────────────────────────────────────

  const fmtDate = (dt) => {
    if (!dt) return '—';
    try { return new Date(dt).toLocaleDateString(); } catch { return dt; }
  };

  const statusBadge = (promo) => {
    const expired = promo.validUntil && new Date(promo.validUntil) < new Date();
    if (expired) return <Badge variant="danger">Expired</Badge>;
    if (promo.isActive) return <Badge variant="success">Active</Badge>;
    return <Badge variant="gray">Inactive</Badge>;
  };

  const productNameMap = useMemo(() => {
    const map = {};
    allProducts.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [allProducts]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div>
          <div className="module-title-row">
            <h1 className="module-title">Discounts &amp; Promotion Campaigns</h1>
            <Badge variant="teal">{pagination.totalElements} Campaigns</Badge>
          </div>
          <p className="module-subtitle">
            Configure retail promotional coupons, percentage discounts, minimum order thresholds, and customer usage limits.
          </p>
        </div>
        <div className="module-actions">
          {isManagerOrAdmin && (
            <Button
              variant="teal"
              icon={<Plus size={16} />}
              onClick={handleOpenCreatePromo}
            >
              Create Campaign
            </Button>
          )}
          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={() => loadPromotions(pagination.page)}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Interactive Coupon Validation Sandbox */}
      <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #f0fdfa, #f8fafc)', border: '1.5px solid var(--color-teal-200)' }}>
        <CardBody style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={18} color="var(--color-teal-700)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-slate-800)' }}>
              Interactive Coupon Validation Tester
            </span>
          </div>

          <form onSubmit={handleTestValidation} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <Input
                label="Coupon Code"
                placeholder="e.g. WELCOME10"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <Input
                type="number"
                step="0.01"
                label="Cart / Order Amount (RS)"
                placeholder="50.00"
                value={testOrderAmount}
                onChange={(e) => setTestOrderAmount(e.target.value)}
              />
            </div>
            <Button variant="teal" type="submit" loading={validating} style={{ marginBottom: '2px' }}>
              Validate &amp; Calculate
            </Button>
          </form>

          {validationResult && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: '6px',
                border: validationResult.isValid ? '1px solid #a7f3d0' : '1px solid #fecaca',
                background: validationResult.isValid ? '#ecfdf5' : '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              {validationResult.isValid ? (
                <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
              )}
              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: validationResult.isValid ? '#065f46' : '#991b1b' }}>
                  {validationResult.message}
                </span>
                {validationResult.isValid && (
                  <div style={{ marginTop: '0.2rem', color: '#047857' }}>
                    Discount Deducted: <strong>{formatCurrency(validationResult.discountAmount)}</strong>
                    {' | '}Net Payable: <strong>{formatCurrency(validationResult.finalAmount)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
              <Input
                placeholder="Search campaigns or coupon codes..."
                icon={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
              Showing {filteredPromos.length} of {pagination.totalElements} promotions
            </div>
          </div>
        </CardHeader>

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner text="Loading promotion campaigns..." />
          ) : filteredPromos.length === 0 ? (
            <EmptyState
              icon={<Tag size={36} />}
              title="No promotional campaigns found"
              message={searchQuery ? 'No campaigns match your search.' : 'Create seasonal discounts or voucher coupon codes for dispensary checkouts.'}
            />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign &amp; Details</th>
                    <th>Coupon Code</th>
                    <th>Discount Rate</th>
                    <th>Min. Order</th>
                    <th>Validity Period</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromos.map((promo) => (
                    <tr key={promo.id}>
                      {/* Campaign Name */}
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{promo.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', maxWidth: '260px' }}>
                            {promo.description || 'Applies to cart purchases.'}
                          </div>
                          {!promo.appliesToAllProducts && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-teal-700)', marginTop: '2px' }}>
                              <Package size={10} style={{ display: 'inline', marginRight: 2 }} />
                              Specific products only
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Coupon Code */}
                      <td>
                        {promo.couponCode ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{
                              fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem',
                              color: 'var(--color-teal-800)', background: 'var(--color-teal-50)',
                              padding: '2px 8px', borderRadius: '4px', border: '1px dashed var(--color-teal-400)'
                            }}>
                              {promo.couponCode}
                            </span>
                            <button
                              onClick={() => handleCopyCode(promo.couponCode)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-slate-400)', padding: '2px' }}
                              title="Copy code"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>Auto-apply</span>
                        )}
                      </td>

                      {/* Discount Rate */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-slate-800)', fontSize: '0.95rem' }}>
                          {promo.discountType === 'PERCENTAGE'
                            ? `${promo.discountValue}% OFF`
                            : `${formatCurrency(promo.discountValue)} OFF`}
                        </div>
                        {promo.maxDiscountCap && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                            Cap: {formatCurrency(promo.maxDiscountCap)}
                          </div>
                        )}
                      </td>

                      {/* Min. Order */}
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-700)' }}>
                        {Number(promo.minOrderAmount || 0) > 0
                          ? formatCurrency(promo.minOrderAmount)
                          : 'No minimum'}
                      </td>

                      {/* Validity */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                        <div>From: {fmtDate(promo.validFrom)}</div>
                        <div>Until: {fmtDate(promo.validUntil)}</div>
                      </td>

                      {/* Usage */}
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{promo.currentUsageCount ?? 0}</span>
                          {promo.maxTotalUses ? ` / ${promo.maxTotalUses}` : ' (Unlimited)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          Max {promo.maxUsesPerCustomer || 1} per customer
                        </div>
                      </td>

                      {/* Status */}
                      <td>{statusBadge(promo)}</td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye size={14} />}
                            onClick={() => handleViewPromo(promo)}
                            title="View details"
                          />
                          {isManagerOrAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Edit2 size={14} />}
                                onClick={() => handleOpenEditPromo(promo)}
                                title="Edit promotion"
                              />
                              {/* Toggle active/inactive */}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={promo.isActive
                                  ? <ToggleRight size={14} color="#059669" />
                                  : <ToggleLeft size={14} color="#94a3b8" />}
                                onClick={() => setToggleConfirm({ promo, activate: !promo.isActive })}
                                title={promo.isActive ? 'Deactivate' : 'Activate'}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={14} color="#ef4444" />}
                                onClick={() => setDeleteConfirm(promo)}
                                title="Deactivate &amp; remove"
                              />
                            </>
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

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          onPageChange={(p) => loadPromotions(p)}
        />
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT PROMOTION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={promoModal}
        onClose={() => setPromoModal(false)}
        title={currentPromo ? `Edit: ${currentPromo.name}` : 'Create Promotion Campaign'}
        size="lg"
      >
        <form onSubmit={handleSavePromo}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Campaign Name *"
              placeholder="e.g. Senior Health 15% Subsidy"
              value={promoForm.name}
              onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
              required
            />
            <Input
              label="Coupon Code *"
              placeholder="e.g. SENIOR15"
              value={promoForm.couponCode}
              onChange={(e) => setPromoForm({ ...promoForm, couponCode: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Campaign Description"
              placeholder="Describe promotional campaign terms..."
              value={promoForm.description}
              onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="input-label">Discount Type *</label>
              <select
                className="form-control"
                value={promoForm.discountType}
                onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (RS)</option>
              </select>
            </div>
            <Input
              type="number"
              step="0.5"
              min="0.01"
              label={promoForm.discountType === 'PERCENTAGE' ? 'Discount % *' : 'Discount Amount (RS) *'}
              placeholder="10"
              value={promoForm.discountValue}
              onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
              required
            />
            <Input
              type="number"
              step="1"
              min="0"
              label="Min Order Amount (RS)"
              placeholder="25.00"
              value={promoForm.minOrderAmount}
              onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              type="number"
              step="1"
              min="0"
              label="Max Discount Cap (RS)"
              placeholder="Optional limit"
              value={promoForm.maxDiscountCap}
              onChange={(e) => setPromoForm({ ...promoForm, maxDiscountCap: e.target.value })}
            />
            <Input
              type="number"
              min="1"
              label="Max Total Uses"
              placeholder="Unlimited if blank"
              value={promoForm.maxTotalUses}
              onChange={(e) => setPromoForm({ ...promoForm, maxTotalUses: e.target.value })}
            />
            <Input
              type="number"
              min="1"
              label="Max Uses Per Customer"
              placeholder="1"
              value={promoForm.maxUsesPerCustomer}
              onChange={(e) => setPromoForm({ ...promoForm, maxUsesPerCustomer: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <Input
              type="datetime-local"
              label="Valid From *"
              value={promoForm.validFrom}
              onChange={(e) => setPromoForm({ ...promoForm, validFrom: e.target.value })}
              required
            />
            <Input
              type="datetime-local"
              label="Valid Until *"
              value={promoForm.validUntil}
              onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
              required
            />
          </div>

          {/* Active + Applies to all */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--color-slate-50)', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-700)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="isActivePromo"
                checked={promoForm.isActive}
                onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-teal-600)' }}
              />
              Promotion is Active
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-700)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="appliesAll"
                checked={promoForm.appliesToAllProducts}
                onChange={(e) => setPromoForm({ ...promoForm, appliesToAllProducts: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-teal-600)' }}
              />
              Applies to all inventory items
            </label>
          </div>

          {/* Product Eligibility Picker (shown when appliesToAllProducts is false) */}
          {!promoForm.appliesToAllProducts && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Package size={13} /> Eligible Products
                <span style={{ fontWeight: 400, color: 'var(--color-slate-500)', fontSize: '0.8rem' }}>
                  ({promoForm.eligibleProductIds.length} selected)
                </span>
              </label>
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--color-slate-200)',
                borderRadius: '6px',
                padding: '0.5rem',
                background: '#fff'
              }}>
                {allProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-slate-400)', fontSize: '0.85rem' }}>
                    Loading products...
                  </div>
                ) : (
                  allProducts.map((product) => (
                    <label key={product.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.3rem 0.4rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      background: promoForm.eligibleProductIds.includes(product.id) ? 'var(--color-teal-50)' : 'transparent',
                      color: 'var(--color-slate-700)'
                    }}>
                      <input
                        type="checkbox"
                        checked={promoForm.eligibleProductIds.includes(product.id)}
                        onChange={() => toggleEligibleProduct(product.id)}
                        style={{ accentColor: 'var(--color-teal-600)' }}
                      />
                      <span>{product.name}</span>
                      {product.sku && <span style={{ color: 'var(--color-slate-400)', fontSize: '0.75rem' }}>{product.sku}</span>}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="outline" type="button" onClick={() => setPromoModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="teal" type="submit" loading={submitting}>
              {currentPromo ? 'Update Campaign' : 'Publish Campaign'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL: VIEW PROMOTION DETAILS
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title="Promotion Details"
        size="md"
      >
        {viewPromo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-slate-800)' }}>{viewPromo.name}</div>
                {viewPromo.description && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', marginTop: '0.2rem' }}>{viewPromo.description}</div>
                )}
              </div>
              {statusBadge(viewPromo)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-slate-50)', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Coupon Code</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-teal-700)' }}>{viewPromo.couponCode || 'Auto-apply'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Discount</div>
                <div style={{ fontWeight: 700 }}>
                  {viewPromo.discountType === 'PERCENTAGE' ? `${viewPromo.discountValue}%` : formatCurrency(viewPromo.discountValue)} OFF
                  {viewPromo.maxDiscountCap && <span style={{ fontWeight: 400, color: 'var(--color-slate-500)' }}> (max {formatCurrency(viewPromo.maxDiscountCap)})</span>}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Min. Order Amount</div>
                <div>{Number(viewPromo.minOrderAmount || 0) > 0 ? formatCurrency(viewPromo.minOrderAmount) : 'No minimum'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Usage</div>
                <div>
                  <strong>{viewPromo.currentUsageCount ?? 0}</strong>
                  {viewPromo.maxTotalUses ? ` / ${viewPromo.maxTotalUses}` : ' (Unlimited)'}
                  <span style={{ color: 'var(--color-slate-500)', marginLeft: 4 }}>total</span>
                </div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem' }}>Max {viewPromo.maxUsesPerCustomer || 1} per customer</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Valid From</div>
                <div>{fmtDate(viewPromo.validFrom)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Valid Until</div>
                <div>{fmtDate(viewPromo.validUntil)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Created By</div>
                <div>{viewPromo.createdByName || '—'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', marginBottom: '2px' }}>Scope</div>
                <div>{viewPromo.appliesToAllProducts ? 'All products' : 'Specific products'}</div>
              </div>
            </div>

            {/* Eligible Products */}
            {!viewPromo.appliesToAllProducts && viewPromo.eligibleProductIds && viewPromo.eligibleProductIds.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-600)', marginBottom: '0.4rem' }}>
                  <Package size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Eligible Products ({viewPromo.eligibleProductIds.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {viewPromo.eligibleProductIds.map((id) => (
                    <span key={id} style={{
                      padding: '2px 8px',
                      background: 'var(--color-teal-50)',
                      color: 'var(--color-teal-800)',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      border: '1px solid var(--color-teal-200)'
                    }}>
                      {productNameMap[id] || `Product #${id}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              {isManagerOrAdmin && (
                <Button variant="outline" size="sm" icon={<Edit2 size={14} />} onClick={() => { setViewModal(false); handleOpenEditPromo(viewPromo); }}>
                  Edit
                </Button>
              )}
              <Button variant="ghost" onClick={() => setViewModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Deactivate Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Promotion"
        message={`Are you sure you want to deactivate "${deleteConfirm?.name}"? Customers will no longer be able to use "${deleteConfirm?.couponCode}".`}
        confirmText="Deactivate"
        confirmVariant="danger"
      />

      {/* Confirm Toggle Active/Inactive */}
      <ConfirmModal
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={handleToggleActive}
        title={toggleConfirm?.activate ? 'Activate Promotion' : 'Deactivate Promotion'}
        message={
          toggleConfirm?.activate
            ? `Activate "${toggleConfirm?.promo?.name}"? Customers will be able to use coupon code "${toggleConfirm?.promo?.couponCode}".`
            : `Deactivate "${toggleConfirm?.promo?.name}"? Coupon "${toggleConfirm?.promo?.couponCode}" will be rejected at checkout.`
        }
        confirmText={toggleConfirm?.activate ? 'Activate' : 'Deactivate'}
        confirmVariant={toggleConfirm?.activate ? 'success' : 'warning'}
      />
    </div>
  );
}
