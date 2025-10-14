import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CorporateSidebar from '../navigation/CorporateSidebar';
import { useAuth } from '../../contexts/AuthContext';
import CorporateDashboard from '../../pages/corporate/Dashboard';

export default function CorporateLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  // Dashboard sayfası için doğrudan component render et
  if (location.pathname === '/corporate/dashboard') {
    return (
      <div className="flex h-screen bg-gray-50">
        <CorporateSidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <CorporateDashboard />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <CorporateSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}