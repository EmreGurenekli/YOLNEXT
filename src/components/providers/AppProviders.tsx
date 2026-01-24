import React, { ReactNode, useEffect } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { ToastProvider } from '../../contexts/ToastContext';
interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders - Combines all context providers to reduce nesting
 * This component wraps all providers in a single component for better organization
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  // Sentry removed from minimum stack

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};











