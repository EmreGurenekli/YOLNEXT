const winston = require('winston');

// Analytics logger
const analyticsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/analytics.log' })
  ]
});

// User behavior tracking
const trackUserBehavior = (req, res, next) => {
  if (req.user) {
    analyticsLogger.info({
      type: 'user_behavior',
      userId: req.user.id,
      userType: req.user.user_type,
      action: req.method,
      endpoint: req.path,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
  }
  next();
};

// API usage analytics
const apiUsageAnalytics = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    analyticsLogger.info({
      type: 'api_usage',
      method: req.method,
      endpoint: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// Performance metrics
const performanceMetrics = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    analyticsLogger.info({
      type: 'performance',
      method: req.method,
      endpoint: req.path,
      duration: `${duration}ms`,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

// Error analytics
const errorAnalytics = (err, req, res, next) => {
  analyticsLogger.error({
    type: 'error',
    error: err.message,
    stack: err.stack,
    method: req.method,
    endpoint: req.path,
    userId: req.user ? req.user.id : null,
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Business metrics
const businessMetrics = (req, res, next) => {
  // İş metrikleri için özel endpoint'ler
  if (req.path.includes('/shipments') && req.method === 'POST') {
    analyticsLogger.info({
      type: 'business_metric',
      metric: 'shipment_created',
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.path.includes('/offers') && req.method === 'POST') {
    analyticsLogger.info({
      type: 'business_metric',
      metric: 'offer_created',
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  trackUserBehavior,
  apiUsageAnalytics,
  performanceMetrics,
  errorAnalytics,
  businessMetrics
};

