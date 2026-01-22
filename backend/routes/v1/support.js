const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

function createSupportRoutes(pool, authenticateToken) {
  const router = express.Router();

  // Multer configuration for file uploads
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/support');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (error) {
        console.error('Error creating upload directory:', error);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, uniqueSuffix + '-' + sanitizedName);
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5 // Maximum 5 files per request
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Desteklenmeyen dosya formatı. Sadece resim, PDF, Word ve arşiv dosyaları kabul edilmektedir.'));
      }
    }
  });

  // Helper function to resolve table schema
  const resolveTable = async (tableName) => {
    try {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = $1
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`,
        [tableName]
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
      
      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = $2`,
        [tableName, schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      
      return { schema, cols };
    } catch (error) {
      return { schema: 'public', cols: new Set() };
    }
  };

  // Generate unique ticket number
  const generateTicketNumber = async () => {
    try {
      const result = await pool.query('SELECT generate_ticket_number() as ticket_number');
      return result.rows[0]?.ticket_number || `TKT-${Date.now()}`;
    } catch (error) {
      // Fallback if function doesn't exist
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `TKT-${dateStr}-${randomStr}`;
    }
  };

  // Get user info with safe field resolution
  const getUserInfo = async (userId) => {
    try {
      const { schema, cols } = await resolveTable('users');
      
      const emailCol = cols.has('email') ? 'email' : cols.has('e_mail') ? 'e_mail' : 'email';
      const nameCol = cols.has('fullName') ? 'fullName' : cols.has('full_name') ? 'full_name' : cols.has('name') ? 'name' : 'fullName';
      const phoneCol = cols.has('phone') ? 'phone' : cols.has('phone_number') ? 'phone_number' : 'phone';
      const roleCol = cols.has('role') ? 'role' : cols.has('user_type') ? 'user_type' : 'role';

      const query = `
        SELECT 
          id,
          ${emailCol} as email,
          ${nameCol} as name,
          ${phoneCol} as phone,
          ${roleCol} as user_type
        FROM "${schema}".users 
        WHERE id = $1
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  };

  // Create support ticket
  router.post('/tickets', authenticateToken, upload.array('attachments'), async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Kimlik doğrulama gereklidir.' });
      }

      const {
        category,
        priority = 'medium',
        subject,
        description,
        relatedShipmentId,
        relatedOfferId,
        relatedTransactionId,
        browserInfo,
        urlContext
      } = req.body;

      // Validation
      if (!category || !subject || !description) {
        return res.status(400).json({
          success: false,
          message: 'Kategori, konu başlığı ve açıklama alanları zorunludur.'
        });
      }

      if (subject.length < 5 || subject.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Konu başlığı 5-500 karakter arasında olmalıdır.'
        });
      }

      if (description.length < 10 || description.length > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Açıklama 10-10000 karakter arasında olmalıdır.'
        });
      }

      // Get user information
      const userInfo = await getUserInfo(userId);
      if (!userInfo) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bilgileri bulunamadı.'
        });
      }

      // Generate ticket number
      const ticketNumber = await generateTicketNumber();

      // Insert ticket
      const ticketQuery = `
        INSERT INTO support_tickets (
          ticket_number, user_id, user_type, user_email, user_name, user_phone,
          category, priority, subject, description,
          related_shipment_id, related_offer_id, related_transaction_id,
          browser_info, url_context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, ticket_number, created_at
      `;

      const ticketResult = await pool.query(ticketQuery, [
        ticketNumber,
        userId,
        userInfo.user_type || 'individual',
        userInfo.email || '',
        userInfo.name || '',
        userInfo.phone || '',
        category,
        priority,
        subject,
        description,
        relatedShipmentId || null,
        relatedOfferId || null,
        relatedTransactionId || null,
        browserInfo || null,
        urlContext || null
      ]);

      const ticketId = ticketResult.rows[0].id;

      // Handle file attachments
      const attachmentData = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const attachmentQuery = `
            INSERT INTO support_ticket_attachments (
              ticket_id, filename, original_filename, file_size, file_type, file_path,
              uploaded_by_id, uploaded_by_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, filename, original_filename, file_size
          `;

          const attachmentResult = await pool.query(attachmentQuery, [
            ticketId,
            file.filename,
            file.originalname,
            file.size,
            file.mimetype,
            file.path,
            userId,
            'user'
          ]);

          attachmentData.push(attachmentResult.rows[0]);
        }
      }

      // Auto-response based on category
      try {
        const categoryQuery = `
          SELECT auto_response_template, expected_response_time_hours
          FROM support_categories 
          WHERE name = $1 AND is_active = true
        `;
        
        const categoryResult = await pool.query(categoryQuery, [category]);
        
        if (categoryResult.rows[0]?.auto_response_template) {
          const autoMessageQuery = `
            INSERT INTO support_ticket_messages (
              ticket_id, sender_type, sender_id, sender_name,
              message_content, message_type, is_auto_generated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;

          await pool.query(autoMessageQuery, [
            ticketId,
            'admin',
            0, // System user
            'YolNext Destek Sistemi',
            categoryResult.rows[0].auto_response_template,
            'message',
            true
          ]);
        }
      } catch (error) {
        console.error('Error sending auto-response:', error);
      }

      res.status(201).json({
        success: true,
        message: 'Destek talebiniz başarıyla oluşturulmuştur.',
        data: {
          ticketId: ticketId,
          ticketNumber: ticketResult.rows[0].ticket_number,
          createdAt: ticketResult.rows[0].created_at,
          attachments: attachmentData
        }
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Destek talebi oluşturulurken bir hata oluştu.',
        error: error.message
      });
    }
  });

  // Get user's tickets
  router.get('/tickets', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Kimlik doğrulama gereklidir.' });
      }

      const { status, category, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereConditions = ['user_id = $1'];
      let params = [userId];
      let paramCounter = 2;

      if (status && status !== 'all') {
        whereConditions.push(`status = $${paramCounter}`);
        params.push(status);
        paramCounter++;
      }

      if (category && category !== 'all') {
        whereConditions.push(`category = $${paramCounter}`);
        params.push(category);
        paramCounter++;
      }

      const whereClause = whereConditions.join(' AND ');

      const countQuery = `
        SELECT COUNT(*) as total
        FROM support_tickets
        WHERE ${whereClause}
      `;

      const ticketsQuery = `
        SELECT 
          id, ticket_number, category, priority, status, subject,
          created_at, updated_at, first_response_at, resolved_at,
          assigned_admin_id
        FROM support_tickets
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      params.push(parseInt(limit), offset);

      const [countResult, ticketsResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(ticketsQuery, params)
      ]);

      const total = parseInt(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          tickets: ticketsResult.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Destek talepleri getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Get specific ticket details
  router.get('/tickets/:ticketId', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const ticketId = req.params.ticketId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Kimlik doğrulama gereklidir.' });
      }

      // Get ticket details
      const ticketQuery = `
        SELECT *
        FROM support_tickets
        WHERE id = $1 AND user_id = $2
      `;

      const ticketResult = await pool.query(ticketQuery, [ticketId, userId]);

      if (ticketResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Destek talebi bulunamadı.'
        });
      }

      // Get messages
      const messagesQuery = `
        SELECT 
          id, sender_type, sender_name, message_content, message_type,
          is_internal, is_auto_generated, created_at
        FROM support_ticket_messages
        WHERE ticket_id = $1 AND (is_internal = false OR sender_type = 'user')
        ORDER BY created_at ASC
      `;

      const messagesResult = await pool.query(messagesQuery, [ticketId]);

      // Get attachments
      const attachmentsQuery = `
        SELECT 
          id, filename, original_filename, file_size, file_type,
          uploaded_by_type, created_at
        FROM support_ticket_attachments
        WHERE ticket_id = $1
        ORDER BY created_at ASC
      `;

      const attachmentsResult = await pool.query(attachmentsQuery, [ticketId]);

      res.json({
        success: true,
        data: {
          ticket: ticketResult.rows[0],
          messages: messagesResult.rows,
          attachments: attachmentsResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching ticket details:', error);
      res.status(500).json({
        success: false,
        message: 'Destek talebi detayları getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Add message to ticket
  router.post('/tickets/:ticketId/messages', authenticateToken, upload.array('attachments'), async (req, res) => {
    try {
      const userId = req.user?.id;
      const ticketId = req.params.ticketId;
      const { message } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Kimlik doğrulama gereklidir.' });
      }

      if (!message || message.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Mesaj en az 5 karakter olmalıdır.'
        });
      }

      // Verify ticket belongs to user
      const ticketCheck = await pool.query(
        'SELECT status FROM support_tickets WHERE id = $1 AND user_id = $2',
        [ticketId, userId]
      );

      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Destek talebi bulunamadı.'
        });
      }

      if (ticketCheck.rows[0].status === 'closed') {
        return res.status(400).json({
          success: false,
          message: 'Kapatılmış destek taleplerine mesaj eklenemez.'
        });
      }

      // Get user info
      const userInfo = await getUserInfo(userId);

      // Insert message
      const messageQuery = `
        INSERT INTO support_ticket_messages (
          ticket_id, sender_type, sender_id, sender_name, message_content
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `;

      const messageResult = await pool.query(messageQuery, [
        ticketId,
        'user',
        userId,
        userInfo?.name || 'Kullanıcı',
        message.trim()
      ]);

      const messageId = messageResult.rows[0].id;

      // Handle attachments
      const attachmentData = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const attachmentQuery = `
            INSERT INTO support_ticket_attachments (
              ticket_id, message_id, filename, original_filename, file_size, file_type, file_path,
              uploaded_by_id, uploaded_by_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, filename, original_filename
          `;

          const attachmentResult = await pool.query(attachmentQuery, [
            ticketId,
            messageId,
            file.filename,
            file.originalname,
            file.size,
            file.mimetype,
            file.path,
            userId,
            'user'
          ]);

          attachmentData.push(attachmentResult.rows[0]);
        }
      }

      // Update ticket status to indicate user response
      await pool.query(
        'UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['open', ticketId]
      );

      res.json({
        success: true,
        message: 'Mesajınız başarıyla gönderilmiştir.',
        data: {
          messageId: messageId,
          createdAt: messageResult.rows[0].created_at,
          attachments: attachmentData
        }
      });

    } catch (error) {
      console.error('Error adding ticket message:', error);
      res.status(500).json({
        success: false,
        message: 'Mesaj gönderilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Get support categories
  router.get('/categories', async (req, res) => {
    try {
      const query = `
        SELECT id, name, description, expected_response_time_hours
        FROM support_categories
        WHERE is_active = true AND parent_id IS NULL
        ORDER BY sort_order, name
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Error fetching support categories:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori listesi getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Get user's support reference code
  router.get('/reference', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Kimlik doğrulama gereklidir.' });
      }

      const query = `
        SELECT support_reference_code, phone_verification_code, total_tickets, resolved_tickets
        FROM user_support_references
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Destek referans kodu bulunamadı.'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error fetching support reference:', error);
      res.status(500).json({
        success: false,
        message: 'Destek referans kodu getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Download attachment
  router.get('/attachments/:attachmentId', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const attachmentId = req.params.attachmentId;

      // Verify user owns the ticket
      const query = `
        SELECT a.file_path, a.original_filename, a.file_type
        FROM support_ticket_attachments a
        JOIN support_tickets t ON a.ticket_id = t.id
        WHERE a.id = $1 AND t.user_id = $2
      `;

      const result = await pool.query(query, [attachmentId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dosya bulunamadı.'
        });
      }

      const { file_path, original_filename, file_type } = result.rows[0];

      res.setHeader('Content-Type', file_type);
      res.setHeader('Content-Disposition', `attachment; filename="${original_filename}"`);
      res.sendFile(path.resolve(file_path));

    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Dosya indirilemedi.',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createSupportRoutes;
