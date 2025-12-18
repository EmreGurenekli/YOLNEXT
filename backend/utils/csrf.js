/**
 * CSRF Protection
 * Implements CSRF token generation and validation
 */

const crypto = require('crypto');

// In-memory token store (use Redis in production)
const tokenStore = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + TOKEN_EXPIRY;
  
  tokenStore.set(token, expiry);
  
  // Cleanup expired tokens
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(token) {
  if (!token) {
    return false;
  }
  
  const expiry = tokenStore.get(token);
  
  if (!expiry || Date.now() > expiry) {
    if (expiry) {
      tokenStore.delete(token);
    }
    return false;
  }
  
  return true;
}

/**
 * Invalidate CSRF token (after use)
 */
function invalidateCSRFToken(token) {
  tokenStore.delete(token);
}

/**
 * Cleanup expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, expiry] of tokenStore.entries()) {
    if (now > expiry) {
      tokenStore.delete(token);
    }
  }
}

/**
 * CSRF token middleware
 */
function csrfMiddleware(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If request is authenticated via Bearer token (JWT), CSRF is not applicable.
  // CSRF primarily protects cookie-based auth; our API uses Authorization header.
  const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return next();
  }

  // Skip CSRF for health check and public endpoints
  if (req.path === '/api/health' || req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || (req.body && req.body._csrf);
  
  if (!token || !validateCSRFToken(token)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
    });
  }

  // Invalidate token after use (optional - can reuse for same session)
  // invalidateCSRFToken(token);

  next();
}

/**
 * CSRF token endpoint
 */
function getCSRFToken(req, res) {
  const token = generateCSRFToken();
  res.json({
    success: true,
    csrfToken: token,
  });
}

module.exports = {
  generateCSRFToken,
  validateCSRFToken,
  invalidateCSRFToken,
  csrfMiddleware,
  getCSRFToken,
};








