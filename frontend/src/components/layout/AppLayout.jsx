import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main content wrapper */}
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Header />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
