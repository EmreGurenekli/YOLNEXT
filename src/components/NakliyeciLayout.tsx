import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NakliyeciSidebar from './NakliyeciSidebar';

const NakliyeciLayout: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <NakliyeciSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default NakliyeciLayout;