import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { createApiUrl } from '../config/api';
// Temporary workaround
const authAPI = {
  login: async (credentials: { email: string; password: string; userType?: string }) => {
    const response = await fetch(createApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },
  register: async (userData: RegisterUserData) => {
    // Map frontend camelCase fields to backend snake_case fields
    const backendUserData = {
      ...userData,
      first_name: userData.firstName,
      last_name: userData.lastName,
      user_type: userData.userType,
      company_name: userData.companyName,
      tax_number: userData.taxNumber,
      // Remove camelCase fields that backend doesn't understand
      firstName: undefined,
      lastName: undefined,
      userType: undefined,
      companyName: undefined,
      taxNumber: undefined,
    };
    
    const response = await fetch(createApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendUserData)
    });
    return response.json();
  },
  demoLogin: async (userType: string) => {
    const response = await fetch(createApiUrl('/api/auth/demo-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userType })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ success: false, message: 'Hızlı giriş başarısız' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  getProfile: async () => {
    const response = await fetch(createApiUrl('/api/users/profile'), {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}` }
    });
    return response.json();
  }
};
import { User } from '../types/auth';
<<<<<<< HEAD
// Socket.io removed - using REST API only
=======
import socketService from '../services/socket';
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

// Register user data interface
interface RegisterUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  userType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  companyName?: string;
  taxId?: string;
  [key: string]: unknown;
}

// API Response interface
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  user?: User;
  token?: string;
  error?: string;
}

// Error interface
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    userType?: string
  ) => Promise<{ success: boolean; user?: User }>;
  register: (
    userData: RegisterUserData
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
    throw new Error('useAuth bir AuthProvider içinde kullanılmalıdır');
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

  // isAuthenticated must be derived from hydrated state to avoid redirect loops
  // (localStorage may be populated before state is updated)
  const isAuthenticated = !!user && !!token;

  // Function to safely access localStorage
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {
        // Silently fail in production
      }
    },
    removeItem: (key: string): void => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (error) {
        // Silently fail in production
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken =
          safeLocalStorage.getItem('authToken') ||
          safeLocalStorage.getItem('token');
        const storedUser = safeLocalStorage.getItem('user');

        // Check if we have valid token and user data
        if (storedToken && storedToken !== 'null' && storedToken !== 'undefined' && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            if (parsedUser && storedToken) {
              const sanitizeDisplayName = (value: unknown) => {
                const s = String(value || '').trim();
                if (!s) return '';
                if (s.toLowerCase() === 'demo') return '';
                if (s.includes('Demo')) {
                  return s.replace(/\bDemo\b/gi, '').replace(/\s+/g, ' ').trim();
                }
                return s;
              };

              const storedIsQuickLogin = storedToken.startsWith('demo-token-');
              const originalFullName = parsedUser.fullName || parsedUser.full_name || parsedUser.name;
              const originalFirstName = parsedUser.firstName || parsedUser.first_name;
              const originalLastName = parsedUser.lastName || parsedUser.last_name;

              const hydratedFullName = sanitizeDisplayName(originalFullName);
              const hydratedFirstName = sanitizeDisplayName(originalFirstName);
              const hydratedLastName = sanitizeDisplayName(originalLastName);

              const shouldOverrideFullName = String(originalFullName || '').includes('Demo') || String(originalFullName || '').trim().toLowerCase() === 'demo';
              const shouldOverrideFirstName = String(originalFirstName || '').includes('Demo') || String(originalFirstName || '').trim().toLowerCase() === 'demo';
              const shouldOverrideLastName = String(originalLastName || '').includes('Demo') || String(originalLastName || '').trim().toLowerCase() === 'demo';

              // Handle potential case sensitivity issues with nakliyeciCode and driverCode
              const userWithFixedCase = {
                ...parsedUser,
                fullName: shouldOverrideFullName ? hydratedFullName : parsedUser.fullName,
                firstName: shouldOverrideFirstName ? hydratedFirstName : parsedUser.firstName,
                lastName: shouldOverrideLastName ? hydratedLastName : parsedUser.lastName,
                nakliyeciCode: parsedUser.nakliyeciCode || parsedUser.nakliyecicode || undefined,
                driverCode: parsedUser.driverCode || parsedUser.drivercode || undefined
              };

              // If this is a quick-login token and name fields are still empty/placeholder,
              // force a neutral display name to avoid "Demo" leaking into UI.
              if (storedIsQuickLogin) {
                const safeRole = parsedUser.role || parsedUser.panel_type || parsedUser.userType || parsedUser.user_type;
                const roleLabel =
                  safeRole === 'corporate'
                    ? 'Kurumsal'
                    : safeRole === 'nakliyeci'
                      ? 'Nakliyeci'
                      : safeRole === 'tasiyici'
                        ? 'Taşıyıcı'
                        : 'Bireysel';
                if (!sanitizeDisplayName(userWithFixedCase.firstName)) userWithFixedCase.firstName = 'Kullanıcı';
                if (!sanitizeDisplayName(userWithFixedCase.fullName)) userWithFixedCase.fullName = `${roleLabel} Kullanıcı`;
              }

              setUser(userWithFixedCase);
              setToken(storedToken);
              // Update localStorage with the corrected user data
              safeLocalStorage.setItem('user', JSON.stringify(userWithFixedCase));
              // Normalize token storage keys for legacy callers
              safeLocalStorage.setItem('authToken', storedToken);
              safeLocalStorage.setItem('token', storedToken);
              // isAuthenticated will be true now because we check localStorage
            }
          } catch (parseError) {
            // If parsing fails, clear storage
            safeLocalStorage.removeItem('authToken');
            safeLocalStorage.removeItem('token');
            safeLocalStorage.removeItem('user');
          }
        }
      } catch (error) {
        // Silently fail in production
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const onAuthLogout = () => {
      logout();
    };
    window.addEventListener('auth:logout', onAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', onAuthLogout);
    };
  }, []);

  const login = async (email: string, password: string, userType?: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password, userType });

      if (response.success || response.data?.success) {
        // Backend response format: { success: true, data: { user: {...}, token: "..." } }
        // OR: { success: true, message: "...", data: { user: {...}, token: "..." } }
        const apiResponse = response as ApiResponse<{ user: User; token: string }>;
        const userData = apiResponse.data?.user || apiResponse.user;
        const token = apiResponse.data?.token || apiResponse.token;

        if (!userData || !token) {
          throw new Error('Geçersiz yanıt formatı');
        }


        // Build fullName from firstName and lastName if not provided
        let fullName = userData.fullName;
        if (!fullName || fullName === 'Kullanıcı') {
          const firstName = userData.firstName || '';
          const lastName = userData.lastName || '';
          if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`.trim();
          } else if (firstName) {
            fullName = firstName;
          } else if (lastName) {
            fullName = lastName;
          } else {
            fullName = userData.fullName || 'Kullanıcı';
          }
        }
        
        const firstName = userData.firstName || userData.fullName?.split(' ')[0] || '';
        const lastName = userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || '';
        const role = userData.role || userData.panel_type || (userData as unknown as RegisterUserData).userType || 'individual';
        
        // If firstName/lastName are still empty, try to extract from fullName
        let finalFirstName = firstName;
        let finalLastName = lastName;
        if (!finalFirstName && !finalLastName && fullName && fullName !== 'Kullanıcı') {
          const nameParts = fullName.split(' ');
          if (nameParts.length >= 2) {
            finalFirstName = nameParts[0];
            finalLastName = nameParts.slice(1).join(' ');
          } else if (nameParts.length === 1) {
            finalFirstName = nameParts[0];
          }
        }
        
        // Create final user object with all required fields
        const finalUserData: User = {
          id: userData.id.toString(),
          fullName: fullName,
          email: userData.email,
          role: role,
          firstName: finalFirstName,
          lastName: finalLastName,
          phone: userData.phone,
          companyName: userData.companyName,
          nakliyeciCode: userData.nakliyeciCode || (userData as any).nakliyecicode || undefined,
          driverCode: userData.driverCode || (userData as any).drivercode || undefined,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        };
        

        safeLocalStorage.setItem('authToken', token);
        safeLocalStorage.setItem('token', token);
        safeLocalStorage.setItem('user', JSON.stringify(finalUserData));
        setUser(finalUserData);
        setToken(token);

        // Connect to Socket.IO (only if enabled)
        if (import.meta.env.VITE_ENABLE_SOCKET === 'true') {
<<<<<<< HEAD
          // Socket.io removed
=======
          socketService.connect();
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
        }

        return { success: true, user: userData };
      } else {
        throw new Error(
          response.data?.message || response.message || 'Giriş yapılamadı'
        );
      }
    } catch (error) {
      // Login error handled by error boundary
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.message || apiError.message || 'Giriş yapılamadı',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    userData: RegisterUserData
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);

      if (response.success || response.data?.success) {
        // Backend response format: { success: true, data: { user: {...}, token: "..." } }
        const responseData = response.data || response;
        const backendUserData = responseData.data?.user || responseData.user;
        const token = responseData.data?.token || responseData.token;


        if (!backendUserData || !token) {
          throw new Error('Geçersiz yanıt formatı');
        }
        
        // If backend doesn't return firstName/lastName, use the original userData
        if (!backendUserData.firstName && !backendUserData.lastName && userData.firstName && userData.lastName) {
          backendUserData.firstName = userData.firstName;
          backendUserData.lastName = userData.lastName;
        }

        // Build fullName from firstName and lastName if not provided
        // First try to use backend's fullName, then combine firstName+lastName, then fallback
        let fullName = backendUserData.fullName;
        if (!fullName || fullName === 'Kullanıcı') {
          const firstName = backendUserData.firstName || '';
          const lastName = backendUserData.lastName || '';
          if (firstName && lastName) {
            fullName = `${firstName} ${lastName}`.trim();
          } else if (firstName) {
            fullName = firstName;
          } else if (lastName) {
            fullName = lastName;
          } else {
            fullName = backendUserData.fullName || 'Kullanıcı';
          }
        }
        
        const firstName = backendUserData.firstName || backendUserData.fullName?.split(' ')[0] || '';
        const lastName = backendUserData.lastName || backendUserData.fullName?.split(' ').slice(1).join(' ') || '';
        const role = backendUserData.role || backendUserData.panel_type || (backendUserData as unknown as RegisterUserData).userType || 'individual';
        
        // Create final user object with all required fields
        const finalUserData: User = {
          id: backendUserData.id.toString(),
          fullName: fullName,
          email: backendUserData.email,
          role: role,
          firstName: firstName,
          lastName: lastName,
          phone: backendUserData.phone,
          companyName: backendUserData.companyName,
          nakliyeciCode: backendUserData.nakliyeciCode || (backendUserData as any).nakliyecicode || undefined,
          driverCode: backendUserData.driverCode || (backendUserData as any).drivercode || undefined,
          createdAt: backendUserData.createdAt || new Date().toISOString(),
          updatedAt: backendUserData.updatedAt || new Date().toISOString(),
        };
        
        // Save to localStorage and state
        safeLocalStorage.setItem('authToken', token);
        safeLocalStorage.setItem('user', JSON.stringify(finalUserData));
        setUser(finalUserData);
        setToken(token);

        // Connect to Socket.IO (only if enabled)
        if (import.meta.env.VITE_ENABLE_SOCKET === 'true') {
<<<<<<< HEAD
          // Socket.io removed
=======
          socketService.connect();
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
        }

        return { success: true, user: finalUserData };
      } else {
        throw new Error(
          response.data?.message || response.message || 'Kayıt işlemi başarısız'
        );
      }
    } catch (error) {
      // Register error handled by error boundary
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.message || apiError.message || 'Kayıt işlemi başarısız',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // No API call needed for logout
      // Debug trace removed for production
      // console.trace('Logout call stack');
    } catch (error) {
      // Logout error handled by error boundary
      // Silently fail in production
    } finally {
      // Clear local state and storage
      setUser(null);
      setToken(null);
      safeLocalStorage.removeItem('authToken');
      safeLocalStorage.removeItem('token');
      safeLocalStorage.removeItem('user');
      // Disconnect from Socket.IO
<<<<<<< HEAD
      // Socket.io removed
=======
      socketService.disconnect();
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      // Don't redirect automatically, let the ProtectedRoute handle it
      // window.location.href = '/login';
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...userData } : null;
      if (updated) {
        safeLocalStorage.setItem('user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const demoLogin = async (userType: string) => {
    try {
      setIsLoading(true);

      const response = await authAPI.demoLogin(userType);
      const apiResponse = response as ApiResponse<{ user: User; token: string }>;
      const rawUser: any = apiResponse.data?.user || apiResponse.user;
      const token = apiResponse.data?.token || apiResponse.token;

      if (!rawUser || !token) {
        throw new Error('Hızlı giriş başarısız');
      }

      const normalizedRole =
        (rawUser.role || rawUser.panel_type || rawUser.userType || rawUser.user_type || userType || 'individual') as User['role'];

      const roleLabels: Record<string, string> = {
        individual: 'Bireysel',
        corporate: 'Kurumsal',
        nakliyeci: 'Nakliyeci',
        tasiyici: 'Taşıyıcı',
      };
      const normalizedRoleLabel = roleLabels[String(normalizedRole)] || 'Kullanıcı';
      const candidateFullName = rawUser.fullName || rawUser.full_name || rawUser.name;
      const normalizedFullNameRaw = candidateFullName || `${normalizedRoleLabel} Kullanıcı`;
      const normalizedFullName =
        String(normalizedFullNameRaw).trim().toLowerCase() === 'demo'
          ? `${normalizedRoleLabel} Kullanıcı`
          : String(normalizedFullNameRaw).includes('Demo')
            ? String(normalizedFullNameRaw).replace(/\bDemo\b/gi, '').replace(/\s+/g, ' ').trim() || `${normalizedRoleLabel} Kullanıcı`
            : normalizedFullNameRaw;

      const normalizedUser: User = {
        ...rawUser,
        id: String(rawUser.id ?? rawUser.userId ?? rawUser.user_id ?? ''),
        role: normalizedRole,
        fullName: normalizedFullName,
        email: rawUser.email || `hizli.${normalizedRole}@yolnext.com`,
        firstName: rawUser.firstName || rawUser.first_name || 'Kullanıcı',
        lastName:
          rawUser.lastName || rawUser.last_name || String(normalizedFullName).split(' ').slice(1).join(' ') || normalizedRole,
      };

      safeLocalStorage.setItem('authToken', token);
      safeLocalStorage.setItem('token', token);
      safeLocalStorage.setItem('user', JSON.stringify(normalizedUser));
      setToken(token);
      setUser(normalizedUser);

      return { success: true, user: normalizedUser };
    } catch (error) {
      // Log error in development
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Hızlı giriş başarısız';
      if (import.meta.env.DEV) {
        console.error('Demo login error:', error);
      }
      return { 
        success: false, 
        error: errorMessage
      };
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
<<<<<<< HEAD
};
    login,
    register,
    logout,
    updateUser,
    demoLogin,
    getPanelRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
    login,
    register,
    logout,
    updateUser,
    demoLogin,
    getPanelRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
=======
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
};