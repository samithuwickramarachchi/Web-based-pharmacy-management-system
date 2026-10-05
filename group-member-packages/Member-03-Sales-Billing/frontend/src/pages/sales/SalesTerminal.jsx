import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Printer,
  CheckCircle2,
  User,
  History,
  ArrowRight,
  Package,
  Calendar,
  DollarSign,
  RefreshCw,
  Eye,
  AlertCircle,
  Tag,
  Clock,
  Layers,
  Check,
  X
} from 'lucide-react';
import salesService from '../../services/salesService';
import inventoryService from '../../services/inventoryService';
import customerService from '../../services/customerService';
import promotionService from '../../services/promotionService';
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

export default function SalesTerminal() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState('pos'); // 'pos', 'history'

  // POS State
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPromotionId, setSelectedPromotionId] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponApplied, setCouponApplied] = useState(null); // { promotionId, couponCode, discountAmount, promotionName }
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, ONLINE_TRANSFER
  const [amountPaid, setAmountPaid] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [notes, setNotes] = useState('');
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Batch Selection Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalProduct, setBatchModalProduct] = useState(null);
  const [productBatches, setProductBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Cart Clear Confirmation Modal
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Sales History State
  const [salesHistory, setSalesHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPagination, setHistoryPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0
  });

  // Receipt Modal State
  const [receiptModal, setReceiptModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Load Catalog, Customers, and Promotions
  const loadPOSData = async () => {
    try {
      setCatalogLoading(true);
      const [prodData, custData, promoData] = await Promise.all([
        inventoryService.getProducts(0, 100).catch(() => null),
        customerService.getAll(0, 100).catch(() => null),
        promotionService.getActive().catch(() => null)
      ]);

      if (prodData?.content) {
        setCatalog(prodData.content);
      }
      if (custData?.content) {
        setCustomers(custData.content);
      }
      if (Array.isArray(promoData)) {
        setPromotions(promoData);
      }
    } catch (err) {
      console.error('POS data load error:', err);
      toast.error('Failed to load products or customers.');
    } finally {
      setCatalogLoading(false);
    }
  };

  // Load Sales History
  const loadSalesHistory = async (page = 0) => {
    try {
      setHistoryLoading(true);
      const data = await salesService.getAllSales(page, historyPagination.size);
      if (data?.content) {
        setSalesHistory(data.content);
        setHistoryPagination({
          page: data.number || 0,
          size: data.size || 10,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || data.content.length
        });
      }
    } catch (err) {
      console.error('Sales history API error:', err);
      toast.error('Failed to load past sales history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadPOSData();
    loadSalesHistory(0);
  }, []);

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    if (!productSearch.trim()) return catalog;
    const q = productSearch.toLowerCase();
    return catalog.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q)
    );
  }, [catalog, productSearch]);

  // Selected Active Promotion Object
  const activePromotion = useMemo(() => {
    if (!selectedPromotionId) return null;
    return promotions.find((p) => p.id === Number(selectedPromotionId)) || null;
  }, [promotions, selectedPromotionId]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const tax = useMemo(() => {
    return subtotal * 0.05; // 5% pharmacy dispensary tax
  }, [subtotal]);

  // Discount Calculation based on applied coupon, selected promotion dropdown, or manual entry
  const discount = useMemo(() => {
    // 1. Coupon applied by code takes highest priority
    if (couponApplied) {
      // Recalculate based on current subtotal (couponApplied.discountAmount was calculated at apply time)
      if (activePromotion) {
        if (activePromotion.minOrderAmount && subtotal < Number(activePromotion.minOrderAmount)) return 0;
        if (activePromotion.discountType === 'PERCENTAGE') {
          let d = (subtotal * Number(activePromotion.discountValue)) / 100;
          if (activePromotion.maxDiscountCap && d > Number(activePromotion.maxDiscountCap)) d = Number(activePromotion.maxDiscountCap);
          return Math.min(d, subtotal);
        } else if (activePromotion.discountType === 'FIXED_AMOUNT') {
          return Math.min(subtotal, Number(activePromotion.discountValue));
        }
      }
      return Math.min(couponApplied.discountAmount, subtotal);
    }
    // 2. Selected from dropdown
    if (activePromotion) {
      if (activePromotion.minOrderAmount && subtotal < Number(activePromotion.minOrderAmount)) return 0;
      if (activePromotion.discountType === 'PERCENTAGE') {
        let d = (subtotal * Number(activePromotion.discountValue)) / 100;
        if (activePromotion.maxDiscountCap && d > Number(activePromotion.maxDiscountCap)) d = Number(activePromotion.maxDiscountCap);
        return d;
      } else if (activePromotion.discountType === 'FIXED_AMOUNT') {
        return Math.min(subtotal, Number(activePromotion.discountValue));
      }
    }
    // 3. Manual discount input
    const d = parseFloat(discountAmount);
    return isNaN(d) || d < 0 ? 0 : d;
  }, [couponApplied, activePromotion, subtotal, discountAmount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + tax - discount);
  }, [subtotal, tax, discount]);

  const changeGiven = useMemo(() => {
    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < total) return 0;
    return paid - total;
  }, [amountPaid, total]);

  // Batch & Add to Cart Handlers
  const handleInitiateAddToCart = async (product) => {
    const totalStock = product.totalStock ?? 0;
    if (totalStock <= 0) {
      toast.warning(`${product.name} is currently out of stock.`);
      return;
    }

    try {
      setLoadingBatches(true);
      const batches = await inventoryService.getBatches(product.id);
      const validBatches = (batches || []).filter(
        (b) => (b.quantity || 0) > 0 && b.isActive !== false
      );

      if (validBatches.length === 0) {
        toast.warning(`No active stock batches found for ${product.name}.`);
        return;
      }

      if (validBatches.length === 1) {
        // Automatically add single available batch
        addBatchToCart(product, validBatches[0]);
      } else {
        // Multiple batches available: let pharmacist choose
        setBatchModalProduct(product);
        setProductBatches(validBatches);
        setBatchModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch batches for product:', err);
      toast.error('Failed to retrieve product batches.');
    } finally {
      setLoadingBatches(false);
    }
  };

  const addBatchToCart = (product, batch) => {
    const existingIdx = cart.findIndex(
      (item) => item.productId === product.id && item.batchId === batch.id
    );

    if (existingIdx >= 0) {
      const currentQty = cart[existingIdx].quantity;
      if (currentQty + 1 > batch.quantity) {
        toast.warning(`Cannot exceed available batch stock (${batch.quantity} units).`);
        return;
      }
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          maxStock: batch.quantity,
          unitPrice: Number(product.sellingPrice || 0),
          quantity: 1
        }
      ]);
    }
    toast.success(`Added ${product.name} (Lot: ${batch.batchNumber})`);
    setBatchModalOpen(false);
  };

  // Adjust Cart Item Quantity
  const handleUpdateQuantity = (idx, delta) => {
    const updated = [...cart];
    const item = updated[idx];
    const newQty = item.quantity + delta;

    if (delta > 0 && item.maxStock && newQty > item.maxStock) {
      toast.warning(`Cannot exceed available batch stock (${item.maxStock} units).`);
      return;
    }

    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      item.quantity = newQty;
    }
    setCart(updated);
  };

  const handleRemoveItem = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Coupon Apply by Code Handler
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) { toast.warning('Enter a coupon code.'); return; }
    try {
      setCouponValidating(true);
      const res = await promotionService.validateCoupon({
        couponCode: couponInput.trim().toUpperCase(),
        orderAmount: subtotal > 0 ? subtotal : 1,
        customerId: selectedCustomer ? Number(selectedCustomer) : null
      });
      if (res.valid) {
        // Find matching promotion from loaded list
        const matched = promotions.find((p) => p.couponCode?.toUpperCase() === couponInput.trim().toUpperCase());
        setSelectedPromotionId(matched ? String(matched.id) : '');
        setCouponApplied({
          promotionId: res.promotionId,
          couponCode: res.couponCode || couponInput.trim().toUpperCase(),
          discountAmount: Number(res.calculatedDiscount ?? 0),
          promotionName: matched?.name || `Promo #${res.promotionId}`
        });
        setDiscountAmount('0.00');
        toast.success(`Coupon "${couponInput.trim().toUpperCase()}" applied! Saving ${formatCurrency(res.calculatedDiscount)}.`);
      } else {
        toast.error(res.message || 'Coupon is invalid or cannot be applied.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Coupon validation failed.';
      toast.error(msg);
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponInput('');
    setSelectedPromotionId('');
  };

  const handleClearCart = (confirm = true) => {
    if (confirm && cart.length > 0) {
      setConfirmClearModal(true);
      return;
    }
    setCart([]);
    setAmountPaid('');
    setSelectedPromotionId('');
    setCouponApplied(null);
    setCouponInput('');
    setDiscountAmount('0.00');
    setNotes('');
    setConfirmClearModal(false);
  };

  // Quick Amount Buttons
  const handleQuickPay = (amt) => {
    setAmountPaid(amt.toFixed(2));
  };

  // Checkout Handler
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty. Select medicines to checkout.');
      return;
    }

    const paidNum = paymentMethod === 'CASH' ? parseFloat(amountPaid) : total;
    if (paymentMethod === 'CASH' && (isNaN(paidNum) || paidNum < total)) {
      toast.error('Amount paid cannot be less than total payable.');
      return;
    }

    try {
      setProcessingCheckout(true);
      const salePayload = {
        customerId: selectedCustomer ? Number(selectedCustomer) : null,
        promotionId: couponApplied?.promotionId
          ?? (selectedPromotionId ? Number(selectedPromotionId) : null),
        subtotal: Number(subtotal.toFixed(2)),
        taxAmount: Number(tax.toFixed(2)),
        discountAmount: Number(discount.toFixed(2)),
        totalAmount: Number(total.toFixed(2)),
        paymentMethod: paymentMethod,
        amountPaid: Number(paidNum.toFixed(2)),
        changeGiven: Number(changeGiven.toFixed(2)),
        notes: notes || null,
        items: cart.map((item) => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: 0.00
        }))
      };

      const completedSale = await salesService.createSale(salePayload);
      toast.success(`Sale completed successfully! Invoice #${completedSale.saleNumber}`);

      // Add to sales history
      setSalesHistory((prev) => [completedSale, ...prev]);

      // Open receipt modal
      setActiveReceipt(completedSale);
      setReceiptModal(true);

      // Reset cart and reload POS product data to update stock numbers
      handleClearCart(false);
      loadPOSData();
    } catch (err) {
      console.error('Sale checkout failed:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'Sale checkout failed. Please check stock and details.';
      toast.error(errorMsg);
    } finally {
      setProcessingCheckout(false);
    }
  };

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div>
          <div className="module-title-row">
            <h1 className="module-title">Sales & Point of Sale (POS)</h1>
            <Badge variant="teal">Dispensary Terminal</Badge>
          </div>
          <p className="module-subtitle">
            Dispense prescription and OTC medicines, choose batch lots, apply promotional discounts, and generate official invoices.
          </p>
        </div>

        <div className="module-actions">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant={activeView === 'pos' ? 'teal' : 'outline'}
              icon={<ShoppingCart size={16} />}
              onClick={() => setActiveView('pos')}
            >
              POS Terminal
            </Button>
            <Button
              variant={activeView === 'history' ? 'teal' : 'outline'}
              icon={<History size={16} />}
              onClick={() => {
                setActiveView('history');
                loadSalesHistory(0);
              }}
            >
              Past Invoices ({salesHistory.length})
            </Button>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: POS TERMINAL ================= */}
      {activeView === 'pos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Product Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card>
              <CardBody style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      placeholder="Scan SKU barcode or search medicine name..."
                      icon={<Search size={18} />}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    icon={<RefreshCw size={15} className={catalogLoading ? 'animate-spin' : ''} />}
                    onClick={loadPOSData}
                    disabled={catalogLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Catalog Grid */}
            {catalogLoading ? (
              <LoadingSpinner text="Loading medicine catalog..." />
            ) : filteredCatalog.length === 0 ? (
              <EmptyState
                icon={<Package size={36} />}
                title="No medicines found"
                message="No products match your search or filter."
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {filteredCatalog.map((prod) => {
                  const stock = prod.totalStock ?? 0;
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= (prod.minReorderLevel || 10);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isOutOfStock && handleInitiateAddToCart(prod)}
                      style={{
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: isOutOfStock ? '1px solid var(--color-slate-200)' : '1px solid var(--color-slate-200)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        opacity: isOutOfStock ? 0.6 : 1,
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => !isOutOfStock && (e.currentTarget.style.borderColor = 'var(--color-teal-500)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-slate-200)')}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <Badge variant="teal">{prod.sku}</Badge>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#059669'
                            }}
                          >
                            {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-slate-800)', fontSize: '0.95rem' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.2rem' }}>
                          {prod.unit || 'Standard Unit'} {prod.categoryName ? `• ${prod.categoryName}` : ''}
                        </div>
                        {prod.requiresPrescription && (
                          <div style={{ marginTop: '0.35rem' }}>
                            <Badge variant="warning">Rx Required</Badge>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '1rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--color-slate-100)'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--color-teal-700)', fontSize: '1.1rem' }}>
                          {formatCurrency(prod.sellingPrice)}
                        </div>
                        <Button
                          variant="teal"
                          size="sm"
                          icon={<Plus size={14} />}
                          disabled={isOutOfStock || loadingBatches}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiateAddToCart(prod);
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Checkout Cart & Summary */}
          <div>
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingCart size={18} color="var(--color-teal-600)" />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-slate-800)' }}>
                      Current Sale ({cart.reduce((s, i) => s + i.quantity, 0)} items)
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => handleClearCart(true)}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Customer Selector */}
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={14} /> Registered Patient / Customer
                  </label>
                  <select
                    className="form-control"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">Walk-in Customer (General Counter)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.phone || c.email || `ID: ${c.id}`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cart Items List */}
                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    border: '1px solid var(--color-slate-200)',
                    borderRadius: '6px',
                    padding: '0.5rem'
                  }}
                >
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-slate-400)' }}>
                      <ShoppingCart size={28} style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontSize: '0.85rem' }}>Scan or click medicines to add to sale</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {cart.map((item, idx) => (
                        <div
                          key={`${item.productId}-${item.batchId}-${idx}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem',
                            background: 'var(--color-slate-50)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: 'var(--color-slate-800)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {item.productName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                              {formatCurrency(item.unitPrice)} x {item.quantity} | Lot: {item.batchNumber}{' '}
                              {item.expiryDate ? `(Exp: ${item.expiryDate})` : ''}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: '#ffffff',
                                borderRadius: '4px',
                                border: '1px solid var(--color-slate-300)'
                              }}
                            >
                              <button
                                style={{ border: 'none', background: 'none', padding: '2px 6px', cursor: 'pointer' }}
                                onClick={() => handleUpdateQuantity(idx, -1)}
                              >
                                <Minus size={12} />
                              </button>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0 4px' }}>
                                {item.quantity}
                              </span>
                              <button
                                style={{ border: 'none', background: 'none', padding: '2px 6px', cursor: 'pointer' }}
                                onClick={() => handleUpdateQuantity(idx, 1)}
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                color: 'var(--color-slate-800)',
                                minWidth: '55px',
                                textAlign: 'right'
                              }}
                            >
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>

                            <button
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              onClick={() => handleRemoveItem(idx)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Promotions & Discounts */}
                <div style={{ borderTop: '1px solid var(--color-slate-200)', paddingTop: '0.75rem' }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <Tag size={14} /> Promotion / Coupon Code
                  </label>

                  {couponApplied ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #6ee7b7',
                        borderRadius: '6px',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} color="#059669" />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>
                            Coupon: {couponApplied.couponCode}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                            {couponApplied.promotionName} (Saved {formatCurrency(discount)})
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          borderRadius: '4px'
                        }}
                        title="Remove coupon"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter coupon code (e.g. SAVE20)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={couponValidating || !couponInput.trim()}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {couponValidating ? <RefreshCw size={14} className="spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}

                  {!couponApplied && (
                    <select
                      className="form-control"
                      value={selectedPromotionId}
                      onChange={(e) => {
                        setSelectedPromotionId(e.target.value);
                        if (e.target.value) {
                          setDiscountAmount('0.00');
                        }
                      }}
                    >
                      <option value="">No Active Promotion (or enter coupon above)</option>
                      {promotions.map((promo) => (
                        <option key={promo.id} value={promo.id}>
                          {promo.name} (
                          {promo.discountType === 'PERCENTAGE'
                            ? `${promo.discountValue}% off`
                            : `${formatCurrency(promo.discountValue)} off`}
                          )
                        </option>
                      ))}
                    </select>
                  )}

                  {activePromotion && activePromotion.minOrderAmount && subtotal < Number(activePromotion.minOrderAmount) && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#d97706',
                        marginTop: '0.35rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <AlertCircle size={12} /> Minimum order of {formatCurrency(activePromotion.minOrderAmount)} required to qualify.
                    </div>
                  )}

                  {!selectedPromotionId && !couponApplied && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>Manual Discount (RS):</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        style={{
                          width: '90px',
                          textAlign: 'right',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-slate-300)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Calculation Summary */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    borderTop: '1px solid var(--color-slate-200)',
                    paddingTop: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-slate-600)' }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-slate-600)' }}>
                    <span>Sales Tax (5%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                      <span>Discount Applied</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      color: 'var(--color-teal-800)',
                      borderTop: '2px solid var(--color-slate-200)',
                      paddingTop: '0.5rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    <span>Total Payable</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="input-label">Payment Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.6rem 0.4rem',
                        borderRadius: '6px',
                        border: paymentMethod === 'CASH' ? '2px solid var(--color-teal-600)' : '1px solid var(--color-slate-200)',
                        background: paymentMethod === 'CASH' ? 'var(--color-teal-50)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <Banknote size={18} color={paymentMethod === 'CASH' ? 'var(--color-teal-700)' : 'var(--color-slate-500)'} />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: paymentMethod === 'CASH' ? 'var(--color-teal-800)' : 'var(--color-slate-600)'
                        }}
                      >
                        Cash
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.6rem 0.4rem',
                        borderRadius: '6px',
                        border: paymentMethod === 'CARD' ? '2px solid var(--color-teal-600)' : '1px solid var(--color-slate-200)',
                        background: paymentMethod === 'CARD' ? 'var(--color-teal-50)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <CreditCard size={18} color={paymentMethod === 'CARD' ? 'var(--color-teal-700)' : 'var(--color-slate-500)'} />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: paymentMethod === 'CARD' ? 'var(--color-teal-800)' : 'var(--color-slate-600)'
                        }}
                      >
                        Card / POS
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ONLINE_TRANSFER')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.6rem 0.4rem',
                        borderRadius: '6px',
                        border:
                          paymentMethod === 'ONLINE_TRANSFER' ? '2px solid var(--color-teal-600)' : '1px solid var(--color-slate-200)',
                        background: paymentMethod === 'ONLINE_TRANSFER' ? 'var(--color-teal-50)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <Smartphone
                        size={18}
                        color={paymentMethod === 'ONLINE_TRANSFER' ? 'var(--color-teal-700)' : 'var(--color-slate-500)'}
                      />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: paymentMethod === 'ONLINE_TRANSFER' ? 'var(--color-teal-800)' : 'var(--color-slate-600)'
                        }}
                      >
                        Transfer
                      </span>
                    </button>
                  </div>
                </div>

                {/* Cash Tendering & Change Calculation */}
                {paymentMethod === 'CASH' && (
                  <div
                    style={{
                      background: 'var(--color-slate-50)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--color-slate-200)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-700)' }}>Amount Tendered</span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {[total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50 || 50].map((amt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuickPay(amt)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-slate-300)',
                              background: '#ffffff',
                              cursor: 'pointer'
                            }}
                          >
                            {formatCurrency(amt)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter cash received"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: changeGiven > 0 ? '#059669' : 'var(--color-slate-600)'
                      }}
                    >
                      <span>Change Due:</span>
                      <span>{formatCurrency(changeGiven)}</span>
                    </div>
                  </div>
                )}

                {/* Optional Sale Notes */}
                <div>
                  <Input
                    placeholder="Optional notes or doctor prescription ref..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Checkout Button */}
                <Button
                  variant="teal"
                  size="lg"
                  icon={<CheckCircle2 size={18} />}
                  onClick={handleCheckout}
                  loading={processingCheckout}
                  disabled={cart.length === 0 || processingCheckout}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Complete Checkout ({formatCurrency(total)})
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: SALES HISTORY ================= */}
      {activeView === 'history' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
                <Input
                  placeholder="Search invoice number or customer..."
                  icon={<Search size={16} />}
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} />}
                onClick={() => loadSalesHistory(historyPagination.page)}
                disabled={historyLoading}
              >
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {historyLoading ? (
              <LoadingSpinner text="Loading sales history..." />
            ) : salesHistory.length === 0 ? (
              <EmptyState
                icon={<Receipt size={36} />}
                title="No sales transactions recorded"
                message="Completed in-store POS checkouts will automatically appear here."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice / Sale #</th>
                      <th>Date & Time</th>
                      <th>Customer</th>
                      <th>Cashier Staff</th>
                      <th>Payment Method</th>
                      <th>Total Amount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory
                      .filter((s) => {
                        const q = historySearch.toLowerCase();
                        return (
                          !q ||
                          s.saleNumber?.toLowerCase().includes(q) ||
                          s.customerName?.toLowerCase().includes(q)
                        );
                      })
                      .map((sale) => (
                        <tr key={sale.id}>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--color-teal-700)' }}>
                              {sale.saleNumber}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                            {sale.saleDate || sale.createdAt ? new Date(sale.saleDate || sale.createdAt).toLocaleString() : 'Recent'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: 'var(--color-slate-800)', fontSize: '0.875rem' }}>
                              {sale.customerName || 'Walk-in Customer'}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                            {sale.staffName || sale.staffUsername || 'Cashier'}
                          </td>
                          <td>
                            <Badge variant="teal">
                              {sale.payment?.paymentMethod || sale.paymentMethod || 'CASH'}
                            </Badge>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-slate-900)' }}>
                              {formatCurrency(sale.totalAmount)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Receipt size={14} />}
                                onClick={() => {
                                  setActiveReceipt(sale);
                                  setReceiptModal(true);
                                }}
                              >
                                View Receipt
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
            page={historyPagination.page}
            totalPages={historyPagination.totalPages}
            totalElements={historyPagination.totalElements}
            onPageChange={(p) => loadSalesHistory(p)}
          />
        </Card>
      )}

      {/* ================= MODAL: BATCH LOT SELECTION ================= */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title={batchModalProduct ? `Select Stock Batch: ${batchModalProduct.name}` : 'Select Batch'}
        size="md"
      >
        {batchModalProduct && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '1rem' }}>
              Multiple inventory batches are available for this medicine. Select the specific batch lot to dispense from:
            </p>

            <div className="table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Batch Lot #</th>
                    <th>Expiry Date</th>
                    <th>Available Stock</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {productBatches.map((b) => {
                    const isExpiringSoon =
                      b.expiryDate && new Date(b.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                          {b.batchNumber}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: isExpiringSoon ? '#dc2626' : 'var(--color-slate-600)' }}>
                            {b.expiryDate || 'N/A'}
                          </span>
                          {isExpiringSoon && (
                            <span style={{ marginLeft: '0.4rem' }}>
                              <Badge variant="warning">Soon</Badge>
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#059669' }}>
                            {b.quantity} units
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="teal"
                              size="sm"
                              icon={<Check size={14} />}
                              onClick={() => addBatchToCart(batchModalProduct, b)}
                            >
                              Select Lot
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <Button variant="secondary" onClick={() => setBatchModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: CONFIRM CLEAR CART ================= */}
      <ConfirmModal
        isOpen={confirmClearModal}
        onClose={() => setConfirmClearModal(false)}
        onConfirm={() => handleClearCart(false)}
        title="Clear Sales Cart"
        message="Are you sure you want to clear the sales cart? All selected items and discounts will be removed."
        confirmLabel="Clear Cart"
        variant="danger"
      />

      {/* ================= MODAL: PRINTABLE RECEIPT ================= */}
      <Modal
        isOpen={receiptModal}
        onClose={() => setReceiptModal(false)}
        title="Transaction Sales Receipt"
        size="md"
      >
        {activeReceipt && (
          <div>
            {/* Printable Receipt Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1px dashed var(--color-slate-300)',
                padding: '1.5rem',
                borderRadius: '8px',
                fontFamily: 'monospace, sans-serif'
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  borderBottom: '1px dashed var(--color-slate-300)',
                  paddingBottom: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-teal-800)' }}>
                  AURA PHARMACY & DISPENSARY
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-600)' }}>
                  Licensed Retail Pharmacy #RX-883921
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                  100 Healthcare Way, Suite 400
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--color-slate-700)',
                  marginBottom: '0.75rem'
                }}
              >
                <span>
                  Invoice: <strong>{activeReceipt.saleNumber}</strong>
                </span>
                <span>
                  Date:{' '}
                  {activeReceipt.saleDate || activeReceipt.createdAt
                    ? new Date(activeReceipt.saleDate || activeReceipt.createdAt).toLocaleDateString()
                    : 'Today'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--color-slate-700)',
                  marginBottom: '1rem'
                }}
              >
                <span>Client: {activeReceipt.customerName || 'Walk-in Customer'}</span>
                <span>Cashier: {activeReceipt.staffName || activeReceipt.staffUsername || user?.username || 'Staff'}</span>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-slate-300)', textAlign: 'left' }}>
                    <th style={{ padding: '4px 0' }}>Item</th>
                    <th style={{ padding: '4px 0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '4px 0', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '4px 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeReceipt.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed var(--color-slate-100)' }}>
                      <td style={{ padding: '4px 0' }}>
                        <div>{item.productName || `Item #${item.productId}`}</div>
                        {item.batchNumber && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-slate-500)' }}>
                            Lot: {item.batchNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '4px 0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>
                        {formatCurrency(item.totalPrice || item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div style={{ borderTop: '1px dashed var(--color-slate-300)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(activeReceipt.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span>Sales Tax (5%):</span>
                  <span>{formatCurrency(activeReceipt.taxAmount)}</span>
                </div>
                {Number(activeReceipt.discountAmount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#059669' }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(activeReceipt.discountAmount)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: '1rem',
                    borderTop: '1px solid var(--color-slate-300)',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem'
                  }}
                >
                  <span>TOTAL PAID:</span>
                  <span>{formatCurrency(activeReceipt.totalAmount)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-slate-500)'
                  }}
                >
                  <span>Method: {activeReceipt.payment?.paymentMethod || activeReceipt.paymentMethod || 'CASH'}</span>
                  {(activeReceipt.payment?.changeGiven ?? activeReceipt.changeGiven) > 0 && (
                    <span>
                      Change Returned: $
                      {Number(activeReceipt.payment?.changeGiven ?? activeReceipt.changeGiven).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '1.25rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px dashed var(--color-slate-300)',
                  fontSize: '0.75rem',
                  color: 'var(--color-slate-500)'
                }}
              >
                Thank you for your patronage! Please retain this receipt for prescription refills.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button variant="outline" icon={<Printer size={16} />} onClick={() => window.print()}>
                Print Receipt
              </Button>
              <Button variant="teal" onClick={() => setReceiptModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
