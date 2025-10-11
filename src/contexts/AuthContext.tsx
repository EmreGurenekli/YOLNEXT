import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'individual' | 'corporate' | 'carrier' | 'driver';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  corporateProfile?: any;
  carrierProfile?: any;
  driverProfile?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  demoLogin: (userType: string) => Promise<{ success: boolean; user?: User }>;
  getPanelRoute: (panelType: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
      const response = await api.getCurrentUser();
      if (response.success && response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = response.data.user as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.login(email, password);
      if (response.success && response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = response.data.user as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Giriş başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.register(userData);
      if (response.success && response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = response.data.user as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.message || 'Kayıt başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'Kayıt olurken bir hata oluştu');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.getCurrentUser();
      if (response.success && response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = response.data.user as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (userType: string) => {
    try {
      console.log('AuthContext demoLogin called with userType:', userType);
      const demoCredentials = {
        individual: { email: 'individual@demo.com', password: 'demo123' },
        corporate: { email: 'corporate@demo.com', password: 'demo123' },
        nakliyeci: { email: 'nakliyeci@demo.com', password: 'demo123' },
        tasiyici: { email: 'tasiyici@demo.com', password: 'demo123' }
      };

      const credentials = demoCredentials[userType as keyof typeof demoCredentials];
      console.log('Demo credentials:', credentials);
      if (!credentials) {
        console.log('No credentials found for userType:', userType);
        return { success: false };
      }

      console.log('Calling API login with:', credentials.email);
      const response = await api.login(credentials.email, credentials.password);
      console.log('API login response:', response);
      
      if (response.success && response.data && typeof response.data === 'object' && 'user' in response.data) {
        const userData = response.data.user as User;
        console.log('Setting user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        console.log('Login failed - invalid response structure');
        return { success: false };
      }
    } catch (error) {
      console.error('Demo login error:', error);
      return { success: false };
    }
  };

  const getPanelRoute = (panelType: string) => {
    const routes = {
      individual: '/individual/dashboard',
      corporate: '/corporate/dashboard',
      nakliyeci: '/nakliyeci/dashboard',
      tasiyici: '/tasiyici/dashboard'
    };
    return routes[panelType as keyof typeof routes] || '/';
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    demoLogin,
    getPanelRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};