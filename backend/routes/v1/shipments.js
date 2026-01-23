// Shipments routes - Modular version
const express = require('express');
const { getPagination, generateTrackingNumber } = require('../../utils/routeHelpers');
const { isValidTransition } = require('../../utils/shipmentStatus');

<<<<<<< HEAD
function createShipmentRoutes(pool, authenticateToken, createNotification, idempotencyGuard) {
=======
function createShipmentRoutes(pool, authenticateToken, createNotification, idempotencyGuard, io) {
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  const router = express.Router();

  let systemUserIdCache = null;
  const ensureSystemUser = async () => {
    if (!pool) return null;
    if (systemUserIdCache) return systemUserIdCache;
    const email = 'system@yolnext.local';
    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
      if (existing.rows && existing.rows[0] && existing.rows[0].id) {
        systemUserIdCache = existing.rows[0].id;
        return systemUserIdCache;
      }
    } catch (_) {
      // ignore
    }

    try {
      const inserted = await pool.query(
        `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, "isActive", "createdat", "updatedAt")
         VALUES ($1, '', 'YolNext', 'Sistem', 'YolNext Sistem', 'system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [email]
      );
      systemUserIdCache = inserted.rows[0].id;
      return systemUserIdCache;
    } catch (_eCamel) {
      try {
        const inserted = await pool.query(
          `INSERT INTO users (email, password, first_name, last_name, full_name, role, is_active, createdat, updated_at)
           VALUES ($1, '', 'YolNext', 'Sistem', 'YolNext Sistem', 'system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id`,
          [email]
        );
        systemUserIdCache = inserted.rows[0].id;
        return systemUserIdCache;
      } catch (_) {
        return null;
      }
    }
  };

  const insertSystemMessageIfMissing = async ({ shipmentId, receiverId, message }) => {
    if (!pool) return;
    if (!shipmentId || !receiverId || !message) return;

    const systemUserId = await ensureSystemUser();
    if (!systemUserId) return;

    try {
      const exists = await pool.query(
        'SELECT 1 FROM messages WHERE "shipmentId" = $1 AND "receiverId" = $2 AND "senderId" = $3 AND message = $4 LIMIT 1',
        [shipmentId, receiverId, systemUserId, message]
      );
      if (exists.rows && exists.rows.length > 0) return;
    } catch (_eCamel) {
      try {
        const exists = await pool.query(
          'SELECT 1 FROM messages WHERE shipmentId = $1 AND receiver_id = $2 AND sender_id = $3 AND content = $4 LIMIT 1',
          [shipmentId, receiverId, systemUserId, message]
        );
        if (exists.rows && exists.rows.length > 0) return;
      } catch (_) {
        // ignore
      }
    }

    try {
      await pool.query(
        `INSERT INTO messages ("shipmentId", "senderId", "receiverId", message, "messageType", "createdat")
         VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)`,
        [shipmentId, systemUserId, receiverId, message]
      );
    } catch (_eCamelInsert) {
      try {
        await pool.query(
          `INSERT INTO messages ("shipmentId", "senderId", "receiverId", message, "createdat")
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [shipmentId, systemUserId, receiverId, message]
        );
      } catch (_eSnakeInsert) {
        try {
          await pool.query(
            `INSERT INTO messages (shipmentId, sender_id, receiver_id, content, message_type, createdat)
             VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)`,
            [shipmentId, systemUserId, receiverId, message]
          );
        } catch (_) {
          // ignore
        }
      }
    }
  };

  const attachCategoryData = rows => {
    const normalizeOne = row => {
      if (!row || typeof row !== 'object') return row;
      if (row.categoryData || row.category_data) {
        return {
          ...row,
          categoryData: row.categoryData || row.category_data,
        };
      }

      let meta = row.metadata;
      if (typeof meta === 'string') {
        try {
          meta = JSON.parse(meta);
        } catch {
          meta = null;
        }
      }

      const cd = meta && typeof meta === 'object' ? meta.categoryData : null;
      if (!cd) return row;
      return {
        ...row,
        categoryData: cd,
      };
    };

    if (Array.isArray(rows)) return rows.map(normalizeOne);
    return normalizeOne(rows);
  };

  async function queryWithFallback(primaryQuery, fallbackQuery, params) {
    try {
      return await pool.query(primaryQuery, params);
    } catch (error) {
      if (error && error.code === '42703' && fallbackQuery) {
        return await pool.query(fallbackQuery, params);
      }
      throw error;
    }
  }

  async function getShipmentByIdForStatusActions(shipmentId) {
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments'`
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));

    const ownerCol = cols.has('userId') ? 'userId' : 'user_id';
    const driverCol = cols.has('driverId') ? 'driverId' : 'driver_id';
    const carrierCol = cols.has('carrierId') ? 'carrierId' : 'carrier_id';
    const statusCol = 'status';
    const updatedAtCol = cols.has('updatedAt') ? 'updatedAt' : 'updated_at';

    const q = `SELECT id, ${ownerCol} as userId, ${carrierCol} as carrierId, ${driverCol} as driverId, ${statusCol} as status, ${updatedAtCol} as updatedAt FROM shipments WHERE id = $1`;
    const res = await pool.query(q, [shipmentId]);
    return { row: res.rows[0] || null, cols: { ownerCol, carrierCol, driverCol, statusCol, updatedAtCol } };
  }

  // Get shipments for individual users (compat endpoint)
  router.get('/individual', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const fallbackUserId = req.user?.id;
      const queryUserId = req.query?.userId ? Number(req.query.userId) : undefined;
      const userId = queryUserId || fallbackUserId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const { status } = req.query;

      // Prefer camelCase columns, fallback to snake_case
      const baseQueryCamel = `
        SELECT s.*
        FROM shipments s
        WHERE s."userId" = $1
      `;
      const baseQuerySnake = `
        SELECT s.*
        FROM shipments s
        WHERE s.user_id = $1
      `;

      const params = [userId];

      const addStatusClause = (q, statusValue) => {
        if (!statusValue || statusValue === 'all') return q;
        params.push(statusValue);
        return `${q} AND s.status = $${params.length}`;
      };

      let qCamel = addStatusClause(baseQueryCamel, status);
      qCamel += ' ORDER BY COALESCE(s."updatedAt", s."createdat") DESC LIMIT 200';

      let qSnake = addStatusClause(baseQuerySnake, status);
      qSnake += ' ORDER BY COALESCE(s.updated_at, s.createdat) DESC LIMIT 200';

      let result;
      try {
        result = await pool.query(qCamel, params);
      } catch (eCamel) {
        result = await pool.query(qSnake, params);
      }

      const normalizedRows = attachCategoryData(result.rows || []);
      return res.status(200).json({
        success: true,
        data: normalizedRows,
        shipments: normalizedRows,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Shipments alınamadı',
        error: error.message,
      });
    }
  });

  // Compatibility endpoint used by some clients: GET /api/shipments/offers
  // In this codebase, offers are primarily exposed via /api/offers; keep this as a safe fallback.
  router.get('/offers', authenticateToken, async (req, res) => {
    return res.json({ success: true, data: [], offers: [] });
  });

  // Get shipments for nakliyeci - MUST be before '/' route
  router.get('/nakliyeci', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const userId = req.user.id;
      const { status } = req.query;
      const { page, limit, offset } = getPagination(req);

      // Ensure limit and offset are valid integers
      const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
      const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

      let query = `
        SELECT s.*, 
               u."fullName" as "ownerName",
               u."companyName" as "ownerCompany",
               u."phone" as "ownerPhone",
               u."email" as "ownerEmail",
               c."fullName" as "carrierName",
               c."companyName" as "carrierCompany"
        FROM shipments s
        LEFT JOIN users u ON s."userId" = u.id
        LEFT JOIN users c ON s."carrierId" = c.id
        WHERE s."carrierId" = $1
      `;

      const params = [userId];

      if (status && status !== 'all') {
        query += ` AND s.status = $${params.length + 1}`;
        params.push(status);
      }

      // Count query with optimized index usage
      let countQuery = `SELECT COUNT(*) as count FROM shipments s WHERE s."carrierId" = $1`;
      const countParams = [userId];
      if (status && status !== 'all') {
        countQuery += ` AND s.status = $2`;
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      // Optimized query with proper indexing
      query += ` ORDER BY COALESCE(s."updatedAt", s."createdat") DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const result = await pool.query(query, params);
      const normalizedRows = attachCategoryData(result.rows || []);
      res.status(200).json({
        success: true,
        data: normalizedRows,
        shipments: normalizedRows,
        meta: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit),
        },
      });
    } catch (error) {
      // Error logging - only in development or for critical errors
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching nakliyeci shipments:', error);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack,
      });
    }
  });

  // Compatibility: recent shipments for dashboards
  // Frontend calls GET /api/shipments/recent/:userType
  router.get('/recent/:userType', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const userId = req.user.id;
      const userType = String(req.params.userType || '').toLowerCase();
      const safeLimit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 10, 50));

      // Determine filter column by role/type
      // - individual/corporate: owner
      // - nakliyeci: carrier
      // - tasiyici: driver
      const type = userType || String(req.user.role || '').toLowerCase();
      const filter =
        type === 'nakliyeci' || type === 'carrier'
          ? { primary: 's."carrierId" = $1', fallback: 's.carrierId = $1' }
          : type === 'tasiyici' || type === 'driver'
            ? { primary: 's.driver_id = $1', fallback: 's.driver_id = $1' }
            : { primary: 's."userId" = $1', fallback: 's.user_id = $1' };

      const qPrimary = `
        SELECT s.*, 
               u."fullName" as "ownerName",
               c."fullName" as "carrierName"
        FROM shipments s
        LEFT JOIN users u ON s."userId" = u.id
        LEFT JOIN users c ON s."carrierId" = c.id
        WHERE ${filter.primary}
        ORDER BY COALESCE(s."updatedAt", s."createdat") DESC
        LIMIT ${safeLimit}
      `;

      const qFallback = `
        SELECT s.*, 
               u.fullname as "ownerName",
               c.fullname as "carrierName"
        FROM shipments s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN users c ON s.carrierId = c.id
        WHERE ${filter.fallback}
        ORDER BY COALESCE(s.updated_at, s.createdat) DESC
        LIMIT ${safeLimit}
      `;

      const result = await queryWithFallback(qPrimary, qFallback, [userId]);
      return res.json({ success: true, data: result.rows || [], shipments: result.rows || [] });
    } catch (error) {
      console.error('Error fetching recent shipments:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch recent shipments' });
    }
  });

  // Shipment status history (compatibility for frontend StatusManager)
  router.get('/:id/status-history', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const shipmentId = parseInt(req.params.id, 10);
      if (!shipmentId) {
        return res.status(400).json({ success: false, message: 'Invalid shipment id' });
      }

      const { row: shipment } = await getShipmentByIdForStatusActions(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      const userId = req.user.id;
      const isOwner = shipment.userId === userId;
      const isCarrier = shipment.carrier_id === userId;
      const isDriver = shipment.driver_id === userId;

      if (!isOwner && !isCarrier && !isDriver) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      // Return empty history if table does not exist
      try {
        const historyRes = await queryWithFallback(
          `SELECT id, "shipmentId" as shipmentId, NULL as user_id, NULL as old_status, status as new_status, message as notes, "createdat" as createdat, NULL as updated_by_name, NULL as user_type
           FROM shipment_status_history
           WHERE "shipmentId" = $1
           ORDER BY "createdat" ASC`,
          `SELECT id, shipmentId as shipmentId, NULL as user_id, NULL as old_status, status as new_status, message as notes, createdat as createdat, NULL as updated_by_name, NULL as user_type
           FROM shipment_status_history
           WHERE shipmentId = $1
           ORDER BY createdat ASC`,
          [shipmentId]
        );

        return res.json({ success: true, data: historyRes.rows || [] });
      } catch (e) {
        if (e && (e.code === '42P01' || e.code === '42703')) {
          return res.json({ success: true, data: [] });
        }
        throw e;
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch status history' });
    }
  });

  // Update shipment status (compatibility for frontend StatusManager)
  router.post('/:id/status', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const shipmentId = parseInt(req.params.id, 10);
      const { status: nextStatus, notes } = req.body || {};

      if (!shipmentId || !nextStatus) {
        return res.status(400).json({ success: false, message: 'shipmentId and status are required' });
      }

      const { row: shipment, cols } = await getShipmentByIdForStatusActions(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      const userId = req.user.id;
      const isOwner = shipment.userId === userId;
      const isCarrier = shipment.carrier_id === userId;
      const isDriver = shipment.driver_id === userId;
      if (!isOwner && !isCarrier && !isDriver) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const normalizeStatus = s => String(s || '').trim().toLowerCase();
      const current = normalizeStatus(shipment.status);
      const next = normalizeStatus(nextStatus);

      // System-only statuses must not be set manually via this endpoint
      // - offer_accepted / accepted: controlled by offer-accept workflow
      // - assigned: controlled by assignment workflow
      if (['offer_accepted', 'accepted', 'assigned'].includes(next)) {
        return res.status(403).json({
          success: false,
          message: 'Bu durum sadece sistem tarafından güncellenebilir',
        });
      }

      // Role-based status permissions (keep UX simple; block misuse)
      // Owner: can cancel from early states, can confirm completion (completed)
      // Carrier/Driver: can move shipment operationally (picked_up/in_transit/delivered)
      const allowedNext = new Set();
      if (isOwner) {
        allowedNext.add('cancelled');
        allowedNext.add('canceled');
        allowedNext.add('completed');
      }
      if (isCarrier || isDriver) {
        allowedNext.add('picked_up');
        allowedNext.add('in_transit');
        allowedNext.add('delivered');
        allowedNext.add('completed');
      }

      if (!allowedNext.has(next)) {
        return res.status(403).json({
          success: false,
          message: 'Bu işlem için yetkiniz yok (rol/durum kuralı)',
        });
      }

      // Owner cancel should only be possible before the shipment is already in transit / delivered
      if (isOwner && (next === 'cancelled' || next === 'canceled')) {
        const blocked = new Set(['in_transit', 'picked_up', 'delivered', 'completed']);
        if (blocked.has(current)) {
          return res.status(409).json({
            success: false,
            message: 'Gönderi yola çıktıktan sonra iptal edilemez',
          });
        }
      }

      const currentStatus = shipment.status;
      if (currentStatus && !isValidTransition(currentStatus, nextStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${nextStatus}`,
        });
      }

      const ownerUserId = shipment.userId;
      const carrierId = shipment.carrier_id;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE shipments SET status = $1, ${cols.updatedAtCol} = CURRENT_TIMESTAMP WHERE id = $2`,
          [nextStatus, shipmentId]
        );

        // Best-effort: insert status history if available
        try {
          await queryWithFallback(
            `INSERT INTO shipment_status_history ("shipmentId", status, message, "createdat") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            `INSERT INTO shipment_status_history (shipmentId, status, message, createdat) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [shipmentId, nextStatus, notes || null]
          );
        } catch (e) {
          if (!(e && (e.code === '42P01' || e.code === '42703'))) {
            throw e;
          }
        }

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      // Auto status system messages (best-effort, low-noise)
      try {
        const s = String(nextStatus || '').trim().toLowerCase();
        let sysText = null;
        if (s === 'picked_up') {
          sysText = 'Yük alındı. Takip ekranı güncellendi.';
        } else if (s === 'in_transit') {
          sysText = 'Araç yola çıktı. Canlı takip güncellendi.';
        } else if (s === 'delivered') {
          sysText = 'Teslimat tamamlandı. Gönderici onayı bekleniyor.';
        } else if (s === 'completed') {
          sysText = 'Teslimat onaylandı. İşlem tamamlandı.';
        }

        if (sysText) {
          if (userId) {
            await insertSystemMessageIfMissing({ shipmentId, receiverId: userId, message: sysText });
          }
          if (carrierId) {
            await insertSystemMessageIfMissing({ shipmentId, receiverId: carrierId, message: sysText });
          }
        }
      } catch (_) {
        // ignore
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Error updating shipment status:', error);
      return res.status(500).json({ success: false, error: 'Failed to update status' });
    }
  });

  // Get active shipments for nakliyeci (accepted offers) - MUST be before '/' route
  router.get('/nakliyeci/active', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const userId = req.user.id;
      const { status } = req.query;
      const { page, limit, offset } = getPagination(req);

      // Ensure limit and offset are valid integers
      const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
      const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

      let query = `
        SELECT s.*,
               u."fullName" as "ownerName",
               u."companyName" as "ownerCompany",
               u."phone" as "ownerPhone",
               u."email" as "ownerEmail",
               o.price as "offerPrice",
               o.id as "offerId",
               COALESCE(s.price, o.price, 0) as "displayPrice",
               o.price as "value"
        FROM shipments s
        LEFT JOIN offers o ON s.id = o."shipmentId" AND (o.status = 'accepted' OR o.status = 'offer_accepted')
        LEFT JOIN users u ON s."userId" = u.id
        WHERE s."carrierId" = $1
          AND (s.status = 'offer_accepted' OR s.status = 'accepted' OR s.status = 'in_progress' OR s.status = 'assigned' OR s.status = 'in_transit' OR s.status = 'picked_up')
      `;

      const params = [userId];

      if (status && status !== 'all') {
        query += ` AND s.status = $${params.length + 1}`;
        params.push(status);
      }

      // Count query
      let countQuery = `
        SELECT COUNT(*) as count
        FROM shipments s
        WHERE s."carrierId" = $1 
          AND (s.status = 'offer_accepted' OR s.status = 'accepted' OR s.status = 'in_progress' OR s.status = 'assigned' OR s.status = 'in_transit' OR s.status = 'picked_up')
      `;
      const countParams = [userId];
      if (status && status !== 'all') {
        countQuery += ` AND s.status = $2`;
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      // LIMIT and OFFSET must be integers, not parameters
      query += ` ORDER BY COALESCE(s."updatedAt", s."createdat") DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
        shipments: result.rows,
        meta: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit),
        },
      });
    } catch (error) {
      // Error logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching nakliyeci active shipments:', error);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack,
      });
    }
  });

  // Get shipments by driver_id (for driver detail page) - MUST be before '/' route
  router.get('/driver/:driverId', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { driverId } = req.params;
      const nakliyeciId = req.user?.id;

      if (!nakliyeciId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Parse driverId as integer
      const parsedDriverId = parseInt(driverId, 10);
      if (isNaN(parsedDriverId)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz taşıyıcı ID',
        });
      }

      // Verify driver is linked to this nakliyeci
      const driverCheck = await pool.query(
        'SELECT driver_id FROM carrier_drivers WHERE carrier_id = $1 AND driver_id = $2',
        [nakliyeciId, parsedDriverId]
      );

      if (driverCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bu taşıyıcıya erişim yetkiniz yok',
        });
      }

      const result = await pool.query(
        `SELECT s.*,
               u."fullName" as "ownerName",
               u."companyName" as "ownerCompany",
               s."pickupCity" as "pickupCity",
               s."deliveryCity" as "deliveryCity",
               COALESCE(s.price, o.price, 0) as "displayPrice",
               o.price as "offerPrice",
               o.price as "value"
         FROM shipments s
         LEFT JOIN users u ON s."userId" = u.id
         LEFT JOIN offers o ON s.id = o."shipmentId" AND (o.status = 'accepted' OR o.status = 'offer_accepted')
         WHERE s.driver_id = $1 AND s."carrierId" = $2
         ORDER BY s."createdat" DESC
         LIMIT 20`,
        [parsedDriverId, nakliyeciId]
      );

      res.json({
        success: true,
        data: result.rows,
        shipments: result.rows,
      });
    } catch (error) {
      console.error('Error fetching driver shipments:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Gönderiler yüklenemedi',
        details: error.message,
      });
    }
  });

  // Get completed shipments for tasiyici (driver) - MUST be before '/tasiyici' route
  router.get('/tasiyici/completed', authenticateToken, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;
      const { page = 1, limit = 20, search = '' } = req.query;
      const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
      const safeOffset = Math.max(0, (parseInt(page, 10) || 1) - 1) * safeLimit;

      let conditions = [`s."driver_id" = $1`, `s.status = 'completed'`];
      let params = [userId];
      let paramIndex = 2;

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        conditions.push(
          `(s.title ILIKE $${paramIndex} OR
            s.description ILIKE $${paramIndex + 1} OR
            s."pickupCity" ILIKE $${paramIndex + 2} OR
            s."deliveryCity" ILIKE $${paramIndex + 3} OR
            s."trackingNumber" ILIKE $${paramIndex + 4})`
        );
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        paramIndex += 5;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT s.*, 
               u."fullName" as "ownerName",
               u."companyName" as "ownerCompany",
               u."phone" as "ownerPhone",
               u."email" as "ownerEmail",
               c."fullName" as "carrierName",
               c."companyName" as "carrierCompany",
               c."phone" as "carrierPhone",
               c."email" as "carrierEmail"
        FROM shipments s
        LEFT JOIN users u ON s."userId" = u.id
        LEFT JOIN users c ON s."carrierId" = c.id
        ${whereClause}
        ORDER BY s."updatedAt" DESC, s."createdat" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(*)
        FROM shipments s
        ${whereClause}
      `;

      const [shipmentsResult, countResult] = await Promise.all([
        pool.query(query, [...params, safeLimit, safeOffset]),
        pool.query(countQuery, params),
      ]);

      res.status(200).json({
        success: true,
        data: shipmentsResult.rows,
        shipments: shipmentsResult.rows,
        total: parseInt(countResult.rows[0]?.count || 0, 10),
        page: parseInt(page, 10) || 1,
        limit: safeLimit,
      });
    } catch (error) {
      console.error('Error fetching completed tasiyici shipments:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.message,
      });
    }
  });

  // Get shipments for tasiyici (driver) - MUST be before '/' route
  router.get('/tasiyici', authenticateToken, async (req, res) => {
    try {
      // Check authentication first
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;
      const { status } = req.query;

      let query = `
        SELECT s.*, 
               u."fullName" as "ownerName",
               u."companyName" as "ownerCompany",
               u."phone" as "ownerPhone",
               u."email" as "ownerEmail",
               c."fullName" as "carrierName",
               c."companyName" as "carrierCompany",
               c."phone" as "carrierPhone",
               c."email" as "carrierEmail"
        FROM shipments s
        LEFT JOIN users u ON s."userId" = u.id
        LEFT JOIN users c ON s."carrierId" = c.id
        WHERE s."driver_id" = $1
      `;

      const params = [userId];

      if (status) {
        query += ` AND s.status = $${params.length + 1}`;
        params.push(status);
      }

      const { page, limit, offset } = getPagination(req);
      
      // Ensure limit and offset are valid integers
      const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
      const safeOffset = Math.max(0, parseInt(offset, 10) || 0);
      
      // Count query for total
      let countQuery = `SELECT COUNT(*) as count FROM shipments s WHERE s."driver_id" = $1`;
      const countParams = [userId];
      
      if (status) {
        countQuery += ` AND s.status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      query += ` ORDER BY s."createdat" DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows,
        shipments: result.rows,
        meta: {
          total,
          page,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit),
        },
      });
    } catch (error) {
      // Error logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching tasiyici shipments:', error);
      }
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.message,
      });
    }
  });

  // Get shipments by driver_id (for driver detail page)
  router.get('/driver/:driverId', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { driverId } = req.params;
      const nakliyeciId = req.user?.id;

      if (!nakliyeciId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Verify driver is linked to this nakliyeci
      const driverCheck = await pool.query(
        'SELECT driver_id FROM carrier_drivers WHERE carrier_id = $1 AND driver_id = $2',
        [nakliyeciId, driverId]
      );

      if (driverCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bu taşıyıcıya erişim yetkiniz yok',
        });
      }

      const result = await pool.query(
        `SELECT s.*,
               u."fullName" as "ownerName",
               u."companyName" as "ownerCompany",
               s."pickupCity" as "pickupCity",
               s."deliveryCity" as "deliveryCity",
               COALESCE(s.price, o.price, 0) as "displayPrice",
               o.price as "offerPrice",
               o.price as "value"
         FROM shipments s
         LEFT JOIN users u ON s."userId" = u.id
         LEFT JOIN offers o ON s.id = o."shipmentId" AND (o.status = 'accepted' OR o.status = 'offer_accepted')
         WHERE s.driver_id = $1 AND s."carrierId" = $2
         ORDER BY s."createdat" DESC
         LIMIT 20`,
        [driverId, nakliyeciId]
      );

      res.json({
        success: true,
        data: result.rows,
        shipments: result.rows,
      });
    } catch (error) {
      console.error('Error fetching driver shipments:', error);
      res.status(500).json({
        success: false,
        message: 'Gönderiler yüklenemedi',
        details: error.message,
      });
    }
  });

  // Get shipments
  router.get('/', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const userId = req.user.id;
      const userRole = req.user.role || 'individual';
      const { status, city, search, q } = req.query;
      const searchTerm = search || q || '';

      let query = `
        SELECT s.*, 
               u."fullName" as "ownerName",
               u."companyName" as "ownerCompany",
               c."fullName" as "carrierName",
               c."companyName" as "carrierCompany",
               c."phone" as "carrierPhone",
               c."email" as "carrierEmail",
               s."carrierId" as "carrierId",
               o.price as "offerPrice",
               o.id as "offerId",
               COALESCE(s.price, o.price, 0) as "displayPrice",
               o.price as "value"
        FROM shipments s
        LEFT JOIN users u ON s."userId" = u.id
        LEFT JOIN users c ON s."carrierId" = c.id
        LEFT JOIN offers o ON s.id = o."shipmentId" AND (o.status = 'accepted' OR o.status = 'offer_accepted')
      `;

      const params = [];
      const conditions = [];

      if (userRole === 'individual' || userRole === 'corporate') {
        conditions.push('s."userId" = $1');
        params.push(userId);
      } else if (userRole === 'nakliyeci') {
        // Nakliyeci can see shipments where they are assigned OR where they have accepted offers
        conditions.push('(s."carrierId" = $1 OR EXISTS (SELECT 1 FROM offers o WHERE o."shipmentId" = s.id AND o."carrierId" = $1 AND o.status IN (\'accepted\', \'offer_accepted\')))');
        params.push(userId);
      } else if (userRole === 'tasiyici') {
        // Tasiyici can see shipments assigned to them
        conditions.push('s.driver_id = $1');
        params.push(userId);
      }

      if (status) {
        conditions.push(`s.status = $${params.length + 1}`);
        params.push(status);
      }

      if (city) {
        conditions.push(
          `(s."pickupCity" ILIKE $${params.length + 1} OR s."deliveryCity" ILIKE $${params.length + 1})`
        );
        params.push(`%${city}%`);
      }

      if (searchTerm && searchTerm.trim()) {
        const searchParam = `%${searchTerm.trim()}%`;
        const paramStart = params.length + 1;
        conditions.push(
          `(s.title ILIKE $${paramStart} OR 
            s.description ILIKE $${paramStart + 1} OR 
            s."pickupCity" ILIKE $${paramStart + 2} OR 
            s."deliveryCity" ILIKE $${paramStart + 3} OR
            s."pickupAddress" ILIKE $${paramStart + 4} OR
            s."deliveryAddress" ILIKE $${paramStart + 5} OR
            s."trackingNumber" ILIKE $${paramStart + 6})`
        );
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      const { page, limit, offset } = getPagination(req);
      // Ensure limit and offset are valid integers
      const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
      const safeOffset = Math.max(0, parseInt(offset, 10) || 0);
      query += ` ORDER BY s."createdat" DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const result = await pool.query(query, params);
      const normalizedRows = attachCategoryData(result.rows || []);
      
      // Build count query with same conditions but without LIMIT/OFFSET
      let countQuery = `SELECT COUNT(*) as count FROM shipments s`;
      const countParams = [];
      const countConditions = [];
      
      if (userRole === 'individual' || userRole === 'corporate') {
        countConditions.push('s."userId" = $1');
        countParams.push(userId);
      } else if (userRole === 'nakliyeci') {
        countConditions.push('(s."carrierId" = $1 OR EXISTS (SELECT 1 FROM offers o WHERE o."shipmentId" = s.id AND o."carrierId" = $1 AND o.status IN (\'accepted\', \'offer_accepted\')))');
        countParams.push(userId);
      } else if (userRole === 'tasiyici') {
        countConditions.push('s.driver_id = $1');
        countParams.push(userId);
      }

      if (status) {
        countConditions.push(`s.status = $${countParams.length + 1}`);
        countParams.push(status);
      }

      if (city) {
        countConditions.push(
          `(s."pickupCity" ILIKE $${countParams.length + 1} OR s."deliveryCity" ILIKE $${countParams.length + 1})`
        );
        countParams.push(`%${city}%`);
      }

      if (searchTerm && searchTerm.trim()) {
        const searchParam = `%${searchTerm.trim()}%`;
        const countParamStart = countParams.length + 1;
        countConditions.push(
          `(s.title ILIKE $${countParamStart} OR 
            s.description ILIKE $${countParamStart + 1} OR 
            s."pickupCity" ILIKE $${countParamStart + 2} OR 
            s."deliveryCity" ILIKE $${countParamStart + 3} OR
            s."pickupAddress" ILIKE $${countParamStart + 4} OR
            s."deliveryAddress" ILIKE $${countParamStart + 5} OR
            s."trackingNumber" ILIKE $${countParamStart + 6})`
        );
        countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
      }

      if (countConditions.length > 0) {
        countQuery += ' WHERE ' + countConditions.join(' AND ');
      }

      const countRes = await pool.query(countQuery, countParams);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: normalizedRows,
        shipments: normalizedRows,
        meta: { total: parseInt(countRes.rows[0].count), page, limit },
      });
    } catch (error) {
      // Error logging - only in development or for critical errors
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching shipments:', error);
        console.error('Error stack:', error.stack);
        if (typeof query !== 'undefined') {
          console.error('Query:', query);
        }
        if (typeof params !== 'undefined') {
          console.error('Params:', params);
        }
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Gönderiler yüklenemedi',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  // Create shipment
  router.post('/', authenticateToken, idempotencyGuard, async (req, res) => {
    console.log('📦 POST /api/shipments - Request received');
<<<<<<< HEAD
    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('User:', req.user?.id, req.user?.email);
      console.log('Request body keys:', Object.keys(req.body || {}));
      console.log('🔍 DEBUG - Request body pickupCity:', req.body?.pickupCity);
      console.log('🔍 DEBUG - Request body deliveryCity:', req.body?.deliveryCity);
    }
=======
    console.log('User:', req.user?.id, req.user?.email);
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Request body:', req.body);
    console.log('🔍 DEBUG - Request body pickupCity:', req.body?.pickupCity);
    console.log('🔍 DEBUG - Request body deliveryCity:', req.body?.deliveryCity);
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
    
    // Ensure response is always sent
    let responseSent = false;
    const sendResponse = (status, data) => {
      if (!responseSent) {
        responseSent = true;
        res.status(status).json(data);
      }
    };
    
    try {
      if (!pool) {
        console.error('❌ Database pool not available');
        sendResponse(500, {
          success: false,
          error: 'Database not available',
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        console.error('❌ User ID not found in request');
        sendResponse(401, {
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      console.log('✅ User authenticated, ID:', userId);
      const {
        title,
        description,
        category,
        pickupCity,
        pickupDistrict,
        pickupAddress,
        pickupDate,
        deliveryCity,
        deliveryDistrict,
        deliveryAddress,
        deliveryDate,
        weight,
        volume,
        dimensions,
        value,
        requiresInsurance,
        specialRequirements,
        categoryData,
      } = req.body;

      const normalizeCategoryData = (body) => {
        const cd = body?.categoryData;
        if (cd && typeof cd === 'object') return cd;
        const cds = body?.category_data;
        if (cds && typeof cds === 'object') return cds;

        const inferred = {};
        const copyIf = (key) => {
          if (body && body[key] != null && String(body[key]).trim() !== '') {
            inferred[key] = body[key];
          }
        };

        // Generic/special cargo
        copyIf('unitType');
        copyIf('temperatureSetpoint');
        copyIf('unNumber');
        copyIf('loadingEquipment');

        // House move
        copyIf('roomCount');
        copyIf('pickupFloor');
        copyIf('deliveryFloor');
        copyIf('buildingType');
        if (typeof body?.hasElevatorPickup === 'boolean') inferred.hasElevatorPickup = body.hasElevatorPickup;
        if (typeof body?.hasElevatorDelivery === 'boolean') inferred.hasElevatorDelivery = body.hasElevatorDelivery;
        if (typeof body?.needsPackaging === 'boolean') inferred.needsPackaging = body.needsPackaging;
        copyIf('specialItems');

        // Furniture
        copyIf('furniturePieces');
        if (typeof body?.isDisassembled === 'boolean') inferred.isDisassembled = body.isDisassembled;

        return Object.keys(inferred).length ? inferred : null;
      };

      const resolvedCategoryData = categoryData || normalizeCategoryData(req.body);

<<<<<<< HEAD
      // Debug: Log all received values (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 DEBUG - Received values:', {
          pickupCity,
          pickupAddress,
          deliveryCity,
          deliveryAddress,
          pickupDistrict,
          deliveryDistrict,
          body: req.body
        });
      }
=======
      // Debug: Log all received values
      console.log('🔍 DEBUG - Received values:', {
        pickupCity,
        pickupAddress,
        deliveryCity,
        deliveryAddress,
        pickupDistrict,
        deliveryDistrict,
        body: req.body
      });
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

      if (!pickupCity || !pickupAddress || !deliveryCity || !deliveryAddress) {
        sendResponse(400, {
          success: false,
          message: 'Pickup and delivery addresses are required',
        });
        return;
      }

      const trackingNumber = generateTrackingNumber();
<<<<<<< HEAD
      
      // Debug logging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Generated tracking number:', trackingNumber);
        console.log('🔍 Preparing INSERT query...');
        console.log('Values:', {
          userId,
          title: title || `${pickupCity} → ${deliveryCity}`,
          pickupCity,
          pickupDistrict,
          pickupAddress,
          deliveryCity,
          deliveryDistrict,
          deliveryAddress,
        });
      }
=======
      console.log('📝 Generated tracking number:', trackingNumber);

      console.log('🔍 Preparing INSERT query...');
      console.log('Values:', {
        userId,
        title: title || `${pickupCity} → ${deliveryCity}`,
        pickupCity,
        pickupDistrict,
        pickupAddress,
        deliveryCity,
        deliveryDistrict,
        deliveryAddress,
      });
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments'`
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));

      const pickCol = (...names) => names.find(n => cols.has(n)) || null;
      const add = (acc, col, val) => {
        if (!col) return;
        acc.columns.push(`"${col}"`);
        acc.values.push(val);
      };

      const shipmentTitle = title || `${pickupCity} → ${deliveryCity}`;
      const pickupDateValue = pickupDate ? new Date(pickupDate) : null;
      const deliveryDateValue = deliveryDate ? new Date(deliveryDate) : null;

      const insert = { columns: [], values: [] };

      add(insert, pickCol('userId', 'userId'), userId);
      add(insert, pickCol('user_id', 'userid', 'userId'), userId);

      add(insert, pickCol('title'), shipmentTitle);
      add(insert, pickCol('description'), description || null);
      add(insert, pickCol('category'), category || 'general');

<<<<<<< HEAD
      // Debug: Log which column names are being used (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 DEBUG - Column names for pickupCity/deliveryCity:', {
          pickupCityCol: pickCol('pickupCity', 'pickup_city'),
          deliveryCityCol: pickCol('deliveryCity', 'delivery_city'),
          pickupCityValue: pickupCity,
          deliveryCityValue: deliveryCity
        });
      }
=======
      // Debug: Log which column names are being used
      console.log('🔍 DEBUG - Column names for pickupCity/deliveryCity:', {
        pickupCityCol: pickCol('pickupCity', 'pickup_city'),
        deliveryCityCol: pickCol('deliveryCity', 'delivery_city'),
        pickupCityValue: pickupCity,
        deliveryCityValue: deliveryCity
      });
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

      add(insert, pickCol('pickupcity'), pickupCity);
      add(insert, pickCol('pickupdistrict'), pickupDistrict || null);
      add(insert, pickCol('pickupaddress', 'from_address'), pickupAddress);
      add(insert, pickCol('pickupdate'), pickupDateValue);

      add(insert, pickCol('deliverycity'), deliveryCity);
      add(insert, pickCol('deliverydistrict'), deliveryDistrict || null);
      add(insert, pickCol('deliveryaddress', 'to_address'), deliveryAddress);
      add(insert, pickCol('deliveryDate', 'delivery_date'), deliveryDateValue);

      add(insert, pickCol('weight', 'weight_kg'), weight || 0);
      add(insert, pickCol('volume', 'volume_m3'), volume || 0);
      add(insert, pickCol('dimensions'), dimensions || null);
      add(insert, pickCol('value', 'insurance_value'), value || 0);
      add(insert, pickCol('requiresInsurance', 'requires_insurance', 'insurance_required'), requiresInsurance || false);
      add(insert, pickCol('specialRequirements', 'special_requirements'), specialRequirements || null);

      const priceCol = pickCol('price', 'budget_max');
      if (priceCol) {
        const priceValue = req.body?.price ?? req.body?.budgetMax ?? req.body?.value ?? 0;
        add(insert, priceCol, priceValue);
      }

      add(insert, pickCol('status'), 'waiting_for_offers');
      add(insert, pickCol('trackingNumber', 'tracking_number'), trackingNumber);
      add(insert, pickCol('tracking_code'), trackingNumber);
      const categoryDataCol = pickCol('categoryData', 'category_data');
      if (categoryDataCol) {
        add(insert, categoryDataCol, resolvedCategoryData ? JSON.stringify(resolvedCategoryData) : null);
      }

      const baseMeta = { createdBy: userId, isDemo: req.user.isDemo || false };
      add(
        insert,
        pickCol('metadata'),
        JSON.stringify(resolvedCategoryData ? { ...baseMeta, categoryData: resolvedCategoryData } : baseMeta)
      );
      add(insert, pickCol('createdat', 'createdat'), new Date());
      add(insert, pickCol('updatedAt', 'updated_at'), new Date());

      if (insert.columns.length === 0) {
        throw new Error('No compatible columns found for shipments insert');
      }

      const placeholders = insert.values.map((_, idx) => `$${idx + 1}`).join(', ');
      const queryText = `INSERT INTO shipments (${insert.columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(queryText, insert.values);

      console.log('✅ INSERT query executed successfully');
      console.log('✅ Shipment created with ID:', result.rows[0]?.id);

      const shipment = attachCategoryData(result.rows[0]);

      // Create notification if available (non-blocking)
      if (createNotification) {
        try {
          await createNotification(
            userId,
            'shipment_created',
            'Gönderi Oluşturuldu',
            `Gönderiniz başarıyla oluşturuldu. Takip numaranız: ${trackingNumber}`,
            `/shipments/${shipment.id}`,
            'normal',
            { shipmentId: shipment.id, trackingNumber }
          );
        } catch (notifError) {
          // Log but don't fail the request
          console.error('Error creating notification (non-critical):', notifError);
        }
      }

      sendResponse(201, {
        success: true,
        message: 'Gönderi başarıyla oluşturuldu',
        data: {
          shipment: shipment,
          id: shipment.id,
        },
      });
    } catch (error) {
      console.error('❌❌❌ Error creating shipment ❌❌❌');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Request body:', JSON.stringify(req.body, null, 2));
      console.error('Error code:', error.code);
      console.error('Error detail:', error.detail);
      console.error('Error hint:', error.hint);
      console.error('Error table:', error.table);
      console.error('Error column:', error.column);
      console.error('Error constraint:', error.constraint);
      
      // Always include error details for debugging
      const errorResponse = {
        success: false,
        error: 'Gönderi oluşturulamadı',
        message: error.message || 'Unknown error',
        details: error.message,
        code: error.code || 'UNKNOWN',
        detail: error.detail || null,
        hint: error.hint || null,
        table: error.table || null,
        column: error.column || null,
        constraint: error.constraint || null,
      };
      
      // Only include stack in development
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = error.stack;
      }
      
      // Ensure response is sent
      try {
        if (!responseSent) {
          res.status(500).json(errorResponse);
          responseSent = true;
        }
      } catch (sendError) {
        console.error('❌ Failed to send error response:', sendError);
        // Last resort: try to send a simple error
        try {
          if (!responseSent) {
            res.status(500).send(
              JSON.stringify({ success: false, error: 'Internal server error' })
            );
          }
        } catch (e) {
          console.error('❌ Complete failure to send response:', e);
        }
      }
    }
  });

  // Get open shipments (for carriers)
  router.get('/open', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User ID not found',
        });
      }

      const { page, limit, offset } = getPagination(req);
      
      // Count total open shipments excluding those with pending offers from this nakliyeci
      const countRes = await queryWithFallback(
        `SELECT COUNT(*) as count
         FROM shipments s
         WHERE s.status IN ('pending', 'waiting_for_offers', 'open')
         AND s."carrierId" IS NULL
         AND s.id NOT IN (
           SELECT o."shipmentId" 
           FROM offers o 
           WHERE o."carrierId" = $1 AND o.status = 'pending'
         )`,
        `SELECT COUNT(*) as count
         FROM shipments s
         WHERE s.status IN ('pending', 'waiting_for_offers', 'open')
         AND s.carrierId IS NULL
         AND s.id NOT IN (
           SELECT o.shipmentId 
           FROM offers o 
           WHERE o.carrierId = $1 AND o.status = 'pending'
         )`,
        [userId]
      );

      const total = parseInt(countRes.rows[0].count, 10);

      // Get open shipments with pagination, excluding those with pending offers from this nakliyeci
      const result = await queryWithFallback(
        `SELECT s.*, 
                u."fullName" as "ownerName",
                u."companyName" as "ownerCompany"
         FROM shipments s
         LEFT JOIN users u ON s."userId" = u.id
         WHERE s.status IN ('pending', 'waiting_for_offers', 'open')
         AND s."carrierId" IS NULL
         AND s.id NOT IN (
           SELECT o."shipmentId" 
           FROM offers o 
           WHERE o."carrierId" = $1 AND o.status = 'pending'
         )
         ORDER BY s."createdat" DESC
         LIMIT $2 OFFSET $3`,
        `SELECT s.*, 
                u."fullName" as "ownerName",
                u."companyName" as "ownerCompany"
         FROM shipments s
         LEFT JOIN users u ON s."userId" = u.id
         WHERE s.status IN ('pending', 'waiting_for_offers', 'open')
         AND s.carrierId IS NULL
         AND s.id NOT IN (
           SELECT o.shipmentId 
           FROM offers o 
           WHERE o.carrierId = $1 AND o.status = 'pending'
         )
         ORDER BY s."createdat" DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching open shipments:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Açık gönderiler yüklenemedi',
        details: error.message,
      });
    }
  });

  // Compatibility: assign carrier for a shipment (used by nakliyeci Offers page)
  router.post('/:id/assign-carrier', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { id } = req.params;
      const { shipment } = await getShipmentById(id);
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
      }

      // Only allow shipment owner (individual/corporate) to trigger this action
      if (shipment.userId != null && shipment.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Bu gönderi için işlem yapma yetkiniz yok' });
      }

      // Minimal compat: frontend expects success response; real assignment handled elsewhere
      return res.json({ success: true, message: 'Atama isteği alındı' });
    } catch (error) {
      console.error('Error in assign-carrier:', error);
      return res.status(500).json({ success: false, message: 'Atama isteği işlenemedi' });
    }
  });

  // Compatibility: open broadcast for a shipment (used by nakliyeci Offers page)
  router.post('/:id/open-broadcast', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { id } = req.params;
      const { shipment } = await getShipmentById(id);
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
      }

      if (shipment.userId != null && shipment.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Bu gönderi için işlem yapma yetkiniz yok' });
      }

      return res.json({ success: true, message: 'Yayın isteği alındı' });
    } catch (error) {
      console.error('Error in open-broadcast:', error);
      return res.status(500).json({ success: false, message: 'Yayın isteği işlenemedi' });
    }
  });

  // Get shipment by ID
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const result = await pool.query(
        `SELECT s.*, 
                u.fullName as ownerName,
                u."companyName" as "ownerCompany",
                u.phone as ownerPhone,
                u.email as ownerEmail,
                c."fullName" as "carrierName",
                c."companyName" as "carrierCompany",
                c.phone as "carrierPhone",
                c.email as "carrierEmail",
                d."fullName" as "driverName",
                d.phone as "driverPhone",
                d.email as "driverEmail"
         FROM shipments s
         LEFT JOIN users u ON s."userId" = u.id
         LEFT JOIN users c ON s."carrierId" = c.id
         LEFT JOIN users d ON s."driver_id" = d.id
         WHERE s.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found',
        });
      }

      const row = attachCategoryData(result.rows[0]);

      // Attach assigned vehicle info (plate/type) if vehicles table exists
      try {
        const driverId = row.driver_id || row.driverId || row.driverID;
        if (driverId) {
          const colsRes = await pool.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles'`
          );
          const cols = new Set((colsRes.rows || []).map(r => r.column_name));

          if (cols.size > 0) {
            const pickCol = (...names) => names.find(n => cols.has(n)) || null;
            const ownerCol = pickCol('userId', 'userId', 'user_id', 'userId');
            const plateCol = pickCol('plate_number', 'plateNumber', 'vehiclePlate', 'plate');
            const typeCol = pickCol('type', 'vehicleType');
            const createdatCol = pickCol('createdat', 'createdat');

            if (ownerCol && (plateCol || typeCol)) {
              const qIdent = c => (/[A-Z]/.test(c) ? `"${c}"` : c);
              const ownerExpr = qIdent(ownerCol);
              const orderExpr = createdatCol ? qIdent(createdatCol) : null;

              const selectParts = [];
              if (plateCol) selectParts.push(`${qIdent(plateCol)} as plate`);
              if (typeCol) selectParts.push(`${qIdent(typeCol)} as type`);

              const vehQ = `SELECT ${selectParts.join(', ')} FROM vehicles WHERE ${ownerExpr} = $1${
                orderExpr ? ` ORDER BY ${orderExpr} DESC` : ''
              } LIMIT 1`;

              const vehRes = await pool.query(vehQ, [driverId]);
              const veh = vehRes.rows && vehRes.rows[0] ? vehRes.rows[0] : null;
              if (veh) {
                if (veh.plate != null && String(veh.plate).trim() !== '') row.vehiclePlate = String(veh.plate);
                if (veh.type != null && String(veh.type).trim() !== '') row.vehicleType = String(veh.type);
              }
            }
          }
        }
      } catch (e) {
        // If vehicles table doesn't exist or schema differs, ignore
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: row,
        shipment: row,
      });
    } catch (error) {
      console.error('Error fetching shipment:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Gönderi yüklenemedi',
        details: error.message,
      });
    }
  });

  // Demo-only: force assign carrier and status for smoke tests
  router.post('/:id/demo-force-assign-carrier', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      if (!req.user?.isDemo) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const { id } = req.params;
      const carrierId = req.user?.id;
      if (!carrierId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments'`
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pickCol = (...names) => names.find(n => cols.has(n)) || null;

      const idCol = pickCol('id', 'shipmentId', 'shipmentId');
      const carrierCol = pickCol('carrierId', 'carrier_id');
      const statusCol = pickCol('status');
      const updatedAtCol = pickCol('updatedAt', 'updated_at');

      if (!idCol || !carrierCol || !statusCol) {
        return res.status(500).json({ success: false, message: 'Shipments schema not compatible' });
      }

      const idExpr = /[A-Z]/.test(idCol) ? `"${idCol}"` : idCol;
      const carrierExpr = /[A-Z]/.test(carrierCol) ? `"${carrierCol}"` : carrierCol;
      const statusExpr = /[A-Z]/.test(statusCol) ? `"${statusCol}"` : statusCol;

      const setParts = [`${carrierExpr} = $1`, `${statusExpr} = $2`];
      const params = [carrierId, 'offer_accepted'];

      if (updatedAtCol) {
        const updatedExpr = /[A-Z]/.test(updatedAtCol) ? `"${updatedAtCol}"` : updatedAtCol;
        setParts.push(`${updatedExpr} = CURRENT_TIMESTAMP`);
      }

      params.push(Number(id));
      const q = `UPDATE shipments SET ${setParts.join(', ')} WHERE ${idExpr} = $${params.length}`;
      const upd = await pool.query(q, params);

      const rowRes = await pool.query(`SELECT * FROM shipments WHERE ${idExpr} = $1`, [Number(id)]);
      const row = rowRes.rows && rowRes.rows[0] ? attachCategoryData(rowRes.rows[0]) : null;

      return res.json({ success: true, updated: upd.rowCount, data: row });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Demo force assign failed', error: error.message });
    }
  });

  // Assign driver to shipment
  router.post('/:id/assign-driver', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const { driverId } = req.body;
      const nakliyeciId = req.user?.id;

      if (!nakliyeciId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!driverId) {
        return res.status(400).json({
          success: false,
          message: 'Taşıyıcı ID gerekli',
        });
      }

      // Verify shipment belongs to this nakliyeci
      const shipmentCheck = await pool.query(
        'SELECT id, "carrierId", status FROM shipments WHERE id = $1',
        [id]
      );

      if (shipmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      const shipment = shipmentCheck.rows[0];

      // Check if carrierId is null - cannot assign driver without accepted offer
      if (!shipment.carrierId) {
        return res.status(400).json({
          success: false,
          message: 'Bu gönderiye henüz teklif kabul edilmemiş. Önce bir teklif kabul edilmelidir.',
        });
      }

      if (shipment.carrierId !== nakliyeciId) {
        return res.status(403).json({
          success: false,
          message: 'Bu gönderiyi atama yetkiniz yok',
        });
      }

      // Verify driver exists and is linked to this nakliyeci
      const driverCheck = await pool.query(
        `SELECT cd.driver_id, u."fullName", u.phone
         FROM carrier_drivers cd
         INNER JOIN users u ON u.id = cd.driver_id
         WHERE cd.carrier_id = $1 AND cd.driver_id = $2`,
        [nakliyeciId, driverId]
      );

      if (driverCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Taşıyıcı bulunamadı veya bu nakliyeciye bağlı değil',
        });
      }

      // Get shipment owner ID for notification
      const shipmentOwner = await pool.query(
        'SELECT "userId" FROM shipments WHERE id = $1',
        [id]
      );
      const userId = shipmentOwner.rows[0]?.userId;

      // Validate status transition before updating
      const currentStatus = shipment.status;
      const transitionCheck = isValidTransition(currentStatus, 'in_progress');
      
      if (!transitionCheck.valid) {
        return res.status(400).json({
          success: false,
          message: transitionCheck.error || 'Gönderi durumu taşıyıcı ataması için uygun değil. Gönderi "offer_accepted" durumunda olmalıdır.',
        });
      }

      // Update shipment with driver assignment
      // Change status to 'in_progress' when driver is assigned
      const updateResult = await pool.query(
        `UPDATE shipments 
         SET driver_id = $1, 
             status = 'in_progress',
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = $3`,
        [driverId, id, currentStatus]
      );
      
      // Check if update was successful
      if (updateResult.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Gönderi durumu taşıyıcı ataması için uygun değil. Gönderi "offer_accepted" durumunda olmalıdır.',
        });
      }

      // Create notification for driver if createNotification is available
      if (createNotification) {
        try {
          await createNotification({
            userId: driverId,
            type: 'driver_assigned',
            title: 'Yeni İş Atandı',
            message: `Gönderi #${id} size atandı. Detayları görüntüleyin.`,
            shipmentId: parseInt(id),
          });
        } catch (notifError) {
          console.error('Notification creation failed:', notifError);
        }

        // Create notification for shipment owner (sender)
        if (userId) {
          try {
            await createNotification({
              userId: userId,
              type: 'driver_assigned',
              title: 'Taşıyıcı Atandı',
              message: `Gönderinize taşıyıcı atandı. Detayları görüntüleyin.`,
              shipmentId: parseInt(id),
            });
          } catch (notifError) {
            console.error('Notification creation for owner failed:', notifError);
          }
        }
      }

      res.json({
        success: true,
        message: 'Taşıyıcı başarıyla atandı',
      });
    } catch (error) {
      console.error('Error assigning driver:', error);
      res.status(500).json({
        success: false,
        message: 'Taşıyıcı atanamadı',
        details: error.message,
      });
    }
  });

  // Start transit - Change status from in_progress to in_transit
  router.post('/:id/start-transit', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Get shipment with driver info
      const shipmentResult = await pool.query(
        `SELECT s.id, s.status, s."driver_id", s."carrierId", s."userId"
         FROM shipments s
         WHERE s.id = $1`,
        [id]
      );

      if (shipmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      const shipment = shipmentResult.rows[0];

      // Check if user is the driver or nakliyeci
      const isDriver = shipment.driver_id === userId;
      const isNakliyeci = shipment.carrierId === userId;

      if (!isDriver && !isNakliyeci) {
        return res.status(403).json({
          success: false,
          message: 'Bu işlemi yapma yetkiniz yok. Sadece taşıyıcı veya nakliyeci bu işlemi yapabilir.',
        });
      }

      // Validate status transition
      const transitionCheck = isValidTransition(shipment.status, 'in_transit');
      if (!transitionCheck.valid) {
        return res.status(400).json({
          success: false,
          message: transitionCheck.error || 'Gönderi durumu yola çıkış için uygun değil. Gönderi "in_progress" durumunda olmalıdır.',
        });
      }

      // Update status to in_transit
      const updateResult = await pool.query(
        `UPDATE shipments 
         SET status = 'in_transit', 
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = ANY($2::text[])`,
        [id, ['in_progress', 'picked_up', 'assigned']]
      );

      if (updateResult.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Gönderi durumu yola çıkış için uygun değil.',
        });
      }

      // Create notifications
      if (createNotification) {
        // Notify shipment owner
        if (shipment.userId) {
          try {
            await createNotification({
              userId: shipment.userId,
              type: 'shipment_in_transit',
              title: 'Gönderi Yola Çıktı',
              message: `Gönderiniz yola çıktı. Takip edebilirsiniz.`,
              shipmentId: parseInt(id),
            });
          } catch (notifError) {
            console.error('Notification creation for owner failed:', notifError);
          }
        }

        // Notify nakliyeci (if not the one who started transit)
        if (shipment.carrierId && !isNakliyeci) {
          try {
            await createNotification({
              userId: shipment.carrierId,
              type: 'shipment_in_transit',
              title: 'Gönderi Yola Çıktı',
              message: `Gönderi #${id} yola çıktı.`,
              shipmentId: parseInt(id),
            });
          } catch (notifError) {
            console.error('Notification creation for nakliyeci failed:', notifError);
          }
        }
      }

      res.json({
        success: true,
        message: 'Gönderi yola çıkış durumuna güncellendi',
      });
    } catch (error) {
      console.error('Error starting transit:', error);
      res.status(500).json({
        success: false,
        message: 'Gönderi durumu güncellenemedi',
        details: error.message,
      });
    }
  });

  // Mark as delivered - Change status from in_transit to delivered (Driver action)
  router.post('/:id/mark-delivered', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Get shipment with driver info
      const shipmentResult = await pool.query(
        `SELECT s.id, s.status, s."driver_id", s."carrierId", s."userId"
         FROM shipments s
         WHERE s.id = $1`,
        [id]
      );

      if (shipmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      const shipment = shipmentResult.rows[0];

      // Only driver can mark as delivered
      if (shipment.driver_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu işlemi yapma yetkiniz yok. Sadece atanan taşıyıcı teslimatı işaretleyebilir.',
        });
      }

      // Validate status transition
      const transitionCheck = isValidTransition(shipment.status, 'delivered');
      if (!transitionCheck.valid) {
        return res.status(400).json({
          success: false,
          message: transitionCheck.error || 'Gönderi durumu teslimat için uygun değil. Gönderi "in_transit" durumunda olmalıdır.',
        });
      }

      // Update status to delivered
      const updateResult = await pool.query(
        `UPDATE shipments 
         SET status = 'delivered', 
             "actualDeliveryDate" = CURRENT_TIMESTAMP,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = $2`,
        [id, 'in_transit']
      );

      if (updateResult.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Gönderi durumu teslimat için uygun değil. Gönderi "in_transit" durumunda olmalıdır.',
        });
      }

      // Create notifications
      if (createNotification) {
        // Notify shipment owner
        if (shipment.userId) {
          try {
            await createNotification({
              userId: shipment.userId,
              type: 'shipment_delivered',
              title: 'Gönderi Teslim Edildi',
              message: `Gönderiniz teslim edildi. Lütfen teslimatı onaylayın.`,
              shipmentId: parseInt(id),
            });
          } catch (notifError) {
            console.error('Notification creation for owner failed:', notifError);
          }
        }

        // Notify nakliyeci
        if (shipment.carrierId) {
          try {
            await createNotification({
              userId: shipment.carrierId,
              type: 'shipment_delivered',
              title: 'Gönderi Teslim Edildi',
              message: `Gönderi #${id} teslim edildi. Gönderici onayını bekliyor.`,
              shipmentId: parseInt(id),
            });
          } catch (notifError) {
            console.error('Notification creation for nakliyeci failed:', notifError);
          }
        }
      }

      res.json({
        success: true,
        message: 'Gönderi teslim edildi olarak işaretlendi',
      });
    } catch (error) {
      console.error('Error marking as delivered:', error);
      res.status(500).json({
        success: false,
        message: 'Gönderi durumu güncellenemedi',
        details: error.message,
      });
    }
  });

  // Reject assignment (tasiyici/driver) - Frontend compatibility
  router.post('/:id/reject-assignment', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body || {};

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { row: shipment, cols } = await getShipmentByIdForStatusActions(parseInt(id, 10));
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
      }

      if (shipment.driver_id !== userId) {
        return res.status(403).json({ success: false, message: 'Bu görevi reddetme yetkiniz yok' });
      }

      // Move back to offer_accepted so carrier can re-assign another driver
      const nextStatus = 'offer_accepted';

      await pool.query(
        `UPDATE shipments SET driver_id = NULL, status = $1, ${cols.updatedAtCol} = CURRENT_TIMESTAMP WHERE id = $2`,
        [nextStatus, id]
      );

      // Best-effort history log
      try {
        await queryWithFallback(
          `INSERT INTO shipment_status_history ("shipmentId", status, message, "createdat") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          `INSERT INTO shipment_status_history (shipmentId, status, message, createdat) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [id, nextStatus, reason || null]
        );
      } catch (e) {
        if (!(e && (e.code === '42P01' || e.code === '42703'))) {
          throw e;
        }
      }

      res.json({ success: true, message: 'Görev reddedildi' });
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      res.status(500).json({ success: false, message: 'Görev reddedilemedi' });
    }
  });

  // Update shipment (compatibility for tasiyici panels) - supports status updates
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const { status } = req.body || {};

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!status) {
        return res.status(400).json({ success: false, message: 'status is required' });
      }

      const shipmentId = parseInt(id, 10);
      const { row: shipment, cols } = await getShipmentByIdForStatusActions(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
      }

      // Tasiyici screens use this endpoint for driver status updates
      if (shipment.driver_id !== userId) {
        return res.status(403).json({ success: false, message: 'Bu gönderiyi güncelleme yetkiniz yok' });
      }

      const normalizedStatus = status === 'picked_up' ? 'in_progress' : status;

      const transitionCheck = isValidTransition(shipment.status, normalizedStatus);
      if (!transitionCheck.valid) {
        return res.status(400).json({
          success: false,
          message: transitionCheck.error || `Invalid status transition from ${shipment.status} to ${normalizedStatus}`,
        });
      }

      if (normalizedStatus === 'delivered') {
        await pool.query(
          `UPDATE shipments 
           SET status = 'delivered',
               "actualDeliveryDate" = CURRENT_TIMESTAMP,
               ${cols.updatedAtCol} = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [shipmentId]
        );
      } else {
        await pool.query(
          `UPDATE shipments SET status = $1, ${cols.updatedAtCol} = CURRENT_TIMESTAMP WHERE id = $2`,
          [normalizedStatus, shipmentId]
        );
      }

      // Best-effort history log
      try {
        await queryWithFallback(
          `INSERT INTO shipment_status_history ("shipmentId", status, message, "createdat") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          `INSERT INTO shipment_status_history (shipmentId, status, message, createdat) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [shipmentId, normalizedStatus, null]
        );
      } catch (e) {
        if (!(e && (e.code === '42P01' || e.code === '42703'))) {
          throw e;
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating shipment (PUT /:id):', error);
      res.status(500).json({ success: false, message: 'Failed to update shipment' });
    }
  });

  // Cancel shipment (compatibility for individual/corporate panels)
  const cancelShipmentHandler = async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body || {};

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const shipmentId = parseInt(id, 10);
      const { row: shipment, cols } = await getShipmentByIdForStatusActions(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
      }

      // Only owner can cancel (consistent with frontend MyShipments)
      const shipmentOwnerUserId = shipment.userId || shipment.user_id;
<<<<<<< HEAD
      
      // Debug logging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 DEBUG - İptal yetki kontrolü:', {
          shipmentId,
          shipmentOwnerUserId,
          requestUserId: userId,
          match: shipmentOwnerUserId === userId
        });
      }
      
=======
      console.log('🔍 DEBUG - İptal yetki kontrolü:', {
        shipmentId,
        shipment,
        shipmentOwnerUserId,
        requestUserId: userId,
        match: shipmentOwnerUserId === userId
      });
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      if (shipmentOwnerUserId !== userId) {
        return res.status(403).json({ success: false, message: 'Bu gönderiyi iptal etme yetkiniz yok' });
      }

      const transitionCheck = isValidTransition(shipment.status, 'cancelled');
      if (!transitionCheck.valid) {
        return res.status(400).json({
          success: false,
          message: transitionCheck.error || `Geçersiz durum geçişi: ${shipment.status} -> cancelled`,
        });
      }

      try {
        await pool.query(
          `UPDATE shipments SET status = 'cancelled', "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
          [shipmentId]
        );
      } catch (updateError) {
        // Fallback: updatedAt column olmadan sadece status güncelle
        await pool.query(
          `UPDATE shipments SET status = 'cancelled' WHERE id = $1`,
          [shipmentId]
        );
      }

      // Best-effort history log
      try {
        await queryWithFallback(
          `INSERT INTO shipment_status_history ("shipmentId", status, message, "createdat") VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          `INSERT INTO shipment_status_history (shipmentId, status, message, createdat) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [shipmentId, 'cancelled', reason || null]
        );
      } catch (e) {
        if (!(e && (e.code === '42P01' || e.code === '42703'))) {
          throw e;
        }
      }

      // Frontend expects refund/commission fields; keep compat flags without implementing payment reversal here.
      return res.json({
        success: true,
        data: {
          commissionRefunded: false,
          refundDenied: true,
          refundReason: 'Komisyon iadesi bu akışta uygulanmadı',
        },
        warning: 'Gönderi iptal edildi. Komisyon iadesi uygulanmadı.',
      });
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      return res.status(500).json({ success: false, message: 'Gönderi iptal edilemedi' });
    }
  };

  router.post('/:id/cancel', authenticateToken, cancelShipmentHandler);
  // Compatibility: some clients use PUT
  router.put('/:id/cancel', authenticateToken, cancelShipmentHandler);

  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.json({ success: true });
      }

      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const shipmentId = parseInt(id, 10);
      const { row: shipment, cols } = await getShipmentByIdForStatusActions(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
      }

      const shipmentOwnerUserId = shipment.userId || shipment.userId || shipment.user_id;
      const nakliyeciId = shipment.carrierId || shipment.nakliyeciId;
      const driverId = shipment.driver_id || shipment.driverId;
      const allowed = userId === shipmentOwnerUserId || nakliyeciId === userId || driverId === userId;
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Bu gönderiyi silme yetkiniz yok' });
      }

      try {
        await pool.query(
          `UPDATE shipments SET status = 'cancelled', "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
          [shipmentId]
        );
      } catch (updateError) {
        // Fallback: updatedAt column olmadan sadece status güncelle
        await pool.query(
          `UPDATE shipments SET status = 'cancelled' WHERE id = $1`,
          [shipmentId]
        );
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting shipment (DELETE /:id):', error);
      return res.status(500).json({ success: false, message: 'Failed to delete shipment' });
    }
  });

  // Confirm delivery - Change status from delivered to completed
  router.post('/:id/confirm-delivery', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const shipmentId = parseInt(id, 10);
      if (!shipmentId) {
        return res.status(400).json({ success: false, message: 'Invalid shipment id' });
      }

      const { row: shipmentBase } = await getShipmentByIdForStatusActions(shipmentId);
      if (!shipmentBase) {
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      // Best-effort: fetch extra fields for payment logic
      let extra = { price: null, acceptedOfferId: null };
      try {
        const extraRes = await pool.query('SELECT price, "acceptedOfferId" FROM shipments WHERE id = $1', [shipmentId]);
        extra = extraRes.rows && extraRes.rows[0] ? extraRes.rows[0] : extra;
      } catch (_eCamel) {
        try {
          const extraRes = await pool.query('SELECT price, accepted_offer_id as "acceptedOfferId" FROM shipments WHERE id = $1', [shipmentId]);
          extra = extraRes.rows && extraRes.rows[0] ? extraRes.rows[0] : extra;
        } catch (_) {
          // ignore
        }
      }

      const shipment = {
        id: shipmentId,
        status: shipmentBase.status,
        driver_id: shipmentBase.driver_id,
        carrierId: shipmentBase.carrier_id,
        userId: shipmentBase.userId,
        price: extra.price,
        acceptedOfferId: extra.acceptedOfferId,
      };

      // Only shipment owner can confirm delivery
      if (shipment.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bu işlemi yapma yetkiniz yok. Sadece gönderi sahibi teslimatı onaylayabilir.',
        });
      }

      // Validate status transition
      const transitionCheck = isValidTransition(shipment.status, 'completed');
      if (!transitionCheck.valid) {
        return res.status(400).json({
          success: false,
          message: transitionCheck.error || 'Gönderi durumu teslimat onayı için uygun değil. Gönderi "delivered" durumunda olmalıdır.',
        });
      }

      // Start transaction for payment release
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update status to completed
        const updateResult = await client.query(
          `UPDATE shipments 
           SET status = 'completed', 
               "updatedAt" = CURRENT_TIMESTAMP
           WHERE id = $1 AND status = $2`,
          [id, 'delivered']
        );

        if (updateResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Gönderi durumu teslimat onayı için uygun değil. Gönderi "delivered" durumunda olmalıdır.',
          });
        }

        // Release payment to nakliyeci if price exists
        // IMPORTANT: Commission was already deducted when offer was accepted
        // So we only deposit the full price amount here (commission already taken)
        let paymentReleased = false;
        let paymentAmount = 0;
        let commissionAmount = 0;

        if (shipment.carrierId && shipment.price) {
          paymentAmount = parseFloat(shipment.price);
          commissionAmount = parseFloat((paymentAmount * 0.01).toFixed(2)); // 1% commission (already deducted at offer acceptance)
          // Commission was already deducted, so nakliyeci receives full price
          // The commission was taken from their wallet when offer was accepted
          const nakliyeciReceives = paymentAmount;

          // Get or create wallet for nakliyeci
          let walletResult = await client.query(
            `SELECT id, balance, userid FROM wallets WHERE userid = $1`,
            [shipment.carrierId]
          );

          if (walletResult.rows.length === 0) {
            // Try with user_id
            walletResult = await client.query(
              `SELECT id, balance, "user_id" as userid FROM wallets WHERE "user_id" = $1`,
              [shipment.carrierId]
            );
          }

          let walletId;
          if (walletResult.rows.length === 0) {
            // Create wallet
            try {
              const newWallet = await client.query(
                `INSERT INTO wallets (userid, balance, createdat, updatedat) 
                 VALUES ($1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                 RETURNING id, balance, userid`,
                [shipment.carrierId]
              );
              walletId = newWallet.rows[0].id;
            } catch (createError) {
              // Try with user_id
              try {
                const newWallet = await client.query(
                  `INSERT INTO wallets ("user_id", balance, "createdat", "updated_at") 
                   VALUES ($1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                   RETURNING id, balance, "user_id" as userid`,
                  [shipment.carrierId]
                );
                walletId = newWallet.rows[0].id;
              } catch (e) {
                console.error('Could not create wallet:', e.message);
                throw new Error('Cüzdan oluşturulamadı');
              }
            }
          } else {
            walletId = walletResult.rows[0].id;
          }

          // Deposit payment to nakliyeci wallet (net amount after commission)
          try {
            await client.query(
              `UPDATE wallets 
               SET balance = balance + $1, "updatedAt" = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [nakliyeciReceives, walletId]
            );
          } catch (e1) {
            try {
              await client.query(
                `UPDATE wallets 
                 SET balance = balance + $1, updatedat = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [nakliyeciReceives, walletId]
              );
            } catch (e2) {
              await client.query(
                `UPDATE wallets 
                 SET balance = balance + $1, "updated_at" = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [nakliyeciReceives, walletId]
              );
            }
          }

          // Record transaction
          try {
            await client.query(
              `INSERT INTO transactions (user_id, wallet_id, type, amount, description, reference_id, createdat)
               VALUES ($1, $2, 'payment_release', $3, $4, $5, CURRENT_TIMESTAMP)`,
              [
                shipment.carrierId,
                walletId,
                nakliyeciReceives,
                `Gönderi #${id} tamamlandı - Ödeme serbest bırakıldı (Komisyon ${commissionAmount} TL teklif kabul edildiğinde kesilmişti)`,
                id,
              ]
            );
          } catch (txError) {
            // Transaction table might have different column names, try alternative
            try {
              await client.query(
                `INSERT INTO transactions (userid, walletid, type, amount, description, referenceid, createdat)
                 VALUES ($1, $2, 'payment_release', $3, $4, $5, CURRENT_TIMESTAMP)`,
                [
                  shipment.carrierId,
                  walletId,
                  nakliyeciReceives,
                  `Gönderi #${id} tamamlandı - Ödeme serbest bırakıldı (Komisyon ${commissionAmount} TL teklif kabul edildiğinde kesilmişti)`,
                  id,
                ]
              );
            } catch (e) {
              console.error('Could not record transaction:', e.message);
              // Non-critical, continue
            }
          }

          paymentReleased = true;
        }

        await client.query('COMMIT');

        // Create notifications
        if (createNotification) {
          // Notify nakliyeci
          if (shipment.carrierId) {
            try {
              await createNotification({
                userId: shipment.carrierId,
                type: 'payment_released',
                title: 'Ödeme Serbest Bırakıldı',
                message: `Gönderi #${id} tamamlandı. ${paymentReleased ? `Ödeme cüzdanınıza yatırıldı (${paymentAmount - commissionAmount} TL).` : 'Ödeme işlemi tamamlandı.'}`,
                shipmentId: parseInt(id),
              });
            } catch (notifError) {
              console.error('Notification creation for nakliyeci failed:', notifError);
            }
          }

          // Notify driver
          if (shipment.driver_id) {
            try {
              await createNotification({
                userId: shipment.driver_id,
                type: 'shipment_completed',
                title: 'Gönderi Tamamlandı',
                message: `Gönderi #${id} başarıyla tamamlandı.`,
                shipmentId: parseInt(id),
              });
            } catch (notifError) {
              console.error('Notification creation for driver failed:', notifError);
            }
          }
        }

        res.json({
          success: true,
          message: 'Teslimat başarıyla onaylandı',
          data: {
            paymentReleased,
            paymentAmount: paymentReleased ? paymentAmount : null,
            commissionAmount: paymentReleased ? commissionAmount : null,
            nakliyeciReceives: paymentReleased ? paymentAmount - commissionAmount : null,
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      res.status(500).json({
        success: false,
        message: 'Teslimat onaylanamadı',
        details: error.message,
      });
    }
  });

  // Get tracking updates for a shipment
  router.get('/:id/tracking', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const result = await pool.query(
        `SELECT 
          tu.id,
          tu.shipmentId,
          tu.status,
          tu.location,
          tu.notes as notes,
          tu.updated_by,
          u."fullName" as updated_by_name,
          tu.createdat
        FROM tracking_updates tu
        LEFT JOIN users u ON tu.updated_by = u.id
        WHERE tu.shipmentId = $1
        ORDER BY tu.createdat DESC`,
        [id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching tracking updates:', error);
      res.status(500).json({
        success: false,
        error: 'Tracking updates could not be fetched',
        details: error.message,
      });
    }
  });

  // Add tracking update
  router.post('/:id/tracking', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const { status, location, notes } = req.body;
      const userId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
        });
      }

      const result = await pool.query(
        `INSERT INTO tracking_updates 
          (shipmentId, status, location, notes, updated_by, createdat)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id, createdat`,
        [id, status, location || '', notes || '', userId]
      );

      // Update shipment status if needed
      try {
        await pool.query(
          `UPDATE shipments 
          SET status = $1, "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $2`,
          [status, id]
        );
      } catch (e1) {
        try {
          await pool.query(
            `UPDATE shipments 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`,
            [status, id]
          );
        } catch (e2) {
          await pool.query(
            `UPDATE shipments 
            SET status = $1, "updated_at" = CURRENT_TIMESTAMP
            WHERE id = $2`,
            [status, id]
          );
        }
      }

<<<<<<< HEAD
      // Socket.io removed - real-time updates not needed
      // Tracking updates available via REST API polling
=======
      // Send real-time notification via Socket.IO
      if (io) {
        io.to(`shipment_${id}`).emit('tracking_update', {
          shipmentId: id,
          status,
          location,
          notes,
          updatedBy: userId,
          timestamp: new Date().toISOString(),
        });
      }
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

      res.json({
        success: true,
        data: {
          id: result.rows[0].id,
          createdat: result.rows[0].createdat,
        },
      });
    } catch (error) {
      console.error('Error adding tracking update:', error);
      res.status(500).json({
        success: false,
        error: 'Tracking update could not be added',
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = createShipmentRoutes;







