import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingState from '../../components/common/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user);

  // Loading durumunda loading göster
  if (isLoading) {
    console.log('ProtectedRoute - showing loading state');
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center'>
        <LoadingState message='Kimlik doğrulanıyor...' />
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!isAuthenticated) {
    console.log('ProtectedRoute - redirecting to login');
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Rol kontrolü gerekliyse
  if (requiredRole && user?.role !== requiredRole) {
    console.log('ProtectedRoute - role mismatch, redirecting to user panel');
    // Kullanıcının kendi panel'ine yönlendir
    const panelRoutes = {
      individual: '/individual/dashboard',
      corporate: '/corporate/dashboard',
      nakliyeci: '/nakliyeci/dashboard',
      tasiyici: '/tasiyici/dashboard',
    };

    const userPanelRoute =
      panelRoutes[user?.role as keyof typeof panelRoutes] || '/';
    return <Navigate to={userPanelRoute} replace />;
  }

  console.log('ProtectedRoute - allowing access to protected route');
  return <>{children}</>;
};

export default ProtectedRoute;