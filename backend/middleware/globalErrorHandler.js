const errorLogger = require('../utils/errorLogger');

class GlobalErrorHandler {
  constructor() {
    this.errorTypes = {
      VALIDATION_ERROR: 'ValidationError',
      AUTHENTICATION_ERROR: 'AuthenticationError',
      AUTHORIZATION_ERROR: 'AuthorizationError',
      NOT_FOUND_ERROR: 'NotFoundError',
      CONFLICT_ERROR: 'ConflictError',
      RATE_LIMIT_ERROR: 'RateLimitError',
      DATABASE_ERROR: 'DatabaseError',
      EXTERNAL_SERVICE_ERROR: 'ExternalServiceError',
      INTERNAL_SERVER_ERROR: 'InternalServerError'
    };

    this.errorStatusCodes = {
      [this.errorTypes.VALIDATION_ERROR]: 400,
      [this.errorTypes.AUTHENTICATION_ERROR]: 401,
      [this.errorTypes.AUTHORIZATION_ERROR]: 403,
      [this.errorTypes.NOT_FOUND_ERROR]: 404,
      [this.errorTypes.CONFLICT_ERROR]: 409,
      [this.errorTypes.RATE_LIMIT_ERROR]: 429,
      [this.errorTypes.DATABASE_ERROR]: 500,
      [this.errorTypes.EXTERNAL_SERVICE_ERROR]: 502,
      [this.errorTypes.INTERNAL_SERVER_ERROR]: 500
    };
  }

  // Create standardized error response
  createError(type, message, details = null, code = null) {
    const error = new Error(message);
    error.type = type;
    error.details = details;
    error.code = code;
    error.statusCode = this.errorStatusCodes[type] || 500;
    return error;
  }

  // Handle validation errors
  handleValidationError(error) {
    if (error.name === 'ValidationError' || error.type === this.errorTypes.VALIDATION_ERROR) {
      return {
        success: false,
        error: {
          type: this.errorTypes.VALIDATION_ERROR,
          message: error.message || 'Validation failed',
          details: error.details || error.errors || [],
          code: error.code || 'VALIDATION_ERROR',
          statusCode: 400
        }
      };
    }
    return null;
  }

  // Handle authentication errors
  handleAuthError(error) {
    if (error.name === 'JsonWebTokenError' || error.type === this.errorTypes.AUTHENTICATION_ERROR) {
      return {
        success: false,
        error: {
          type: this.errorTypes.AUTHENTICATION_ERROR,
          message: 'Authentication required',
          details: null,
          code: 'AUTH_REQUIRED',
          statusCode: 401
        }
      };
    }

    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: {
          type: this.errorTypes.AUTHENTICATION_ERROR,
          message: 'Token expired',
          details: null,
          code: 'TOKEN_EXPIRED',
          statusCode: 401
        }
      };
    }

    return null;
  }

  // Handle authorization errors
  handleAuthzError(error) {
    if (error.type === this.errorTypes.AUTHORIZATION_ERROR) {
      return {
        success: false,
        error: {
          type: this.errorTypes.AUTHORIZATION_ERROR,
          message: error.message || 'Access denied',
          details: error.details || null,
          code: error.code || 'ACCESS_DENIED',
          statusCode: 403
        }
      };
    }
    return null;
  }

  // Handle database errors
  handleDatabaseError(error) {
    if (error.code?.startsWith('23')) { // PostgreSQL integrity constraint violation
      return {
        success: false,
        error: {
          type: this.errorTypes.VALIDATION_ERROR,
          message: 'Data integrity violation',
          details: {
            constraint: error.constraint,
            detail: error.detail
          },
          code: 'INTEGRITY_VIOLATION',
          statusCode: 400
        }
      };
    }

    if (error.code?.startsWith('28')) { // PostgreSQL authentication error
      return {
        success: false,
        error: {
          type: this.errorTypes.DATABASE_ERROR,
          message: 'Database authentication failed',
          details: null,
          code: 'DB_AUTH_ERROR',
          statusCode: 500
        }
      };
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        error: {
          type: this.errorTypes.DATABASE_ERROR,
          message: 'Database connection failed',
          details: null,
          code: 'DB_CONNECTION_ERROR',
          statusCode: 503
        }
      };
    }

    return null;
  }

  // Handle rate limiting errors
  handleRateLimitError(error) {
    if (error.type === this.errorTypes.RATE_LIMIT_ERROR) {
      return {
        success: false,
        error: {
          type: this.errorTypes.RATE_LIMIT_ERROR,
          message: error.message || 'Too many requests',
          details: {
            resetTime: error.resetTime,
            limit: error.limit,
            remaining: error.remaining
          },
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429
        }
      };
    }
    return null;
  }

  // Handle external service errors
  handleExternalServiceError(error) {
    if (error.type === this.errorTypes.EXTERNAL_SERVICE_ERROR) {
      return {
        success: false,
        error: {
          type: this.errorTypes.EXTERNAL_SERVICE_ERROR,
          message: error.message || 'External service unavailable',
          details: {
            service: error.service,
            endpoint: error.endpoint
          },
          code: error.code || 'EXTERNAL_SERVICE_ERROR',
          statusCode: 502
        }
      };
    }
    return null;
  }

  // Handle generic errors
  handleGenericError(error) {
    // Check if it's a known error type
    const knownErrorHandlers = [
      this.handleValidationError,
      this.handleAuthError,
      this.handleAuthzError,
      this.handleDatabaseError,
      this.handleRateLimitError,
      this.handleExternalServiceError
    ];

    for (const handler of knownErrorHandlers) {
      const result = handler(error);
      if (result) return result;
    }

    // Default error handling
    const statusCode = error.statusCode || error.status || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      success: false,
      error: {
        type: this.errorTypes.INTERNAL_SERVER_ERROR,
        message: isDevelopment ? error.message : 'Internal server error',
        details: isDevelopment ? {
          stack: error.stack,
          name: error.name
        } : null,
        code: error.code || 'INTERNAL_ERROR',
        statusCode
      }
    };
  }

  // Log error with context
  logError(error, req = null) {
    const errorContext = {
      message: error.message,
      stack: error.stack,
      type: error.type || 'Unknown',
      code: error.code,
      timestamp: new Date().toISOString(),
      requestId: req?.headers['x-request-id'],
      userId: req?.user?.id,
      ip: req?.ip,
      userAgent: req?.headers['user-agent'],
      method: req?.method,
      url: req?.url,
      body: req?.body,
      query: req?.query
    };

    // Log to error logger
    errorLogger.log(errorContext);

    // In development, also log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error:', errorContext);
    }
  }

  // Create error response middleware
  createMiddleware() {
    return (error, req, res, next) => {
      // Don't handle headers already sent
      if (res.headersSent) {
        return next(error);
      }

      // Log the error
      this.logError(error, req);

      // Handle the error
      const errorResponse = this.handleGenericError(error);

      // Set appropriate headers
      res.set({
        'Content-Type': 'application/json',
        'X-Request-ID': req.headers['x-request-id'] || 'unknown',
        'X-Error-Type': errorResponse.error.type,
        'X-Error-Code': errorResponse.error.code
      });

      // Send error response
      res.status(errorResponse.error.statusCode).json(errorResponse);
    };
  }

  // Create async error wrapper
  asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Create route-specific error handler
  createRouteErrorHandler(routeName) {
    return (error, req, res, next) => {
      error.route = routeName;
      this.createMiddleware()(error, req, res, next);
    };
  }
}

module.exports = GlobalErrorHandler;
