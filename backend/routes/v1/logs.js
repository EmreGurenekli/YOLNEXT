const express = require('express');

function createLogsRoutes(pool, authenticateToken) {
  const router = express.Router();

  // Logger sends logs without auth in production; accept both.
  router.post('/', express.json({ limit: '200kb' }), async (req, res) => {
    try {
      const entry = req.body || {};

      if (pool) {
        try {
          await pool.query(
            'INSERT INTO client_logs (level, message, data, timestamp, user_agent, url, session_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)',
            [
              entry.level || null,
              entry.message || null,
              entry.data ? JSON.stringify(entry.data) : null,
              entry.timestamp || null,
              entry.userAgent || null,
              entry.url || null,
              entry.sessionId || null,
            ]
          );
        } catch (_) {
          // ignore
        }
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to accept logs' });
    }
  });

  return router;
}

module.exports = createLogsRoutes;
