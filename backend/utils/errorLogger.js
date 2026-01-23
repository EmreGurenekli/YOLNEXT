/**
 * Error Logger Utility
 * 
 * Centralized error logging with optional Sentry integration.
 * Handles both production (Sentry) and development (console) logging.
 */

// Sentry - conditional import (only if DSN is provided)
let Sentry = null;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
  } catch (e) {
    // Sentry not available, continue without it
  }
}

/**
 * Centralized error logging utility
 * Handles both Sentry (production) and console logging
 */
class ErrorLogger {
  constructor() {
    this.isSentryEnabled = !!process.env.SENTRY_DSN;
  }

  /**
   * Log error to Sentry and console
   * @param {Error} error - Error object
   * @param {object} context - Additional context
   */
  logError(error, context = {}) {
    const errorMessage = error?.message || String(error);
    const stack = error?.stack || 'No stack trace';

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ ERROR:', {
        message: errorMessage,
        stack,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    // Sentry logging (if enabled)
    if (this.isSentryEnabled && Sentry) {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          environment: process.env.NODE_ENV || 'development',
          ...context,
        },
        extra: {
          context,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Log warning
   * @param {string} message - Warning message
   * @param {object} context - Additional context
   */
  logWarning(message, context = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ WARNING:', {
        message,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    if (this.isSentryEnabled && Sentry) {
      Sentry.captureMessage(message, {
        level: 'warning',
        tags: context,
      });
    }
  }

  /**
   * Log info
   * @param {string} message - Info message
   * @param {object} context - Additional context
   */
  logInfo(message, context = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ INFO:', {
        message,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Alias methods for convenience (error, warn, info)
   */
  error(messageOrError, context = {}) {
    if (messageOrError instanceof Error) {
      this.logError(messageOrError, context);
    } else {
      this.logError(new Error(String(messageOrError)), context);
    }
  }

  warn(message, context = {}) {
    this.logWarning(message, context);
  }

  info(message, context = {}) {
    this.logInfo(message, context);
  }

  /**
   * Log API error with request context
   * @param {Error} error - Error object
   * @param {object} req - Express request object
   * @param {object} additionalContext - Additional context
   */
  logApiError(error, req, additionalContext = {}) {
    const context = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || null,
      body: this.sanitizeRequestBody(req.body),
      query: req.query,
      ...additionalContext,
    };

    this.logError(error, context);
  }

  /**
   * Sanitize request body (remove sensitive data)
   * @param {object} body - Request body
   * @returns {object} Sanitized body
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return null;

    const sensitiveFields = [
      'password',
      'token',
      'creditCard',
      'cvv',
      'cardNumber',
      'authToken',
      'refreshToken',
    ];
    const sanitized = { ...body };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  /**
   * Log database error
   * @param {Error} error - Database error
   * @param {string} operation - Database operation
   * @param {object} context - Additional context
   */
  logDatabaseError(error, operation, context = {}) {
    this.logError(error, {
      type: 'database',
      operation,
      ...context,
    });
  }

  /**
   * Log authentication error
   * @param {Error} error - Authentication error
   * @param {object} context - Additional context
   */
  logAuthError(error, context = {}) {
    this.logError(error, {
      type: 'authentication',
      ...context,
    });
  }
}

// Export singleton instance
module.exports = new ErrorLogger();

