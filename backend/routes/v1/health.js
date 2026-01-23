// Health check routes - Modular version
const express = require('express');
const { comprehensiveHealthCheck } = require('../../utils/healthCheck');

function createHealthRoutes(pool) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const health = await comprehensiveHealthCheck(pool);
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

<<<<<<< HEAD
  // Live endpoint for Docker healthcheck (lightweight, no DB query)
  router.get('/live', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

=======
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  return router;
}

module.exports = createHealthRoutes;




