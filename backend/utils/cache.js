/**
 * API Response Caching
 * In-memory cache with TTL support (use Redis in production)
 */

class Cache {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  /**
   * Set cache value with TTL
   */
  set(key, value, ttl = 3600) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store value
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000),
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Get cache value
   */
  get(key) {
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Delete cache value
   */
  delete(key) {
    this.store.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.store.clear();
    this.timers.clear();
  }

  /**
   * Generate cache key from request
   */
  generateKey(req) {
    const { method, path, query, user } = req;
    const queryString = JSON.stringify(query || {});
    const userId = user?.id || 'anonymous';
    return `${method}:${path}:${userId}:${queryString}`;
  }
}

// Singleton instance
const cache = new Cache();

/**
 * Cache middleware
 */
function cacheMiddleware(ttl = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for Authorization-based requests (JWT)
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      return next();
    }

    // Skip cache for endpoints that need fresh data
    if (req.path.includes('/notifications') || req.path.includes('/messages')) {
      return next();
    }

    const cacheKey = cache.generateKey(req);
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear cache for specific pattern
 */
function clearCachePattern(pattern) {
  for (const [key] of cache.store.entries()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

module.exports = {
  cache,
  cacheMiddleware,
  clearCachePattern,
};








