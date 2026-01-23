const { cacheGet, cacheSet } = require('../utils/redis');

/**
 * Cache middleware for GET requests
 */
function cacheMiddleware(ttlSeconds = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create cache key from URL
    const cacheKey = `cache:${req.originalUrl}`;
    
    try {
      // Try to get from cache
      const cached = await cacheGet(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = function(data) {
        // Cache the response
        cacheSet(cacheKey, data, ttlSeconds);
        
        // Call original json method
        originalJson(data);
      };
      
      next();
    } catch (error) {
      // If caching fails, continue without cache
      next();
    }
  };
}

module.exports = {
  cacheMiddleware
};


