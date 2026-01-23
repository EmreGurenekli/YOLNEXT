const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      success: true,
      message: 'YolNext API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
    };

    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    const checks = {};

    // Database health check
    try {
      const dbStart = Date.now();
      await req.db.query('SELECT NOW()');
      checks.database = {
        status: 'healthy',
        responseTime: `${Date.now() - dbStart}ms`,
        message: 'Database connection successful',
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message,
        message: 'Database connection failed',
      };
    }

    // Memory health check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    checks.memory = {
      status: memoryUsageMB.heapUsed < 500 ? 'healthy' : 'warning',
      usage: memoryUsageMB,
      message:
        memoryUsageMB.heapUsed < 500
          ? 'Memory usage normal'
          : 'High memory usage detected',
    };

    // CPU health check
    const cpuUsage = process.cpuUsage();
    checks.cpu = {
      status: 'healthy',
      usage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      message: 'CPU usage normal',
    };

    // Disk space check (if available)
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      checks.disk = {
        status: 'healthy',
        message: 'Disk access normal',
      };
    } catch (error) {
      checks.disk = {
        status: 'unknown',
        message: 'Disk check not available',
      };
    }

    // Overall health status
    const overallStatus = Object.values(checks).every(
      check => check.status === 'healthy'
    )
      ? 'healthy'
      : 'degraded';

    const healthCheck = {
      success: overallStatus === 'healthy',
      status: overallStatus,
      message:
        overallStatus === 'healthy'
          ? 'All systems operational'
          : 'Some systems degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: `${Date.now() - startTime}ms`,
      checks,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    await req.db.query('SELECT 1');

    res.json({
      success: true,
      message: 'Service is ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      success: false,
      message: 'Service not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.json({
    success: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development',
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Metrics collection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
