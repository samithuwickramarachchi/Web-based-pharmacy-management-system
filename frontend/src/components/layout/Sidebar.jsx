import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleDisplayName, hasAnyRole } from '../../utils/roleUtils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Truck,
  Users,
  Tag,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cross,
  ClipboardList,
  FileText,
} from 'lucide-react';

export function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth();

  const navSections = [
    {
      title: 'My Account',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          roles: ['CUSTOMER'],
        },
        {
          label: 'My Orders',
          path: '/my-orders',
          icon: ClipboardList,
          roles: ['CUSTOMER'],
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          roles: ['ADMIN', 'SALES_STAFF', 'SALES_OFFICER', 'DELIVERY_STAFF', 'DELIVERY_OFFICER', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF', 'CUSTOMER_MANAGER', 'PROMOTION_MANAGER'],
        },
        {
          label: 'In-Store Sales',
          path: '/sales',
          icon: ShoppingCart,
          roles: ['ADMIN', 'SALES_STAFF', 'SALES_OFFICER'],
        },
        {
          label: 'Online Orders',
          path: '/orders',
          icon: Package,
          roles: ['ADMIN', 'SALES_STAFF', 'SALES_OFFICER', 'DELIVERY_STAFF', 'DELIVERY_OFFICER'],
        },
      ],
    },
    {
      title: 'Inventory & Procurement',
      items: [
        {
          label: 'Inventory & Stock',
          path: '/inventory',
          icon: Layers,
          roles: ['ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER'],
        },
        {
          label: 'Suppliers & POs',
          path: '/suppliers',
          icon: Building2,
          roles: ['ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF'],
        },
      ],
    },
    {
      title: 'Relations & Marketing',
      items: [
        {
          label: 'Customers',
          path: '/customers',
          icon: Users,
          roles: ['ADMIN', 'CUSTOMER_MANAGER', 'SALES_STAFF', 'SALES_OFFICER'],
        },
        {
          label: 'Discounts & Coupons',
          path: '/promotions',
          icon: Tag,
          roles: ['ADMIN', 'PROMOTION_MANAGER'],
        },
        {
          label: 'Deliveries',
          path: '/deliveries',
          icon: Truck,
          roles: ['ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER'],
        },
      ],
    },
  ];

  const userInitials = (user?.username || 'U').substring(0, 2).toUpperCase();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-icon-box">
            <Cross size={22} strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="brand-title">
              Pharma<span>Care</span> Pro
            </div>
          )}
        </div>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav Content */}
      <div className="sidebar-content">
        {navSections.map((section, sIndex) => {
          // Filter items based on user role
          const visibleItems = section.items.filter(
            (item) => item.roles.length === 0 || hasAnyRole(user, item.roles)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={sIndex} className="sidebar-section">
              {!collapsed && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              <nav className="sidebar-nav">
                {visibleItems.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `nav-link-item ${isActive ? 'active' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <ItemIcon size={20} className="nav-icon" />
                      {!collapsed && <span className="nav-label">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{userInitials}</div>
          {!collapsed && (
            <div className="user-info-text">
              <span className="user-name">{user?.username || 'User'}</span>
              <span className="user-role-badge">
                {getRoleDisplayName(user?.role)}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
