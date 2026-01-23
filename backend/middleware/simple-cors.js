/**
 * Simple CORS Middleware
 * Handles Cross-Origin Resource Sharing for the API
 */

/**
 * Create CORS middleware
 * @param {object} options - CORS options
 * @param {string[]} options.allowedOrigins - Array of allowed origin URLs
 * @returns {Function} Express middleware function
 */
function simpleCors(options = {}) {
  const { allowedOrigins = ['http://localhost:5173'] } = options;

  return (req, res, next) => {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end();
    }

    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

    next();
  };
}

module.exports = simpleCors;

