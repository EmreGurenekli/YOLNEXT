const rateLimit = require('express-rate-limit');
const cacheService = require('../services/cache-service');
const loggerService = require('../services/logger-service');
const { RateLimitError } = require('../utils/errors');

// Genel rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000, // IP başına 1000 istek
  message: {
    success: false,
    error: {
      message: 'Çok fazla istek gönderildi',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 dakika'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    loggerService.logSecurity('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Çok fazla istek gönderildi',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 dakika'
      }
    });
  }
});

// Kimlik doğrulama rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // IP başına 5 giriş denemesi
  message: {
    success: false,
    error: {
      message: 'Çok fazla giriş denemesi',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 dakika'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    loggerService.logSecurity('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email || 'unknown'
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Çok fazla giriş denemesi',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 dakika'
      }
    });
  }
});

// Kayıt rate limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // IP başına 3 kayıt denemesi
  message: {
    success: false,
    error: {
      message: 'Çok fazla kayıt denemesi',
      code: 'REGISTER_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 saat'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    loggerService.logSecurity('Register rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email || 'unknown'
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Çok fazla kayıt denemesi',
        code: 'REGISTER_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 saat'
      }
    });
  }
});

// Dosya yükleme rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 10, // IP başına 10 dosya yükleme
  message: {
    success: false,
    error: {
      message: 'Çok fazla dosya yükleme',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 dakika'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    loggerService.logSecurity('Upload rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Çok fazla dosya yükleme',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 dakika'
      }
    });
  }
});

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 100 API isteği
  message: {
    success: false,
    error: {
      message: 'API rate limit aşıldı',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 dakika'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    loggerService.logSecurity('API rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: req.user?.id || 'anonymous'
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'API rate limit aşıldı',
        code: 'API_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 dakika'
      }
    });
  }
});

// Özel rate limiter (kullanıcı bazlı)
const createUserBasedLimiter = (windowMs, max, keyGenerator) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const current = await cacheService.incrementRateLimit(key, windowMs);
      
      if (current > max) {
        loggerService.logSecurity('User-based rate limit exceeded', {
          key,
          current,
          max,
          ip: req.ip,
          userId: req.user?.id || 'anonymous'
        });
        
        return res.status(429).json({
          success: false,
          error: {
            message: 'Rate limit aşıldı',
            code: 'USER_RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000) + ' saniye'
          }
        });
      }
      
      // Rate limit bilgilerini header'a ekle
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - current),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });
      
      next();
    } catch (error) {
      loggerService.error('Rate limiter error', error);
      next(); // Hata durumunda devam et
    }
  };
};

// Gönderi oluşturma rate limiter (kullanıcı bazlı)
const shipmentCreateLimiter = createUserBasedLimiter(
  60 * 60 * 1000, // 1 saat
  10, // Kullanıcı başına 10 gönderi
  (req) => `shipment_create:${req.user?.id || req.ip}`
);

// Teklif verme rate limiter (kullanıcı bazlı)
const offerCreateLimiter = createUserBasedLimiter(
  60 * 1000, // 1 dakika
  5, // Kullanıcı başına 5 teklif
  (req) => `offer_create:${req.user?.id || req.ip}`
);

// Mesaj gönderme rate limiter (kullanıcı bazlı)
const messageSendLimiter = createUserBasedLimiter(
  60 * 1000, // 1 dakika
  20, // Kullanıcı başına 20 mesaj
  (req) => `message_send:${req.user?.id || req.ip}`
);

// Ödeme rate limiter (kullanıcı bazlı)
const paymentLimiter = createUserBasedLimiter(
  5 * 60 * 1000, // 5 dakika
  3, // Kullanıcı başına 3 ödeme
  (req) => `payment:${req.user?.id || req.ip}`
);

// IP bazlı dinamik rate limiter
const createDynamicLimiter = () => {
  return async (req, res, next) => {
    try {
      const ip = req.ip;
      const key = `dynamic_limit:${ip}`;
      
      // IP'nin geçmiş davranışını kontrol et
      const behavior = await cacheService.get(key) || { requests: 0, violations: 0 };
      
      // Violation sayısına göre limit belirle
      let maxRequests = 1000; // Varsayılan
      if (behavior.violations > 5) {
        maxRequests = 10; // Çok fazla ihlal
      } else if (behavior.violations > 2) {
        maxRequests = 50; // Orta seviye ihlal
      } else if (behavior.violations > 0) {
        maxRequests = 200; // Az ihlal
      }
      
      const current = await cacheService.incrementRateLimit(key, 15 * 60 * 1000);
      
      if (current > maxRequests) {
        behavior.violations++;
        await cacheService.set(key, behavior, 24 * 60 * 60); // 24 saat sakla
        
        loggerService.logSecurity('Dynamic rate limit exceeded', {
          ip,
          current,
          maxRequests,
          violations: behavior.violations
        });
        
        return res.status(429).json({
          success: false,
          error: {
            message: 'Rate limit aşıldı',
            code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
            retryAfter: '15 dakika'
          }
        });
      }
      
      next();
    } catch (error) {
      loggerService.error('Dynamic rate limiter error', error);
      next();
    }
  };
};

const dynamicLimiter = createDynamicLimiter();

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  uploadLimiter,
  apiLimiter,
  shipmentCreateLimiter,
  offerCreateLimiter,
  messageSendLimiter,
  paymentLimiter,
  dynamicLimiter,
  createUserBasedLimiter,
  createDynamicLimiter
};



