import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  panel_type: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  company_name?: string;
  location?: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User }>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await apiClient.verifyToken();
          if (response && response.user) {
            setUser(response.user as User);
          } else {
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      setUser(response.user as User);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiClient.register(userData);
      setUser(response.user as User);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    try {
      apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      setUser(null);
      localStorage.removeItem('authToken');
      
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const demoLogin = async (userType: string) => {
    try {
      const demoCredentials = {
        individual: { email: 'individual@demo.com', password: 'demo123' },
        corporate: { email: 'corporate@demo.com', password: 'demo123' },
        nakliyeci: { email: 'nakliyeci@demo.com', password: 'demo123' },
        tasiyici: { email: 'tasiyici@demo.com', password: 'demo123' }
      };

      const credentials = demoCredentials[userType as keyof typeof demoCredentials];
      if (!credentials) {
        return { success: false };
      }

      const response = await apiClient.login(credentials);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
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
    login,
    register,
    logout,
    updateUser,
    demoLogin,
    getPanelRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};