const winston = require('winston');
const { performance } = require('perf_hooks');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Database health monitoring
const databaseHealthMonitoring = (req, res, next) => {
  const startTime = performance.now();
  
  req.dbStartTime = startTime;
  
  res.on('finish', () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 1000) { // 1 saniyeden uzun süren istekler
      logger.warn(`Slow database query detected: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Request logging
const requestLogging = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info({
      method: req.method,
      url: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Error monitoring
const errorMonitoring = (err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(err);
};

// Performance metrics
const performanceMetrics = (req, res, next) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Performance metrics'i logla
    logger.info({
      type: 'performance',
      method: req.method,
      url: req.path,
      duration: `${duration}ms`,
      status: res.statusCode
    });
  });
  
  next();
};

module.exports = {
  logger,
  databaseHealthMonitoring,
  requestLogging,
  errorMonitoring,
  performanceMetrics
};

