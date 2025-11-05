const Sentry = require('@sentry/node');

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
   */
  logError(error, context = {}) {
    const errorMessage = error.message || String(error);
    const stack = error.stack || 'No stack trace';

    // Console logging (always)
    console.error('❌ ERROR:', {
      message: errorMessage,
      stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Sentry logging (if enabled)
    if (this.isSentryEnabled) {
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
   */
  logWarning(message, context = {}) {
    console.warn('⚠️ WARNING:', { message, context, timestamp: new Date().toISOString() });

    if (this.isSentryEnabled) {
      Sentry.captureMessage(message, {
        level: 'warning',
        tags: context,
      });
    }
  }

  /**
   * Log info
   */
  logInfo(message, context = {}) {
    console.log('ℹ️ INFO:', { message, context, timestamp: new Date().toISOString() });
  }

  /**
   * Log API error with request context
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
   */
  sanitizeRequestBody(body) {
    if (!body) return null;

    const sensitiveFields = ['password', 'token', 'creditCard', 'cvv', 'cardNumber'];
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
   */
  logDatabaseError(error, query = null, params = null) {
    const context = {
      type: 'database_error',
      query: query ? query.substring(0, 200) : null, // Truncate long queries
      params: params ? JSON.stringify(params).substring(0, 200) : null,
    };

    this.logError(error, context);
  }

  /**
   * Log payment error (sensitive)
   */
  logPaymentError(error, paymentContext = {}) {
    const sanitizedContext = {
      ...paymentContext,
      cardNumber: paymentContext.cardNumber ? '***REDACTED***' : null,
      cvv: paymentContext.cvv ? '***REDACTED***' : null,
      token: paymentContext.token ? '***REDACTED***' : null,
    };

    this.logError(error, { type: 'payment_error', ...sanitizedContext });
  }

  /**
   * Log authentication error
   */
  logAuthError(error, authContext = {}) {
    const sanitizedContext = {
      ...authContext,
      password: authContext.password ? '***REDACTED***' : null,
      token: authContext.token ? '***REDACTED***' : null,
    };

    this.logError(error, { type: 'auth_error', ...sanitizedContext });
  }

  /**
   * Set user context for Sentry
   */
  setUserContext(user) {
    if (this.isSentryEnabled && user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    }
  }

  /**
   * Clear user context
   */
  clearUserContext() {
    if (this.isSentryEnabled) {
      Sentry.setUser(null);
    }
  }
}

module.exports = new ErrorLogger();

