const Redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      this.client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis bağlandı');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis bağlantı hatası:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get hatası:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set hatası:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete hatası:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists hatası:', error);
      return false;
    }
  }

  // Cache patterns
  async cacheUserData(userId, userData) {
    return await this.set(`user:${userId}`, userData, 1800); // 30 minutes
  }

  async getCachedUserData(userId) {
    return await this.get(`user:${userId}`);
  }

  async cacheShipments(userType, shipments) {
    return await this.set(`shipments:${userType}`, shipments, 300); // 5 minutes
  }

  async getCachedShipments(userType) {
    return await this.get(`shipments:${userType}`);
  }

  async cacheStats(userId, stats) {
    return await this.set(`stats:${userId}`, stats, 600); // 10 minutes
  }

  async getCachedStats(userId) {
    return await this.get(`stats:${userId}`);
  }

  // Invalidate cache
  async invalidateUserCache(userId) {
    await this.del(`user:${userId}`);
    await this.del(`stats:${userId}`);
  }

  async invalidateShipmentsCache() {
    const keys = ['shipments:individual', 'shipments:corporate', 'shipments:nakliyeci', 'shipments:tasiyici'];
    await Promise.all(keys.map(key => this.del(key)));
  }
}

module.exports = new CacheService();


