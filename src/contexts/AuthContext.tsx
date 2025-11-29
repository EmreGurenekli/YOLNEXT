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

  // isAuthenticated should check both state and localStorage
  const isAuthenticated = !!user || !!(typeof localStorage !== 'undefined' && localStorage.getItem('authToken') && localStorage.getItem('user'));

  // Function to safely access localStorage
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const value = window.localStorage.getItem(key);
          console.log(`localStorage.getItem('${key}') =`, value);
          return value;
        }
        return null;
      } catch (error) {
        console.error('localStorage getItem error:', error);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        console.log(`localStorage.setItem('${key}', '${value}')`);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error('localStorage setItem error:', error);
      }
    },
    removeItem: (key: string): void => {
      try {
        console.log(`localStorage.removeItem('${key}')`);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('localStorage removeItem error:', error);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Auth init started');
        const storedToken = safeLocalStorage.getItem('authToken');
        const storedUser = safeLocalStorage.getItem('user');
        
        console.log('Stored token:', storedToken);
        console.log('Stored user:', storedUser);

        // Check if we have valid token and user data
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('Parsed user:', parsedUser);
            
            if (parsedUser && storedToken) {
              setUser(parsedUser);
              setToken(storedToken);
              console.log('Auth state restored from localStorage');
              // isAuthenticated will be true now because we check localStorage
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
            // If parsing fails, clear storage
            safeLocalStorage.removeItem('authToken');
            safeLocalStorage.removeItem('user');
          }
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        // Auth initialization error
        console.error('Auth init error:', error);
      } finally {
        console.log('Auth init complete');
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('=== FRONTEND LOGIN ===');
      console.log('email:', email);
      const response = await authAPI.login({ email, password });
      console.log('Backend login response:', JSON.stringify(response, null, 2));

      if (response.success || response.data?.success) {
        // Backend response format: { success: true, data: { user: {...}, token: "..." } }
        // OR: { success: true, message: "...", data: { user: {...}, token: "..." } }
        const userData = (response.data as any)?.user || (response as any).user;
        const token = (response.data as any)?.token || (response as any).token;

        if (!userData || !token) {
          throw new Error('Invalid response format');
        }

        console.log('=== LOGIN USER DATA ===');
        console.log('userData:', JSON.stringify(userData, null, 2));
        console.log('userData.firstName:', userData.firstName);
        console.log('userData.lastName:', userData.lastName);
        console.log('userData.fullName:', userData.fullName);

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
            fullName = userData.name || 'Kullanıcı';
          }
        }
        
        const firstName = userData.firstName || userData.name?.split(' ')[0] || '';
        const lastName = userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '';
        const role = userData.role || userData.panel_type || userData.userType || 'individual';
        
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
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        };
        
        console.log('=== FINAL LOGIN USER DATA ===');
        console.log('finalUserData.fullName:', finalUserData.fullName);
        console.log('finalUserData.firstName:', finalUserData.firstName);
        console.log('finalUserData.lastName:', finalUserData.lastName);

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
      console.log('=== FRONTEND REGISTER ===');
      console.log('userData.firstName:', userData.firstName);
      console.log('userData.lastName:', userData.lastName);
      console.log('Full userData:', JSON.stringify(userData, null, 2));
      const response = await authAPI.register(userData);
      console.log('Backend response:', JSON.stringify(response, null, 2));

      if (response.success || response.data?.success) {
        // Backend response format: { success: true, data: { user: {...}, token: "..." } }
        const responseData = response.data || response;
        const backendUserData = responseData.data?.user || responseData.user;
        const token = responseData.data?.token || responseData.token;

        console.log('=== BACKEND USER DATA ===');
        console.log('backendUserData:', JSON.stringify(backendUserData, null, 2));
        console.log('backendUserData.firstName:', backendUserData?.firstName);
        console.log('backendUserData.lastName:', backendUserData?.lastName);
        console.log('backendUserData.fullName:', backendUserData?.fullName);

        if (!backendUserData || !token) {
          throw new Error('Invalid response format');
        }
        
        // If backend doesn't return firstName/lastName, use the original userData
        if (!backendUserData.firstName && !backendUserData.lastName && userData.firstName && userData.lastName) {
          console.log('Backend missing firstName/lastName, using original userData');
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
            fullName = backendUserData.name || 'Kullanıcı';
          }
        }
        
        const firstName = backendUserData.firstName || backendUserData.name?.split(' ')[0] || '';
        const lastName = backendUserData.lastName || backendUserData.name?.split(' ').slice(1).join(' ') || '';
        const role = backendUserData.role || backendUserData.panel_type || backendUserData.userType || 'individual';
        
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
      console.log('Logout function called');
      // Print stack trace to see where it's called from
      console.trace('Logout call stack');
    } catch (error) {
      // Logout error handled by error boundary
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      console.log('Logging out - clearing auth state');
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
    setUser(prev => (prev ? { ...prev, ...userData } : null));
  };

  const demoLogin = async (userType: string) => {
    try {
      setIsLoading(true);
      console.log('Demo login started for userType:', userType);

      // Use fixed demo user IDs for consistency across sessions
      const demoUserIds: Record<string, string> = {
        individual: 'individual-1001',
        corporate: 'corporate-1002',
        nakliyeci: 'nakliyeci-1003',
        tasiyici: 'tasiyici-1004',
      };
      
      // Get or create fixed demo user ID
      const fallbackId = `${userType}-${Date.now() % 100000}`;
      const demoUserId = demoUserIds[userType] || fallbackId;
      const mockToken = `demo-token-${demoUserId}`;
      const mockUser: User = {
        id: `demo-${demoUserId}`,
        fullName: `${userType.charAt(0).toUpperCase() + userType.slice(1)} Demo User`,
        email: `demo@${userType}.com`,
        role: userType as 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici',
        firstName: 'Demo',
        lastName: userType.charAt(0).toUpperCase() + userType.slice(1),
        phone: '05001112233',
        address: 'Demo Address',
        companyName: userType === 'corporate' ? 'Demo Company' : undefined,
        taxNumber: userType === 'corporate' ? '1234567890' : undefined,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Storing auth data to localStorage');
      // Store in localStorage
      safeLocalStorage.setItem('authToken', mockToken);
      safeLocalStorage.setItem('user', JSON.stringify(mockUser));
      
      // Verify storage
      console.log('Stored token:', safeLocalStorage.getItem('authToken'));
      console.log('Stored user:', safeLocalStorage.getItem('user'));
      
      // Update state
      setToken(mockToken);
      setUser(mockUser);
      
      console.log('Demo login completed successfully');

      return { success: true, user: mockUser };
    } catch (error: any) {
      console.error('Demo login error:', error);
      return { 
        success: false, 
        error: error?.message || 'Demo login failed'
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