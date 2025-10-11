import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/real-api';
const AuthContext = createContext(undefined);
export const RealAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
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
                    }
                    else {
                        localStorage.removeItem('authToken');
                    }
                }
                catch (error) {
                    console.error('Token doğrulama hatası:', error);
                    localStorage.removeItem('authToken');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);
    const login = async (credentials) => {
        try {
            setLoading(true);
            const response = await apiClient.login(credentials);
            if (response.success) {
                setUser(response.data);
                setIsAuthenticated(true);
                apiClient.setToken(localStorage.getItem('authToken') || '');
                return { success: true, message: response.message };
            }
            else {
                return { success: false, message: response.message };
            }
        }
        catch (error) {
            console.error('Giriş hatası:', error);
            return {
                success: false,
                message: error.message || 'Giriş yapılırken bir hata oluştu'
            };
        }
        finally {
            setLoading(false);
        }
    };
    const register = async (userData) => {
        try {
            setLoading(true);
            const response = await apiClient.register(userData);
            if (response.success) {
                setUser(response.data);
                setIsAuthenticated(true);
                apiClient.setToken(localStorage.getItem('authToken') || '');
                return { success: true, message: response.message };
            }
            else {
                return { success: false, message: response.message };
            }
        }
        catch (error) {
            console.error('Kayıt hatası:', error);
            return {
                success: false,
                message: error.message || 'Kayıt olurken bir hata oluştu'
            };
        }
        finally {
            setLoading(false);
        }
    };
    const demoLogin = async (userType) => {
        try {
            setLoading(true);
            const response = await apiClient.demoLogin(userType);
            if (response.success) {
                setUser(response.data);
                setIsAuthenticated(true);
                apiClient.setToken(localStorage.getItem('authToken') || '');
                return { success: true, message: response.message };
            }
            else {
                return { success: false, message: response.message };
            }
        }
        catch (error) {
            console.error('Demo giriş hatası:', error);
            return {
                success: false,
                message: error.message || 'Demo giriş yapılırken bir hata oluştu'
            };
        }
        finally {
            setLoading(false);
        }
    };
    const logout = async () => {
        try {
            await apiClient.logout();
            setUser(null);
            setIsAuthenticated(false);
            apiClient.clearToken();
        }
        catch (error) {
            console.error('Çıkış hatası:', error);
        }
    };
    const updateProfile = async (userData) => {
        try {
            setLoading(true);
            const response = await apiClient.updateProfile(userData);
            if (response.success) {
                setUser(response.data);
                return { success: true, message: response.message };
            }
            else {
                return { success: false, message: response.message };
            }
        }
        catch (error) {
            console.error('Profil güncelleme hatası:', error);
            return {
                success: false,
                message: error.message || 'Profil güncellenirken bir hata oluştu'
            };
        }
        finally {
            setLoading(false);
        }
    };
    const refreshUser = async () => {
        try {
            const response = await apiClient.getProfile();
            if (response.success) {
                setUser(response.data);
            }
        }
        catch (error) {
            console.error('Kullanıcı yenileme hatası:', error);
        }
    };
    const value = {
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
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a RealAuthProvider');
    }
    return context;
};
export default RealAuthProvider;
