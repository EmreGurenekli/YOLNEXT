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

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error
  logger.error('Error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500
    },
    request: {
      id: req.id,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    },
    timestamp: new Date().toISOString()
  });

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
      message: val.message
    }));
    const message = 'Validation failed';
    err = new ValidationError(message, errors);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new AuthenticationError(message);
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new AuthenticationError(message);
  }

  // PostgreSQL errors
  if (error.code === '23505') { // Unique violation
    const message = 'Resource already exists';
    err = new ConflictError(message);
  }

  if (error.code === '23503') { // Foreign key violation
    const message = 'Referenced resource not found';
    err = new ValidationError(message);
  }

  if (error.code === '23502') { // Not null violation
    const message = 'Required field is missing';
    err = new ValidationError(message);
  }

  // Default to 500 server error
  if (!err.statusCode) {
    err = new AppError('Internal server error', 500);
  }

  // Send error response
  const response = {
    success: false,
    message: err.message,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  // Add validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
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