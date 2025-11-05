const express = require('express');
const router = express.Router();

// Database connection
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the correct database file (same as other routes)
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Database connection helper
const getDb = () => {
  return new sqlite3.Database(dbPath);
};

// GET /api/messages - Mesajları listele
router.get('/', (req, res) => {
  try {
    const { userId, shipmentId, page = 1, limit = 20 } = req.query;

    // Use correct column names - Include user type info
    let query =
      `SELECT m.id, m.sender_id as senderId, m.receiver_id as recipientId, m.shipment_id as shipmentId, 
       m.content as message, m.is_read as readStatus, m.created_at as createdAt,
       COALESCE(sender_u.userType, sender_u.user_type, sender_u.role) as senderType,
       COALESCE(receiver_u.userType, receiver_u.user_type, receiver_u.role) as receiverType,
       COALESCE(sender_u.phone, sender_u.phone_number) as senderPhone,
       COALESCE(receiver_u.phone, receiver_u.phone_number) as receiverPhone,
       COALESCE(sender_u.firstName || ' ' || sender_u.lastName, sender_u.fullName, sender_u.first_name || ' ' || sender_u.last_name) as senderName,
       COALESCE(receiver_u.firstName || ' ' || receiver_u.lastName, receiver_u.fullName, receiver_u.first_name || ' ' || receiver_u.last_name) as receiverName
       FROM messages m
       LEFT JOIN users sender_u ON m.sender_id = sender_u.id
       LEFT JOIN users receiver_u ON m.receiver_id = receiver_u.id
       WHERE 1=1`;
    let params = [];

    if (userId) {
      query += ' AND (sender_id = ? OR receiver_id = ?)';
      params.push(userId, userId);
    }

    if (shipmentId) {
      query += ' AND shipment_id = ?';
      params.push(shipmentId);
    }

    query += ' ORDER BY created_at DESC';

    // Count total (simplified for COUNT)
    const countQuery = query.replace(
      `SELECT m.id, m.sender_id as senderId, m.receiver_id as recipientId, m.shipment_id as shipmentId, 
       m.content as message, m.is_read as readStatus, m.created_at as createdAt,
       COALESCE(sender_u.userType, sender_u.user_type, sender_u.role) as senderType,
       COALESCE(receiver_u.userType, receiver_u.user_type, receiver_u.role) as receiverType,
       COALESCE(sender_u.phone, sender_u.phone_number) as senderPhone,
       COALESCE(receiver_u.phone, receiver_u.phone_number) as receiverPhone,
       COALESCE(sender_u.firstName || ' ' || sender_u.lastName, sender_u.fullName, sender_u.first_name || ' ' || sender_u.last_name) as senderName,
       COALESCE(receiver_u.firstName || ' ' || receiver_u.lastName, receiver_u.fullName, receiver_u.first_name || ' ' || receiver_u.last_name) as receiverName
       FROM messages m
       LEFT JOIN users sender_u ON m.sender_id = sender_u.id
       LEFT JOIN users receiver_u ON m.receiver_id = receiver_u.id`,
      'SELECT COUNT(*) as total FROM messages m'
    );
    const db = getDb();
    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Mesajlar sayılırken hata oluştu',
          error: err.message,
        });
      }

      const total = countResult.total;

      // Get paginated results
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Mesajlar alınırken hata oluştu',
            error: err.message,
          });
        }

        res.json({
          success: true,
          data: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        });
        db.close();
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Mesajlar alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/messages/:id - Belirli mesajı getir
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Use correct column names
    db.get(
      'SELECT id, sender_id as senderId, receiver_id as recipientId, shipment_id as shipmentId, content as message, is_read as readStatus, created_at as createdAt FROM messages WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Mesaj alınırken hata oluştu',
            error: err.message,
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: 'Mesaj bulunamadı',
          });
        }

        res.json({
          success: true,
          data: row,
        });
        db.close();
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Mesaj alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/messages - Yeni mesaj gönder
router.post('/', (req, res) => {
  try {
    const { recipientId, receiver_id, message, shipmentId, shipment_id } = req.body;
    const senderId = req.headers['x-user-id'] || req.body.sender_id || '1';

    // Support both recipientId and receiver_id
    const receiverId = recipientId || receiver_id;
    const finalShipmentId = shipmentId || shipment_id;

    // Validation
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik (receiver_id ve message)',
      });
    }

    const db = getDb();
    
    // Check if this is nakliyeci-tasiyici communication (should be blocked)
    db.serialize(() => {
      db.get('SELECT userType, user_type, role FROM users WHERE id = ?', [senderId], (senderErr, senderUser) => {
        if (senderErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Gönderen kullanıcı bilgisi alınamadı',
            error: senderErr.message,
          });
        }

        db.get('SELECT userType, user_type, role FROM users WHERE id = ?', [receiverId], (receiverErr, receiverUser) => {
          if (receiverErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Alıcı kullanıcı bilgisi alınamadı',
              error: receiverErr.message,
            });
          }

          const senderType = senderUser?.userType || senderUser?.user_type || senderUser?.role || '';
          const receiverType = receiverUser?.userType || receiverUser?.user_type || receiverUser?.role || '';

          // Block nakliyeci-tasiyici messaging (they should use phone)
          if (
            (senderType === 'nakliyeci' && receiverType === 'tasiyici') ||
            (senderType === 'tasiyici' && receiverType === 'nakliyeci')
          ) {
            db.close();
            return res.status(403).json({
              success: false,
              message: 'Nakliyeci ve taşıyıcılar arasında mesajlaşma yapılamaz. Lütfen telefon numarası üzerinden iletişime geçin.',
            });
          }

          // Continue with message creation
          // Use correct column names and table structure
    const sql = `INSERT INTO messages 
      (id, sender_id, receiver_id, shipment_id, content, is_read, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    // Generate a unique ID
    const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

          const params = [
            messageId,
            senderId,
            receiverId,
            finalShipmentId || null,
            message,
            0, // is_read default to false
            new Date().toISOString(),
          ];

          db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Mesaj gönderilirken hata oluştu',
          error: err.message,
        });
      }

      // Get the created message with correct column names
      db.get(
        'SELECT id, sender_id as senderId, receiver_id as recipientId, shipment_id as shipmentId, content as message, is_read as readStatus, created_at as createdAt FROM messages WHERE id = ?',
        [messageId],
        (err, row) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Mesaj gönderildi ama alınamadı',
              error: err.message,
            });
          }

            res.status(201).json({
              success: true,
              message: 'Mesaj başarıyla gönderildi',
              data: row,
            });
            db.close();
          }
        );
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken hata oluştu',
      error: error.message,
    });
  }
});

// PUT /api/messages/:id/read - Mesajı okundu işaretle
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Use correct column names
    db.run(
      'UPDATE messages SET is_read = ?, updated_at = ? WHERE id = ?',
      [1, new Date().toISOString(), id],
      function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Mesaj okundu işaretlenirken hata oluştu',
            error: err.message,
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Mesaj bulunamadı',
          });
        }

        res.json({
          success: true,
          message: 'Mesaj okundu işaretlendi',
        });
        db.close();
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Mesaj okundu işaretlenirken hata oluştu',
      error: error.message,
    });
  }
});

// DELETE /api/messages/:id - Mesajı sil
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.run('DELETE FROM messages WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Mesaj silinirken hata oluştu',
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mesaj bulunamadı',
        });
      }

      res.json({
        success: true,
        message: 'Mesaj başarıyla silindi',
      });
      db.close();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Mesaj silinirken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;
