/**
 * Enhanced monitoring utilities
 * Tracks requests, metrics, and system health for comprehensive monitoring
 */

const client = require('prom-client');

class ApplicationMonitoring {
  constructor() {
    // Create a Registry to register the metrics
    this.register = new client.Registry();
    
    // Add a default label which can be used to identify metrics
    this.register.setDefaultLabels({
      app: 'yolnext-api'
    });

    // Enable the collection of default metrics
    client.collectDefaultMetrics({ register: this.register });

    // Custom metrics
    this.setupCustomMetrics();
  }

  setupCustomMetrics() {
    // HTTP request metrics
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'user_type'],
      registers: [this.register]
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.register]
    });

    // Database metrics
    this.dbConnectionsActive = new client.Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.register]
    });

    this.dbQueryDuration = new client.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register]
    });

    // Business metrics
    this.shipmentsCreated = new client.Counter({
      name: 'shipments_created_total',
      help: 'Total number of shipments created',
      labelNames: ['user_type', 'priority'],
      registers: [this.register]
    });

    this.offersCreated = new client.Counter({
      name: 'offers_created_total',
      help: 'Total number of offers created',
      labelNames: ['carrier_type'],
      registers: [this.register]
    });

    this.usersRegistered = new client.Counter({
      name: 'users_registered_total',
      help: 'Total number of users registered',
      labelNames: ['user_type'],
      registers: [this.register]
    });

    // Authentication metrics
    this.authAttempts = new client.Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['result', 'user_type'],
      registers: [this.register]
    });

    // Error metrics
    this.errorsTotal = new client.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['error_type', 'route', 'method'],
      registers: [this.register]
    });

    // System metrics
    this.memoryUsage = new client.Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.register]
    });

    this.cpuUsage = new client.Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [this.register]
    });

    // WebSocket metrics
    this.websocketConnections = new client.Gauge({
      name: 'websocket_connections_active',
      help: 'Number of active WebSocket connections',
      registers: [this.register]
    });

    this.websocketMessages = new client.Counter({
      name: 'websocket_messages_total',
      help: 'Total number of WebSocket messages',
      labelNames: ['type', 'direction'],
      registers: [this.register]
    });
  }

  // Middleware for tracking HTTP requests
  trackRequest() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Generate unique request ID
      req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Track response
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        const userType = req.user?.userType || 'anonymous';

        // Record metrics
        this.httpRequestsTotal
          .labels(req.method, route, res.statusCode.toString(), userType)
          .inc();
        
        this.httpRequestDuration
          .labels(req.method, route, res.statusCode.toString())
          .observe(duration);

        // Log slow requests
        if (duration > 2) {
          console.warn('Slow request detected', {
            requestId: req.requestId,
            method: req.method,
            route,
            statusCode: res.statusCode,
            duration,
            userAgent: req.headers['user-agent'],
            ip: req.ip
          });
        }
      });

      next();
    };
  }

  // Track database operations
  trackDatabaseQuery(queryType, table, duration) {
    this.dbQueryDuration.labels(queryType, table).observe(duration);
  }

  // Track business events
  trackShipmentCreated(userType, priority) {
    this.shipmentsCreated.labels(userType, priority).inc();
  }

  trackOfferCreated(carrierType) {
    this.offersCreated.labels(carrierType).inc();
  }

  trackUserRegistered(userType) {
    this.usersRegistered.labels(userType).inc();
  }

  trackAuthAttempt(result, userType) {
    this.authAttempts.labels(result, userType).inc();
  }

  // Track errors
  trackError(errorType, route, method) {
    this.errorsTotal.labels(errorType, route, method).inc();
  }

  // Update system metrics
  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    this.memoryUsage
      .labels('rss')
      .set(memUsage.rss);
    
    this.memoryUsage
      .labels('heapTotal')
      .set(memUsage.heapTotal);
    
    this.memoryUsage
      .labels('heapUsed')
      .set(memUsage.heapUsed);
    
    this.memoryUsage
      .labels('external')
      .set(memUsage.external);
  }

  // Update database connection metrics
  updateDbConnectionMetrics(activeConnections) {
    this.dbConnectionsActive.set(activeConnections);
  }

  // Update WebSocket metrics
  updateWebSocketMetrics(activeConnections) {
    this.websocketConnections.set(activeConnections);
  }

  trackWebSocketMessage(type, direction) {
    this.websocketMessages.labels(type, direction).inc();
  }

  // Get metrics for Prometheus
  getMetrics() {
    return this.register.metrics();
  }

  // Health check metrics
  getHealthMetrics() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
  }

  // Create alert conditions
  checkAlerts() {
    const alerts = [];
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Memory usage alert
    if (memUsagePercent > 90) {
      alerts.push({
        type: 'memory_high',
        severity: 'critical',
        message: `Memory usage is ${memUsagePercent.toFixed(2)}%`,
        value: memUsagePercent,
        threshold: 90
      });
    }

    // CPU usage alert (simplified)
    const cpuUsage = process.cpuUsage();
    if (cpuUsage.user > 1000000000) { // 1 second in microseconds
      alerts.push({
        type: 'cpu_high',
        severity: 'warning',
        message: 'High CPU usage detected',
        value: cpuUsage.user,
        threshold: 1000000000
      });
    }

    return alerts;
  }

  // Create monitoring dashboard data
  getDashboardData() {
    return {
      metrics: {
        requests: this.httpRequestsTotal.get(),
        responseTime: this.httpRequestDuration.get(),
        database: {
          connections: this.dbConnectionsActive.get(),
          queryTime: this.dbQueryDuration.get()
        },
        business: {
          shipments: this.shipmentsCreated.get(),
          offers: this.offersCreated.get(),
          users: this.usersRegistered.get()
        },
        auth: this.authAttempts.get(),
        errors: this.errorsTotal.get(),
        system: {
          memory: this.memoryUsage.get(),
          cpu: this.cpuUsage.get(),
          uptime: process.uptime()
        },
        websockets: {
          connections: this.websocketConnections.get(),
          messages: this.websocketMessages.get()
        }
      },
      health: this.getHealthMetrics(),
      alerts: this.checkAlerts(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const monitoring = new ApplicationMonitoring();

// Update system metrics periodically
if (!(process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID)) {
  const t = setInterval(() => {
    monitoring.updateSystemMetrics();
  }, 30000); // Every 30 seconds
  try {
    if (t && typeof t.unref === 'function') t.unref();
  } catch (_) {
    // ignore
  }
}

// Legacy compatibility
function trackRequest(req, res, next) {
  return monitoring.trackRequest()(req, res, next);
}

module.exports = { 
  trackRequest,
  monitoring
};
































