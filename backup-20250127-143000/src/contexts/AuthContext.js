import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';
const AuthContext = createContext(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = !!user;
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token) {
                    const response = await apiClient.verifyToken();
                    if (response.valid) {
                        const userResponse = await apiClient.getCurrentUser();
                        setUser(userResponse.user);
                    }
                    else {
                        localStorage.removeItem('authToken');
                    }
                }
            }
            catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('authToken');
            }
            finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);
    const login = async (email, password) => {
        try {
            const response = await apiClient.login({ email, password });
            setUser(response.user);
            return { success: true, user: response.user };
        }
        catch (error) {
            return { success: false };
        }
    };
    const register = async (userData) => {
        try {
            const response = await apiClient.register(userData);
            setUser(response.user);
        }
        catch (error) {
            throw error;
        }
    };
    const logout = () => {
        apiClient.logout();
        setUser(null);
    };
    const updateUser = (userData) => {
        setUser(prev => prev ? { ...prev, ...userData } : null);
    };
    const demoLogin = async (userType) => {
        try {
            const demoCredentials = {
                individual: { email: 'individual@demo.com', password: 'demo123' },
                corporate: { email: 'corporate@demo.com', password: 'demo123' },
                nakliyeci: { email: 'nakliyeci@demo.com', password: 'demo123' },
                tasiyici: { email: 'tasiyici@demo.com', password: 'demo123' }
            };
            const credentials = demoCredentials[userType];
            if (!credentials) {
                return { success: false };
            }
            const response = await apiClient.login(credentials);
            setUser(response.user);
            return { success: true, user: response.user };
        }
        catch (error) {
            return { success: false };
        }
    };
    const getPanelRoute = (panelType) => {
        const routes = {
            individual: '/individual/dashboard',
            corporate: '/corporate/dashboard',
            nakliyeci: '/nakliyeci/dashboard',
            tasiyici: '/tasiyici/dashboard'
        };
        return routes[panelType] || '/';
    };
    const value = {
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
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
};
