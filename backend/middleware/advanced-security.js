const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Gelişmiş rate limiting
const advancedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 100 istek
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Health check endpoint'lerini atla
    return req.path === '/api/health' || req.path === '/health';
  }
});

// Slow down protection
const slowDownProtection = slowDown({
  windowMs: 15 * 60 * 1000, // 15 dakika
  delayAfter: 50, // 50 istekten sonra gecikme başla
  delayMs: 500, // 500ms gecikme
  maxDelayMs: 20000, // Maksimum 20 saniye gecikme
  skip: (req) => {
    return req.path === '/api/health' || req.path === '/health';
  }
});

// IP whitelist kontrolü
const ipWhitelist = (req, res, next) => {
  const whitelist = process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [];
  
  if (whitelist.length > 0 && !whitelist.includes(req.ip)) {
    return res.status(403).json({ error: 'IP not whitelisted' });
  }
  
  next();
};

// Request size limit
const requestSizeLimit = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({ error: 'Request too large' });
  }
  
  next();
};

// User agent kontrolü
const userAgentCheck = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  const blockedAgents = ['curl', 'wget', 'python-requests'];
  
  if (userAgent && blockedAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return res.status(403).json({ error: 'User agent not allowed' });
  }
  
  next();
};

module.exports = {
  advancedRateLimit,
  slowDownProtection,
  ipWhitelist,
  requestSizeLimit,
  userAgentCheck
};

