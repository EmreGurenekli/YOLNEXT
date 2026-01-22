import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NakliyeciSidebar from './navigation/NakliyeciSidebar';

const NakliyeciLayout: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className='flex h-screen bg-white'>
      <NakliyeciSidebar onLogout={handleLogout} />
      <main className='flex-1 overflow-auto bg-white'>
        <div className='min-h-full'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default NakliyeciLayout;
