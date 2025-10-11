import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      apiService.setToken(token);
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Kullanıcı profilini yükle
  const loadUserProfile = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Giriş yapma
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Demo giriş
  const demoLogin = async (userType) => {
    try {
      setLoading(true);
      const response = await apiService.demoLogin(userType);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Kayıt olma
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yapma
  const logout = () => {
    apiService.clearToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Kullanıcı tipine göre panel yönlendirmesi
  const getPanelRoute = (userType) => {
    const routes = {
      individual: '/individual',
      corporate: '/corporate',
      carrier: '/nakliyeci',
      driver: '/tasiyici'
    };
    return routes[userType] || '/';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    demoLogin,
    register,
    logout,
    getPanelRoute,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};







