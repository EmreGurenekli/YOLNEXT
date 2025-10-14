import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import IndividualSidebar from '../navigation/IndividualSidebar';

const IndividualLayout: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <IndividualSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default IndividualLayout;