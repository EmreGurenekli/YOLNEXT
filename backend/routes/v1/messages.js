// Messages routes - Modular version
const express = require('express');
const contentModeration = require('../../middleware/contentModeration');

function createMessageRoutes(pool, authenticateToken, createNotification, writeAuditLog, messageSpeedLimiter, idempotencyGuard, generalLimiter, upload) {
  const router = express.Router();

  const normalizeRole = r => String(r || '').toLowerCase();
  const isShipperRole = r => {
    const role = normalizeRole(r);
    return role === 'corporate' || role === 'individual';
  };

  let cachedShipmentsSchema = undefined;
  const resolveShipmentsSchema = async () => {
    if (cachedShipmentsSchema !== undefined) return cachedShipmentsSchema;
    try {
      const schemasRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'shipments'
         ORDER BY table_schema ASC`
      );
      const schemas = (schemasRes.rows || []).map(r => r.table_schema).filter(Boolean);
      if (!schemas.length) {
        cachedShipmentsSchema = 'public';
        return cachedShipmentsSchema;
      }

      // Prefer a schema that actually contains shipment rows.
      for (const s of schemas) {
        try {
          const hasRow = await pool.query(`SELECT 1 FROM "${s}".shipments LIMIT 1`);
          if ((hasRow.rows || []).length > 0) {
            cachedShipmentsSchema = s;
            return cachedShipmentsSchema;
          }
        } catch (_) {
          // ignore
        }
      }

      cachedShipmentsSchema = schemas.includes('public') ? 'public' : schemas[0];
      return cachedShipmentsSchema;
    } catch (_) {
      cachedShipmentsSchema = 'public';
      return cachedShipmentsSchema;
    }
  };

  const resolveOffersTable = async () => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'offers'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'offers' AND table_schema = $1`,
      [schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pick = (...names) => names.find(n => cols.has(n)) || null;
    const qColO = (col) => (col && /[A-Z]/.test(col) ? `\"${col}\"` : col);
    return {
      schema,
      qCol: qColO,
      cols: {
        shipmentId: pick('shipment_id', 'shipmentId', 'shipmentID', 'shipmentid') || 'shipment_id',
        nakliyeciId: pick('nakliyeci_id', 'carrier_id', 'carrierId', 'nakliyeciId', 'carrierid') || 'nakliyeci_id',
        status: pick('status') || 'status',
      },
    };
  };

  const getMessageColNames = async () => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'messages'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';

    const colsRes = await pool.query(
      `SELECT column_name, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'messages' AND table_schema = $1`,
      [schema]
    );
    const rows = colsRes.rows || [];
    const cols = new Set(rows.map(r => r.column_name));
    const nullableByName = new Map(rows.map(r => [String(r.column_name), String(r.is_nullable || '')]));

    const pickCol = (...names) => {
      const existing = names.filter(n => n && cols.has(n));
      if (existing.length === 0) return null;
      const notNull = existing.find(n => nullableByName.get(n) === 'NO');
      return notNull || existing[0];
    };

    const senderCol = pickCol('senderId', 'senderid', 'sender_id');
    const receiverCol = pickCol('receiverId', 'receiverid', 'receiver_id');
    const createdAtCol = pickCol('createdAt', 'createdat', 'created_at');
    const shipmentIdCol = pickCol('shipmentId', 'shipmentid', 'shipment_id');
    const messageCol = pickCol('message', 'content');

    return {
      senderCol,
      receiverCol,
      createdAtCol,
      shipmentIdCol,
      messageCol,
    };
  };

  let messageSchemaCache = null;
  const getMessageSchemaInfo = async () => {
    if (!pool) return { shipmentIdNotNull: false };
    if (messageSchemaCache) return messageSchemaCache;
    try {
      const cols = await pool.query(
        `SELECT column_name, is_nullable
         FROM information_schema.columns
         WHERE table_name = 'messages'`
      );
      const rows = cols.rows || [];
      const byName = new Map(rows.map(r => [String(r.column_name), String(r.is_nullable || '')]));
      const pickNullable = (...names) => {
        for (const n of names) {
          if (byName.has(n)) return byName.get(n);
        }
        return null;
      };
      const shipmentNullable = pickNullable('shipmentId', 'shipmentid', 'shipment_id');
      const shipmentIdNotNull = shipmentNullable === 'NO';
      messageSchemaCache = { shipmentIdNotNull };
      return messageSchemaCache;
    } catch (_) {
      messageSchemaCache = { shipmentIdNotNull: false };
      return messageSchemaCache;
    }
  };

  const resolveUsersTable = async () => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'users'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = $1`,
      [schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pick = (...names) => names.find(n => cols.has(n)) || null;
    const qColU = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);
    return {
      schema,
      qCol: qColU,
      cols: {
        role: pick('role', 'panel_type', 'userType', 'user_type') || 'role',
        fullName: pick('fullName', 'full_name', 'name'),
      },
    };
  };

  const resolveShipmentsTable = async () => {
    const schema = await resolveShipmentsSchema();
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments' AND table_schema = $1`,
      [schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pick = (...names) => names.find(n => cols.has(n)) || null;
    const qCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

    const coalesceExpr = (prefix, names) => {
      const parts = [];
      for (const n of names) {
        if (n && cols.has(n)) parts.push(`${prefix}.${qCol(n)}`);
      }
      if (parts.length === 0) return 'NULL';
      if (parts.length === 1) return parts[0];
      return `COALESCE(${parts.join(', ')})`;
    };

    return {
      schema,
      qCol,
      cols: {
        // Prefer canonical/populated columns first.
        // Some DBs may contain an "owner_id" column that is present but unused (NULL), while userId/user_id carries the actual owner.
        owner: pick('userId', 'user_id', 'userid', 'owner_id', 'owner_id'),
        carrier: pick('carrierId', 'carrier_id', 'nakliyeciId', 'nakliyeci_id', 'carrierid', 'nakliyeciid'),
        driver: pick('driverId', 'driver_id', 'driverID', 'driverid'),
        status: pick('status'),
      },
      exprs: {
        owner: coalesceExpr('s', ['userId', 'user_id', 'userid', 'owner_id', 'owner_id']),
        carrier: coalesceExpr('s', ['carrierId', 'carrier_id', 'nakliyeciId', 'nakliyeci_id', 'carrierid', 'nakliyeciid']),
        driver: coalesceExpr('s', ['driverId', 'driver_id', 'driverID', 'driverid']),
        status: coalesceExpr('s', ['status']),
      },
    };
  };

  const qCol = (col) => `m."${col}"`;
  const isDriverRole = r => normalizeRole(r) === 'tasiyici';

  const normalizeShipmentStatus = s => String(s || '').trim().toLowerCase();
  const isAcceptedMessagingStatus = s => {
    const st = normalizeShipmentStatus(s);
    return (
      st === 'offer_accepted' ||
      st === 'accepted' ||
      st === 'picked_up' ||
      st === 'in_transit' ||
      st === 'delivered' ||
      st === 'completed'
    );
  };

  // Compatibility alias: some UIs call GET /api/messages/corporate
  // We treat it as the same as GET /api/messages (conversation list)
  router.get('/corporate', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const { senderCol, receiverCol, createdAtCol, shipmentIdCol } = await getMessageColNames();
      if (!senderCol || !receiverCol || !createdAtCol) {
        return res.json({ success: true, data: [], messages: [], meta: { total: 0, page: 1, limit: 20 } });
      }

      const uMeta = await resolveUsersTable();
      const usersTable = `"${uMeta.schema}".users`;
      const uRoleCol = uMeta.qCol(uMeta.cols.role);
      const uNameCol = uMeta.cols.fullName ? uMeta.qCol(uMeta.cols.fullName) : null;

      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const threadKeyExpr = `CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${qCol(receiverCol)} 
            ELSE ${qCol(senderCol)} 
          END`;
      const distinctOn = shipmentIdCol ? `(${threadKeyExpr}, ${qCol(shipmentIdCol)})` : `(${threadKeyExpr})`;
      const orderByKey = shipmentIdCol
        ? `${threadKeyExpr}, ${qCol(shipmentIdCol)}, ${qCol(createdAtCol)} DESC`
        : `${threadKeyExpr}, ${qCol(createdAtCol)} DESC`;

      const result = await pool.query(
        `SELECT DISTINCT ON ${distinctOn}
          m.*,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${uNameCol ? `u2.${uNameCol}` : 'NULL'} 
            ELSE ${uNameCol ? `u1.${uNameCol}` : 'NULL'} 
          END as otherUserName,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.id 
            ELSE u1.id 
          END as otherUserId,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.${uRoleCol} 
            ELSE u1.${uRoleCol} 
          END as otherUserRole
         FROM messages m
         LEFT JOIN ${usersTable} u1 ON ${qCol(senderCol)} = u1.id
         LEFT JOIN ${usersTable} u2 ON ${qCol(receiverCol)} = u2.id
         WHERE ${qCol(senderCol)} = $1 OR ${qCol(receiverCol)} = $1
         ORDER BY ${orderByKey}
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), offset]
      );

      const countResult = await pool.query(
        shipmentIdCol
          ? `SELECT COUNT(DISTINCT (CASE 
                WHEN "${senderCol}" = $1 THEN "${receiverCol}" 
                ELSE "${senderCol}" 
              END, "${shipmentIdCol}")) as count
             FROM messages
             WHERE "${senderCol}" = $1 OR "${receiverCol}" = $1`
          : `SELECT COUNT(DISTINCT CASE 
                WHEN "${senderCol}" = $1 THEN "${receiverCol}" 
                ELSE "${senderCol}" 
              END) as count
             FROM messages
             WHERE "${senderCol}" = $1 OR "${receiverCol}" = $1`,
        [userId]
      );

      const userRole = normalizeRole(req.user?.role);
      const filtered = (result.rows || []).filter(r => {
        const otherRole = normalizeRole(r.otheruserrole || r.otherUserRole);
        if (isShipperRole(userRole) && isDriverRole(otherRole)) return false;
        if (isDriverRole(userRole) && isShipperRole(otherRole)) return false;
        return true;
      });

      return res.json({
        success: true,
        data: filtered,
        messages: filtered,
        meta: {
          total: filtered.length,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Get corporate messages error:', error);
      return res.status(500).json({ success: false, error: 'Failed to get messages' });
    }
  });

  // Get messages/conversations (for messages page) - MUST be before /shipment/:shipmentId
  router.get('/', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { senderCol, receiverCol, createdAtCol, shipmentIdCol } = await getMessageColNames();
      if (!senderCol || !receiverCol || !createdAtCol) {
        return res.json({ success: true, data: [], messages: [], meta: { total: 0, page: 1, limit: 20 } });
      }

      const uMeta = await resolveUsersTable();
      const usersTable = `"${uMeta.schema}".users`;
      const uRoleCol = uMeta.qCol(uMeta.cols.role);
      const uNameCol = uMeta.cols.fullName ? uMeta.qCol(uMeta.cols.fullName) : null;

      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const threadKeyExpr = `CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${qCol(receiverCol)} 
            ELSE ${qCol(senderCol)} 
          END`;
      const distinctOn = shipmentIdCol ? `(${threadKeyExpr}, ${qCol(shipmentIdCol)})` : `(${threadKeyExpr})`;
      const orderByKey = shipmentIdCol
        ? `${threadKeyExpr}, ${qCol(shipmentIdCol)}, ${qCol(createdAtCol)} DESC`
        : `${threadKeyExpr}, ${qCol(createdAtCol)} DESC`;

      // Get all messages where user is sender or receiver
      const result = await pool.query(
        `SELECT DISTINCT ON ${distinctOn}
          m.*,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${uNameCol ? `u2.${uNameCol}` : 'NULL'} 
            ELSE ${uNameCol ? `u1.${uNameCol}` : 'NULL'} 
          END as otherUserName,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.id 
            ELSE u1.id 
          END as otherUserId,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.${uRoleCol} 
            ELSE u1.${uRoleCol} 
          END as otherUserRole
         FROM messages m
         LEFT JOIN ${usersTable} u1 ON ${qCol(senderCol)} = u1.id
         LEFT JOIN ${usersTable} u2 ON ${qCol(receiverCol)} = u2.id
         WHERE ${qCol(senderCol)} = $1 OR ${qCol(receiverCol)} = $1
         ORDER BY ${orderByKey}
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), offset]
      );

      // Get total count
      const countResult = await pool.query(
        shipmentIdCol
          ? `SELECT COUNT(DISTINCT (CASE 
                WHEN "${senderCol}" = $1 THEN "${receiverCol}" 
                ELSE "${senderCol}" 
              END, "${shipmentIdCol}")) as count
             FROM messages
             WHERE "${senderCol}" = $1 OR "${receiverCol}" = $1`
          : `SELECT COUNT(DISTINCT CASE 
                WHEN "${senderCol}" = $1 THEN "${receiverCol}" 
                ELSE "${senderCol}" 
              END) as count
             FROM messages
             WHERE "${senderCol}" = $1 OR "${receiverCol}" = $1`,
        [userId]
      );

      const userRole = normalizeRole(req.user?.role);
      const filtered = (result.rows || []).filter(r => {
        const otherRole = normalizeRole(r.otheruserrole || r.otherUserRole);
        if (isShipperRole(userRole) && isDriverRole(otherRole)) return false;
        if (isDriverRole(userRole) && isShipperRole(otherRole)) return false;
        return true;
      });

      res.json({
        success: true,
        data: filtered,
        messages: filtered,
        meta: {
          total: filtered.length,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get messages',
      });
    }
  });

  // Get messages for a shipment
  router.get('/shipment/:shipmentId', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { senderCol, receiverCol, createdAtCol, shipmentIdCol } = await getMessageColNames();
      if (!senderCol || !receiverCol || !createdAtCol || !shipmentIdCol) {
        return res.json({ success: true, data: [] });
      }

      const { shipmentId } = req.params;
      const userId = req.user.id;
      const userIdNum = Number(userId);

      // SECURITY CHECK: Verify user is related to this shipment
      const sMeta = await resolveShipmentsTable();
      const shipmentsTable = `"${sMeta.schema}".shipments`;
      const ownerExpr = sMeta.exprs?.owner || (sMeta.cols.owner ? `s.${sMeta.qCol(sMeta.cols.owner)}` : 'NULL');
      const carrierExpr = sMeta.exprs?.carrier || (sMeta.cols.carrier ? `s.${sMeta.qCol(sMeta.cols.carrier)}` : 'NULL');
      const driverExpr = sMeta.exprs?.driver || (sMeta.cols.driver ? `s.${sMeta.qCol(sMeta.cols.driver)}` : 'NULL');

      const shipmentCheck = await pool.query(
        `SELECT ${ownerExpr} as "owner_id", ${carrierExpr} as "nakliyeci_id", ${driverExpr} as "driver_id"
         FROM ${shipmentsTable} s
         WHERE s.id = $1`,
        [shipmentId]
      );

      if (shipmentCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
      }

      const shipment = shipmentCheck.rows[0];
      const shipOwnerId = shipment.owner_id == null ? null : Number(shipment.owner_id);
      const shipNakliyeciId = shipment.nakliyeci_id == null ? null : Number(shipment.nakliyeci_id);
      const shipDriverId = shipment.driver_id == null ? null : Number(shipment.driver_id);

      const isOwner = shipOwnerId != null && shipOwnerId === userIdNum;
      const isNakliyeci = shipNakliyeciId != null && shipNakliyeciId === userIdNum;
      const isDriver = shipDriverId != null && shipDriverId === userIdNum;

      // Also check if carrier has an accepted offer (even if not yet updated in shipment table, though usually they sync)
      // Or if carrier is bidding? (Usually can't see messages until accepted).
      // Logic in POST: "isNakliyeciByAcceptedOffer".
      
      let isAuthorized = isOwner || isNakliyeci || isDriver;

      if (!isAuthorized) {
        // Check for accepted offer if not directly assigned yet
         const offersMeta = await resolveOffersTable();
         const offersTable = `"${offersMeta.schema}".offers`;
         const offerShipmentCol = offersMeta.qCol(offersMeta.cols.shipmentId);
         const offerNakliyeciCol = offersMeta.qCol(offersMeta.cols.nakliyeciId);
         const offerStatusCol = offersMeta.qCol(offersMeta.cols.status);
         
         const offerShipmentExpr = offersMeta.exprs?.shipmentId || `o.${offerShipmentCol}`;
         const offerNakliyeciExpr = offersMeta.exprs?.nakliyeciId || `o.${offerNakliyeciCol}`;
         const offerStatusExpr = offersMeta.exprs?.status || `o.${offerStatusCol}`;

         const offerCheck = await pool.query(
            `SELECT 1 FROM ${offersTable} o
             WHERE ${offerShipmentExpr} = $1
               AND ${offerNakliyeciExpr} = $2
               AND ${offerStatusExpr} IN ('accepted', 'offer_accepted')
             LIMIT 1`,
            [shipmentId, userIdNum]
         );
         if ((offerCheck.rows || []).length > 0) {
           isAuthorized = true;
         }
      }

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Bu gönderinin mesajlarını görüntüleme yetkiniz yok.'
        });
      }

      const uMeta = await resolveUsersTable();
      const usersTable = `"${uMeta.schema}".users`;
      const uRoleCol = uMeta.qCol(uMeta.cols.role);
      const uNameCol = uMeta.cols.fullName ? uMeta.qCol(uMeta.cols.fullName) : null;

      const result = await pool.query(
        `SELECT m.*, 
                ${uNameCol ? `u1.${uNameCol}` : 'NULL'} as senderName,
                ${uNameCol ? `u2.${uNameCol}` : 'NULL'} as receiverName,
                u1.${uRoleCol} as senderRole,
                u2.${uRoleCol} as receiverRole
         FROM messages m
         LEFT JOIN ${usersTable} u1 ON ${qCol(senderCol)} = u1.id
         LEFT JOIN ${usersTable} u2 ON ${qCol(receiverCol)} = u2.id
         WHERE ${qCol(shipmentIdCol)} = $1
           AND (${qCol(senderCol)} = $2 OR ${qCol(receiverCol)} = $2)
         ORDER BY ${qCol(createdAtCol)} ASC`,
        [shipmentId, userId]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get messages',
      });
    }
  });

  // Send message
  router.post('/', authenticateToken, messageSpeedLimiter || generalLimiter, idempotencyGuard, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { shipmentId, receiverId, message } = req.body;
      const senderId = req.user.id;
      const senderIdNum = Number(senderId);

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID and message are required',
        });
      }

      // If receiverId is missing but shipmentId exists, infer the counterparty.
      // This enables the common "send message from shipment chat" flow without the UI needing to know receiverId.
      let resolvedReceiverId = receiverId;
      if ((!resolvedReceiverId || String(resolvedReceiverId).trim() === '') && shipmentId) {
        const sMeta = await resolveShipmentsTable();
        const shipmentsTable = `"${sMeta.schema}".shipments`;
        const ownerExpr = sMeta.exprs?.owner || (sMeta.cols.owner ? `s.${sMeta.qCol(sMeta.cols.owner)}` : 'NULL');
        const carrierExpr = sMeta.exprs?.carrier || (sMeta.cols.carrier ? `s.${sMeta.qCol(sMeta.cols.carrier)}` : 'NULL');

        const shipmentCheck = await pool.query(
          `SELECT ${ownerExpr} as "owner_id", ${carrierExpr} as "nakliyeci_id"
           FROM ${shipmentsTable} s
           WHERE s.id = $1`,
          [shipmentId]
        );

        if (shipmentCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        const shipment = shipmentCheck.rows[0];
        const shipOwnerId = shipment.owner_id == null ? null : Number(shipment.owner_id);
        let shipNakliyeciId = shipment.nakliyeci_id == null ? null : Number(shipment.nakliyeci_id);

        // If shipment doesn't have a carrier assigned yet, fall back to accepted offer's nakliyeci.
        if (shipNakliyeciId == null) {
          const offersMeta = await resolveOffersTable();
          const offersTable = `"${offersMeta.schema}".offers`;
          const offerShipmentCol = offersMeta.qCol(offersMeta.cols.shipmentId);
          const offerNakliyeciCol = offersMeta.qCol(offersMeta.cols.nakliyeciId);
          const offerStatusCol = offersMeta.qCol(offersMeta.cols.status);
          const offerShipmentExpr = offersMeta.exprs?.shipmentId || `o.${offerShipmentCol}`;
          const offerNakliyeciExpr = offersMeta.exprs?.nakliyeciId || `o.${offerNakliyeciCol}`;
          const offerStatusExpr = offersMeta.exprs?.status || `o.${offerStatusCol}`;

          const r = await pool.query(
            `SELECT ${offerNakliyeciExpr} as "nakliyeciId"
             FROM ${offersTable} o
             WHERE ${offerShipmentExpr} = $1
               AND ${offerStatusExpr} IN ('accepted', 'offer_accepted')
             ORDER BY o.id DESC
             LIMIT 1`,
            [shipmentId]
          );
          if ((r.rows || []).length > 0) {
            const v = r.rows[0]?.nakliyeciId;
            shipNakliyeciId = v == null ? null : Number(v);
          }
        }

        if (shipOwnerId == null || shipNakliyeciId == null) {
          return res.status(400).json({
            success: false,
            message: 'Mesajlaşma sadece teklif kabul edildikten sonra ve ilgili gönderi üzerinden yapılabilir.',
          });
        }

        // Infer receiver as the opposite party.
        if (senderIdNum === shipOwnerId) {
          resolvedReceiverId = shipNakliyeciId;
        } else if (senderIdNum === shipNakliyeciId) {
          resolvedReceiverId = shipOwnerId;
        } else {
          // Drivers/other roles must provide explicit receiverId; they are validated later.
          return res.status(400).json({
            success: false,
            message: 'Receiver ID and message are required',
          });
        }
      }

      const receiverIdNum = Number(resolvedReceiverId);

      if (!resolvedReceiverId) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID and message are required',
        });
      }

      // Content Moderation Check
      const moderationResult = contentModeration.moderateContent(message, {
        strictMode: false, // Allow warnings for business communication
        allowUrls: true,   // Allow URLs in business context
        allowEmails: false, // Don't allow emails
        allowPhoneNumbers: false // Don't allow phone numbers
      });

      if (!moderationResult.allowed) {
        // Content is not allowed
        await writeAuditLog('CONTENT_MODERATION_BLOCKED', {
          userId: senderId,
          receiverId: resolvedReceiverId,
          shipmentId,
          reason: moderationResult.reason,
          originalMessage: message
        }, req);

        return res.status(400).json({
          success: false,
          message: `Mesaj gönderilemedi: ${contentModeration.getModerationReason(moderationResult.reason)}`,
          reason: moderationResult.reason
        });
      }

      // If content has warnings, sanitize it
      let finalMessage = message;
      if (moderationResult.warning) {
        finalMessage = contentModeration.sanitizeContent(message);
        await writeAuditLog('CONTENT_MODERATION_SANITIZED', {
          userId: senderId,
          receiverId: resolvedReceiverId,
          shipmentId,
          warning: moderationResult.warning,
          originalMessage: message,
          sanitizedMessage: finalMessage
        }, req);
      }

      const schemaInfo = await getMessageSchemaInfo();
      if (schemaInfo.shipmentIdNotNull && !shipmentId) {
        return res.status(400).json({
          success: false,
          message: 'Mesajlaşma için shipmentId zorunlu (DB şeması gereği).',
        });
      }

      const u = await resolveUsersTable();
      const usersTable = `"${u.schema}".users`;
      const roleCol = u.qCol(u.cols.role);
      const roleRes = await pool.query(
        `SELECT id, ${roleCol} as role FROM ${usersTable} WHERE id = ANY($1::int[])`,
        [[senderIdNum, receiverIdNum]]
      );
      const roleMap = new Map(roleRes.rows.map(r => [Number(r.id), String(r.role || '').toLowerCase()]));
      const senderRole = roleMap.get(Number(senderId)) || String(req.user.role || '').toLowerCase();
      const receiverRole = roleMap.get(Number(resolvedReceiverId)) || '';

      if (!roleMap.get(Number(resolvedReceiverId))) {
        return res.status(404).json({
          success: false,
          message: 'Alıcı kullanıcı bulunamadı',
        });
      }
      const isSenderShipper = senderRole === 'corporate' || senderRole === 'individual';
      const isReceiverShipper = receiverRole === 'corporate' || receiverRole === 'individual';
      const isSenderDriver = senderRole === 'tasiyici';
      const isReceiverDriver = receiverRole === 'tasiyici';
      const isSenderNakliyeci = senderRole === 'nakliyeci';
      const isReceiverNakliyeci = receiverRole === 'nakliyeci';

      const isDirectShipperDriver = (isSenderShipper && isReceiverDriver) || (isReceiverShipper && isSenderDriver);
      if (isDirectShipperDriver && !isSenderNakliyeci && !isReceiverNakliyeci) {
        return res.status(403).json({
          success: false,
          message: 'Gönderici ile taşıyıcı arasında doğrudan mesajlaşma desteklenmiyor. Lütfen nakliyeci üzerinden iletişim kurun.',
        });
      }

      const isSenderShipperNakliyeciPair = (isSenderShipper && isReceiverNakliyeci) || (isSenderNakliyeci && isReceiverShipper);
      if (isSenderShipperNakliyeciPair && !shipmentId) {
        return res.status(400).json({
          success: false,
          message: 'Mesajlaşma sadece teklif kabul edildikten sonra ve ilgili gönderi üzerinden yapılabilir.',
        });
      }

      // SECURITY: If shipmentId is provided, verify user has permission to message about this shipment
      if (shipmentId) {
        // Check if shipment exists and user is related to it (owner or nakliyeci with accepted offer)

        const sMeta = await resolveShipmentsTable();
        const shipmentsTable = `"${sMeta.schema}".shipments`;
        const ownerExpr = sMeta.exprs?.owner || (sMeta.cols.owner ? `s.${sMeta.qCol(sMeta.cols.owner)}` : 'NULL');
        const carrierExpr = sMeta.exprs?.carrier || (sMeta.cols.carrier ? `s.${sMeta.qCol(sMeta.cols.carrier)}` : 'NULL');
        const driverExpr = sMeta.exprs?.driver || (sMeta.cols.driver ? `s.${sMeta.qCol(sMeta.cols.driver)}` : 'NULL');
        const statusExpr = sMeta.exprs?.status || (sMeta.cols.status ? `s.${sMeta.qCol(sMeta.cols.status)}` : 'NULL');

        const shipmentCheck = await pool.query(
          `SELECT ${ownerExpr} as "owner_id", ${carrierExpr} as "nakliyeci_id", ${driverExpr} as "driver_id", ${statusExpr} as status
           FROM ${shipmentsTable} s
           WHERE s.id = $1`,
          [shipmentId]
        );

        if (shipmentCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        const shipment = shipmentCheck.rows[0];
        const shipOwnerId = shipment.owner_id == null ? null : Number(shipment.owner_id);
        const shipNakliyeciId = shipment.nakliyeci_id == null ? null : Number(shipment.nakliyeci_id);
        const shipDriverId = shipment.driver_id == null ? null : Number(shipment.driver_id);
        const isOwner = shipOwnerId != null && shipOwnerId === senderIdNum;
        const isNakliyeci = shipNakliyeciId != null && shipNakliyeciId === senderIdNum;
        const isDriver = shipDriverId != null && shipDriverId === senderIdNum;
        const canMessageAsNakliyeci = isAcceptedMessagingStatus(shipment.status);

        const offersMeta = await resolveOffersTable();
        const offersTable = `\"${offersMeta.schema}\".offers`;
        const offerShipmentCol = offersMeta.qCol(offersMeta.cols.shipmentId);
        const offerNakliyeciCol = offersMeta.qCol(offersMeta.cols.nakliyeciId);
        const offerStatusCol = offersMeta.qCol(offersMeta.cols.status);

        const offerShipmentExpr = offersMeta.exprs?.shipmentId || `o.${offerShipmentCol}`;
        const offerNakliyeciExpr = offersMeta.exprs?.nakliyeciId || `o.${offerNakliyeciCol}`;
        const offerStatusExpr = offersMeta.exprs?.status || `o.${offerStatusCol}`;
        const hasAcceptedOfferFor = async (nakliyeciIdNum) => {
          const r = await pool.query(
            `SELECT 1 FROM ${offersTable} o
             WHERE ${offerShipmentExpr} = $1
               AND ${offerNakliyeciExpr} = $2
               AND ${offerStatusExpr} IN ('accepted', 'offer_accepted')
             LIMIT 1`,
            [shipmentId, nakliyeciIdNum]
          );
          return (r.rows || []).length > 0;
        };

        const isNakliyeciByAcceptedOffer = isSenderNakliyeci ? await hasAcceptedOfferFor(senderIdNum) : false;

        // Enforce B rule (payment messaging): shipper <-> nakliyeci messaging only after acceptance and only with assigned nakliyeci.
        if (isSenderShipperNakliyeciPair) {
          const nakliyeciId = isSenderNakliyeci ? senderIdNum : receiverIdNum;
          const shipperId = isSenderShipper ? senderIdNum : receiverIdNum;

          const acceptedOfferExists = await hasAcceptedOfferFor(nakliyeciId);
          if (shipNakliyeciId == null && !acceptedOfferExists) {
            return res.status(403).json({
              success: false,
              message: 'Mesajlaşma teklif kabul edilince açılır. Bu gönderiye henüz nakliyeci atanmadı.',
            });
          }

          if ((shipNakliyeciId != null && shipNakliyeciId !== nakliyeciId) || (shipOwnerId != null && shipOwnerId !== shipperId)) {
            return res.status(403).json({
              success: false,
              message: 'Bu gönderi için sadece ilgili nakliyeci ve gönderi sahibi mesajlaşabilir.',
            });
          }

          if (!isAcceptedMessagingStatus(shipment.status)) {
            return res.status(403).json({
              success: false,
              message: 'Mesajlaşma teklif kabul edilince açılır.',
            });
          }
        }

        // Only allow messaging if user is a party to the shipment.
        // NOTE: previously, shipment.status === 'offer_accepted' could allow unrelated users; this blocks that.
        const isParty = isOwner || ((isNakliyeci || isNakliyeciByAcceptedOffer) && canMessageAsNakliyeci) || isDriver;
        if (!isParty) {
          return res.status(403).json({
            success: false,
            message: 'Bu gönderi için mesaj gönderme yetkiniz yok. Mesajlaşma sadece teklif kabul edildikten sonra yapılabilir.',
          });
        }

        // Verify receiver is the other party (owner or nakliyeci)
        const isReceiverOwner = shipOwnerId != null && shipOwnerId === receiverIdNum;
        const isReceiverNakliyeci =
          (shipNakliyeciId != null && shipNakliyeciId === receiverIdNum) ||
          (await hasAcceptedOfferFor(receiverIdNum));
        const isReceiverDriver = shipDriverId != null && shipDriverId === receiverIdNum;
        
        if (!isReceiverOwner && !isReceiverNakliyeci && !isReceiverDriver) {
          return res.status(403).json({
            success: false,
            message: 'Bu gönderi ile ilgili sadece gönderi sahibi, nakliyeci veya taşıyıcı ile mesajlaşabilirsiniz.',
          });
        }
      }

      const { senderCol, receiverCol, createdAtCol, shipmentIdCol, messageCol } = await getMessageColNames();
      if (!senderCol || !receiverCol || !createdAtCol || !shipmentIdCol || !messageCol) {
        return res.status(500).json({
          success: false,
          error: 'Messages schema not compatible',
        });
      }

      let result;
      try {
        result = await pool.query(
          `INSERT INTO messages ("${shipmentIdCol}", "${senderCol}", "${receiverCol}", "${messageCol}", "${createdAtCol}")
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING *`,
          [shipmentId || null, senderId, resolvedReceiverId, message]
        );
      } catch (e) {
        // Common: NOT NULL shipmentId or FK violations -> return a safe 400/404 instead of 500
        const msg = String(e?.message || '');
        if (msg.toLowerCase().includes('null') && msg.toLowerCase().includes('shipment')) {
          return res.status(400).json({
            success: false,
            message: 'Mesajlaşma için shipmentId gerekli.',
          });
        }
        if (msg.toLowerCase().includes('foreign key')) {
          return res.status(404).json({
            success: false,
            message: 'Mesaj alıcısı veya gönderi bulunamadı',
          });
        }
        throw e;
      }

      const newMessage = result.rows[0];

      // Socket.io removed - real-time updates not needed
      // New messages available via REST API polling

      // Create notification
      if (createNotification) {
        await createNotification(
          resolvedReceiverId,
          'new_message',
          'Yeni Mesaj',
          message.substring(0, 50),
          shipmentId ? `/shipments/${shipmentId}` : '/messages',
          'normal',
          { messageId: newMessage.id, shipmentId }
        );
      }

      res.status(201).json({
        success: true,
        data: newMessage,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message',
      });
    }
  });

  // Compatibility alias: some UIs call POST /api/messages/send
  router.post('/send', authenticateToken, messageSpeedLimiter || generalLimiter, idempotencyGuard, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const { shipmentId, receiverId, message } = req.body;
      const senderId = req.user.id;

      if (!receiverId || !message) {
        return res.status(400).json({ success: false, message: 'Receiver ID and message are required' });
      }

      // Content Moderation Check
      const moderationResult = contentModeration.moderateContent(message, {
        strictMode: false, // Allow warnings for business communication
        allowUrls: true,   // Allow URLs in business context
        allowEmails: false, // Don't allow emails
        allowPhoneNumbers: false // Don't allow phone numbers
      });

      if (!moderationResult.allowed) {
        // Content is not allowed
        await writeAuditLog('CONTENT_MODERATION_BLOCKED', {
          userId: senderId,
          receiverId,
          shipmentId,
          reason: moderationResult.reason,
          originalMessage: message
        }, req);

        return res.status(400).json({
          success: false,
          message: `Mesaj gönderilemedi: ${contentModeration.getModerationReason(moderationResult.reason)}`,
          reason: moderationResult.reason
        });
      }

      // If content has warnings, sanitize it
      let finalMessage = message;
      if (moderationResult.warning) {
        finalMessage = contentModeration.sanitizeContent(message);
        await writeAuditLog('CONTENT_MODERATION_SANITIZED', {
          userId: senderId,
          receiverId,
          shipmentId,
          warning: moderationResult.warning,
          originalMessage: message,
          sanitizedMessage: finalMessage
        }, req);
      }

      const schemaInfo = await getMessageSchemaInfo();
      if (schemaInfo.shipmentIdNotNull && !shipmentId) {
        return res.status(400).json({
          success: false,
          message: 'Mesajlaşma için shipmentId zorunlu (DB şeması gereği).',
        });
      }

      const roleRes = await pool.query(
        'SELECT id, role FROM users WHERE id = ANY($1::int[])',
        [[Number(senderId), Number(receiverId)]]
      );
      const roleMap = new Map(roleRes.rows.map(r => [Number(r.id), String(r.role || '').toLowerCase()]));
      const senderRole = roleMap.get(Number(senderId)) || String(req.user.role || '').toLowerCase();
      const receiverRole = roleMap.get(Number(receiverId)) || '';
      const isSenderShipperNakliyeciPair =
        (senderRole === 'corporate' || senderRole === 'individual')
          ? receiverRole === 'nakliyeci'
          : senderRole === 'nakliyeci' && (receiverRole === 'corporate' || receiverRole === 'individual');

      if (!roleMap.get(Number(receiverId))) {
        return res.status(404).json({ success: false, message: 'Alıcı kullanıcı bulunamadı' });
      }
      const isSenderShipper = senderRole === 'corporate' || senderRole === 'individual';
      const isReceiverShipper = receiverRole === 'corporate' || receiverRole === 'individual';
      const isSenderDriver = senderRole === 'tasiyici';
      const isReceiverDriver = receiverRole === 'tasiyici';
      const isSenderNakliyeci = senderRole === 'nakliyeci';
      const isReceiverNakliyeci = receiverRole === 'nakliyeci';

      const isDirectShipperDriver = (isSenderShipper && isReceiverDriver) || (isReceiverShipper && isSenderDriver);
      if (isDirectShipperDriver && !isSenderNakliyeci && !isReceiverNakliyeci) {
        return res.status(403).json({
          success: false,
          message: 'Gönderici ile taşıyıcı arasında doğrudan mesajlaşma desteklenmiyor. Lütfen nakliyeci üzerinden iletişim kurun.',
        });
      }

      const { senderCol, receiverCol, createdAtCol, shipmentIdCol, messageCol } = await getMessageColNames();
      if (!senderCol || !receiverCol || !createdAtCol || !shipmentIdCol || !messageCol) {
        return res.status(500).json({
          success: false,
          error: 'Messages schema not compatible',
        });
      }

      let result;
      try {
        result = await pool.query(
          `INSERT INTO messages ("${shipmentIdCol}", "${senderCol}", "${receiverCol}", "${messageCol}", "${createdAtCol}")
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING *`,
          [shipmentId || null, senderId, receiverId, message]
        );
      } catch (e) {
        const msg = String(e?.message || '');
        if (msg.toLowerCase().includes('null') && msg.toLowerCase().includes('shipment')) {
          return res.status(400).json({ success: false, message: 'Mesajlaşma için shipmentId gerekli.' });
        }
        if (msg.toLowerCase().includes('foreign key')) {
          return res.status(404).json({ success: false, message: 'Mesaj alıcısı veya gönderi bulunamadı' });
        }
        throw e;
      }

      const newMessage = result.rows[0];

      // Socket.io removed - real-time updates not needed
      // New messages available via REST API polling

      if (createNotification) {
        await createNotification(
          receiverId,
          'new_message',
          'Yeni Mesaj',
          message.substring(0, 50),
          shipmentId ? `/shipments/${shipmentId}` : '/messages',
          'normal',
          { messageId: newMessage.id, shipmentId }
        );
      }

      return res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
      console.error('Send message (/send) error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send message' });
    }
  });

  // Compatibility: mark message as read
  const markMessageReadHandler = async (req, res) => {
    try {
      if (!pool) {
        return res.json({ success: true });
      }

      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      try {
        await pool.query(
          'UPDATE messages SET "isRead" = true WHERE id = $1 AND "receiverId" = $2',
          [id, userId]
        );
      } catch (_) {
        try {
          await pool.query('UPDATE messages SET is_read = true WHERE id = $1 AND receiver_id = $2', [id, userId]);
        } catch (_) {
          // ignore
        }
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Mark message read error:', error);
      return res.status(500).json({ success: false, error: 'Failed to mark as read' });
    }
  };

  router.put('/:id/read', authenticateToken, markMessageReadHandler);
  router.patch('/:id/read', authenticateToken, markMessageReadHandler);

  // Delete entire conversation with another user
  router.delete('/conversation/:otherUserId', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.json({ success: true });
      }

      const userId = req.user?.id;
      const otherUserId = parseInt(req.params.otherUserId, 10);
      if (!userId || Number.isNaN(otherUserId)) {
        return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı' });
      }

      const { senderCol, receiverCol } = await getMessageColNames();
      if (!senderCol || !receiverCol) {
        return res.status(500).json({ success: false, message: 'Messages schema not compatible' });
      }

      try {
        await pool.query(
          `DELETE FROM messages 
           WHERE ( "${senderCol}" = $1 AND "${receiverCol}" = $2 )
              OR ( "${senderCol}" = $2 AND "${receiverCol}" = $1 )`,
          [userId, otherUserId]
        );
      } catch (_) {
        await pool.query(
          `DELETE FROM messages 
           WHERE ( sender_id = $1 AND receiver_id = $2 )
              OR ( sender_id = $2 AND receiver_id = $1 )`,
          [userId, otherUserId]
        );
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Delete conversation error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete conversation' });
    }
  });

  // Compatibility: delete message
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.json({ success: true });
      }

      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      try {
        await pool.query('DELETE FROM messages WHERE id = $1 AND ("senderId" = $2 OR "receiverId" = $2)', [id, userId]);
      } catch (_) {
        try {
          await pool.query('DELETE FROM messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)', [id, userId]);
        } catch (_) {
          // ignore
        }
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Delete message error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
  });

  // Compatibility: some UIs upload attachments via POST /api/messages/upload
  // Best-effort: accept file if an upload middleware is provided; otherwise accept JSON and return a placeholder.
  const uploadMiddleware = upload && typeof upload.single === 'function' ? upload.single('file') : (req, _res, next) => next();
  router.post('/upload', authenticateToken, uploadMiddleware, async (req, res) => {
    try {
      const file = req.file;
      if (file) {
        return res.json({
          success: true,
          data: {
            filename: file.originalname || file.filename,
            url: file.path || file.filename,
            mimetype: file.mimetype,
            size: file.size,
          },
        });
      }

      const { filename, url } = req.body || {};
      return res.json({ success: true, data: { filename: filename || null, url: url || null } });
    } catch (error) {
      console.error('Message upload error:', error);
      return res.status(500).json({ success: false, error: 'Failed to upload message attachment' });
    }
  });

  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const userId = req.user?.id;
      const { id } = req.params;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await pool.query(
        'SELECT * FROM messages WHERE id = $1 AND ("senderId" = $2 OR "receiverId" = $2)',
        [id, userId]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get message by id error:', error);
      return res.status(500).json({ success: false, error: 'Failed to get message' });
    }
  });

  return router;
}

module.exports = createMessageRoutes;




