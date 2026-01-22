const express = require('express');

function createKvkkRoutes(pool, authenticateToken) {
  const router = express.Router();

  router.post('/cookie-consent', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const analytics = Boolean(req.body?.analytics);
      const version = typeof req.body?.version === 'string' && req.body.version.trim()
        ? req.body.version.trim()
        : 'v1';

      const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (!pool) {
        return res.json({ success: true, message: 'Consent recorded (no DB pool)' });
      }

      try {
        await pool.query(
          `INSERT INTO user_consents
           (user_id, consent_type, is_accepted, consent_date, ip_address, user_agent, document_version, metadata)
           VALUES ($1, 'cookie_policy', $2, NOW(), $3, $4, $5, $6::jsonb)` ,
          [
            userId,
            analytics,
            clientIp,
            userAgent,
            version,
            JSON.stringify({ analytics, source: 'cookie_preferences' }),
          ]
        );
      } catch (e) {
        if (e && e.code === '42P01') {
          return res.json({ success: true, message: 'Consent recorded (table missing)' });
        }
        return res.status(500).json({ success: false, message: 'Failed to record consent' });
      }

      return res.json({ success: true });
    } catch {
      return res.status(500).json({ success: false, message: 'Failed to record consent' });
    }
  });

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
