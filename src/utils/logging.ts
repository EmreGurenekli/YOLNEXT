/**
 * Production Logging Utility
 * 
 * Centralized logging with support for:
 * - Console logging (development)
 * - Sentry integration (production)
 * - Error tracking
 * - Performance monitoring
 */

interface LogLevel {
  DEBUG: string;
  INFO: string;
  WARN: string;
  ERROR: string;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private sentryEnabled: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.sentryEnabled = !!import.meta.env.VITE_SENTRY_DSN;
    
    // Initialize Sentry if available
    if (this.sentryEnabled && !this.isDevelopment) {
      this.initSentry();
    }
  }

  private async initSentry() {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    } catch (error) {
      console.warn('Sentry initialization failed:', error);
    }
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(this.formatMessage(LOG_LEVELS.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, context));
    } else if (this.sentryEnabled) {
      this.captureSentryMessage('warning', message, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = `${message}: ${errorMessage}`;

    if (this.isDevelopment) {
      console.error(this.formatMessage(LOG_LEVELS.ERROR, fullMessage, context));
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
      }
    } else if (this.sentryEnabled) {
      this.captureSentryError(error instanceof Error ? error : new Error(fullMessage), context);
    }
  }

  private async captureSentryMessage(level: string, message: string, context?: LogContext) {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureMessage(message, {
        level: level as Sentry.SeverityLevel,
        extra: context,
      });
    } catch (error) {
      // Sentry not available, ignore
    }
  }

  private async captureSentryError(error: Error, context?: LogContext) {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureException(error, {
        extra: context,
      });
    } catch (err) {
      // Sentry not available, ignore
    }
  }

  // Performance logging
  async measurePerformance(name: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      if (duration > 1000) {
        this.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`Performance error: ${name} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }

  // API call logging
  logApiCall(endpoint: string, method: string, status: number, duration: number) {
    if (status >= 500) {
      this.error(`API Error: ${method} ${endpoint}`, new Error(`Status: ${status}`), {
        endpoint,
        method,
        status,
        duration,
      });
    } else if (status >= 400) {
      this.warn(`API Warning: ${method} ${endpoint}`, {
        endpoint,
        method,
        status,
        duration,
      });
    } else if (duration > 2000) {
      this.warn(`Slow API: ${method} ${endpoint}`, {
        endpoint,
        method,
        status,
        duration,
      });
    }
  }

  // User action logging
  logUserAction(action: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.debug(`User action: ${action}`, context);
    }
    // In production, you might want to send this to analytics
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => 
  logger.error(message, error, context);

export default logger;

