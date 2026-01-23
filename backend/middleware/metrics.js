const logger = require('../utils/logger');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byMethod: {},
        byRoute: {},
        byStatus: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      errors: {
        total: 0,
        byType: {},
        byRoute: {}
      },
      database: {
        queries: 0,
        errors: 0,
        averageTime: 0,
        totalTime: 0
      },
      memory: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0
      },
      uptime: 0
    };

    this.startTime = Date.now();
    if (process.env.NODE_ENV !== 'test') {
      this.startMetricsCollection();
    }
  }

  // Start periodic metrics collection
  startMetricsCollection() {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Update every 30 seconds
  }

  // Record API request
  recordRequest(req, res, responseTime) {
    this.metrics.requests.total++;
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // By method
    this.metrics.requests.byMethod[req.method] = 
      (this.metrics.requests.byMethod[req.method] || 0) + 1;

    // By route
    const route = req.route ? req.route.path : req.path;
    this.metrics.requests.byRoute[route] = 
      (this.metrics.requests.byRoute[route] || 0) + 1;

    // By status
    this.metrics.requests.byStatus[res.statusCode] = 
      (this.metrics.requests.byStatus[res.statusCode] || 0) + 1;

    // Response time
    this.metrics.responseTime.total += responseTime;
    this.metrics.responseTime.count++;
    this.metrics.responseTime.average = 
      this.metrics.responseTime.total / this.metrics.responseTime.count;
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, responseTime);
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, responseTime);
  }

  // Record error
  recordError(error, route) {
    this.metrics.errors.total++;
    
    const errorType = error.name || 'UnknownError';
    this.metrics.errors.byType[errorType] = 
      (this.metrics.errors.byType[errorType] || 0) + 1;

    if (route) {
      this.metrics.errors.byRoute[route] = 
        (this.metrics.errors.byRoute[route] || 0) + 1;
    }
  }

  // Record database operation
  recordDatabaseOperation(duration, error = null) {
    this.metrics.database.queries++;
    this.metrics.database.totalTime += duration;
    this.metrics.database.averageTime = 
      this.metrics.database.totalTime / this.metrics.database.queries;

    if (error) {
      this.metrics.database.errors++;
    }
  }

  // Update system metrics
  updateSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    this.metrics.memory = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024) // MB
    };

    this.metrics.uptime = Math.round(process.uptime());
  }

  // Get current metrics
  getMetrics() {
    this.updateSystemMetrics();
    return { ...this.metrics };
  }

  // Get metrics summary
  getSummary() {
    const uptime = process.uptime();
    const requestsPerSecond = this.metrics.requests.total / uptime;
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.errors / this.metrics.requests.total) * 100 
      : 0;

    return {
      uptime: Math.round(uptime),
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(this.metrics.responseTime.average),
      memoryUsage: this.metrics.memory,
      totalRequests: this.metrics.requests.total,
      totalErrors: this.metrics.errors.total,
      databaseQueries: this.metrics.database.queries,
      databaseErrors: this.metrics.database.errors
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byMethod: {},
        byRoute: {},
        byStatus: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      errors: {
        total: 0,
        byType: {},
        byRoute: {}
      },
      database: {
        queries: 0,
        errors: 0,
        averageTime: 0,
        totalTime: 0
      },
      memory: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0
      },
      uptime: 0
    };
    this.startTime = Date.now();
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

// Middleware to collect request metrics
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    metricsCollector.recordRequest(req, res, responseTime);
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware to collect error metrics
const errorMetricsMiddleware = (error, req, res, next) => {
  const route = req.route ? req.route.path : req.path;
  metricsCollector.recordError(error, route);
  next(error);
};

module.exports = {
  metricsCollector,
  metricsMiddleware,
  errorMetricsMiddleware
};

