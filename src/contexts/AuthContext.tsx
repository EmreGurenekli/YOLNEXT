import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { authAPI, userAPI } from '../services/api';
import { User } from '../types/auth';
import socketService from '../services/socket';
import { createApiUrl, API_ENDPOINTS } from '../config/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user?: User }>;
  register: (
    userData: any
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  demoLogin: (userType: string) => Promise<{ success: boolean; user?: User }>;
  getPanelRoute: (panelType: string) => string;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        // Only try API call if we have a token AND it's not on initial page load
        // This prevents unnecessary API calls that cause 500 errors
        if (storedUser && storedToken && storedToken.startsWith('eyJ')) {
          setToken(storedToken);
          
          // Restore user from localStorage immediately (don't wait for API)
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser) {
              setUser(parsedUser);
            }
          } catch (parseError) {
            // If parsing fails, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setToken(null);
          }
          
          // Try to verify with backend in background (non-blocking)
          // Don't await this - let it happen async
          userAPI.getProfile()
            .then((response) => {
              if (response && response.data?.success) {
                const userData: User = {
                  id: response.data.data.id.toString(),
                  fullName: `${response.data.data.firstName} ${response.data.data.lastName}`,
                  email: response.data.data.email,
                  role: response.data.data.userType,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setUser(userData);
                // Connect to Socket.IO (only if enabled)
                if (import.meta.env.VITE_ENABLE_SOCKET === 'true') {
                  socketService.connect(storedToken);
                }
              }
            })
            .catch((error: any) => {
              // Silently fail - we already have user from localStorage
              // Only log if it's not a token/auth error
              if (import.meta.env.DEV && !error?.message?.includes('Invalid or expired token') && !error?.message?.includes('403')) {
              console.debug('Profile API call failed (non-critical):', error?.status || error?.message);
              }
            });
        } else if (storedUser && storedToken) {
          // Old token format - just restore from localStorage
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser) {
              setUser(parsedUser);
              setToken(storedToken);
            }
          } catch (parseError) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setToken(null);
          }
        }
      } catch (error) {
        // Auth initialization error handled by error boundary
        console.error('Auth init error:', error);
        // Don't remove tokens on error, might be demo tokens
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success || response.data?.success) {
        // Backend response format: { success: true, data: { user: {...}, token: "..." } }
        const responseData = response.data || response;
        const userData = responseData.data?.user || responseData.user;
        const token = responseData.data?.token || responseData.token;

        if (!userData || !token) {
          throw new Error('Invalid response format');
        }

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser({
          id: userData.id.toString(),
          fullName:
            userData.fullName ||
            `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email,
          role: userData.role || userData.panel_type || 'individual',
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          companyName: userData.companyName,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        });
        setToken(token);

        // Connect to Socket.IO (only if enabled)
        if (import.meta.env.VITE_ENABLE_SOCKET === 'true') {
          socketService.connect();
        }

        return { success: true, user: userData };
      } else {
        throw new Error(
          response.data?.message || response.message || 'Login failed'
        );
      }
    } catch (error: any) {
      // Login error handled by error boundary
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    userData: any
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);

      if (response.success || response.data?.success) {
        // Backend response format: { success: true, data: { user: {...}, token: "..." } }
        const responseData = response.data || response;
        const userData = responseData.data?.user || responseData.user;
        const token = responseData.data?.token || responseData.token;

        if (!userData || !token) {
          throw new Error('Invalid response format');
        }

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser({
          id: userData.id.toString(),
          fullName:
            userData.fullName ||
            `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email,
          role: userData.role || userData.panel_type || 'individual',
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          companyName: userData.companyName,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        });
        setToken(token);

        // Connect to Socket.IO (only if enabled)
        if (import.meta.env.VITE_ENABLE_SOCKET === 'true') {
          socketService.connect();
        }

        return { success: true, user: userData };
      } else {
        throw new Error(
          response.data?.message || response.message || 'Registration failed'
        );
      }
    } catch (error: any) {
      // Register error handled by error boundary
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // No API call needed for logout
    } catch (error) {
      // Logout error handled by error boundary
    } finally {
      // Clear local state and storage
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Disconnect from Socket.IO
      socketService.disconnect();
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...userData } : null));
  };

  const demoLogin = async (userType: string) => {
    try {
      setIsLoading(true);

      // Call backend demo login endpoint to get real JWT token
      const response = await authAPI.demoLogin(userType);

      if (response.success || response.data?.success) {
        const responseData = response.data || response;
        const userData = responseData.data?.user || responseData.user;
        const token = responseData.data?.token || responseData.token;

        if (!userData || !token) {
          throw new Error('Invalid response format from demo login');
        }

        localStorage.setItem('authToken', token);
        setToken(token);

        // userType parametresini kullanarak role'ü kesin olarak ayarla
        // Backend'den gelen userData'dan name veya firstName/lastName'den fullName oluştur
        const fullName = userData.fullName || 
          userData.name || 
          (userData.firstName || userData.lastName 
            ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
            : userData.panel_type === 'individual' ? 'Bireysel Demo Kullanıcı'
            : userData.panel_type === 'corporate' ? 'Kurumsal Demo Kullanıcı'
            : userData.panel_type === 'nakliyeci' ? 'Nakliyeci Demo Kullanıcı'
            : userData.panel_type === 'tasiyici' ? 'Taşıyıcı Demo Kullanıcı'
            : 'Demo Kullanıcı');
        
        const formattedUser: User = {
          id: userData.id?.toString() || String(Math.floor(Math.random() * 1000) + 10000),
          fullName: fullName,
          email: userData.email || `demo@${userType}.com`,
          role: userType, // userType parametresini direkt kullan (backend'den gelen role'ü değil)
          firstName: userData.firstName || fullName.split(' ')[0] || 'Demo',
          lastName: userData.lastName || fullName.split(' ').slice(1).join(' ') || 'Kullanıcı',
          phone: userData.phone || '05001112233',
          address: userData.address || 'Demo Adres',
          companyName: userData.companyName || userData.company_name || '',
          taxNumber: userData.taxNumber || userData.tax_number || '',
          isVerified: userData.isVerified !== false,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        };

        setUser(formattedUser);
        localStorage.setItem('user', JSON.stringify(formattedUser));

        // Connect socket (only if enabled)
        if (import.meta.env.VITE_ENABLE_SOCKET === 'true') {
          socketService.connect();
        }

        return { success: true, user: formattedUser };
      } else {
        throw new Error(
          response.data?.message || response.message || 'Demo login failed'
        );
      }
    } catch (error) {
      console.error('Demo login error:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const getPanelRoute = (panelType: string) => {
    const routes = {
      individual: '/individual/dashboard',
      corporate: '/corporate/dashboard',
      nakliyeci: '/nakliyeci/dashboard',
      tasiyici: '/tasiyici/dashboard',
    };
    return routes[panelType as keyof typeof routes] || '/';
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    demoLogin,
    getPanelRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
