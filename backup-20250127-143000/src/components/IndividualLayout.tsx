import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const IndividualLayout: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default IndividualLayout;