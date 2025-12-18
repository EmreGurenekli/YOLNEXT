// Messages routes - Modular version
const express = require('express');

function createMessageRoutes(pool, authenticateToken, createNotification, io, writeAuditLog, messageSpeedLimiter, idempotencyGuard, generalLimiter, upload) {
  const router = express.Router();

  const normalizeRole = r => String(r || '').toLowerCase();
  const isShipperRole = r => {
    const role = normalizeRole(r);
    return role === 'corporate' || role === 'individual';
  };

  const getMessageColNames = async () => {
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'`
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pickCol = (...names) => names.find(n => cols.has(n)) || null;

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

      const { senderCol, receiverCol, createdAtCol } = await getMessageColNames();
      if (!senderCol || !receiverCol || !createdAtCol) {
        return res.json({ success: true, data: [], messages: [], meta: { total: 0, page: 1, limit: 20 } });
      }

      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await pool.query(
        `SELECT DISTINCT ON (CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${qCol(receiverCol)} 
            ELSE ${qCol(senderCol)} 
          END)
          m.*,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2."fullName" 
            ELSE u1."fullName" 
          END as otherUserName,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.id 
            ELSE u1.id 
          END as otherUserId,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.role 
            ELSE u1.role 
          END as otherUserRole
         FROM messages m
         LEFT JOIN users u1 ON ${qCol(senderCol)} = u1.id
         LEFT JOIN users u2 ON ${qCol(receiverCol)} = u2.id
         WHERE ${qCol(senderCol)} = $1 OR ${qCol(receiverCol)} = $1
         ORDER BY CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${qCol(receiverCol)} 
            ELSE ${qCol(senderCol)} 
          END, ${qCol(createdAtCol)} DESC
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT CASE 
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

      const { senderCol, receiverCol, createdAtCol } = await getMessageColNames();
      if (!senderCol || !receiverCol || !createdAtCol) {
        return res.json({ success: true, data: [], messages: [], meta: { total: 0, page: 1, limit: 20 } });
      }

      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get all messages where user is sender or receiver
      const result = await pool.query(
        `SELECT DISTINCT ON (CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${qCol(receiverCol)} 
            ELSE ${qCol(senderCol)} 
          END)
          m.*,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2."fullName" 
            ELSE u1."fullName" 
          END as otherUserName,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.id 
            ELSE u1.id 
          END as otherUserId,
          CASE 
            WHEN ${qCol(senderCol)} = $1 THEN u2.role 
            ELSE u1.role 
          END as otherUserRole
         FROM messages m
         LEFT JOIN users u1 ON ${qCol(senderCol)} = u1.id
         LEFT JOIN users u2 ON ${qCol(receiverCol)} = u2.id
         WHERE ${qCol(senderCol)} = $1 OR ${qCol(receiverCol)} = $1
         ORDER BY CASE 
            WHEN ${qCol(senderCol)} = $1 THEN ${qCol(receiverCol)} 
            ELSE ${qCol(senderCol)} 
          END, ${qCol(createdAtCol)} DESC
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit), offset]
      );

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT CASE 
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

      const result = await pool.query(
        `SELECT m.*, 
                u1."fullName" as senderName,
                u2."fullName" as receiverName
         FROM messages m
         LEFT JOIN users u1 ON ${qCol(senderCol)} = u1.id
         LEFT JOIN users u2 ON ${qCol(receiverCol)} = u2.id
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

      if (!receiverId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID and message are required',
        });
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

      if (!roleMap.get(Number(receiverId))) {
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
        const shipmentCheck = await pool.query(
          `SELECT s."ownerId", s."nakliyeci_id", s."driver_id", s.status, o.status as offer_status
           FROM shipments s
           LEFT JOIN offers o ON s.id = o."shipment_id" AND o."nakliyeci_id" = $1
           WHERE s.id = $2`,
          [senderId, shipmentId]
        );

        if (shipmentCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        const shipment = shipmentCheck.rows[0];
        const isOwner = shipment.ownerId === senderId;
        const isNakliyeci = shipment.nakliyeci_id === senderId;
        const isDriver = shipment.driver_id === senderId;
        const hasAcceptedOffer = shipment.offer_status === 'accepted' || shipment.status === 'offer_accepted';

        // Enforce B rule (payment messaging): shipper <-> nakliyeci messaging only after acceptance and only with assigned nakliyeci.
        if (isSenderShipperNakliyeciPair) {
          const nakliyeciId = isSenderNakliyeci ? senderId : parseInt(receiverId);
          const shipperId = isSenderShipper ? senderId : parseInt(receiverId);

          if (!shipment.nakliyeci_id) {
            return res.status(403).json({
              success: false,
              message: 'Mesajlaşma teklif kabul edilince açılır. Bu gönderiye henüz nakliyeci atanmadı.',
            });
          }

          if (shipment.nakliyeci_id !== nakliyeciId || shipment.ownerId !== shipperId) {
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
        const isParty = isOwner || (isNakliyeci && hasAcceptedOffer) || isDriver;
        if (!isParty) {
          return res.status(403).json({
            success: false,
            message: 'Bu gönderi için mesaj gönderme yetkiniz yok. Mesajlaşma sadece teklif kabul edildikten sonra yapılabilir.',
          });
        }

        // Verify receiver is the other party (owner or nakliyeci)
        const isReceiverOwner = shipment.ownerId === parseInt(receiverId);
        const isReceiverNakliyeci = shipment.nakliyeci_id === parseInt(receiverId);
        const isReceiverDriver = shipment.driver_id === parseInt(receiverId);
        
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
          [shipmentId || null, senderId, receiverId, message]
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

      // Emit via Socket.IO
      if (io) {
        io.to(`user_${receiverId}`).emit('new_message', newMessage);
      }

      // Create notification
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

      if (shipmentId) {
        const shipmentCheck = await pool.query(
          `SELECT s."ownerId", s."nakliyeci_id", s."driver_id", s.status, o.status as offer_status
           FROM shipments s
           LEFT JOIN offers o ON s.id = o."shipment_id" AND o."nakliyeci_id" = $1
           WHERE s.id = $2`,
          [senderId, shipmentId]
        );

        if (shipmentCheck.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
        }

        const shipment = shipmentCheck.rows[0];
        const isOwner = shipment.ownerId === senderId;
        const isNakliyeci = shipment.nakliyeci_id === senderId;
        const isDriver = shipment.driver_id === senderId;
        const hasAcceptedOffer = shipment.offer_status === 'accepted' || shipment.status === 'offer_accepted';

        // Enforce B rule (payment messaging): shipper <-> nakliyeci messaging only after acceptance and only with assigned nakliyeci.
        if (isSenderShipperNakliyeciPair) {
          const nakliyeciId = isSenderNakliyeci ? senderId : parseInt(receiverId);
          const shipperId = isSenderShipper ? senderId : parseInt(receiverId);

          if (!shipment.nakliyeci_id) {
            return res.status(403).json({
              success: false,
              message: 'Mesajlaşma teklif kabul edilince açılır. Bu gönderiye henüz nakliyeci atanmadı.',
            });
          }

          if (shipment.nakliyeci_id !== nakliyeciId || shipment.ownerId !== shipperId) {
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
        const isParty = isOwner || (isNakliyeci && hasAcceptedOffer) || isDriver;

        if (!isParty) {
          return res.status(403).json({
            success: false,
            message: 'Bu gönderi için mesaj gönderme yetkiniz yok. Mesajlaşma sadece teklif kabul edildikten sonra yapılabilir.',
          });
        }

        const isReceiverOwner = shipment.ownerId === parseInt(receiverId);
        const isReceiverNakliyeci = shipment.nakliyeci_id === parseInt(receiverId);
        const isReceiverDriver = shipment.driver_id === parseInt(receiverId);

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

      if (io) {
        io.to(`user_${receiverId}`).emit('new_message', newMessage);
      }

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



