/**
 * Enhanced Health Check
 * Comprehensive health check for database, Redis, and external services
 */

/**
 * Check database health
 */
async function checkDatabaseHealth(pool) {
  try {
    const startTime = Date.now();
    const result = await pool.query('SELECT NOW(), version()');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      version: result.rows[0]?.version || 'unknown',
      timestamp: result.rows[0]?.now || new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Check Redis health (if available)
 */
async function checkRedisHealth() {
  try {
    // TODO: Implement Redis health check when Redis is added
    return {
      status: 'not_configured',
      message: 'Redis not configured',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Check external services health
 */
async function checkExternalServices() {
  const services = {
    email: {
      status: 'unknown',
      message: 'Email service not configured',
    },
  };

  // TODO: Add actual health checks for email services when implemented
  if (process.env.SMTP_HOST) {
    services.email.status = 'configured';
  }

  return services;
}

/**
 * Comprehensive health check
 */
async function comprehensiveHealthCheck(pool) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  // Database health
  health.services.database = await checkDatabaseHealth(pool);

  // Redis health
  health.services.redis = await checkRedisHealth();

  // External services
  health.services.external = await checkExternalServices();

  // Determine overall status
  if (health.services.database.status === 'unhealthy') {
    health.status = 'unhealthy';
  }

  return health;
}

module.exports = {
  checkDatabaseHealth,
  checkRedisHealth,
  checkExternalServices,
  comprehensiveHealthCheck,
};









