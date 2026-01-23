/**
 * Simple Rate Limiting Middleware
 * Basic rate limiting without external dependencies
 */

/**
 * Create rate limiter middleware
 * @param {object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {object} options.message - Error message to return
 * @returns {Function} Express middleware function
 */
function simpleRateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100,
    message = { success: false, message: 'Too many requests, please try again later' },
  } = options;

  // In-memory store (simple implementation)
  // In production, consider using Redis for distributed rate limiting
  const requests = new Map();

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
      if (now - value.resetTime > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Get or create request record
    let record = requests.get(key);

    if (!record || now - record.resetTime > windowMs) {
      // Reset or create new record
      record = {
        count: 0,
        resetTime: now,
      };
      requests.set(key, record);
    }

    record.count++;

    // Check if limit exceeded
    if (record.count > max) {
      return res.status(429).json({
        ...message,
        retryAfter: Math.ceil((record.resetTime + windowMs - now) / 1000),
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime + windowMs).toISOString());

    next();
  };
}

module.exports = simpleRateLimit;

