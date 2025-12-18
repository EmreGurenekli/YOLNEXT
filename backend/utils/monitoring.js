/**
 * Monitoring utilities
 * Tracks requests for analytics and monitoring
 */

/**
 * Middleware to track HTTP requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function trackRequest(req, res, next) {
  // Track request start time
  const startTime = Date.now();

  // Track response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Log request details (optional, can be extended for analytics)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
}

module.exports = { trackRequest };
































