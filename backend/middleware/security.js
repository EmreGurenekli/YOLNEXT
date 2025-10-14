const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const { logger } = require('../utils/logger');

// Rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        message: message || 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin'
      });
    }
  });
};

// General rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Çok fazla istek gönderildi, lütfen 15 dakika sonra tekrar deneyin'
);

// Auth rate limiting (login, register)
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin'
);

// API rate limiting
const apiLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  30, // 30 requests per minute
  'API limiti aşıldı, lütfen 1 dakika sonra tekrar deneyin'
);

// Shipment creation rate limiting
const shipmentLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  3, // 3 shipments per minute
  'Çok fazla gönderi oluşturuldu, lütfen 1 dakika sonra tekrar deneyin'
);

// Offer creation rate limiting
const offerLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  10, // 10 offers per minute
  'Çok fazla teklif gönderildi, lütfen 1 dakika sonra tekrar deneyin'
);

// Slow down for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per window without delay
  delayMs: 500 // add 500ms delay per request after delayAfter
});

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
});

// IP whitelist for admin functions
const ipWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    logger.warn(`Unauthorized IP access attempt: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Erişim reddedildi'
    });
  }
  
  next();
};

// Request logging
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
  });
  
  next();
};

// Suspicious activity detection
const suspiciousActivityDetection = (req, res, next) => {
  const suspiciousPatterns = [
    /script/i,
    /<script/i,
    /javascript:/i,
    /onload/i,
    /onerror/i,
    /eval\(/i,
    /document\./i,
    /window\./i
  ];
  
  const checkSuspicious = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(obj[key])) {
            logger.warn(`Suspicious activity detected from IP: ${req.ip}, Pattern: ${pattern}, Value: ${obj[key]}`);
            return true;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkSuspicious(obj[key])) return true;
      }
    }
    return false;
  };
  
  if (checkSuspicious(req.body) || checkSuspicious(req.query) || checkSuspicious(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz veri tespit edildi'
    });
  }
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
  shipmentLimiter,
  offerLimiter,
  speedLimiter,
  securityHeaders,
  ipWhitelist,
  requestLogger,
  suspiciousActivityDetection
};





