const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis bağlantısı kuruldu');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis hatası:', err);
    });
  }

  // Genel cache işlemleri
  async get(key) {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get hatası:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set hatası:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete hatası:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists hatası:', error);
      return false;
    }
  }

  // Pattern ile silme
  async delPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache pattern delete hatası:', error);
      return false;
    }
  }

  // Shipment cache işlemleri
  async getCachedShipments(filters) {
    const cacheKey = `shipments:${JSON.stringify(filters)}`;
    return await this.get(cacheKey);
  }

  async setCachedShipments(filters, shipments, ttl = 300) {
    const cacheKey = `shipments:${JSON.stringify(filters)}`;
    return await this.set(cacheKey, shipments, ttl);
  }

  async invalidateShipmentCache() {
    await this.delPattern('shipments:*');
  }

  // User cache işlemleri
  async getCachedUser(userId) {
    const cacheKey = `user:${userId}`;
    return await this.get(cacheKey);
  }

  async setCachedUser(userId, user, ttl = 1800) {
    const cacheKey = `user:${userId}`;
    return await this.set(cacheKey, user, ttl);
  }

  async invalidateUserCache(userId) {
    await this.del(`user:${userId}`);
  }

  // Offer cache işlemleri
  async getCachedOffers(shipmentId) {
    const cacheKey = `offers:${shipmentId}`;
    return await this.get(cacheKey);
  }

  async setCachedOffers(shipmentId, offers, ttl = 600) {
    const cacheKey = `offers:${shipmentId}`;
    return await this.set(cacheKey, offers, ttl);
  }

  async invalidateOfferCache(shipmentId) {
    await this.del(`offers:${shipmentId}`);
  }

  // Analytics cache işlemleri
  async getCachedAnalytics(userId, type, period) {
    const cacheKey = `analytics:${userId}:${type}:${period}`;
    return await this.get(cacheKey);
  }

  async setCachedAnalytics(userId, type, period, data, ttl = 3600) {
    const cacheKey = `analytics:${userId}:${type}:${period}`;
    return await this.set(cacheKey, data, ttl);
  }

  // Rate limiting için
  async incrementRateLimit(key, windowMs) {
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, Math.ceil(windowMs / 1000));
      }
      return current;
    } catch (error) {
      console.error('Rate limit increment hatası:', error);
      return 0;
    }
  }

  // Session cache
  async getSession(sessionId) {
    const cacheKey = `session:${sessionId}`;
    return await this.get(cacheKey);
  }

  async setSession(sessionId, sessionData, ttl = 86400) {
    const cacheKey = `session:${sessionId}`;
    return await this.set(cacheKey, sessionData, ttl);
  }

  async deleteSession(sessionId) {
    const cacheKey = `session:${sessionId}`;
    return await this.del(cacheKey);
  }

  // Cache istatistikleri
  async getStats() {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      return {
        memory: info,
        keyspace: keyspace,
        connected: this.redis.status === 'ready'
      };
    } catch (error) {
      console.error('Cache stats hatası:', error);
      return null;
    }
  }

  // Cache temizleme
  async flushAll() {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flush hatası:', error);
      return false;
    }
  }

  // Bağlantıyı kapat
  async disconnect() {
    try {
      await this.redis.disconnect();
      return true;
    } catch (error) {
      console.error('Redis disconnect hatası:', error);
      return false;
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;



