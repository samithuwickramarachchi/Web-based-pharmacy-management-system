import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import CustomerLayout from './components/layout/CustomerLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import InventoryManagement from './pages/inventory/InventoryManagement';
import SalesTerminal from './pages/sales/SalesTerminal';
import OnlineOrders from './pages/sales/OnlineOrders';
import SupplierManagement from './pages/suppliers/SupplierManagement';
import PromotionManagement from './pages/promotions/PromotionManagement';
import DeliveryManagement from './pages/deliveries/DeliveryManagement';
import NotFound from './pages/NotFound';

// Phase 5 Customer Storefront Pages
import CustomerHome from './pages/customer/CustomerHome';
import ProductCatalog from './pages/customer/ProductCatalog';
import ProductDetails from './pages/customer/ProductDetails';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import CustomerAccount from './pages/customer/CustomerAccount';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer E-Commerce Storefront */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<CustomerHome />} />
                <Route path="/products" element={<ProductCatalog />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <CustomerAccount />
                    </ProtectedRoute>
                  }
                />
                {/* Backwards-compatibility redirect */}
                <Route path="/my-orders" element={<Navigate to="/account?tab=orders" replace />} />
              </Route>

              {/* Staff Operations & Back-Office Layout */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      'ADMIN',
                      'SALES_STAFF',
                      'SALES_OFFICER',
                      'DELIVERY_STAFF',
                      'DELIVERY_OFFICER',
                      'INVENTORY_STAFF',
                      'INVENTORY_MANAGER',
                      'SUPPLIER_OFFICER',
                      'SUPPLIER_STAFF',
                      'CUSTOMER_MANAGER',
                      'PROMOTION_MANAGER',
                    ]}
                  >
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />

                {/* In-Store Sales & Billing */}
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'SALES_STAFF', 'SALES_OFFICER']}>
                      <SalesTerminal />
                    </ProtectedRoute>
                  }
                />

                {/* Online Orders & Prescriptions */}
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        'ADMIN',
                        'SALES_STAFF',
                        'SALES_OFFICER',
                        'DELIVERY_STAFF',
                        'DELIVERY_OFFICER',
                      ]}
                    >
                      <OnlineOrders />
                    </ProtectedRoute>
                  }
                />

                {/* Inventory Management */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute
                      allowedRoles={['ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER']}
                    >
                      <InventoryManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Supplier Management & Purchase Orders */}
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        'ADMIN',
                        'INVENTORY_STAFF',
                        'INVENTORY_MANAGER',
                        'SUPPLIER_OFFICER',
                        'SUPPLIER_STAFF',
                      ]}
                    >
                      <SupplierManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Customer Management (Staff CRM) */}
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        'ADMIN',
                        'CUSTOMER_MANAGER',
                        'SALES_STAFF',
                        'SALES_OFFICER',
                      ]}
                    >
                      <CustomerList />
                    </ProtectedRoute>
                  }
                />

                {/* Discount & Promotion Management */}
                <Route
                  path="/promotions"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'PROMOTION_MANAGER']}>
                      <PromotionManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Delivery Operations */}
                <Route
                  path="/deliveries"
                  element={
                    <ProtectedRoute
                      allowedRoles={['ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER']}
                    >
                      <DeliveryManagement />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
