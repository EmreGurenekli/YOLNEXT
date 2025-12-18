import React, { ReactNode, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { RealtimeProvider } from '../../contexts/RealtimeContext';
import { WebSocketProvider } from '../../contexts/WebSocketContext';
import { initSentry } from '../../config/sentry';

// Toast configuration
const toastConfig = {
  position: 'top-right' as const,
  duration: 4000,
  style: {
    background: '#363636',
    color: '#fff',
  },
  success: {
    duration: 3000,
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  },
  error: {
    duration: 4000,
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
};

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders - Combines all context providers to reduce nesting
 * This component wraps all providers in a single component for better organization
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Initialize Sentry error monitoring in production
  useEffect(() => {
    initSentry();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <SocketProvider>
            <RealtimeProvider>
              <NotificationProvider>
                <ToastProvider>
                  <Toaster {...toastConfig} />
                  {children}
                </ToastProvider>
              </NotificationProvider>
            </RealtimeProvider>
          </SocketProvider>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
