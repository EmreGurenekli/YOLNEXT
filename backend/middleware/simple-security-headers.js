/**
 * Simple Security Headers Middleware
 * Sets basic security headers for the API
 */

/**
 * Create security headers middleware
 * @param {object} options - Security options
 * @param {boolean} options.isProduction - Whether running in production
 * @returns {Function} Express middleware function
 */
function simpleSecurityHeaders(options = {}) {
  const { isProduction = false } = options;

  return (req, res, next) => {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (basic)
    if (isProduction) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      );
    }

    // Remove server header in production
    if (isProduction) {
      res.removeHeader('X-Powered-By');
    }

    next();
  };
}

module.exports = simpleSecurityHeaders;

