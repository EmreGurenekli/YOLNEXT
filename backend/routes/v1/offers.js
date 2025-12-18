// Offers routes - Modular version
const express = require('express');
const router = express.Router();

const { clearCachePattern } = require('../../utils/cache');
const { getPagination } = require('../../utils/routeHelpers');

function createOfferRoutes(pool, authenticateToken, createNotification, sendEmail, sendSMS, writeAuditLog, offerSpeedLimiter, idempotencyGuard) {
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
        `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, "isActive", "createdAt", "updatedAt")
         VALUES ($1, '', 'YolNext', 'Sistem', 'YolNext Sistem', 'system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [email]
      );
      systemUserIdCache = inserted.rows[0].id;
      return systemUserIdCache;
    } catch (_eCamel) {
      try {
        const inserted = await pool.query(
          `INSERT INTO users (email, password, first_name, last_name, full_name, role, is_active, created_at, updated_at)
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
          'SELECT 1 FROM messages WHERE shipment_id = $1 AND receiver_id = $2 AND sender_id = $3 AND content = $4 LIMIT 1',
          [shipmentId, receiverId, systemUserId, message]
        );
        if (exists.rows && exists.rows.length > 0) return;
      } catch (_) {
        // ignore
      }
    }

    try {
      await pool.query(
        `INSERT INTO messages ("shipmentId", "senderId", "receiverId", message, "messageType", "createdAt")
         VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)`,
        [shipmentId, systemUserId, receiverId, message]
      );
    } catch (_eCamelInsert) {
      try {
        await pool.query(
          `INSERT INTO messages ("shipmentId", "senderId", "receiverId", message, "createdAt")
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [shipmentId, systemUserId, receiverId, message]
        );
      } catch (_eSnakeInsert) {
        try {
          await pool.query(
            `INSERT INTO messages (shipment_id, sender_id, receiver_id, content, message_type, created_at)
             VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)`,
            [shipmentId, systemUserId, receiverId, message]
          );
        } catch (_) {
          // ignore
        }
      }
    }
  };

  // Get offers for individual/corporate user
  const getIndividualOffersHandler = async (req, res) => {
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

      if (userRole !== 'individual' && userRole !== 'corporate') {
        return res.status(403).json({
          success: false,
          error: 'This endpoint is only available for individual and corporate users',
        });
      }

      const { status } = req.query;
      const { page, limit, offset } = getPagination(req);

      let query = `
        SELECT o.id,
               o."shipment_id" as "shipmentId",
               o."nakliyeci_id" as "carrierId",
               o.price,
               o.message,
               o."estimatedDelivery" as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               o."createdAt" as "createdAt",
               o."updatedAt" as "updatedAt",
               s.title as "shipmentTitle",
               s.description as "shipmentDescription",
               s."pickupCity" as "pickupCity",
               s."pickupAddress" as "pickupAddress",
               s."deliveryCity" as "deliveryCity",
               s."deliveryAddress" as "deliveryAddress",
               s.weight,
               s.dimensions,
               s."specialRequirements" as "specialRequirements",
               (c."firstName" || ' ' || c."lastName") as "carrierName",
               c."companyName" as "carrierCompany",
               (u."firstName" || ' ' || u."lastName") as "userName",
               u."companyName" as "userCompany"
        FROM offers o
        LEFT JOIN shipments s ON o."shipment_id" = s.id
        LEFT JOIN users c ON o."nakliyeci_id" = c.id
        LEFT JOIN users u ON s."user_id" = u.id
        WHERE s."user_id" = $1
      `;

      const params = [userId];

      if (status && status !== 'all') {
        query += ` AND o.status = $${params.length + 1}`;
        params.push(status);
      }

      query += ` ORDER BY o."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM offers o INNER JOIN shipments s ON o."shipment_id" = s.id WHERE s."user_id" = $1${status && status !== 'all' ? ` AND o.status = $2` : ''}`,
        status && status !== 'all' ? [userId, status] : [userId]
      );

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: result.rows,
        offers: result.rows,
        meta: { total: parseInt(countRes.rows[0].count), page, limit },
      });
    } catch (error) {
      // Error logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching individual offers:', error);
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklifler yüklenemedi',
        details: error.message,
      });
    }
  };

  router.get('/individual', authenticateToken, getIndividualOffersHandler);
  // Compatibility: corporate UI calls /api/offers/corporate
  router.get('/corporate', authenticateToken, getIndividualOffersHandler);

  // Get all offers
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
      const { status, shipmentId } = req.query;
      const { page, limit, offset } = getPagination(req);

      let query = `
        SELECT o.id,
               o."shipment_id" as "shipmentId",
               o."nakliyeci_id" as "carrierId",
               o.price,
               o.message,
               o."estimatedDelivery" as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               o."createdAt" as "createdAt",
               o."updatedAt" as "updatedAt",
               s.title as "shipmentTitle",
               s.description as "shipmentDescription",
               s."pickupCity" as "pickupCity",
               s."pickupAddress" as "pickupAddress",
               s."deliveryCity" as "deliveryCity",
               s."deliveryAddress" as "deliveryAddress",
               (c."firstName" || ' ' || c."lastName") as "carrierName",
               c."companyName" as "carrierCompany"
        FROM offers o
        INNER JOIN shipments s ON o."shipment_id" = s.id
        LEFT JOIN users c ON o."nakliyeci_id" = c.id
        WHERE 1=1
      `;

      const params = [];

      if (userRole === 'individual' || userRole === 'corporate') {
        query += ` AND s."user_id" = $${params.length + 1}`;
        params.push(userId);
      } else       if (userRole === 'nakliyeci') {
        query += ` AND o."nakliyeci_id" = $${params.length + 1}`;
        params.push(userId);
      }

      if (shipmentId) {
        query += ` AND o."shipment_id" = $${params.length + 1}`;
        params.push(shipmentId);
      }

      if (status && status !== 'all') {
        query += ` AND o.status = $${params.length + 1}`;
        params.push(status);
      }

      // Build count query separately
      let countQuery = `
        SELECT COUNT(*) as count
        FROM offers o
        INNER JOIN shipments s ON o."shipment_id" = s.id
        LEFT JOIN users c ON o."nakliyeci_id" = c.id
        WHERE 1=1
      `;
      const countParams = [];

      if (userRole === 'individual' || userRole === 'corporate') {
        countQuery += ` AND s."user_id" = $${countParams.length + 1}`;
        countParams.push(userId);
      } else if (userRole === 'nakliyeci') {
        countQuery += ` AND o."nakliyeci_id" = $${countParams.length + 1}`;
        countParams.push(userId);
      }

      if (shipmentId) {
        countQuery += ` AND o."shipment_id" = $${countParams.length + 1}`;
        countParams.push(shipmentId);
      }

      if (status && status !== 'all') {
        countQuery += ` AND o.status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      query += ` ORDER BY o."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const [result, countRes] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, countParams)
      ]);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: result.rows,
        offers: result.rows,
        meta: { total: parseInt(countRes.rows[0].count), page, limit },
      });
    } catch (error) {
      // Error logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching offers:', error);
        console.error('Error stack:', error.stack);
        console.error('Query:', query);
        console.error('Params:', params);
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklifler yüklenemedi',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  // Get offer by ID
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
        `SELECT o.id,
               o."shipment_id" as "shipmentId",
               o."nakliyeci_id" as "carrierId",
               o.price,
               o.message,
               o."estimatedDelivery" as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               o."createdAt" as "createdAt",
               o."updatedAt" as "updatedAt", 
                s.title as "shipmentTitle",
                s.description as "shipmentDescription",
                s."pickupCity" as "pickupCity",
                s."pickupAddress" as "pickupAddress",
                s."deliveryCity" as "deliveryCity",
                s."deliveryAddress" as "deliveryAddress",
                (c."firstName" || ' ' || c."lastName") as "carrierName",
                c."companyName" as "carrierCompany"
         FROM offers o
         INNER JOIN shipments s ON o."shipment_id" = s.id
         LEFT JOIN users c ON o."nakliyeci_id" = c.id
         WHERE o.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found',
        });
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching offer:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklif yüklenemedi',
        details: error.message,
      });
    }
  });

  // Create offer
  router.post('/', authenticateToken, offerSpeedLimiter, idempotencyGuard, async (req, res) => {
    try {
      // Validate user authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
      }

      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const carrierId = req.user.id;
      const { shipmentId, price, message, estimatedDelivery } = req.body;

      if (!shipmentId || !price) {
        return res.status(400).json({
          success: false,
          message: 'Shipment ID and price are required',
        });
      }

      // Check if shipment exists and is waiting for offers
      const shipmentResult = await pool.query(
        'SELECT * FROM shipments WHERE id = $1 AND status = $2',
        [shipmentId, 'waiting_for_offers']
      );

      if (shipmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found or not available for offers',
        });
      }

      // Check for duplicate offer
      const existingOffer = await pool.query(
        'SELECT id FROM offers WHERE "shipment_id" = $1 AND "nakliyeci_id" = $2 AND status = $3',
        [shipmentId, carrierId, 'pending']
      );

      if (existingOffer.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending offer for this shipment',
        });
      }

      const result = await pool.query(
        `INSERT INTO offers ("shipment_id", "nakliyeci_id", price, message, "estimatedDelivery", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, "shipment_id" as "shipmentId", "nakliyeci_id" as "carrierId", price, message, "estimatedDelivery" as "estimatedDelivery", status, "createdAt" as "createdAt", "updatedAt" as "updatedAt"`,
        [shipmentId, carrierId, price, message || '', estimatedDelivery || null, 'pending']
      );

      const offer = result.rows[0];

      // Notify shipment owner (non-blocking, don't fail if notification fails)
      const shipment = shipmentResult.rows[0];
      if (createNotification && shipment && shipment.userId) {
        try {
          await createNotification(
            shipment.userId,
            'new_offer',
            'Yeni Teklif',
            `Gönderiniz için yeni bir teklif aldınız.`,
            `/shipments/${shipmentId}`,
            'normal',
            { offerId: offer.id, shipmentId }
          );
        } catch (notifError) {
          // Log but don't fail the request
          console.error('Error creating notification (non-critical):', notifError);
        }
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(201).json({
        success: true,
        message: 'Teklif başarıyla oluşturuldu',
        data: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      console.error('Error stack:', error.stack);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklif oluşturulamadı',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      });
    }
  });

  // Accept offer (support both POST and PUT)
  const acceptOfferHandler = async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      // Get offer with shipment info
      const offerResult = await pool.query(
        `SELECT o.id,
               o."shipment_id" as "shipmentId",
               o."nakliyeci_id" as "carrierId",
               o.price,
               o.message,
               o."estimatedDelivery" as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               o."createdAt" as "createdAt",
               o."updatedAt" as "updatedAt", 
                o."shipment_id" as "shipmentId",
                o."nakliyeci_id" as "carrierId",
                s."user_id" as "shipmentOwnerId", 
                s.status as "shipmentStatus"
         FROM offers o
         INNER JOIN shipments s ON o."shipment_id" = s.id
         WHERE o.id = $1`,
        [id]
      );

      if (offerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found',
        });
      }

      const offer = offerResult.rows[0];
      // Map column names for compatibility
      const shipmentId = offer.shipmentId || offer.shipment_id;
      const carrierId = offer.carrierId || offer.nakliyeci_id || offer.carrier_id;

      // Offer must be pending to be accepted (prevents double-accept)
      if (offer.status && offer.status !== 'pending') {
        return res.status(409).json({
          success: false,
          message: 'Offer is not in a valid state to be accepted',
        });
      }

      // Check if user owns the shipment
      if (offer.shipmentOwnerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only accept offers for your own shipments',
        });
      }

      // Check if shipment is in correct status
      // Do not allow accept if shipment is already offer_accepted/assigned (prevents double accept).
      if (!['pending', 'open', 'waiting_for_offers'].includes(offer.shipmentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Shipment is not in a valid state to accept offers',
        });
      }

      // Start transaction using a client for proper transaction management
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        const shipTableRes = await client.query(
          `SELECT table_schema
           FROM information_schema.tables
           WHERE table_name = 'shipments'
           ORDER BY (table_schema = 'public') DESC, table_schema ASC
           LIMIT 1`
        );
        const shipSchema = shipTableRes.rows && shipTableRes.rows[0]?.table_schema ? shipTableRes.rows[0].table_schema : 'public';

        const shipColsRes = await client.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments' AND table_schema = $1`,
          [shipSchema]
        );
        const shipCols = new Set((shipColsRes.rows || []).map(r => r.column_name));

        const pickCol = (...names) => names.find(n => shipCols.has(n)) || null;
        const idCol = pickCol('id', 'shipment_id', 'shipmentId');
        const carrierCol = pickCol('nakliyeci_id', 'carrier_id');
        const acceptedOfferCol = pickCol('acceptedOfferId', 'accepted_offer_id');
        const updatedAtCol = pickCol('updatedAt', 'updated_at');
        const priceCol = pickCol('price');
        const statusCol = pickCol('status');

        if (!idCol || !statusCol) {
          throw new Error('Shipments table schema not compatible for offer accept');
        }

        const idNeedsQuotes = /[A-Z]/.test(idCol);
        const idExpr = idNeedsQuotes ? `"${idCol}"` : idCol;
        const statusNeedsQuotes = /[A-Z]/.test(statusCol);
        const statusExpr = statusNeedsQuotes ? `"${statusCol}"` : statusCol;
        const carrierExpr = carrierCol
          ? (/[A-Z]/.test(carrierCol) ? `"${carrierCol}"` : carrierCol)
          : null;
        const acceptedOfferExpr = acceptedOfferCol
          ? (/[A-Z]/.test(acceptedOfferCol) ? `"${acceptedOfferCol}"` : acceptedOfferCol)
          : null;

        const lockSelectCols = [statusExpr, carrierExpr, acceptedOfferExpr].filter(Boolean).join(', ');
        const lockSql = `SELECT ${lockSelectCols} FROM "${shipSchema}".shipments WHERE ${idExpr} = $1 FOR UPDATE`;
        const lockedShipmentRes = await client.query(lockSql, [shipmentId]);
        const lockedShipment = lockedShipmentRes.rows && lockedShipmentRes.rows[0] ? lockedShipmentRes.rows[0] : null;
        if (!lockedShipment) {
          return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        const lockedStatus = lockedShipment[statusCol] || lockedShipment.status;
        const lockedCarrier = carrierCol ? (lockedShipment[carrierCol] ?? lockedShipment.carrier_id ?? lockedShipment.nakliyeci_id) : null;
        const lockedAcceptedOffer = acceptedOfferCol
          ? (lockedShipment[acceptedOfferCol] ?? lockedShipment.accepted_offer_id ?? lockedShipment.acceptedOfferId)
          : null;

        if (lockedCarrier != null || lockedAcceptedOffer != null || lockedStatus === 'offer_accepted') {
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'Shipment already assigned or offer already accepted',
          });
        }

        if (!['pending', 'open', 'waiting_for_offers'].includes(String(lockedStatus || ''))) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'Shipment is not in a valid state to accept offers',
          });
        }

        // Reject other offers for this shipment
        const rejectResult = await client.query(
          `UPDATE offers SET status = 'rejected', "updatedAt" = CURRENT_TIMESTAMP
           WHERE "shipment_id" = $1 AND id != $2 AND status = 'pending'`,
          [shipmentId, id]
        );
        console.log(`✅ Rejected ${rejectResult.rowCount} other offers for shipment ${shipmentId}`);

        // Accept this offer
        const acceptResult = await client.query(
          `UPDATE offers SET status = 'accepted', "updatedAt" = CURRENT_TIMESTAMP
           WHERE id = $1 AND status = 'pending'`,
          [id]
        );
        console.log(`✅ Accepted offer ${id}, rows affected: ${acceptResult.rowCount}`);

        if (acceptResult.rowCount === 0) {
          throw new Error('Offer is no longer available to accept');
        }

        const sets = [];
        const params = [];
        const addSet = (col, value) => {
          if (!col) return;
          params.push(value);
          const placeholder = `$${params.length}`;
          const needsQuotes = /[A-Z]/.test(col);
          const colExpr = needsQuotes ? `"${col}"` : col;
          sets.push(`${colExpr} = ${placeholder}`);
        };

        addSet(statusCol, 'offer_accepted');
        addSet(carrierCol, carrierId);
        addSet(acceptedOfferCol, offer.id);
        addSet(priceCol, offer.price);
        if (updatedAtCol) {
          const needsQuotes = /[A-Z]/.test(updatedAtCol);
          const colExpr = needsQuotes ? `"${updatedAtCol}"` : updatedAtCol;
          sets.push(`${colExpr} = CURRENT_TIMESTAMP`);
        }

        params.push(shipmentId);
        const whereParts = [`${idExpr} = $${params.length}`];
        whereParts.push(`${statusExpr} IN ('pending','open','waiting_for_offers')`);
        if (carrierExpr) whereParts.push(`${carrierExpr} IS NULL`);
        if (acceptedOfferExpr) whereParts.push(`${acceptedOfferExpr} IS NULL`);

        const updateSql = `UPDATE "${shipSchema}".shipments SET ${sets.join(', ')} WHERE ${whereParts.join(' AND ')}`;
        const updateResult = await client.query(updateSql, params);
        console.log(`✅ Updated shipment ${shipmentId}, rows affected: ${updateResult.rowCount}`);

        if (!updateResult || updateResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'Shipment already assigned or offer already accepted',
          });
        }

        // Verify the update (schema-aware)
        const priceExpr = priceCol ? (/[A-Z]/.test(priceCol) ? `"${priceCol}"` : priceCol) : null;

        const selectCols = [statusExpr, carrierExpr, acceptedOfferExpr, priceExpr].filter(Boolean).join(', ');
        const verifySql = `SELECT ${selectCols} FROM "${shipSchema}".shipments WHERE ${idExpr} = $1`;
        const verifyResult = await client.query(verifySql, [shipmentId]);

        if (!verifyResult.rows || verifyResult.rows.length === 0) {
          throw new Error('Shipment verification failed after offer accept update');
        }

        const updatedShipment = verifyResult.rows[0];
        const gotStatus = updatedShipment[statusCol] || updatedShipment.status;
        if (gotStatus !== 'offer_accepted') {
          throw new Error('Shipment status did not update to offer_accepted');
        }

        const debugInfo = req.user?.isDemo === true || process.env.NODE_ENV === 'development'
          ? {
              shipmentUpdate: {
                shipmentId,
                updateRowCount: updateResult.rowCount,
                idCol,
                carrierCol,
                acceptedOfferCol,
                updatedAtCol,
                priceCol,
                statusCol,
                updateSql,
              },
              shipmentVerify: updatedShipment,
            }
          : undefined;

        const commissionPercentage = 0.01;
        const commission = offer.price * commissionPercentage;

        if (commission > 0) {
          let walletResult;
          try {
            walletResult = await client.query('SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE', [carrierId]);
          } catch (e1) {
            try {
              walletResult = await client.query('SELECT balance FROM wallets WHERE userid = $1 FOR UPDATE', [carrierId]);
            } catch (e2) {
              walletResult = await client.query('SELECT balance FROM wallets WHERE "userId" = $1 FOR UPDATE', [carrierId]);
            }
          }

          if (!walletResult.rows || walletResult.rows.length === 0) {
            throw new Error('yeterli bakiye bulunmuyor');
          }

          const currentBalance = parseFloat(walletResult.rows[0].balance);
          if (!Number.isFinite(currentBalance) || currentBalance < commission) {
            throw new Error('yeterli bakiye bulunmuyor');
          }

          try {
            await client.query(
              'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
              [commission, carrierId]
            );
          } catch (e1) {
            try {
              await client.query(
                'UPDATE wallets SET balance = balance - $1 WHERE userid = $2',
                [commission, carrierId]
              );
            } catch (e2) {
              await client.query(
                'UPDATE wallets SET balance = balance - $1 WHERE "userId" = $2',
                [commission, carrierId]
              );
            }
          }

          const transactionDescription = `Teklif #${offer.id} için %${commissionPercentage * 100} komisyon`;
          await client.query(
            `INSERT INTO transactions (user_id, type, amount, status, description, reference_type, reference_id)
                 VALUES ($1, 'commission', $2, 'completed', $3, 'offer', $4)`,
            [carrierId, commission, transactionDescription, offer.id]
          );
        }

        // Auto status system messages (best-effort, low-noise)
        try {
          const sysText = 'Sistem: Anlaşma tamamlandı. Ödeme (IBAN/alıcı adı/açıklama) ve yükleme saatini mesajlaşma üzerinden yazılı teyitleyin.';
          // Owner and carrier should both see it in the shipment chat
          await insertSystemMessageIfMissing({ shipmentId, receiverId: offer.shipmentOwnerId, message: sysText });
          await insertSystemMessageIfMissing({ shipmentId, receiverId: carrierId, message: sysText });
        } catch (_) {
          // ignore
        }

        await client.query('COMMIT');
        console.log(`✅ Transaction committed successfully for offer ${id}`);

        if (debugInfo && pool) {
          try {
            try {
              const persistedSameConn = await client.query(
                `SELECT status, "nakliyeci_id", "acceptedOfferId", price FROM "${shipSchema}".shipments WHERE id = $1`,
                [shipmentId]
              );
              debugInfo.shipmentPersistedReadSameConnection =
                persistedSameConn.rows && persistedSameConn.rows[0] ? persistedSameConn.rows[0] : null;
            } catch (e) {
              debugInfo.shipmentPersistedReadSameConnection = { error: e.message };
            }

            const persisted = await pool.query(
              `SELECT status, "nakliyeci_id", "acceptedOfferId", price FROM "${shipSchema}".shipments WHERE id = $1`,
              [shipmentId]
            );
            debugInfo.shipmentPersistedRead = persisted.rows && persisted.rows[0] ? persisted.rows[0] : null;
            debugInfo.shipmentsSchema = shipSchema;

            try {
              const triggers = await pool.query(
                `SELECT trigger_name, event_manipulation, action_timing, action_statement
                 FROM information_schema.triggers
                 WHERE event_object_table = 'shipments' AND event_object_schema = $1
                 ORDER BY trigger_name ASC`,
                [shipSchema]
              );
              debugInfo.shipmentsTriggers = triggers.rows || [];
            } catch (e) {
              debugInfo.shipmentsTriggers = { error: e.message };
            }
          } catch (e) {
            debugInfo.shipmentPersistedRead = { error: e.message };
            debugInfo.shipmentPersistedReadSameConnection = debugInfo.shipmentPersistedReadSameConnection || { error: e.message };
            debugInfo.shipmentsSchema = shipSchema;
          }
        }

        // Notify carrier (non-blocking)
        if (createNotification) {
          try {
            await createNotification(
              carrierId,
              'offer_accepted',
              'Teklifiniz Kabul Edildi',
              `Gönderi için verdiğiniz teklif kabul edildi.`,
              `/shipments/${shipmentId}`,
              'success',
              { offerId: offer.id, shipmentId: shipmentId }
            );
          } catch (notifError) {
            console.error('Error creating notification (non-critical):', notifError);
          }
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
          clearCachePattern('GET:/api/shipments');
        } catch (_) {
          // ignore cache clear errors
        }

        return res.json({
          success: true,
          message: 'Teklif başarıyla kabul edildi',
          data: {
            offerId: offer.id,
            shipmentId,
            carrierId,
            price: offer.price,
            nextSteps: 'Ödeme ve teslimat detaylarını mesajlaşma üzerinden netleştirin.',
          },
          debug: debugInfo,
        });
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('❌ Error rolling back transaction:', rollbackError);
        }
        console.error('Error accepting offer:', error);
        console.error('Error stack:', error.stack);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({
          success: false,
          error: 'Teklif kabul edilemedi',
          details: error.message,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      console.error('Error stack:', error.stack);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(500).json({
        success: false,
        error: 'Teklif kabul edilemedi',
        details: error.message,
      });
    }
  };

  router.post('/:id/accept', authenticateToken, idempotencyGuard, acceptOfferHandler);
  router.put('/:id/accept', authenticateToken, idempotencyGuard, acceptOfferHandler);

  // Reject offer
  router.put('/:id/reject', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      // Get offer with shipment info
      const offerResult = await pool.query(
        `SELECT o.id,
               o."shipment_id" as "shipmentId",
               o."nakliyeci_id" as "carrierId",
               o.price,
               o.message,
               o."estimatedDelivery" as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               o."createdAt" as "createdAt",
               o."updatedAt" as "updatedAt", s."user_id" as "shipmentOwnerId"
         FROM offers o
         INNER JOIN shipments s ON o."shipment_id" = s.id
         WHERE o.id = $1`,
        [id]
      );

      if (offerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found',
        });
      }

      const offer = offerResult.rows[0];

      // Check if user owns the shipment
      if (offer.shipmentOwnerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only reject offers for your own shipments',
        });
      }

      await pool.query(
          `UPDATE offers SET status = 'rejected', "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        message: 'Teklif başarıyla reddedildi',
      });
    } catch (error) {
      console.error('Error rejecting offer:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklif reddedilemedi',
        details: error.message,
      });
    }
  });

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

      const offerRes = await pool.query(
        `SELECT id, "nakliyeci_id" as carrier_id, "shipment_id" as shipment_id
         FROM offers
         WHERE id = $1`,
        [id]
      );

      if (offerRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      const offer = offerRes.rows[0];
      const carrierId = offer.carrier_id;

      if (carrierId && carrierId !== userId) {
        try {
          const ownerRes = await pool.query('SELECT "user_id" as owner_id FROM shipments WHERE id = $1', [offer.shipment_id]);
          const ownerId = ownerRes.rows[0]?.owner_id;
          if (ownerId !== userId) {
            return res.status(403).json({ success: false, message: 'Bu teklifi silme yetkiniz yok' });
          }
        } catch (_) {
          return res.status(403).json({ success: false, message: 'Bu teklifi silme yetkiniz yok' });
        }
      }

      await pool.query('DELETE FROM offers WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting offer:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete offer' });
    }
  });

  return router;
}

module.exports = createOfferRoutes;


