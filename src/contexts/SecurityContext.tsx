import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authAPI, userAPI } from '../services/api';
import { LoginCredentials, SecurityLog, PasswordStrength } from '../types/auth';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: string;
  companyName?: string;
  phone?: string;
  address?: string;
}

interface SecurityContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  enable2FA: () => Promise<void>;
  disable2FA: () => Promise<void>;
  verify2FA: (code: string) => Promise<boolean>;
  getSecurityLogs: () => Promise<SecurityLog[]>;
  reportSuspiciousActivity: (activity: string) => Promise<void>;
  isPasswordStrong: (password: string) => boolean;
  getPasswordStrength: (password: string) => PasswordStrength;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  panel_type: string;
  company_name?: string;
  location?: string;
  phone?: string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Skip verification for demo tokens
      if (token && token.startsWith('demo-jwt-token-')) {
        console.log('🔐 Demo token detected, skipping verification');
        setIsAuthenticated(true);
        return;
      }

      const response = await userAPI.getProfile();
      setUser(response.data.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token verification failed:', error);

      // Don't remove demo tokens
      const token = localStorage.getItem('authToken');
      if (token && token.startsWith('demo-jwt-token-')) {
        console.log('🔐 Demo token verification failed, but keeping token');
        setIsAuthenticated(true);
        return;
      }

      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      // Input validation
      if (!credentials.email || !credentials.password) {
        throw new Error('Email ve şifre gereklidir');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error('Geçerli bir email adresi giriniz');
      }

      const response = await authAPI.login(credentials);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.data);
      setIsAuthenticated(true);

      // Log security event
      await logSecurityEvent('login', 'User logged in successfully');
    } catch (error) {
      // Log failed login attempt
      await logSecurityEvent('failed_login', 'Failed login attempt', 'high');
      throw error;
    }
  };

  const logout = () => {
    console.log('SecurityContext logout function called - DISABLED');
    // localStorage.removeItem('authToken');
    // setUser(null);
    // setIsAuthenticated(false);
    // logSecurityEvent('logout', 'User logged out');
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.data);
      setIsAuthenticated(true);

      // Log security event
      await logSecurityEvent('register', 'New user registered');
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    try {
      // Validate password strength
      const strength = getPasswordStrength(newPassword);
      if (strength.strength === 'weak') {
        throw new Error('Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log security event
      await logSecurityEvent(
        'password_change',
        'Password updated successfully'
      );
    } catch (error) {
      await logSecurityEvent(
        'password_change_failed',
        'Failed to update password',
        'medium'
      );
      throw error;
    }
  };

  const enable2FA = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log security event
      await logSecurityEvent(
        '2fa_enabled',
        'Two-factor authentication enabled'
      );
    } catch (error) {
      throw error;
    }
  };

  const disable2FA = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log security event
      await logSecurityEvent(
        '2fa_disabled',
        'Two-factor authentication disabled'
      );
    } catch (error) {
      throw error;
    }
  };

  const verify2FA = async (code: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log security event
      await logSecurityEvent(
        '2fa_verified',
        'Two-factor authentication verified'
      );
      return true;
    } catch (error) {
      await logSecurityEvent(
        '2fa_failed',
        'Two-factor authentication failed',
        'high'
      );
      return false;
    }
  };

  const getSecurityLogs = async (): Promise<SecurityLog[]> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock security logs
      return [
        {
          id: '1',
          userId: '1',
          action: 'login',
          ipAddress: '192.168.1.1',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date().toISOString(),
          success: true,
          riskLevel: 'low',
          details: 'Successful login from trusted device',
        },
        {
          id: '2',
          userId: '1',
          action: 'password_change',
          ipAddress: '192.168.1.1',
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          success: true,
          riskLevel: 'low',
          details: 'Password updated successfully',
        },
        {
          id: '3',
          userId: '1',
          action: 'failed_login',
          ipAddress: '203.0.113.1',
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          success: false,
          riskLevel: 'high',
          details: 'Failed login attempt from unknown device',
        },
      ];
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
      return [];
    }
  };

  const reportSuspiciousActivity = async (activity: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Log security event
      await logSecurityEvent(
        'suspicious_activity',
        `User reported: ${activity}`,
        'high'
      );
    } catch (error) {
      console.error('Failed to report suspicious activity:', error);
    }
  };

  const isPasswordStrong = (password: string): boolean => {
    const strength = getPasswordStrength(password);
    return strength.strength === 'strong';
  };

  const getPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('En az 8 karakter olmalı');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir büyük harf içermeli');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir küçük harf içermeli');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir rakam içermeli');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir özel karakter içermeli');
    }

    // Length bonus
    if (password.length >= 12) {
      score += 1;
    }

    let strength: 'weak' | 'medium' | 'strong';
    if (score <= 2) {
      strength = 'weak';
    } else if (score <= 3) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return { score, feedback, isStrong: strength === 'strong', strength };
  };

  const logSecurityEvent = async (
    action: string,
    details: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Security event logged:', { action, details, riskLevel });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const value: SecurityContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    register,
    updatePassword,
    enable2FA,
    disable2FA,
    verify2FA,
    getSecurityLogs,
    reportSuspiciousActivity,
    isPasswordStrong,
    getPasswordStrength,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export default SecurityContext;
