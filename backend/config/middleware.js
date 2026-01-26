/**
 * Middleware Configuration
 * Centralized middleware setup for the application
 */

const express = require('express');
const simpleCors = require('../middleware/simple-cors');
const simpleRateLimit = require('../middleware/simple-rate-limit');
const simpleSecurityHeaders = require('../middleware/simple-security-headers');
const { createAuthMiddleware } = require('../middleware/auth');
const errorLogger = require('../utils/errorLogger');

/**
 * Setup all application middleware
 * @param {Express} app - Express application instance
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {string} jwtSecret - JWT secret key
 * @param {string} frontendOrigin - Frontend origin URL(s)
 * @param {string} nodeEnv - Node environment
 * @returns {object} Middleware functions (authenticateToken, etc.)
 */
function setupMiddleware(app, pool, jwtSecret, frontendOrigin, nodeEnv) {
  // Request ID middleware
  app.use((req, res, next) => {
    req.requestId = require('crypto').randomUUID();
    next();
  });

  // Simple CORS middleware
  const allowedOrigins = frontendOrigin.split(',').map(o => o.trim());
  app.use(simpleCors({ allowedOrigins }));

  // Simple security headers
  app.use(simpleSecurityHeaders({ isProduction: nodeEnv === 'production' }));

  // Request timeout middleware (simple implementation)
  app.use((req, res, next) => {
    const timeout = 30000; // 30 seconds
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({ success: false, message: 'Request timeout' });
      }
    });
    next();
  });

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // No-cache headers for API endpoints
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Enhanced request logging middleware
  app.use((req, res, next) => {
    const startHrTime = process.hrtime.bigint();
    const { method, originalUrl, ip, requestId } = req;

    res.on('finish', () => {
      const endHrTime = process.hrtime.bigint();
      const duration = Number(endHrTime - startHrTime) / 1_000_000; // milliseconds
      const { statusCode } = res;

      const logContext = {
        requestId,
        method,
        url: originalUrl,
        ip,
        statusCode,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.id || 'guest',
      };

      if (statusCode >= 500) {
        errorLogger.error('Server Error', logContext);
      } else if (statusCode >= 400) {
        errorLogger.warn('Client Error', logContext);
      } else {
        errorLogger.info('Request', logContext);
      }
    });
    next();
  });

  // Authentication middleware
  const authenticateToken = createAuthMiddleware(pool, jwtSecret, errorLogger);

  // Rate limiters
  const generalLimiter = simpleRateLimit({
    windowMs: 15 * 60 * 1000,
    // Dev note: UI route-by-route smoke tests and admin panels can legitimately
    // generate high request volumes (polling + list refresh). Keep production strict,
    // but avoid 429 noise in development.
    max: nodeEnv === 'production' ? 100 : 1_000_000,
    message: { success: false, message: 'Too many requests' },
  });

  const authLimiter = simpleRateLimit({
    windowMs: 15 * 60 * 1000,
    max: nodeEnv === 'production' ? 5 : 1000,
    message: { success: false, message: 'Too many auth requests' },
  });

  // Speed limiters (placeholder - can be enhanced if needed)
  const offerSpeedLimiter = (req, res, next) => next();
  const messageSpeedLimiter = (req, res, next) => next();

  return {
    authenticateToken,
    generalLimiter,
    authLimiter,
    offerSpeedLimiter,
    messageSpeedLimiter,
  };
}

module.exports = { setupMiddleware };
