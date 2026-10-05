import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Pill,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpDown,
  Layers,
  DollarSign,
  PackageCheck,
  RotateCcw
} from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatUtils';
import { getProductImageUrl } from '../../utils/productImageUtil';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// ── Filter Options Definitions ──────────────────────────────────────────────
const CATEGORY_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All Products' },
  { id: 'Prescription Medicines', label: 'Prescription Medicines' },
  { id: 'Over-the-Counter (OTC)', label: 'Over-the-Counter (OTC)' },
  { id: 'Vitamins & Supplements', label: 'Vitamins & Supplements' },
  { id: 'Pain Relief & Antipyretics', label: 'Pain Relief & Antipyretics' },
  { id: 'Cold, Cough & Allergy', label: 'Cold, Cough & Allergy' },
  { id: 'Antibiotics', label: 'Antibiotics' },
  { id: 'Cardiovascular & Hypertension', label: 'Cardiovascular & Hypertension' },
  { id: 'Personal Care & First Aid', label: 'Personal Care & First Aid' },
];

const PRICE_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All Prices' },
  { id: 'UNDER_500', label: 'Under RS 500' },
  { id: '500_1000', label: 'RS 500 – RS 1,000' },
  { id: 'ABOVE_1000', label: 'Above RS 1,000' },
];

const AVAILABILITY_FILTER_OPTIONS = [
  { id: 'ALL', label: 'All' },
  { id: 'IN_STOCK', label: 'In Stock' },
  { id: 'RX_REQUIRED', label: 'Prescription Required' },
];

// ── Helper Filtering Functions ──────────────────────────────────────────────
function matchCategory(product, catFilter, categories = []) {
  if (!catFilter || catFilter === 'ALL' || catFilter === 'All Products') return true;

  // Resolve target category name if an ID was passed in URL
  let targetName = catFilter;
  const foundCat = categories.find(
    (c) => String(c.id) === String(catFilter) || c.name === catFilter
  );
  if (foundCat) {
    targetName = foundCat.name;
  }

  const prodCatName = (product.categoryName || '').toLowerCase().trim();
  const prodName = (product.name || '').toLowerCase();
  const prodCatId = Number(product.categoryId);

  if (foundCat && prodCatId === Number(foundCat.id)) {
    return true;
  }

  switch (targetName) {
    case 'Prescription Medicines':
      return (
        product.requiresPrescription === true ||
        prodCatId === 1 ||
        prodCatId === 5 ||
        prodCatId === 6 ||
        prodCatName.includes('prescription') ||
        prodCatName.includes('antibiotic') ||
        prodCatName.includes('cardio')
      );
    case 'Over-the-Counter (OTC)':
      return (
        !product.requiresPrescription ||
        prodCatId === 2 ||
        prodCatId === 7 ||
        prodCatId === 8 ||
        prodCatName.includes('otc') ||
        prodCatName.includes('counter')
      );
    case 'Vitamins & Supplements':
      return (
        prodCatId === 3 ||
        prodCatName.includes('vitamin') ||
        prodCatName.includes('supplement') ||
        prodName.includes('vitamin')
      );
    case 'Pain Relief & Antipyretics':
      return (
        prodCatId === 7 ||
        prodCatName.includes('pain') ||
        prodCatName.includes('antipyretic') ||
        prodCatName.includes('analgesic') ||
        prodName.includes('paracetamol') ||
        prodName.includes('ibuprofen')
      );
    case 'Cold, Cough & Allergy':
      return (
        prodCatId === 8 ||
        prodCatName.includes('cold') ||
        prodCatName.includes('cough') ||
        prodCatName.includes('allergy') ||
        prodName.includes('cetirizine')
      );
    case 'Antibiotics':
      return (
        prodCatId === 5 ||
        prodCatName.includes('antibiotic') ||
        prodName.includes('amoxicillin') ||
        prodName.includes('azithromycin')
      );
    case 'Cardiovascular & Hypertension':
      return (
        prodCatId === 6 ||
        prodCatName.includes('cardio') ||
        prodCatName.includes('hypertension') ||
        prodCatName.includes('heart') ||
        prodName.includes('amlodipine') ||
        prodName.includes('atorvastatin')
      );
    case 'Personal Care & First Aid':
      return (
        prodCatId === 4 ||
        prodCatName.includes('personal') ||
        prodCatName.includes('first aid') ||
        prodCatName.includes('spray') ||
        prodName.includes('antiseptic')
      );
    default:
      return (
        String(product.categoryId) === String(catFilter) ||
        prodCatName.includes(String(catFilter).toLowerCase())
      );
  }
}

function matchPrice(product, priceFilter) {
  if (!priceFilter || priceFilter === 'ALL') return true;
  const price = Number(product.sellingPrice || 0);
  if (priceFilter === 'UNDER_500') {
    return price < 500;
  }
  if (priceFilter === '500_1000') {
    return price >= 500 && price <= 1000;
  }
  if (priceFilter === 'ABOVE_1000') {
    return price > 1000;
  }
  return true;
}

function matchAvailability(product, availFilter) {
  if (!availFilter || availFilter === 'ALL') return true;
  if (availFilter === 'IN_STOCK') {
    return product.totalStock !== undefined ? product.totalStock > 0 : true;
  }
  if (availFilter === 'RX_REQUIRED') {
    return product.requiresPrescription === true;
  }
  return true;
}

function matchSearch(product, query) {
  if (!query || !query.trim()) return true;
  const q = query.toLowerCase().trim();
  const name = (product.name || '').toLowerCase();
  const sku = (product.sku || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const dosage = (product.dosageInfo || '').toLowerCase();
  const cat = (product.categoryName || '').toLowerCase();
  return (
    name.includes(q) ||
    sku.includes(q) ||
    desc.includes(q) ||
    dosage.includes(q) ||
    cat.includes(q)
  );
}

// ── Sidebar Inner Content Component ─────────────────────────────────────────
function FilterSidebarContent({
  activeCategoryOptionId,
  onSelectCategory,
  priceRange,
  onSelectPrice,
  availabilityFilter,
  onSelectAvailability,
  onClearFilters,
  hasActiveFilters,
  categoryCounts,
  priceCounts,
  availabilityCounts,
}) {
  return (
    <div>
      <div className="sidebar-header">
        <div className="sidebar-header-title">
          <Filter size={18} color="var(--color-primary)" />
          Filters
        </div>
        {hasActiveFilters && (
          <button className="sidebar-clear-btn" onClick={onClearFilters}>
            Reset All
          </button>
        )}
      </div>

      {/* SHOP BY CATEGORY */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <Layers size={13} /> Shop by Category
        </div>
        <div className="sidebar-filter-list">
          {CATEGORY_FILTER_OPTIONS.map((opt) => {
            const isActive = activeCategoryOptionId === opt.id;
            const count = categoryCounts[opt.id] ?? 0;
            return (
              <button
                key={opt.id}
                type="button"
                className={`sidebar-filter-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(opt.id)}
              >
                <div className="sidebar-filter-left">
                  <span className="sidebar-radio-indicator">
                    {isActive && <span className="sidebar-radio-dot" />}
                  </span>
                  <span>{opt.label}</span>
                </div>
                <span className="sidebar-count-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRICE RANGE */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <DollarSign size={13} /> Price Range
        </div>
        <div className="sidebar-filter-list">
          {PRICE_FILTER_OPTIONS.map((opt) => {
            const isActive = priceRange === opt.id;
            const count = priceCounts[opt.id] ?? 0;
            return (
              <button
                key={opt.id}
                type="button"
                className={`sidebar-filter-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectPrice(opt.id)}
              >
                <div className="sidebar-filter-left">
                  <span className="sidebar-radio-indicator">
                    {isActive && <span className="sidebar-radio-dot" />}
                  </span>
                  <span>{opt.label}</span>
                </div>
                <span className="sidebar-count-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AVAILABILITY */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          <PackageCheck size={13} /> Availability
        </div>
        <div className="sidebar-filter-list">
          {AVAILABILITY_FILTER_OPTIONS.map((opt) => {
            const isActive = availabilityFilter === opt.id;
            const count = availabilityCounts[opt.id] ?? 0;
            return (
              <button
                key={opt.id}
                type="button"
                className={`sidebar-filter-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectAvailability(opt.id)}
              >
                <div className="sidebar-filter-left">
                  <span className="sidebar-radio-indicator">
                    {isActive && <span className="sidebar-radio-dot" />}
                  </span>
                  <span>{opt.label}</span>
                </div>
                <span className="sidebar-count-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Catalog Page Component ─────────────────────────────────────────────
export default function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const paramSearch = searchParams.get('search') || '';
  const paramCategory = searchParams.get('category') || 'ALL';

  // Filters state initialized from URL params if present
  const [searchQuery, setSearchQuery] = useState(paramSearch);
  const [selectedCategory, setSelectedCategory] = useState(paramCategory);
  const [priceRange, setPriceRange] = useState('ALL'); // 'ALL' | 'UNDER_500' | '500_1000' | 'ABOVE_1000'
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'RX_REQUIRED'
  const [sortBy, setSortBy] = useState('NAME_ASC'); // 'NAME_ASC' | 'PRICE_LOW' | 'PRICE_HIGH'

  const prevUrlStateRef = React.useRef({ search: paramSearch, category: paramCategory });

  useEffect(() => {
    if (prevUrlStateRef.current.search !== paramSearch) {
      prevUrlStateRef.current.search = paramSearch;
      setSearchQuery(paramSearch);
    }
    if (prevUrlStateRef.current.category !== paramCategory) {
      prevUrlStateRef.current.category = paramCategory;
      setSelectedCategory(paramCategory);
    }
  }, [paramSearch, paramCategory]);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.allSettled([
          inventoryService.getProducts(0, 100),
          inventoryService.getCategories(),
        ]);

        if (!isMounted) return;

        if (prodRes.status === 'fulfilled' && prodRes.value) {
          const list = prodRes.value.content || (Array.isArray(prodRes.value) ? prodRes.value : []);
          setProducts(list);
        }

        if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
          setCategories(catRes.value);
        }
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // Determine which option id in CATEGORY_FILTER_OPTIONS matches the active selectedCategory
  const activeCategoryOptionId = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'ALL') return 'ALL';

    const directMatch = CATEGORY_FILTER_OPTIONS.find((opt) => opt.id === selectedCategory);
    if (directMatch) return directMatch.id;

    // Check if numeric ID from URL matches any loaded category
    const found = categories.find((c) => String(c.id) === String(selectedCategory));
    if (found) {
      const nameMatch = CATEGORY_FILTER_OPTIONS.find(
        (opt) => opt.id.toLowerCase() === found.name.toLowerCase()
      );
      if (nameMatch) return nameMatch.id;
    }
    return selectedCategory;
  }, [selectedCategory, categories]);

  // Compute live counts for categories
  const categoryCounts = useMemo(() => {
    const counts = { ALL: products.length };
    CATEGORY_FILTER_OPTIONS.forEach((opt) => {
      if (opt.id === 'ALL') return;
      counts[opt.id] = products.filter((p) => matchCategory(p, opt.id, categories)).length;
    });
    return counts;
  }, [products, categories]);

  // Compute live counts for price ranges
  const priceCounts = useMemo(() => {
    return {
      ALL: products.length,
      UNDER_500: products.filter((p) => matchPrice(p, 'UNDER_500')).length,
      '500_1000': products.filter((p) => matchPrice(p, '500_1000')).length,
      ABOVE_1000: products.filter((p) => matchPrice(p, 'ABOVE_1000')).length,
    };
  }, [products]);

  // Compute live counts for availability
  const availabilityCounts = useMemo(() => {
    return {
      ALL: products.length,
      IN_STOCK: products.filter((p) => matchAvailability(p, 'IN_STOCK')).length,
      RX_REQUIRED: products.filter((p) => matchAvailability(p, 'RX_REQUIRED')).length,
    };
  }, [products]);

  // Filter & Sort products conjunctively
  const filteredProducts = useMemo(() => {
    let list = products.filter(
      (p) =>
        matchSearch(p, searchQuery) &&
        matchCategory(p, selectedCategory, categories) &&
        matchPrice(p, priceRange) &&
        matchAvailability(p, availabilityFilter)
    );

    list.sort((a, b) => {
      if (sortBy === 'PRICE_LOW') {
        return Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0);
      }
      if (sortBy === 'PRICE_HIGH') {
        return Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0);
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    return list;
  }, [products, searchQuery, selectedCategory, priceRange, availabilityFilter, sortBy, categories]);

  const hasActiveFilters = Boolean(
    selectedCategory !== 'ALL' ||
    priceRange !== 'ALL' ||
    availabilityFilter !== 'ALL' ||
    searchQuery.trim()
  );

  const activeFilterCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (priceRange !== 'ALL' ? 1 : 0) +
    (availabilityFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (catId === 'ALL') {
        next.delete('category');
      } else {
        next.set('category', catId);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setPriceRange('ALL');
    setAvailabilityFilter('ALL');
    setSortBy('NAME_ASC');
    setSearchParams({});
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    try {
      setAddingId(product.id);
      await addToCart(product, 1);
    } finally {
      setAddingId(null);
    }
  };

  // Helper label for active category pill
  const activeCategoryLabel = useMemo(() => {
    const opt = CATEGORY_FILTER_OPTIONS.find((o) => o.id === activeCategoryOptionId);
    return opt ? opt.label : selectedCategory;
  }, [activeCategoryOptionId, selectedCategory]);

  const activePriceLabel = useMemo(() => {
    const opt = PRICE_FILTER_OPTIONS.find((o) => o.id === priceRange);
    return opt ? opt.label : '';
  }, [priceRange]);

  const activeAvailabilityLabel = useMemo(() => {
    const opt = AVAILABILITY_FILTER_OPTIONS.find((o) => o.id === availabilityFilter);
    return opt ? opt.label : '';
  }, [availabilityFilter]);

  return (
    <div>
      {/* ── Breadcrumb & Title ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
          <Link to="/" style={{ color: 'var(--color-primary)' }}>Home</Link> / <span>Medicines & Pharmacy Catalog</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
          Pharmacy Medicines & Healthcare
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem' }}>
          Browse certified pharmaceutical treatments, over-the-counter remedies, vitamins, and medical essentials.
        </p>
      </div>

      {/* ── Mobile Filter Bar (Visible on tablets & mobile screens < 992px) ── */}
      <div className="catalog-mobile-bar">
        <button
          type="button"
          className={`mobile-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
          onClick={() => setMobileDrawerOpen(true)}
        >
          <Filter size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="mobile-filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            className="sidebar-clear-btn"
            onClick={handleClearFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        )}
      </div>

      {/* ── Slide-over Mobile Drawer ──────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="catalog-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="catalog-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="catalog-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                <Filter size={18} color="var(--color-primary)" />
                Filter Medicines
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="catalog-drawer-body">
              <FilterSidebarContent
                activeCategoryOptionId={activeCategoryOptionId}
                onSelectCategory={(id) => {
                  handleSelectCategory(id);
                }}
                priceRange={priceRange}
                onSelectPrice={(id) => setPriceRange(id)}
                availabilityFilter={availabilityFilter}
                onSelectAvailability={(id) => setAvailabilityFilter(id)}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
                categoryCounts={categoryCounts}
                priceCounts={priceCounts}
                availabilityCounts={availabilityCounts}
              />
            </div>
            <div className="catalog-drawer-footer">
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setMobileDrawerOpen(false)}
              >
                Apply Filters ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
      <div className="catalog-layout">
        {/* Left Sticky Sidebar (Desktop) */}
        <aside className="catalog-sidebar">
          <FilterSidebarContent
            activeCategoryOptionId={activeCategoryOptionId}
            onSelectCategory={handleSelectCategory}
            priceRange={priceRange}
            onSelectPrice={setPriceRange}
            availabilityFilter={availabilityFilter}
            onSelectAvailability={setAvailabilityFilter}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            categoryCounts={categoryCounts}
            priceCounts={priceCounts}
            availabilityCounts={availabilityCounts}
          />
        </aside>

        {/* Right Main Catalog Content */}
        <main className="catalog-main-content">
          {/* Top Search & Sort Control Bar */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Box */}
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-slate-400)'
                  }}
                />
                <input
                  type="text"
                  className="customer-search-input"
                  placeholder="Search by medicine name, generic, SKU, or symptoms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-slate-400)'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowUpDown size={16} color="var(--color-text-muted)" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--color-border)',
                    background: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="NAME_ASC">Sort: Name (A-Z)</option>
                  <option value="PRICE_LOW">Sort: Price (Low to High)</option>
                  <option value="PRICE_HIGH">Sort: Price (High to Low)</option>
                </select>
              </div>
            </div>

            {/* Active Filters Row (if any filter is selected) */}
            {hasActiveFilters && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  Active Filters:
                </span>

                {searchQuery && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--color-text-main)'
                    }}
                  >
                    Search: &ldquo;{searchQuery}&rdquo;
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSearchQuery('')}
                    />
                  </span>
                )}

                {selectedCategory !== 'ALL' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--color-primary-border)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--color-primary-active)'
                    }}
                  >
                    Category: {activeCategoryLabel}
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectCategory('ALL')}
                    />
                  </span>
                )}

                {priceRange !== 'ALL' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--color-primary-border)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--color-primary-active)'
                    }}
                  >
                    Price: {activePriceLabel}
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPriceRange('ALL')}
                    />
                  </span>
                )}

                {availabilityFilter !== 'ALL' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--color-primary-border)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--color-primary-active)'
                    }}
                  >
                    Availability: {activeAvailabilityLabel}
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setAvailabilityFilter('ALL')}
                    />
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-red-600)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <RotateCcw size={12} /> Clear All
                </button>
              </div>
            )}
          </div>

          {/* Results count */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'medicine' : 'medicines'}
            </span>
          </div>

          {/* Products Grid / Loading / Empty */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
              <LoadingSpinner size="lg" text="Searching pharmacy inventory..." />
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No medicines match your filters"
              description="Try adjusting your category, price range, or availability filters to see available stock."
              actionText="Reset All Filters"
              onAction={handleClearFilters}
            />
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => {
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
                        <span className="rx-badge" title="Doctor prescription required">
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
                              <CheckCircle2 size={13} /> In Stock ({product.totalStock} available)
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
                          type="button"
                          className="btn btn-primary"
                          disabled={!inStock || addingId === product.id}
                          onClick={(e) => handleAddToCart(e, product)}
                          style={{
                            borderRadius: 'var(--radius-full)',
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <ShoppingCart size={15} />
                          {addingId === product.id ? 'Adding...' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
