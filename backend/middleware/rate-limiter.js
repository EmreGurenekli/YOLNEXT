const rateLimit = require('express-rate-limit');

// Genel API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 100 istek
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına 5 login denemesi
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 10, // IP başına 10 upload
  message: {
    error: 'Too many upload requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Dynamic rate limiter
const dynamicLimiter = (req, res, next) => {
  // Kullanıcı tipine göre farklı limitler
  let maxRequests = 100; // Default
  
  if (req.user) {
    switch (req.user.user_type) {
      case 'individual':
        maxRequests = 50;
        break;
      case 'corporate':
        maxRequests = 200;
        break;
      case 'carrier':
        maxRequests = 150;
        break;
      case 'driver':
        maxRequests = 100;
        break;
      default:
        maxRequests = 50;
    }
  }
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: {
      error: 'Rate limit exceeded for your user type',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  return limiter(req, res, next);
};

// Strict rate limiter
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 20, // IP başına 20 istek
  message: {
    error: 'Rate limit exceeded, please slow down.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  dynamicLimiter,
  strictLimiter
};

