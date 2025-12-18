import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingState from '../common/LoadingState';
import { getAdminBasePath } from '../../config/admin';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingState message='Kimlik doğrulanıyor...' />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${getAdminBasePath()}/login`}
        state={{ from: location }}
        replace
      />
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
