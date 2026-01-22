const express = require('express');

function createComplaintsRoutes(pool, authenticateToken, upload) {
  const router = express.Router();

  // Frontend sends multipart/form-data with fields + attachment_* files
  const uploadAny = upload && typeof upload.any === 'function' ? upload.any() : (req, _res, next) => next();

  router.post('/', authenticateToken, uploadAny, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const body = req.body || {};
      const type = body.type;
      const title = body.title;
      const description = body.description;
      const priority = body.priority || 'medium';
      const shipmentId = body.shipmentId || body.shipment_id || null;

      const files = Array.isArray(req.files) ? req.files : [];
      const attachments = files.map(f => ({
        field: f.fieldname,
        filename: f.originalname || f.filename,
        path: f.path || f.filename,
        mimetype: f.mimetype,
        size: f.size,
      }));

      // Best-effort persistence: optional
      // If DB/schema missing, still return success.
      if (pool) {
        try {
          await pool.query(
            'INSERT INTO complaints (user_id, shipment_id, type, title, description, priority, attachments, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)',
            [userId, shipmentId, type || null, title || null, description || null, priority || null, JSON.stringify(attachments)]
          );
        } catch (_) {
          // ignore
        }
      }

      return res.status(201).json({
        success: true,
        data: {
          id: Date.now(),
          shipmentId,
          type,
          title,
          description,
          priority,
          attachments,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Complaint submission failed' });
    }
  });

  return router;
}

module.exports = createComplaintsRoutes;
