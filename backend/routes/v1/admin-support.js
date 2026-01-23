const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

function createAdminSupportRoutes(pool, authenticateToken, requireAdminRole) {
  const router = express.Router();

  // Multer configuration for admin file uploads
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads/support/admin');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (error) {
        console.error('Error creating admin upload directory:', error);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, 'admin-' + uniqueSuffix + '-' + sanitizedName);
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit for admin uploads
      files: 10
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

  // Get admin info
  const getAdminInfo = async (adminId) => {
    try {
      const { schema, cols } = await resolveTable('users');
      
      const emailCol = cols.has('email') ? 'email' : cols.has('e_mail') ? 'e_mail' : 'email';
      const nameCol = cols.has('fullName') ? 'fullName' : cols.has('full_name') ? 'full_name' : cols.has('name') ? 'name' : 'fullName';

      const query = `
        SELECT 
          id,
          ${emailCol} as email,
          ${nameCol} as name
        FROM "${schema}".users 
        WHERE id = $1 AND role = 'admin'
      `;

      const result = await pool.query(query, [adminId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting admin info:', error);
      return null;
    }
  };

  // Get all tickets for admin dashboard
  router.get('/tickets', authenticateToken, requireAdminRole, async (req, res) => {
    try {
      const {
        status,
        category,
        priority,
        assignedTo,
        search,
        page = 1,
        limit = 50
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereConditions = [];
      let params = [];
      let paramCounter = 1;

      if (status && status !== 'all') {
        whereConditions.push(`t.status = $${paramCounter}`);
        params.push(status);
        paramCounter++;
      }

      if (category && category !== 'all') {
        whereConditions.push(`t.category = $${paramCounter}`);
        params.push(category);
        paramCounter++;
      }

      if (priority && priority !== 'all') {
        whereConditions.push(`t.priority = $${paramCounter}`);
        params.push(priority);
        paramCounter++;
      }

      if (assignedTo && assignedTo !== 'all') {
        if (assignedTo === 'unassigned') {
          whereConditions.push('t.assigned_admin_id IS NULL');
        } else {
          whereConditions.push(`t.assigned_admin_id = $${paramCounter}`);
          params.push(parseInt(assignedTo));
          paramCounter++;
        }
      }

      if (search && search.trim()) {
        whereConditions.push(`(
          t.ticket_number ILIKE $${paramCounter} OR
          t.subject ILIKE $${paramCounter} OR
          t.user_name ILIKE $${paramCounter} OR
          t.user_email ILIKE $${paramCounter}
        )`);
        params.push(`%${search.trim()}%`);
        paramCounter++;
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // Get admin names for assigned tickets
      const ticketsQuery = `
        SELECT 
          t.*,
          a.${cols.has('fullName') ? 'fullName' : cols.has('full_name') ? 'full_name' : 'name'} as assigned_admin_name,
          (SELECT COUNT(*) FROM support_ticket_messages WHERE ticket_id = t.id AND sender_type = 'user') as user_message_count,
          (SELECT COUNT(*) FROM support_ticket_messages WHERE ticket_id = t.id AND sender_type = 'admin' AND is_internal = false) as admin_message_count
        FROM support_tickets t
        LEFT JOIN users a ON t.assigned_admin_id = a.id
        ${whereClause}
        ORDER BY 
          CASE t.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          t.created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      params.push(parseInt(limit), offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM support_tickets t
        ${whereClause}
      `;

      const [ticketsResult, countResult] = await Promise.all([
        pool.query(ticketsQuery, params),
        pool.query(countQuery, params.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Get statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
          COUNT(CASE WHEN status = 'waiting_user' THEN 1 END) as waiting_user_tickets,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
          COUNT(CASE WHEN assigned_admin_id IS NULL THEN 1 END) as unassigned_tickets,
          AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, CURRENT_TIMESTAMP) - created_at))/3600) as avg_resolution_hours
        FROM support_tickets
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const statsResult = await pool.query(statsQuery);

      res.json({
        success: true,
        data: {
          tickets: ticketsResult.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          },
          statistics: statsResult.rows[0]
        }
      });

    } catch (error) {
      console.error('Error fetching admin tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Destek talepleri getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Get specific ticket for admin
  router.get('/tickets/:ticketId', authenticateToken, requireAdminRole, async (req, res) => {
    try {
      const ticketId = req.params.ticketId;

      // Get ticket details with user info
      const ticketQuery = `
        SELECT 
          t.*,
          u.id as user_detail_id,
          u.${cols.has('fullName') ? 'fullName' : cols.has('full_name') ? 'full_name' : 'name'} as user_full_name,
          u.${cols.has('email') ? 'email' : 'e_mail'} as user_detail_email,
          u.${cols.has('phone') ? 'phone' : 'phone_number'} as user_detail_phone,
          u.role as user_detail_role,
          usr.support_reference_code,
          usr.total_tickets as user_total_tickets,
          usr.resolved_tickets as user_resolved_tickets,
          usr.is_vip_customer,
          usr.priority_level
        FROM support_tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN user_support_references usr ON t.user_id = usr.user_id
        WHERE t.id = $1
      `;

      const ticketResult = await pool.query(ticketQuery, [ticketId]);

      if (ticketResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Destek talebi bulunamadı.'
        });
      }

      // Get all messages (including internal)
      const messagesQuery = `
        SELECT 
          id, sender_type, sender_id, sender_name, message_content, message_type,
          is_internal, is_auto_generated, created_at
        FROM support_ticket_messages
        WHERE ticket_id = $1
        ORDER BY created_at ASC
      `;

      const messagesResult = await pool.query(messagesQuery, [ticketId]);

      // Get attachments
      const attachmentsQuery = `
        SELECT 
          id, message_id, filename, original_filename, file_size, file_type,
          uploaded_by_id, uploaded_by_type, created_at
        FROM support_ticket_attachments
        WHERE ticket_id = $1
        ORDER BY created_at ASC
      `;

      const attachmentsResult = await pool.query(attachmentsQuery, [ticketId]);

      // Get related shipment info if exists
      let relatedShipmentInfo = null;
      if (ticketResult.rows[0].related_shipment_id) {
        try {
          const { schema: shipmentSchema } = await resolveTable('shipments');
          const shipmentQuery = `
            SELECT id, title, status, tracking_number
            FROM "${shipmentSchema}".shipments
            WHERE id = $1
          `;
          const shipmentResult = await pool.query(shipmentQuery, [ticketResult.rows[0].related_shipment_id]);
          relatedShipmentInfo = shipmentResult.rows[0] || null;
        } catch (error) {
          console.error('Error fetching related shipment:', error);
        }
      }

      res.json({
        success: true,
        data: {
          ticket: ticketResult.rows[0],
          messages: messagesResult.rows,
          attachments: attachmentsResult.rows,
          relatedShipment: relatedShipmentInfo
        }
      });

    } catch (error) {
      console.error('Error fetching admin ticket details:', error);
      res.status(500).json({
        success: false,
        message: 'Destek talebi detayları getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Update ticket (assign, change status, priority, etc.)
  router.patch('/tickets/:ticketId', authenticateToken, requireAdminRole, async (req, res) => {
    try {
      const adminId = req.user?.id;
      const ticketId = req.params.ticketId;
      const {
        status,
        priority,
        assignedAdminId,
        adminNotes,
        resolutionSummary,
        resolutionCategory,
        isEscalated,
        escalationReason,
        followUpRequired,
        followUpDate
      } = req.body;

      const adminInfo = await getAdminInfo(adminId);
      if (!adminInfo) {
        return res.status(403).json({
          success: false,
          message: 'Admin yetkisi gereklidir.'
        });
      }

      // Build update query dynamically
      const updateFields = [];
      const params = [];
      let paramCounter = 1;

      if (status !== undefined) {
        updateFields.push(`status = $${paramCounter}`);
        params.push(status);
        paramCounter++;
      }

      if (priority !== undefined) {
        updateFields.push(`priority = $${paramCounter}`);
        params.push(priority);
        paramCounter++;
      }

      if (assignedAdminId !== undefined) {
        updateFields.push(`assigned_admin_id = $${paramCounter}`);
        params.push(assignedAdminId || null);
        paramCounter++;
      }

      if (adminNotes !== undefined) {
        updateFields.push(`admin_notes = $${paramCounter}`);
        params.push(adminNotes);
        paramCounter++;
      }

      if (resolutionSummary !== undefined) {
        updateFields.push(`resolution_summary = $${paramCounter}`);
        params.push(resolutionSummary);
        paramCounter++;
      }

      if (resolutionCategory !== undefined) {
        updateFields.push(`resolution_category = $${paramCounter}`);
        params.push(resolutionCategory);
        paramCounter++;
      }

      if (isEscalated !== undefined) {
        updateFields.push(`is_escalated = $${paramCounter}`);
        params.push(isEscalated);
        paramCounter++;
      }

      if (escalationReason !== undefined) {
        updateFields.push(`escalation_reason = $${paramCounter}`);
        params.push(escalationReason);
        paramCounter++;
      }

      if (followUpRequired !== undefined) {
        updateFields.push(`follow_up_required = $${paramCounter}`);
        params.push(followUpRequired);
        paramCounter++;
      }

      if (followUpDate !== undefined) {
        updateFields.push(`follow_up_date = $${paramCounter}`);
        params.push(followUpDate);
        paramCounter++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek alan belirtilmedi.'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(ticketId);

      const updateQuery = `
        UPDATE support_tickets
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Destek talebi bulunamadı.'
        });
      }

      // Log status change if status was updated
      if (status !== undefined) {
        const logQuery = `
          INSERT INTO support_ticket_messages (
            ticket_id, sender_type, sender_id, sender_name,
            message_content, message_type, is_internal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await pool.query(logQuery, [
          ticketId,
          'admin',
          adminId,
          adminInfo.name || 'Admin',
          `Durum değiştirildi: ${status}`,
          'status_change',
          false
        ]);
      }

      res.json({
        success: true,
        message: 'Destek talebi başarıyla güncellendi.',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Destek talebi güncellenirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Add admin message to ticket
  router.post('/tickets/:ticketId/messages', authenticateToken, requireAdminRole, upload.array('attachments'), async (req, res) => {
    try {
      const adminId = req.user?.id;
      const ticketId = req.params.ticketId;
      const { message, isInternal = false } = req.body;

      if (!message || message.trim().length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Mesaj içeriği gereklidir.'
        });
      }

      const adminInfo = await getAdminInfo(adminId);
      if (!adminInfo) {
        return res.status(403).json({
          success: false,
          message: 'Admin yetkisi gereklidir.'
        });
      }

      // Verify ticket exists
      const ticketCheck = await pool.query(
        'SELECT status FROM support_tickets WHERE id = $1',
        [ticketId]
      );

      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Destek talebi bulunamadı.'
        });
      }

      // Insert message
      const messageQuery = `
        INSERT INTO support_ticket_messages (
          ticket_id, sender_type, sender_id, sender_name, message_content, is_internal
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `;

      const messageResult = await pool.query(messageQuery, [
        ticketId,
        'admin',
        adminId,
        adminInfo.name || 'Admin',
        message.trim(),
        isInternal === true || isInternal === 'true'
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
            adminId,
            'admin'
          ]);

          attachmentData.push(attachmentResult.rows[0]);
        }
      }

      // Update ticket status if not internal message
      if (!isInternal) {
        const newStatus = ticketCheck.rows[0].status === 'waiting_user' ? 'in_progress' : 'in_progress';
        await pool.query(
          'UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStatus, ticketId]
        );
      }

      res.json({
        success: true,
        message: 'Mesaj başarıyla gönderildi.',
        data: {
          messageId: messageId,
          createdAt: messageResult.rows[0].created_at,
          attachments: attachmentData
        }
      });

    } catch (error) {
      console.error('Error adding admin message:', error);
      res.status(500).json({
        success: false,
        message: 'Mesaj gönderilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Search users for ticket assignment or lookup
  router.get('/users/search', authenticateToken, requireAdminRole, async (req, res) => {
    try {
      const { query: searchQuery, type = 'all' } = req.query;

      if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Arama sorgusu en az 2 karakter olmalıdır.'
        });
      }

      const { schema, cols } = await resolveTable('users');
      const emailCol = cols.has('email') ? 'email' : cols.has('e_mail') ? 'e_mail' : 'email';
      const nameCol = cols.has('fullName') ? 'fullName' : cols.has('full_name') ? 'full_name' : cols.has('name') ? 'name' : 'fullName';
      const phoneCol = cols.has('phone') ? 'phone' : cols.has('phone_number') ? 'phone_number' : 'phone';

      let whereConditions = [`(
        ${nameCol} ILIKE $1 OR 
        ${emailCol} ILIKE $1 OR 
        ${phoneCol} ILIKE $1 OR
        id::text = $2
      )`];
      let params = [`%${searchQuery.trim()}%`, searchQuery.trim()];

      if (type !== 'all') {
        whereConditions.push(`role = $3`);
        params.push(type);
      }

      const searchSql = `
        SELECT 
          u.id,
          u.${nameCol} as name,
          u.${emailCol} as email,
          u.${phoneCol} as phone,
          u.role,
          usr.support_reference_code,
          usr.total_tickets,
          usr.resolved_tickets,
          usr.is_vip_customer
        FROM "${schema}".users u
        LEFT JOIN user_support_references usr ON u.id = usr.user_id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY u.${nameCol}
        LIMIT 20
      `;

      const result = await pool.query(searchSql, params);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı arama işlemi başarısız.',
        error: error.message
      });
    }
  });

  // Get admin list for assignment
  router.get('/admins', authenticateToken, requireAdminRole, async (req, res) => {
    try {
      const { schema, cols } = await resolveTable('users');
      const nameCol = cols.has('fullName') ? 'fullName' : cols.has('full_name') ? 'full_name' : cols.has('name') ? 'name' : 'fullName';
      const emailCol = cols.has('email') ? 'email' : cols.has('e_mail') ? 'e_mail' : 'email';

      const query = `
        SELECT 
          id,
          ${nameCol} as name,
          ${emailCol} as email,
          (SELECT COUNT(*) FROM support_tickets WHERE assigned_admin_id = u.id AND status IN ('open', 'in_progress', 'waiting_user')) as active_tickets
        FROM "${schema}".users u
        WHERE role = 'admin'
        ORDER BY ${nameCol}
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Error fetching admin list:', error);
      res.status(500).json({
        success: false,
        message: 'Admin listesi getirilemedi.',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createAdminSupportRoutes;
