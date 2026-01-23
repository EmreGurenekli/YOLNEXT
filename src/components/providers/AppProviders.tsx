import React, { ReactNode, useEffect } from 'react';
<<<<<<< HEAD
=======
import { Toaster } from 'react-hot-toast';
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { ToastProvider } from '../../contexts/ToastContext';
<<<<<<< HEAD
=======
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

>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders - Combines all context providers to reduce nesting
 * This component wraps all providers in a single component for better organization
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
<<<<<<< HEAD
  // Sentry removed from minimum stack
=======
  // Initialize Sentry error monitoring in production
  useEffect(() => {
    initSentry();
  }, []);
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

  return (
    <ThemeProvider>
      <AuthProvider>
<<<<<<< HEAD
        <NotificationProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NotificationProvider>
=======
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
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      </AuthProvider>
    </ThemeProvider>
  );
};
