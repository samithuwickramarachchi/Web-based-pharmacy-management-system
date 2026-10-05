import React from 'react';
import { Outlet } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';

export default function CustomerLayout() {
  return (
    <div className="customer-layout">
      <CustomerNavbar />
      <main className="customer-main-content">
        <Outlet />
      </main>
      <CustomerFooter />
    </div>
  );
}
