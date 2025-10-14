const { logger } = require('../utils/logger');

// Load balancing and rate limiting middleware
class LoadBalancer {
  constructor() {
    this.requestCounts = new Map();
    this.maxRequestsPerMinute = 100;
    this.maxConcurrentRequests = 50;
    this.currentRequests = 0;
  }

  // Rate limiting per IP
  rateLimitByIP() {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute

      if (!this.requestCounts.has(clientIP)) {
        this.requestCounts.set(clientIP, []);
      }

      const requests = this.requestCounts.get(clientIP);
      
      // Remove old requests outside the window
      const validRequests = requests.filter(time => now - time < windowMs);
      this.requestCounts.set(clientIP, validRequests);

      if (validRequests.length >= this.maxRequestsPerMinute) {
        logger.warn(`Rate limit exceeded for IP: ${clientIP}`);
        return res.status(429).json({
          success: false,
          message: 'Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin.'
        });
      }

      // Add current request
      validRequests.push(now);
      this.requestCounts.set(clientIP, validRequests);

      next();
    };
  }

  // Concurrent request limiting
  concurrentRequestLimit() {
    return (req, res, next) => {
      if (this.currentRequests >= this.maxConcurrentRequests) {
        logger.warn(`Concurrent request limit exceeded: ${this.currentRequests}`);
        return res.status(503).json({
          success: false,
          message: 'Sunucu yoğun. Lütfen daha sonra tekrar deneyin.'
        });
      }

      this.currentRequests++;
      
      res.on('finish', () => {
        this.currentRequests--;
      });

      res.on('close', () => {
        this.currentRequests--;
      });

      next();
    };
  }

  // Request queuing
  requestQueue() {
    const queue = [];
    let processing = false;

    return (req, res, next) => {
      if (this.currentRequests < this.maxConcurrentRequests) {
        next();
        return;
      }

      // Add to queue
      queue.push({ req, res, next });

      // Process queue
      if (!processing) {
        processing = true;
        this.processQueue(queue);
      }
    };
  }

  async processQueue(queue) {
    while (queue.length > 0 && this.currentRequests < this.maxConcurrentRequests) {
      const { req, res, next } = queue.shift();
      
      // Check if request is still valid
      if (res.headersSent) {
        continue;
      }

      // Add timeout
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({
            success: false,
            message: 'İstek zaman aşımına uğradı.'
          });
        }
      }, 30000); // 30 second timeout

      res.on('finish', () => {
        clearTimeout(timeout);
      });

      next();
    }

    processing = false;
  }

  // Health check
  healthCheck() {
    return (req, res, next) => {
      if (req.path === '/health') {
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          currentRequests: this.currentRequests,
          maxConcurrentRequests: this.maxConcurrentRequests,
          requestCounts: this.requestCounts.size
        };

        return res.json(health);
      }
      next();
    };
  }

  // Cleanup old request counts
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute

      for (const [ip, requests] of this.requestCounts.entries()) {
        const validRequests = requests.filter(time => now - time < windowMs);
        if (validRequests.length === 0) {
          this.requestCounts.delete(ip);
        } else {
          this.requestCounts.set(ip, validRequests);
        }
      }
    }, 30000); // Cleanup every 30 seconds
  }
}

const loadBalancer = new LoadBalancer();
loadBalancer.cleanup();

module.exports = {
  rateLimitByIP: loadBalancer.rateLimitByIP(),
  concurrentRequestLimit: loadBalancer.concurrentRequestLimit(),
  requestQueue: loadBalancer.requestQueue(),
  healthCheck: loadBalancer.healthCheck()
};





