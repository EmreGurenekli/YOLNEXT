import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CorporateSidebar from './navigation/CorporateSidebar';
import { useAuth } from '../contexts/AuthContext';
import CorporateDashboard from '../pages/corporate/Dashboard';

export default function CorporateLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(1024);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dinamik sidebar genişliği
  const sidebarWidth = windowWidth <= 480 ? 0 : Math.min(256, Math.max(200, windowWidth * 0.25));

  const handleLogout = () => {
    logout();
  };

  // Dashboard sayfası için doğrudan component render et
  if (location.pathname === '/corporate/dashboard') {
    return (
      <div className='flex h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900'>
        <CorporateSidebar onLogout={handleLogout} />
        <main 
          className='overflow-auto bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900'
          style={{ 
            width: `calc(100% - ${sidebarWidth}px)`,
            marginLeft: `${sidebarWidth}px`
          }}
        >
          <CorporateDashboard />
        </main>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900'>
      <CorporateSidebar onLogout={handleLogout} />
      <main 
        className='overflow-auto bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900'
        style={{ 
          width: `calc(100% - ${sidebarWidth}px)`,
          marginLeft: `${sidebarWidth}px`
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}











