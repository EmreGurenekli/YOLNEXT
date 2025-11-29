#!/usr/bin/env node

/**
 * Production Logging Utility
 * 
 * Structured logging for production environment
 * Supports file logging, console logging, and external services
 */

const fs = require('fs');
const path = require('path');

class ProductionLogger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.logToFile = options.logToFile !== false && process.env.LOG_TO_FILE === 'true';
    this.logFilePath = options.logFilePath || process.env.LOG_FILE_PATH || './logs/app.log';
    this.enableConsole = options.enableConsole !== false;
    
    // Create logs directory if it doesn't exist
    if (this.logToFile) {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
    
    // Log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }
  
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }
  
  formatLog(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...metadata,
    };
    
    return JSON.stringify(logEntry);
  }
  
  writeToFile(logEntry) {
    if (this.logToFile) {
      try {
        fs.appendFileSync(this.logFilePath, logEntry + '\n', 'utf8');
      } catch (error) {
        // Fallback to console if file write fails
        console.error('Failed to write to log file:', error.message);
        console.error(logEntry);
      }
    }
  }
  
  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const logEntry = this.formatLog(level, message, metadata);
    
    // Console output
    if (this.enableConsole) {
      const colors = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        debug: '\x1b[90m',
        reset: '\x1b[0m',
      };
      
      const color = colors[level] || colors.reset;
      console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`, metadata);
    }
    
    // File output
    this.writeToFile(logEntry);
    
    // External service integration (Sentry, LogRocket, etc.)
    // This can be extended to send logs to external services
    if (level === 'error' && process.env.SENTRY_DSN) {
      // Example: Send to Sentry
      // Sentry.captureException(new Error(message), { extra: metadata });
    }
  }
  
  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }
  
  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }
  
  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }
  
  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }
  
  // Request logging middleware
  requestLogger(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };
      
      if (res.statusCode >= 500) {
        this.error('Request failed', logData);
      } else if (res.statusCode >= 400) {
        this.warn('Request error', logData);
      } else {
        this.info('Request completed', logData);
      }
    });
    
    next();
  }
}

// Export singleton instance
const logger = new ProductionLogger();

module.exports = logger;
module.exports.ProductionLogger = ProductionLogger;

