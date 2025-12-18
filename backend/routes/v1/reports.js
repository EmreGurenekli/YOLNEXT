const express = require('express');

function createReportsRoutes(pool, authenticateToken) {
  const router = express.Router();

  router.get('/', authenticateToken, async (_req, res) => {
    return res.json({ success: true, data: [] });
  });

  router.get('/history', authenticateToken, async (_req, res) => {
    return res.json({ success: true, data: [] });
  });

  router.get('/:reportId/download', authenticateToken, async (req, res) => {
    return res.status(404).json({ success: false, message: 'Report not found' });
  });

  router.post('/:type', authenticateToken, express.json({ limit: '2mb' }), async (_req, res) => {
    return res.json({ success: true, data: { id: null } });
  });

  return router;
}

module.exports = createReportsRoutes;
