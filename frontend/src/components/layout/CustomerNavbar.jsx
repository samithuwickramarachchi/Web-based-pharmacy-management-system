import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Cross,
  Search,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Phone,
  ShieldCheck,
  Award,
  FileText,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import customerService from '../../services/customerService';

export default function CustomerNavbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [customerProfile, setCustomerProfile] = useState(null);

  // Fetch customer profile for tier badge if customer is logged in
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && user?.roles?.includes('CUSTOMER')) {
      customerService.getMe()
        .then((data) => {
          if (isMounted) setCustomerProfile(data);
        })
        .catch(() => {
          // ignore if error
        });
    }
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const isCustomer = user?.roles?.includes('CUSTOMER');

  const rawTier = customerProfile?.membershipTier || 'Standard';
  const tier = rawTier.toUpperCase();
  const tierClass = tier === 'GOLD' ? 'tier-gold' : tier === 'SILVER' ? 'tier-silver' : 'tier-standard';

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="customer-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span>
            <ShieldCheck size={14} /> 100% Genuine Certified Healthcare Products
          </span>
          <span>
            <Phone size={14} /> 24/7 Pharmacist Support: +94 11 234 5678
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Free delivery on orders over RS 2,000</span>
          {customerProfile?.membershipId && (
            <span style={{ color: '#fde047', fontWeight: 600 }}>
              ID: {customerProfile.membershipId}
            </span>
          )}
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="customer-header">
        <div className="customer-header-inner">
          {/* Brand Logo */}
          <Link to="/" className="customer-brand">
            <div className="customer-brand-icon">
              <Cross size={22} strokeWidth={2.7} />
            </div>
            <div className="customer-brand-text">
              Pharma<span>Care</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form className="customer-search-form" onSubmit={handleSearchSubmit}>
            <Search size={18} className="customer-search-icon" />
            <input
              type="text"
              className="customer-search-input"
              placeholder="Search medicines, vitamins, wellness products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Nav Navigation */}
          <nav className="customer-nav">
            <NavLink to="/" className={({ isActive }) => `customer-nav-link ${isActive ? 'active' : ''}`} end>
              Home
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `customer-nav-link ${isActive ? 'active' : ''}`}>
              Medicines & Shop
            </NavLink>
            {isCustomer && (
              <NavLink to="/account?tab=prescriptions" className="customer-nav-link">
                <FileText size={16} /> Upload Rx
              </NavLink>
            )}

            {/* Cart Button with Count Badge */}
            <Link to="/cart" className="customer-cart-btn" aria-label="Shopping Cart">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartCount > 0 && <span className="customer-cart-badge">{cartCount}</span>}
            </Link>

            {/* Auth / Account Controls */}
            {isAuthenticated ? (
              <div className="customer-user-menu">
                {isCustomer ? (
                  <>
                    <Link
                      to="/account?tab=loyalty"
                      className="customer-nav-link"
                      style={{ background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-full)', padding: '0.4rem 0.85rem' }}
                      title="View Loyalty Rewards & Membership Tier"
                    >
                      <UserIcon size={16} />
                      <span>{user?.firstName || user?.username || 'My Account'}</span>
                      <span className={`loyalty-tier-pill ${tierClass}`}>
                        <Award size={11} /> {rawTier}
                      </span>
                    </Link>
                    <button
                      onClick={logout}
                      title="Log Out"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-slate-400)',
                        padding: '0.4rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <LogOut size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className="customer-nav-link"
                      style={{ background: '#fef3c7', color: '#92400e', borderRadius: 'var(--radius-full)' }}
                    >
                      <LayoutDashboard size={16} /> Staff Portal
                    </Link>
                    <button
                      onClick={logout}
                      title="Log Out"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}
                    >
                      <LogOut size={18} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link
                  to="/login"
                  className="customer-nav-link"
                  style={{
                    padding: '0.45rem 0.85rem',
                    color: 'var(--color-slate-700)',
                    fontWeight: 600
                  }}
                >
                  <UserIcon size={16} /> Sign In
                </Link>
                <Link
                  to="/register"
                  className="customer-nav-link"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.45rem 1.15rem',
                    fontWeight: 600
                  }}
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
