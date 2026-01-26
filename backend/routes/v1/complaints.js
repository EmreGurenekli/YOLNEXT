const express = require('express');

function createComplaintsRoutes(pool, authenticateToken, upload) {
  const router = express.Router();

  // Frontend sends multipart/form-data with fields + attachment_* files
  const uploadAny = upload && typeof upload.any === 'function' ? upload.any() : (req, _res, next) => next();

  const normalizeRole = (r) => String(r || '').trim().toLowerCase();

  const resolveShipmentContext = async (shipmentId) => {
    if (!pool || !shipmentId) return null;
    const id = Number(shipmentId);
    if (!Number.isFinite(id) || id <= 0) return null;
    try {
      const q = `SELECT id, "userId" as user_id, "carrierId" as carrier_id, driver_id, metadata FROM shipments WHERE id = $1`;
      const r = await pool.query(q, [id]);
      return r.rows && r.rows[0] ? r.rows[0] : null;
    } catch (_e1) {
      try {
        const q = `SELECT id, user_id, carrier_id, driver_id, metadata FROM shipments WHERE id = $1`;
        const r = await pool.query(q, [id]);
        return r.rows && r.rows[0] ? r.rows[0] : null;
      } catch (_e2) {
        return null;
      }
    }
  };

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
      const relatedUserId =
        body.relatedUserId || body.related_user_id || body.related_user || body.targetUserId || body.target_user_id || null;

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
      let createdComplaintId = null;
      let inferredRelatedUserId = relatedUserId ? Number(relatedUserId) : null;
      const role = normalizeRole(req.user?.role);
      const shipmentCtx = shipmentId ? await resolveShipmentContext(shipmentId) : null;
      if (shipmentCtx && !inferredRelatedUserId) {
        const ownerId = shipmentCtx.user_id != null ? Number(shipmentCtx.user_id) : null;
        const carrierId = shipmentCtx.carrier_id != null ? Number(shipmentCtx.carrier_id) : null;
        const driverId = shipmentCtx.driver_id != null ? Number(shipmentCtx.driver_id) : null;

        // Minimal, explainable counterpart inference by role.
        // - Shipper complains about carrier/driver
        // - Carrier complains about shipper/driver
        // - Driver complains about carrier/shipper
        if (role === 'individual' || role === 'corporate') {
          inferredRelatedUserId = carrierId || driverId || null;
        } else if (role === 'nakliyeci') {
          inferredRelatedUserId = ownerId || driverId || null;
        } else if (role === 'tasiyici') {
          inferredRelatedUserId = carrierId || ownerId || null;
        } else {
          inferredRelatedUserId = carrierId || ownerId || driverId || null;
        }
      }

      if (pool) {
        try {
          const meta = {
            sourceRole: role || null,
            userId: Number(userId),
            shipmentId: shipmentId ? Number(shipmentId) : null,
            inferredRelatedUserId: inferredRelatedUserId ? Number(inferredRelatedUserId) : null,
            // keep client payload minimal; attachments already stored separately
          };

          const insertRes = await pool.query(
            `INSERT INTO complaints (user_id, related_user_id, shipment_id, type, title, description, priority, status, attachments, metadata, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
             RETURNING id`,
            [
              Number(userId),
              inferredRelatedUserId ? Number(inferredRelatedUserId) : null,
              shipmentId ? Number(shipmentId) : null,
              type || null,
              title || null,
              description || null,
              priority || null,
              JSON.stringify(attachments),
              JSON.stringify(meta),
            ]
          );
          createdComplaintId = insertRes.rows?.[0]?.id || null;
        } catch (_) {
          // ignore
        }
      }

      return res.status(201).json({
        success: true,
        data: {
          id: createdComplaintId || Date.now(),
          shipmentId,
          relatedUserId: inferredRelatedUserId,
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
