import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/real-api';

interface User {
  id: number;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: 'individual' | 'corporate' | 'carrier' | 'driver';
  company_name?: string;
  tax_number?: string;
  address?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  email_verified_at?: string;
  phone_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message: string }>;
  register: (userData: any) => Promise<{ success: boolean; message: string }>;
  demoLogin: (userType: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const RealAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Token kontrolü ve kullanıcı bilgilerini yükle
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await apiClient.getProfile();
          if (response.success) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.error('Token doğrulama hatası:', error);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      const response = await apiClient.login(credentials);
      
      if (response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
        apiClient.setToken(localStorage.getItem('authToken') || '');
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      return { 
        success: false, 
        message: error.message || 'Giriş yapılırken bir hata oluştu' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);
      
      if (response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
        apiClient.setToken(localStorage.getItem('authToken') || '');
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      return { 
        success: false, 
        message: error.message || 'Kayıt olurken bir hata oluştu' 
      };
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (userType: string) => {
    try {
      setLoading(true);
      const response = await apiClient.demoLogin(userType);
      
      if (response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
        apiClient.setToken(localStorage.getItem('authToken') || '');
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.error('Demo giriş hatası:', error);
      return { 
        success: false, 
        message: error.message || 'Demo giriş yapılırken bir hata oluştu' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
      setIsAuthenticated(false);
      apiClient.clearToken();
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      const response = await apiClient.updateProfile(userData);
      
      if (response.success) {
        setUser(response.data);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.error('Profil güncelleme hatası:', error);
      return { 
        success: false, 
        message: error.message || 'Profil güncellenirken bir hata oluştu' 
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getProfile();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Kullanıcı yenileme hatası:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    demoLogin,
    logout,
    updateProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a RealAuthProvider');
  }
  return context;
};

export default RealAuthProvider;




