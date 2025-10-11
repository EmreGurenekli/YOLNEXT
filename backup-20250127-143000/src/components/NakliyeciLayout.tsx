import React from 'react';
import { Outlet } from 'react-router-dom';
import NakliyeciSidebar from './NakliyeciSidebar';
import { useAuth } from '../contexts/AuthContext';

export default function NakliyeciLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <NakliyeciSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}