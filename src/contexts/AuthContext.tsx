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
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch(createApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },
  register: async (userData: RegisterUserData) => {
    const response = await fetch(createApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  demoLogin: async (userType: string) => {
    const response = await fetch(createApiUrl('/api/auth/demo-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userType })
    });
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
import socketService from '../services/socket';

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
    password: string
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

  // isAuthenticated should check both state and localStorage
  const isAuthenticated = !!user || !!(typeof localStorage !== 'undefined' && localStorage.getItem('authToken') && localStorage.getItem('user'));

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
        const storedToken = safeLocalStorage.getItem('authToken');
        const storedUser = safeLocalStorage.getItem('user');

        // Check if we have valid token and user data
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            if (parsedUser && storedToken) {
              // Handle potential case sensitivity issues with nakliyeciCode and driverCode
              const userWithFixedCase = {
                ...parsedUser,
                nakliyeciCode: parsedUser.nakliyeciCode || parsedUser.nakliyecicode || undefined,
                driverCode: parsedUser.driverCode || parsedUser.drivercode || undefined
              };
              setUser(userWithFixedCase);
              setToken(storedToken);
              // Update localStorage with the corrected user data
              safeLocalStorage.setItem('user', JSON.stringify(userWithFixedCase));
              // isAuthenticated will be true now because we check localStorage
            }
          } catch (parseError) {
            // If parsing fails, clear storage
            safeLocalStorage.removeItem('authToken');
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

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });

      if (response.success || response.data?.success) {
        // Backend response format: { success: true, data: { user: {...}, token: "..." } }
        // OR: { success: true, message: "...", data: { user: {...}, token: "..." } }
        const apiResponse = response as ApiResponse<{ user: User; token: string }>;
        const userData = apiResponse.data?.user || apiResponse.user;
        const token = apiResponse.data?.token || apiResponse.token;

        if (!userData || !token) {
          throw new Error('Invalid response format');
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
        safeLocalStorage.setItem('user', JSON.stringify(finalUserData));
        setUser(finalUserData);
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
    } catch (error) {
      // Login error handled by error boundary
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.message || apiError.message || 'Login failed',
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
          throw new Error('Invalid response format');
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
          socketService.connect();
        }

        return { success: true, user: finalUserData };
      } else {
        throw new Error(
          response.data?.message || response.message || 'Registration failed'
        );
      }
    } catch (error) {
      // Register error handled by error boundary
      const apiError = error as ApiError;
      return {
        success: false,
        error: apiError.response?.data?.message || apiError.message || 'Registration failed',
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
      safeLocalStorage.removeItem('user');
      // Disconnect from Socket.IO
      socketService.disconnect();
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

      // Use fixed demo user IDs that match database IDs (1001, 1002, 1003, 1004)
      const demoUserIds: Record<string, number> = {
        individual: 1001,
        corporate: 1002,
        nakliyeci: 1003,
        tasiyici: 1004,
      };
      
      const demoUserId = demoUserIds[userType] || 1001;
      // Token format: demo-token-{role}-{id} (e.g., demo-token-individual-1001)
      const mockToken = `demo-token-${userType}-${demoUserId}`;
      const mockUser: User = {
        id: demoUserId.toString(),
        fullName: `${userType.charAt(0).toUpperCase() + userType.slice(1)} Demo User`,
        email: `demo@${userType}.com`,
        role: userType as 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici',
        firstName: 'Demo',
        lastName: userType.charAt(0).toUpperCase() + userType.slice(1),
        phone: '05001112233',
        address: 'Demo Address',
        companyName: userType === 'corporate' ? 'Demo A.Ş.' : userType === 'nakliyeci' ? 'Demo Nakliyat A.Ş.' : undefined,
        taxNumber: userType === 'corporate' ? '1234567890' : userType === 'nakliyeci' ? '0987654321' : undefined,
        nakliyeciCode: userType === 'nakliyeci' ? 'YN-10003' : undefined, // Demo nakliyeci için sabit kod
        driverCode: userType === 'tasiyici' ? 'YD-01004' : undefined, // Demo taşıyıcı için sabit kod
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in localStorage
      safeLocalStorage.setItem('authToken', mockToken);
      safeLocalStorage.setItem('user', JSON.stringify(mockUser));
      
      // Verify storage
      
      // Update state
      setToken(mockToken);
      setUser(mockUser);
      

      return { success: true, user: mockUser };
    } catch (error) {
      // Silently fail in production
      const apiError = error as ApiError;
      return { 
        success: false, 
        error: apiError.message || 'Demo login failed'
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
};