const logger = require('../utils/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Log the request
    logger.apiRequest(req, res, responseTime);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.apiError(req, error);
  next(error);
};

// Database query logging
const queryLogger = (query, duration, error = null) => {
  logger.database('query', query, duration, error);
};

module.exports = {
  requestLogger,
  errorLogger,
  queryLogger
};


