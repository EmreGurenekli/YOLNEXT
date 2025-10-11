import React from 'react';
import { Outlet } from 'react-router-dom';
import TasiyiciSidebar from './TasiyiciSidebar';
import { useAuth } from '../contexts/AuthContext';

export default function TasiyiciLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <TasiyiciSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}