const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Log klasörünü oluştur
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Log formatları
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Winston logger oluştur
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'yolnet-api' },
  transports: [
    // Hata logları
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // Tüm loglar
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: logFormat
    }),
    
    // Günlük loglar
    new winston.transports.File({
      filename: path.join(logDir, `daily-${new Date().toISOString().split('T')[0]}.log`),
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      format: logFormat
    })
  ]
});

// Development ortamında konsola da yazdır
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Özel log seviyeleri
class LoggerService {
  constructor() {
    this.logger = logger;
  }

  // Genel log
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  // Hata logu
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code
        }
      })
    };
    this.logger.error(message, errorMeta);
  }

  // Uyarı logu
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  // Debug logu
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // HTTP istek logu
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      contentLength: res.get('Content-Length') || 0
    };

    if (res.statusCode >= 400) {
      this.error('HTTP Request Error', null, logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  // Veritabanı işlem logu
  logDatabase(operation, table, query, duration, error = null) {
    const logData = {
      operation,
      table,
      query: query.substring(0, 200), // İlk 200 karakter
      duration: `${duration}ms`,
      error: error?.message || null
    };

    if (error) {
      this.error('Database Operation Error', error, logData);
    } else {
      this.debug('Database Operation', logData);
    }
  }

  // API çağrı logu
  logApiCall(service, endpoint, method, statusCode, duration, error = null) {
    const logData = {
      service,
      endpoint,
      method,
      statusCode,
      duration: `${duration}ms`,
      error: error?.message || null
    };

    if (error || statusCode >= 400) {
      this.error('External API Call Error', error, logData);
    } else {
      this.info('External API Call', logData);
    }
  }

  // Kullanıcı işlem logu
  logUserAction(userId, action, details = {}) {
    this.info('User Action', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Güvenlik logu
  logSecurity(event, details = {}) {
    this.warn('Security Event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Ödeme logu
  logPayment(paymentId, action, amount, currency, status, details = {}) {
    this.info('Payment Event', {
      paymentId,
      action,
      amount,
      currency,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Gönderi logu
  logShipment(shipmentId, action, details = {}) {
    this.info('Shipment Event', {
      shipmentId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Performans logu
  logPerformance(operation, duration, details = {}) {
    const level = duration > 5000 ? 'warn' : 'info';
    this[level]('Performance', {
      operation,
      duration: `${duration}ms`,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Cache logu
  logCache(operation, key, hit, duration) {
    this.debug('Cache Operation', {
      operation,
      key,
      hit,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }

  // Sistem logu
  logSystem(event, details = {}) {
    this.info('System Event', {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Log dosyası temizleme
  async cleanupLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info('Log file cleaned up', { file });
        }
      }
    } catch (error) {
      this.error('Log cleanup error', error);
    }
  }

  // Log istatistikleri
  getLogStats() {
    try {
      const files = fs.readdirSync(logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        files: []
      };

      for (const file of files) {
        const filePath = path.join(logDir, file);
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;
        stats.files.push({
          name: file,
          size: fileStats.size,
          modified: fileStats.mtime
        });
      }

      return stats;
    } catch (error) {
      this.error('Log stats error', error);
      return null;
    }
  }
}

// Singleton instance
const loggerService = new LoggerService();

module.exports = loggerService;



