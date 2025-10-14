const { logger } = require('../utils/logger');

// Performance Monitoring
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log performance metrics
    logger.info(`Performance: ${req.method} ${req.path} - ${statusCode} - ${duration}ms - IP: ${req.ip}`);
    
    // Alert for slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Alert for high error rates
    if (statusCode >= 400) {
      logger.error(`Error response: ${req.method} ${req.path} - ${statusCode} - ${duration}ms`);
    }
  });
  
  next();
};

// Security Event Monitoring
const securityMonitoring = (req, res, next) => {
  // Monitor suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /admin/i, // Admin access attempts
    /wp-admin/i, // WordPress attacks
    /phpmyadmin/i, // phpMyAdmin attacks
    /\.env/i, // Environment file access
    /config/i, // Config file access
    /backup/i, // Backup file access
    /\.sql/i, // SQL file access
    /\.log/i, // Log file access
  ];
  
  const checkSuspiciousActivity = (url, body, query) => {
    const content = `${url} ${JSON.stringify(body)} ${JSON.stringify(query)}`.toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        logger.warn(`Suspicious activity detected: ${pattern} - IP: ${req.ip} - URL: ${url}`);
        return true;
      }
    }
    return false;
  };
  
  if (checkSuspiciousActivity(req.path, req.body, req.query)) {
    // Log security event
    logger.error(`Security event: Suspicious activity from IP: ${req.ip} - Path: ${req.path}`);
    
    // Optionally block the request
    // return res.status(403).json({ success: false, message: 'Suspicious activity detected' });
  }
  
  next();
};

// API Usage Monitoring
const apiUsageMonitoring = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || 'anonymous';
  const endpoint = `${req.method} ${req.path}`;
  
  // Log API usage
  logger.info(`API Usage: ${endpoint} - Key: ${apiKey} - IP: ${req.ip}`);
  
  // Track endpoint popularity
  const endpointStats = {
    endpoint,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    apiKey: apiKey !== 'anonymous' ? 'authenticated' : 'anonymous'
  };
  
  // Store in database or send to analytics service
  // This would typically go to a monitoring service like DataDog, New Relic, etc.
  
  next();
};

// Error Tracking
const errorTracking = (err, req, res, next) => {
  // Log error details
  logger.error(`Error: ${err.message} - Stack: ${err.stack} - IP: ${req.ip} - Path: ${req.path}`);
  
  // Track error metrics
  const errorStats = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    statusCode: err.statusCode || 500
  };
  
  // Send to error tracking service (Sentry, Bugsnag, etc.)
  // This would typically integrate with a service like Sentry
  
  // Don't expose sensitive information in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Sunucu hatası',
    ...(isDevelopment && { stack: err.stack })
  });
};

// Uptime Monitoring
const uptimeMonitoring = (req, res, next) => {
  if (req.path === '/health') {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};

// Database Health Monitoring
const databaseHealthMonitoring = async (req, res, next) => {
  if (req.path === '/health/db') {
    try {
      const { sequelize } = require('../config/database');
      await sequelize.authenticate();
      
      res.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Database health check failed: ${error.message}`);
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    return;
  }
  
  next();
};

// Request Logging
const requestLogging = (req, res, next) => {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    headers: {
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length'),
      'referer': req.get('Referer'),
      'origin': req.get('Origin')
    }
  };
  
  logger.info('Request:', logData);
  next();
};

module.exports = {
  performanceMonitoring,
  securityMonitoring,
  apiUsageMonitoring,
  errorTracking,
  uptimeMonitoring,
  databaseHealthMonitoring,
  requestLogging
};

