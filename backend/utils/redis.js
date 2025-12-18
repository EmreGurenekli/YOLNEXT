const redis = require('redis');

let client = null;

/**
 * Initialize Redis client (with graceful fallback)
 */
async function initRedis() {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || 6379;
  
  try {
    client = redis.createClient({
      socket: {
        host: redisHost,
        port: redisPort,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('⚠️ Redis connection failed after 3 retries. Running without cache.');
            return false; // Stop retrying
          }
          return Math.min(retries * 50, 500); // Exponential backoff
        }
      }
    });
    
    client.on('error', (err) => {
      console.warn('⚠️ Redis error (will continue without cache):', err.message);
      client = null;
    });
    
    await client.connect();
    console.log('✅ Redis connected');
    
    return client;
  } catch (error) {
    console.warn('⚠️ Redis not available (continuing without cache):', error.message);
    client = null;
    return null;
  }
}

/**
 * Get Redis client
 */
function getRedisClient() {
  return client;
}

/**
 * Cache with TTL (Time To Live) - Graceful fallback
 */
async function cacheGet(key) {
  if (!client || !client.isReady) return null;
  
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 3600) {
  if (!client || !client.isReady) return false;
  
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

async function cacheDelete(key) {
  if (!client) return false;
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Delete all keys matching pattern
 */
async function cacheDeletePattern(pattern) {
  if (!client) return false;
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis delete pattern error:', error);
    return false;
  }
}

/**
 * Get cache stats
 */
async function getCacheStats() {
  if (!client) return null;
  
  try {
    const info = await client.info('stats');
    const keys = await client.dbSize();
    
    return {
      connected: client.isReady,
      keys: keys,
      info: info
    };
  } catch (error) {
    console.error('Redis stats error:', error);
    return null;
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  getCacheStats
};



