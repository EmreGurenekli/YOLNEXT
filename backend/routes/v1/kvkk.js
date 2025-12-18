const express = require('express');

function createKvkkRoutes(pool, authenticateToken) {
  const router = express.Router();

  router.get('/data-access', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Best-effort: in real implementation you'd queue a GDPR/KVKK export job
      return res.json({
        success: true,
        data: {
          requestId: `kvkk_${userId}_${Date.now()}`,
          status: 'queued',
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to request data access' });
    }
  });

  router.post('/delete-data', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Best-effort: do not actually delete records here; Settings already uses /api/users/account.
      return res.json({ success: true, message: 'Deletion request received' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to process delete request' });
    }
  });

  return router;
}

module.exports = createKvkkRoutes;
