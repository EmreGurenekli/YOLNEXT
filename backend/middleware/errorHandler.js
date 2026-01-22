const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error') {
    super(message, 502);
    this.name = 'ExternalServiceError';
  }
}

// Enhanced error handling middleware with better context
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Generate unique request ID if not present
  const requestId = req.id || req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;

  // Enhanced error logging with more context
  const errorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
      type: error.type || 'Unknown',
      code: error.code
    },
    request: {
      id: requestId,
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    },
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      userType: req.user.userType
    } : null,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };

  // Log error with structured format
  logger.error('Error occurred', errorContext);

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Invalid ID format';
    err = new ValidationError(message);
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    err = new ConflictError(message);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    const message = 'Validation failed';
    err = new ValidationError(message, errors);
  }

  // JWT errors with enhanced messages
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    err = new AuthenticationError(message);
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    err = new AuthenticationError(message);
  }

  // PostgreSQL errors with enhanced handling
  if (error.code?.startsWith('23')) { // Integrity constraint violations
    const constraintMessages = {
      '23505': 'Resource already exists',
      '23503': 'Referenced resource not found',
      '23502': 'Required field is missing',
      '23514': 'Check constraint violation'
    };
    const message = constraintMessages[error.code] || 'Data integrity violation';
    err = new ValidationError(message);
  }

  // Database connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    const message = 'Database connection failed';
    err = new DatabaseError(message);
  }

  // Rate limiting errors
  if (error.status === 429 || error.statusCode === 429) {
    const message = error.message || 'Too many requests';
    err = new RateLimitError(message);
  }

  // Default to 500 server error
  if (!err.statusCode) {
    err = new AppError('Internal server error', 500);
  }

  // Build standardized error response
  const response = {
    success: false,
    error: {
      type: err.name || 'InternalServerError',
      message: err.message,
      code: error.code || 'INTERNAL_ERROR',
      requestId: requestId,
      timestamp: new Date().toISOString()
    }
  };

  // Add validation errors if present
  if (err.errors) {
    response.error.details = err.errors;
  }

  // Add rate limit information if available
  if (err.name === 'RateLimitError') {
    response.error.details = {
      resetTime: error.resetTime,
      limit: error.limit,
      remaining: error.remaining
    };
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
    response.error.debug = {
      originalError: error,
      requestDetails: {
        body: req.body,
        query: req.query,
        params: req.params
      }
    };
  }

  // Set appropriate headers
  res.set({
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    'X-Error-Type': err.name || 'InternalServerError',
    'X-Error-Code': error.code || 'INTERNAL_ERROR',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });

  // Send error response
  res.status(err.statusCode).json(response);
};

// Enhanced async error wrapper with better error tracking
const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Add request ID for tracking
    req.id = req.id || req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    Promise.resolve(fn(req, res, next))
      .catch(error => {
        // Add context to the error
        error.requestId = req.id;
        error.method = req.method;
        error.url = req.url;
        next(error);
      });
  };
};

// Enhanced 404 handler with better logging
const notFoundHandler = (req, res, next) => {
  const requestId = req.id || req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  
  logger.warn('Route not found', {
    request: {
      id: requestId,
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    },
    timestamp: new Date().toISOString()
  });
  
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  error.requestId = requestId;
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};