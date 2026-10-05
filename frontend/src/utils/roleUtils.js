export const ROLES = {
  ADMIN: 'ADMIN',
  SALES_OFFICER: 'SALES_OFFICER',
  SALES_STAFF: 'SALES_STAFF',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  INVENTORY_STAFF: 'INVENTORY_STAFF',
  DELIVERY_OFFICER: 'DELIVERY_OFFICER',
  DELIVERY_STAFF: 'DELIVERY_STAFF',
  CUSTOMER_MANAGER: 'CUSTOMER_MANAGER',
  PROMOTION_MANAGER: 'PROMOTION_MANAGER',
  SUPPLIER_OFFICER: 'SUPPLIER_OFFICER',
  CUSTOMER: 'CUSTOMER',
};

export function getRoleDisplayName(role) {
  if (!role) return 'Staff';
  switch (role.toUpperCase()) {
    case 'ADMIN':
      return 'System Administrator';
    case 'SALES_OFFICER':
    case 'SALES_STAFF':
      return 'Sales & Billing Officer';
    case 'INVENTORY_MANAGER':
    case 'INVENTORY_STAFF':
      return 'Inventory Manager';
    case 'DELIVERY_OFFICER':
    case 'DELIVERY_STAFF':
      return 'Delivery Officer';
    case 'CUSTOMER_MANAGER':
      return 'Customer Relations Officer';
    case 'PROMOTION_MANAGER':
      return 'Promotion & Discounts Manager';
    case 'SUPPLIER_OFFICER':
      return 'Supplier Management Officer';
    case 'CUSTOMER':
      return 'Customer';
    default:
      return role.replace(/_/g, ' ');
  }
}

export function hasAnyRole(user, allowedRoles = []) {
  if (!user) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;

  const userRole = (user.role || '').toUpperCase();
  const userAuthorities = (user.authorities || []).map((a) => a.toUpperCase());

  return allowedRoles.some((r) => {
    const target = r.toUpperCase();
    return (
      userRole === target ||
      userAuthorities.includes(target) ||
      userAuthorities.includes(`ROLE_${target}`)
    );
  });
}
