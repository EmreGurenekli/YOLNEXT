const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

// Advanced Security Headers
const advancedSecurityHeaders = (req, res, next) => {
  // Helmet with advanced configuration
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })(req, res, next);
};

// IP Whitelist for Admin
const adminWhitelist = ['127.0.0.1', '::1'];
const checkAdminAccess = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (req.path.startsWith('/admin') && !adminWhitelist.includes(clientIP)) {
    logger.warn(`Unauthorized admin access attempt from IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Admin erişimi reddedildi'
    });
  }
  
  next();
};

// Brute Force Protection
const bruteForceProtection = (req, res, next) => {
  const key = `bf:${req.ip}:${req.path}`;
  const attempts = req.session?.bruteForceAttempts || 0;
  
  if (attempts >= 5) {
    const lockoutTime = 15 * 60 * 1000; // 15 minutes
    const lastAttempt = req.session?.lastBruteForceAttempt || 0;
    
    if (Date.now() - lastAttempt < lockoutTime) {
      logger.warn(`Brute force attack detected from IP: ${req.ip}`);
      return res.status(429).json({
        success: false,
        message: 'Çok fazla başarısız deneme, 15 dakika bekleyin'
      });
    } else {
      // Reset attempts after lockout period
      req.session.bruteForceAttempts = 0;
    }
  }
  
  next();
};

// SQL Injection Protection
const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
    /(\bUNION\s+SELECT\b)/gi,
    /(\bDROP\s+TABLE\b)/gi,
    /(\bINSERT\s+INTO\b)/gi,
    /(\bDELETE\s+FROM\b)/gi,
    /(\bUPDATE\s+SET\b)/gi
  ];
  
  const checkForSQLInjection = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(obj[key])) {
            logger.warn(`SQL injection attempt detected from IP: ${req.ip}, Pattern: ${pattern}`);
            return true;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForSQLInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };
  
  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz istek formatı'
    });
  }
  
  next();
};

// XSS Protection
const xssProtection = (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi
  ];
  
  const checkForXSS = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of xssPatterns) {
          if (pattern.test(obj[key])) {
            logger.warn(`XSS attempt detected from IP: ${req.ip}, Pattern: ${pattern}`);
            return true;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForXSS(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };
  
  if (checkForXSS(req.body) || checkForXSS(req.query) || checkForXSS(req.params)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz istek formatı'
    });
  }
  
  next();
};

// Content Moderation
const contentModeration = (req, res, next) => {
  const inappropriateWords = [
    'spam', 'scam', 'fraud', 'hack', 'crack', 'virus', 'malware',
    'phishing', 'bot', 'fake', 'scam', 'fraudulent'
  ];
  
  const checkContent = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        const text = obj[key].toLowerCase();
        for (const word of inappropriateWords) {
          if (text.includes(word)) {
            logger.warn(`Inappropriate content detected from IP: ${req.ip}, Word: ${word}`);
            return true;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkContent(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };
  
  if (checkContent(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'İçerik moderasyonu nedeniyle istek reddedildi'
    });
  }
  
  next();
};

// Request Size Limiter
const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.get('content-length') || '0');
  
  if (contentLength > maxSize) {
    logger.warn(`Large request detected from IP: ${req.ip}, Size: ${contentLength}`);
    return res.status(413).json({
      success: false,
      message: 'İstek boyutu çok büyük'
    });
  }
  
  next();
};

// Advanced Rate Limiting
const advancedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Rate limit aşıldı, lütfen daha sonra tekrar deneyin'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Advanced rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Rate limit aşıldı, lütfen daha sonra tekrar deneyin'
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Slow Down Protection
const slowDownProtection = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes, then...
  delayMs: 500, // Add 500ms delay per request above delayAfter
  maxDelayMs: 20000, // Max delay of 20 seconds
  skip: (req) => {
    return req.path === '/health';
  }
});

module.exports = {
  advancedSecurityHeaders,
  checkAdminAccess,
  bruteForceProtection,
  sqlInjectionProtection,
  xssProtection,
  contentModeration,
  requestSizeLimiter,
  advancedRateLimit,
  slowDownProtection
};





