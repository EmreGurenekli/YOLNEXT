#!/usr/bin/env node

/**
 * Güvenlik İyileştirme Scripti
 * 
 * Bu script projeye ek güvenlik katmanları ekler:
 * - CSRF protection
 * - Enhanced input validation
 * - Security headers
 * - Request logging (sensitive data olmadan)
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Güvenlik iyileştirmeleri ekleniyor...\n');

// CSRF Protection için express-rate-limit ve csurf paketleri gerekli
// Ama şimdilik basit bir CSRF token mekanizması ekleyebiliriz

const securityEnhancements = `
// ========================================
// GÜVENLİK İYİLEŞTİRMELERİ
// ========================================

// CSRF Token Store (in-memory, production'da Redis kullanılmalı)
const csrfTokens = new Map();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 saat

// CSRF Token Generation
const generateCSRFToken = () => {
  const token = require('crypto').randomBytes(32).toString('hex');
  const expiry = Date.now() + CSRF_TOKEN_EXPIRY;
  csrfTokens.set(token, expiry);
  
  // Cleanup expired tokens
  for (const [t, exp] of csrfTokens.entries()) {
    if (Date.now() > exp) {
      csrfTokens.delete(t);
    }
  }
  
  return token;
};

// CSRF Token Validation
const validateCSRFToken = (token) => {
  if (!token) return false;
  const expiry = csrfTokens.get(token);
  if (!expiry || Date.now() > expiry) {
    csrfTokens.delete(token);
    return false;
  }
  return true;
};

// CSRF Token Endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  res.json({ csrfToken: token });
});

// Enhanced Input Sanitization
const enhancedSanitize = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove SQL injection attempts
  input = input.replace(/['";\\x00\\n\\r\\\\]/g, '');
  
  // Remove XSS attempts
  input = input.replace(/<script[^>]*>.*?<\\/script>/gi, '');
  input = input.replace(/<iframe[^>]*>.*?<\\/iframe>/gi, '');
  input = input.replace(/javascript:/gi, '');
  input = input.replace(/on\\w+\\s*=/gi, '');
  
  // Remove dangerous HTML
  input = input.replace(/<[^>]+>/g, '');
  
  return input.trim();
};

// Enhanced Input Validation Middleware
const enhancedInputValidation = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = enhancedSanitize(req.body[key]);
      } else if (Array.isArray(req.body[key])) {
        req.body[key] = req.body[key].map(item => 
          typeof item === 'string' ? enhancedSanitize(item) : item
        );
      } else if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        // Recursively sanitize objects
        const sanitizeObject = (obj) => {
          for (const k in obj) {
            if (typeof obj[k] === 'string') {
              obj[k] = enhancedSanitize(obj[k]);
            } else if (typeof obj[k] === 'object' && obj[k] !== null) {
              sanitizeObject(obj[k]);
            }
          }
        };
        sanitizeObject(req.body[key]);
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = enhancedSanitize(req.query[key]);
      }
    }
  }
  
  next();
};

// Apply enhanced validation
app.use('/api', enhancedInputValidation);

// Request logging (without sensitive data)
const secureRequestLogger = (req, res, next) => {
  if (isProduction) {
    // Production'da minimal logging
    const logData = {
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(logData));
  } else {
    // Development'ta daha detaylı
    console.log(\`\${req.method} \${req.path}\`);
  }
  next();
};

app.use(secureRequestLogger);

// Additional Security Headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy (if not already set by Helmet)
  if (!res.getHeader('Content-Security-Policy')) {
    res.setHeader(
      'Content-Security-Policy',
      \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';\"
    );
  }
  
  next();
});

// Brute Force Protection (enhanced)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000; // 15 dakika

const checkBruteForce = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const attempts = loginAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
  
  if (Date.now() < attempts.lockoutUntil) {
    const remainingMinutes = Math.ceil((attempts.lockoutUntil - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: \`Çok fazla başarısız giriş denemesi. Lütfen \${remainingMinutes} dakika sonra tekrar deneyin.\`
    });
  }
  
  // Reset if lockout expired
  if (attempts.lockoutUntil > 0 && Date.now() >= attempts.lockoutUntil) {
    loginAttempts.set(ip, { count: 0, lockoutUntil: 0 });
  }
  
  next();
};

// Apply brute force protection to login
app.post('/api/auth/login', checkBruteForce, async (req, res, next) => {
  // Track failed attempts
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const ip = req.ip || req.connection.remoteAddress;
    if (!data.success) {
      const attempts = loginAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
      attempts.count++;
      
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockoutUntil = Date.now() + LOGIN_LOCKOUT_TIME;
        attempts.count = 0;
      }
      
      loginAttempts.set(ip, attempts);
    } else {
      // Reset on successful login
      loginAttempts.delete(ip);
    }
    
    return originalJson(data);
  };
  
  next();
});

console.log('✅ Güvenlik iyileştirmeleri eklendi');
`;

// Bu kod backend/server-modular.js'e eklenecek
// Şimdilik dosyaya yazıyoruz, manuel olarak eklenebilir
fs.writeFileSync(
  path.join(__dirname, 'security-enhancements.js'),
  securityEnhancements
);

console.log('✅ Güvenlik iyileştirme kodu oluşturuldu: scripts/security-enhancements.js');
console.log('📝 Bu kodu backend/server-modular.js dosyasına ekleyebilirsiniz');
































































