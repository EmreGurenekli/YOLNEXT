// Health check routes - Modular version
const express = require('express');
const { comprehensiveHealthCheck } = require('../../utils/systemHealthCheck');

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

  // Live endpoint for Docker healthcheck (lightweight, no DB query)
  router.get('/live', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = createHealthRoutes;





