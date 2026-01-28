import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import IndividualSidebar from './navigation/IndividualSidebar';

const IndividualLayout: React.FC = () => {
  const { logout } = useAuth();
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
  const sidebarWidth = windowWidth <= 768 ? 0 : Math.min(256, Math.max(200, windowWidth * 0.25));

  const handleLogout = () => {
    logout();
  };

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900'>
      <IndividualSidebar onLogout={handleLogout} />
      <main 
        className='overflow-auto bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900'
        style={{ 
          width: `calc(100% - ${sidebarWidth}px)`,
          marginLeft: `${sidebarWidth}px`
        }}
      >
        <div className='min-h-full'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default IndividualLayout;











