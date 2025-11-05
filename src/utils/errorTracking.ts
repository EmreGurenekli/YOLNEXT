/**
 * Error Tracking Utility
 * Centralized error logging and tracking
 */

interface ErrorInfo {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
  timestamp: string;
  url?: string;
  userAgent?: string;
}

class ErrorTracker {
  private isDevelopment: boolean;
  private sentryEnabled: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.sentryEnabled = !!import.meta.env.VITE_SENTRY_DSN;
    
    // Initialize Sentry if enabled
    if (this.sentryEnabled && !this.isDevelopment) {
      this.initSentry();
    }
  }

  private initSentry() {
    // Sentry will be initialized here when VITE_SENTRY_DSN is set
    // import('@sentry/react').then(Sentry => {
    //   Sentry.init({
    //     dsn: import.meta.env.VITE_SENTRY_DSN,
    //     environment: import.meta.env.MODE,
    //   });
    // });
    console.log('📊 Error tracking initialized (Sentry ready)');
  }

  /**
   * Log error to console and error tracking service
   */
  logError(error: Error | string, context?: Record<string, any>): void {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context: context || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Get user info from localStorage if available
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        errorInfo.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Log to console in development
    if (this.isDevelopment) {
      console.error('🚨 Error:', errorInfo);
    }

    // Send to Sentry in production
    if (this.sentryEnabled && !this.isDevelopment) {
      this.sendToSentry(errorInfo);
    }

    // Send to backend for logging
    this.sendToBackend(errorInfo);
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(errorInfo: ErrorInfo): void {
    // Sentry integration will be here
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(errorInfo.message), {
    //     extra: errorInfo.context,
    //     user: errorInfo.user,
    //   });
    // }
  }

  /**
   * Send error to backend for logging
   */
  private async sendToBackend(errorInfo: ErrorInfo): Promise<void> {
    try {
      const token = localStorage.getItem('authToken');
      
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(errorInfo),
      }).catch(() => {
        // Silently fail if backend is not available
      });
    } catch (e) {
      // Silently fail
    }
  }

  /**
   * Log warning
   */
  logWarning(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.warn('⚠️ Warning:', message, context);
    }
  }

  /**
   * Log info
   */
  logInfo(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log('ℹ️ Info:', message, context);
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Export convenience functions
export const logError = (error: Error | string, context?: Record<string, any>) => {
  errorTracker.logError(error, context);
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  errorTracker.logWarning(message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  errorTracker.logInfo(message, context);
};

