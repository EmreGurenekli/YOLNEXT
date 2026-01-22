const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Konuşmaları listele
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await db.all(
      `
      SELECT c.*, 
             s.title as shipment_title,
             s.pickup_city, s.delivery_city,
             CASE 
               WHEN c.participant1_id = ? THEN u2.first_name || ' ' || u2.last_name
               ELSE u1.first_name || ' ' || u1.last_name
             END as other_participant_name,
             CASE 
               WHEN c.participant1_id = ? THEN u2.avatar_url
               ELSE u1.avatar_url
             END as other_participant_avatar,
             CASE 
               WHEN c.participant1_id = ? THEN u2.company_name
               ELSE u1.company_name
             END as other_participant_company,
             m.content as last_message,
             m.created_at as last_message_at,
             m.message_type as last_message_type
      FROM conversations c
      JOIN shipments s ON c.shipment_id = s.id
      JOIN users u1 ON c.participant1_id = u1.id
      JOIN users u2 ON c.participant2_id = u2.id
      LEFT JOIN messages m ON c.id = m.conversation_id AND m.id = (
        SELECT MAX(id) FROM messages WHERE conversation_id = c.id
      )
      WHERE (c.participant1_id = ? OR c.participant2_id = ?) AND c.is_active = true
      ORDER BY c.last_message_at DESC
    `,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error('Konuşma listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
});

// Konuşma oluştur veya getir
router.post(
  '/conversations',
  authenticateToken,
  [
    body('shipment_id').isInt().withMessage('Geçerli gönderi ID gerekli'),
    body('other_participant_id')
      .isInt()
      .withMessage('Geçerli katılımcı ID gerekli'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array(),
        });
      }

      const { shipment_id, other_participant_id } = req.body;

      // Gönderi kontrolü
      const shipment = await db.get('SELECT * FROM shipments WHERE id = ?', [
        shipment_id,
      ]);
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      // Katılımcı kontrolü
      const otherParticipant = await db.get(
        'SELECT * FROM users WHERE id = ? AND is_active = true',
        [other_participant_id]
      );
      if (!otherParticipant) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı',
        });
      }

      // Mevcut konuşma kontrolü
      let conversation = await db.get(
        `
      SELECT * FROM conversations 
      WHERE shipment_id = ? AND 
            ((participant1_id = ? AND participant2_id = ?) OR 
             (participant1_id = ? AND participant2_id = ?))
    `,
        [
          shipment_id,
          req.user.id,
          other_participant_id,
          other_participant_id,
          req.user.id,
        ]
      );

      if (!conversation) {
        // Yeni konuşma oluştur
        const result = await db.run(
          `
        INSERT INTO conversations (shipment_id, participant1_id, participant2_id)
        VALUES (?, ?, ?)
      `,
          [shipment_id, req.user.id, other_participant_id]
        );

        conversation = await db.get(
          'SELECT * FROM conversations WHERE id = ?',
          [result.lastID]
        );
      }

      // Konuşma detaylarını getir
      const conversationDetails = await db.get(
        `
      SELECT c.*, 
             s.title as shipment_title,
             s.pickup_city, s.delivery_city,
             u1.first_name || ' ' || u1.last_name as participant1_name,
             u1.avatar_url as participant1_avatar,
             u1.company_name as participant1_company,
             u2.first_name || ' ' || u2.last_name as participant2_name,
             u2.avatar_url as participant2_avatar,
             u2.company_name as participant2_company
      FROM conversations c
      JOIN shipments s ON c.shipment_id = s.id
      JOIN users u1 ON c.participant1_id = u1.id
      JOIN users u2 ON c.participant2_id = u2.id
      WHERE c.id = ?
    `,
        [conversation.id]
      );

      res.json({
        success: true,
        data: conversationDetails,
      });
    } catch (error) {
      console.error('Konuşma oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

// Mesajları getir
router.get(
  '/conversations/:id/messages',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      // Konuşma erişim kontrolü
      const conversation = await db.get(
        `
      SELECT * FROM conversations 
      WHERE id = ? AND (participant1_id = ? OR participant2_id = ?) AND is_active = true
    `,
        [id, req.user.id, req.user.id]
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Konuşma bulunamadı',
        });
      }

      // Mesajları getir
      const messages = await db.all(
        `
      SELECT m.*, 
             u.first_name, u.last_name, u.avatar_url, u.company_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `,
        [id, parseInt(limit), parseInt(offset)]
      );

      // Mesajları okundu olarak işaretle
      await db.run(
        `
      UPDATE messages 
      SET is_read = true, read_at = CURRENT_TIMESTAMP 
      WHERE conversation_id = ? AND sender_id != ? AND is_read = false
    `,
        [id, req.user.id]
      );

      res.json({
        success: true,
        data: messages.reverse(), // En eski mesajlar önce
      });
    } catch (error) {
      console.error('Mesaj listeleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

// Mesaj gönder
router.post(
  '/conversations/:id/messages',
  authenticateToken,
  [
    body('content').notEmpty().withMessage('Mesaj içeriği gerekli'),
    body('message_type')
      .optional()
      .isIn(['text', 'image', 'file', 'location'])
      .withMessage('Geçerli mesaj tipi gerekli'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { content, message_type = 'text' } = req.body;

      // Konuşma erişim kontrolü
      const conversation = await db.get(
        `
      SELECT * FROM conversations 
      WHERE id = ? AND (participant1_id = ? OR participant2_id = ?) AND is_active = true
    `,
        [id, req.user.id, req.user.id]
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Konuşma bulunamadı',
        });
      }

      // Mesaj oluştur
      const result = await db.run(
        `
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES (?, ?, ?, ?)
    `,
        [id, req.user.id, content, message_type]
      );

      // Konuşmanın son mesaj zamanını güncelle
      await db.run(
        `
      UPDATE conversations 
      SET last_message_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
        [id]
      );

      // Mesaj detaylarını getir
      const message = await db.get(
        `
      SELECT m.*, 
             u.first_name, u.last_name, u.avatar_url, u.company_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `,
        [result.lastID]
      );

      res.json({
        success: true,
        message: 'Mesaj gönderildi',
        data: message,
      });
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

// Dosya yükleme (resim, belge)
router.post(
  '/conversations/:id/upload',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Dosya gerekli',
        });
      }

      // Konuşma erişim kontrolü
      const conversation = await db.get(
        `
      SELECT * FROM conversations 
      WHERE id = ? AND (participant1_id = ? OR participant2_id = ?) AND is_active = true
    `,
        [id, req.user.id, req.user.id]
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Konuşma bulunamadı',
        });
      }

      // Dosya tipini belirle
      const mimeType = req.file.mimetype;
      let messageType = 'file';
      if (mimeType.startsWith('image/')) {
        messageType = 'image';
      }

      // Mesaj oluştur
      const result = await db.run(
        `
      INSERT INTO messages (conversation_id, sender_id, content, message_type, file_url, file_name, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          id,
          req.user.id,
          req.file.originalname,
          messageType,
          req.file.path,
          req.file.originalname,
          req.file.size,
          mimeType,
        ]
      );

      // Konuşmanın son mesaj zamanını güncelle
      await db.run(
        `
      UPDATE conversations 
      SET last_message_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
        [id]
      );

      // Mesaj detaylarını getir
      const message = await db.get(
        `
      SELECT m.*, 
             u.first_name, u.last_name, u.avatar_url, u.company_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `,
        [result.lastID]
      );

      res.json({
        success: true,
        message: 'Dosya yüklendi',
        data: message,
      });
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

// Okunmamış mesaj sayısı
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await db.get(
      `
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.participant1_id = ? OR c.participant2_id = ?) 
        AND m.sender_id != ? 
        AND m.is_read = false
        AND c.is_active = true
    `,
      [req.user.id, req.user.id, req.user.id]
    );

    res.json({
      success: true,
      data: {
        unread_count: result.count,
      },
    });
  } catch (error) {
    console.error('Okunmamış mesaj sayısı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message,
    });
  }
});

// Konuşmayı arşivle
router.patch(
  '/conversations/:id/archive',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Konuşma erişim kontrolü
      const conversation = await db.get(
        `
      SELECT * FROM conversations 
      WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `,
        [id, req.user.id, req.user.id]
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Konuşma bulunamadı',
        });
      }

      // Konuşmayı arşivle
      await db.run('UPDATE conversations SET is_active = false WHERE id = ?', [
        id,
      ]);

      res.json({
        success: true,
        message: 'Konuşma arşivlendi',
      });
    } catch (error) {
      console.error('Konuşma arşivleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error: error.message,
      });
    }
  }
);

module.exports = router;
