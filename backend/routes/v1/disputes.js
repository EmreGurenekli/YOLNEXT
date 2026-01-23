// Admin Dispute Resolution System - Anlaşmazlık Yönetim Sistemi
// YolNext Admin Panel "Hakemlik Mekanizması"

const express = require('express');
const router = express.Router();

function createDisputeRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification) {
  
  // Apply middleware to all dispute routes
  router.use(authenticateToken);
  router.use(requireAdmin);

  // Dispute statuses
  const DISPUTE_STATUS = {
    PENDING: 'pending',
    INVESTIGATING: 'investigating', 
    MEDIATING: 'mediating',
    RESOLVED: 'resolved',
    ESCALATED: 'escalated',
    CLOSED: 'closed'
  };

  // Dispute types
  const DISPUTE_TYPES = {
    PAYMENT: 'payment',
    DELIVERY: 'delivery',
    DAMAGE: 'damage',
    DELAY: 'delay',
    FRAUD: 'fraud',
    COMMUNICATION: 'communication',
    OTHER: 'other'
  };

  // Dispute priority levels
  const DISPUTE_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  // Helper function for safe database queries
  async function safeQuery(query, params = []) {
    if (!pool) return { rows: [] };
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Dispute DB error:', error);
      return { rows: [] };
    }
  }

  // Calculate dispute priority based on amount and type
  function calculateDisputePriority(amount, type, isRepeated = false) {
    let priority = DISPUTE_PRIORITY.LOW;
    
    if (amount > 10000 || type === DISPUTE_TYPES.FRAUD) priority = DISPUTE_PRIORITY.CRITICAL;
    else if (amount > 5000 || type === DISPUTE_TYPES.PAYMENT) priority = DISPUTE_PRIORITY.HIGH;
    else if (amount > 1000 || isRepeated) priority = DISPUTE_PRIORITY.MEDIUM;
    
    return priority;
  }

  // GET /api/disputes - List all disputes
  router.get('/', async (req, res) => {
    try {
      const {
        status = '',
        type = '',
        priority = '',
        assigned_to = '',
        page = 1,
        limit = 20,
        search = ''
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      // Build dynamic WHERE clause
      if (status) {
        whereConditions.push(`status = $${++paramCount}`);
        params.push(status);
      }

      if (type) {
        whereConditions.push(`dispute_type = $${++paramCount}`);
        params.push(type);
      }

      if (priority) {
        whereConditions.push(`priority = $${++paramCount}`);
        params.push(priority);
      }

      if (assigned_to) {
        whereConditions.push(`assigned_to = $${++paramCount}`);
        params.push(assigned_to);
      }

      if (search) {
        whereConditions.push(`(title ILIKE $${++paramCount} OR description ILIKE $${paramCount})`);
        params.push(`%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          d.*,
          u1.email as complainant_email,
          u2.email as respondent_email,
          s.id as shipment_tracking_number,
          admin.email as admin_email
        FROM disputes d
        LEFT JOIN users u1 ON d.complainant_id = u1.id
        LEFT JOIN users u2 ON d.respondent_id = u2.id  
        LEFT JOIN shipments s ON d.shipment_id = s.id
        LEFT JOIN users admin ON d.assigned_to = admin.id
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN priority = 'critical' THEN 1
            WHEN priority = 'high' THEN 2  
            WHEN priority = 'medium' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(parseInt(limit), offset);

      const disputes = await safeQuery(query, params);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM disputes d
        ${whereClause}
      `;
      const countResult = await safeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.total || 0);

      return res.json({
        success: true,
        data: disputes.rows,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get disputes error:', error);
      return res.status(500).json({
        success: false,
        message: 'Dispute list fetch failed',
        error: error.message
      });
    }
  });

  // POST /api/disputes - Create new dispute  
  router.post('/', async (req, res) => {
    try {
      const {
        shipment_id,
        complainant_id,
        respondent_id,
        dispute_type,
        title,
        description,
        amount = 0,
        evidence_urls = []
      } = req.body;

      // Validation
      if (!complainant_id || !respondent_id || !dispute_type || !title) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: complainant_id, respondent_id, dispute_type, title'
        });
      }

      if (!Object.values(DISPUTE_TYPES).includes(dispute_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dispute type'
        });
      }

      // Check if dispute already exists for this shipment
      if (shipment_id) {
        const existingDispute = await safeQuery(
          'SELECT id FROM disputes WHERE shipment_id = $1 AND status NOT IN ($2, $3)',
          [shipment_id, DISPUTE_STATUS.RESOLVED, DISPUTE_STATUS.CLOSED]
        );

        if (existingDispute.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Active dispute already exists for this shipment'
          });
        }
      }

      // Check for repeated disputes between same users
      const repeatCheck = await safeQuery(
        'SELECT COUNT(*) as count FROM disputes WHERE complainant_id = $1 AND respondent_id = $2',
        [complainant_id, respondent_id]
      );
      const isRepeated = parseInt(repeatCheck.rows[0]?.count || 0) > 0;

      // Calculate priority
      const priority = calculateDisputePriority(parseFloat(amount), dispute_type, isRepeated);

      // Generate unique dispute reference
      const disputeRef = `DSP${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Create dispute
      const insertQuery = `
        INSERT INTO disputes (
          dispute_ref,
          shipment_id,
          complainant_id, 
          respondent_id,
          dispute_type,
          title,
          description,
          amount,
          priority,
          status,
          evidence_urls,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `;

      const newDispute = await safeQuery(insertQuery, [
        disputeRef,
        shipment_id,
        complainant_id,
        respondent_id, 
        dispute_type,
        title,
        description,
        parseFloat(amount),
        priority,
        DISPUTE_STATUS.PENDING,
        JSON.stringify(evidence_urls),
        req.user.id
      ]);

      if (newDispute.rows.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create dispute'
        });
      }

      const dispute = newDispute.rows[0];

      // Send notifications to involved parties
      if (createNotification) {
        // Notify complainant
        await createNotification({
          userId: complainant_id,
          type: 'dispute_created',
          title: 'Anlaşmazlık Talebi Oluşturuldu',
          message: `${disputeRef} referanslı anlaşmazlık talebiniz incelemeye alınmıştır.`,
          metadata: { disputeId: dispute.id, disputeRef }
        });

        // Notify respondent  
        await createNotification({
          userId: respondent_id,
          type: 'dispute_received', 
          title: 'Anlaşmazlık Bildirimi',
          message: `Hakkınızda ${disputeRef} referanslı bir anlaşmazlık talebi oluşturulmuştur.`,
          metadata: { disputeId: dispute.id, disputeRef }
        });
      }

      // Auto-assign to admin if high/critical priority
      if (priority === DISPUTE_PRIORITY.HIGH || priority === DISPUTE_PRIORITY.CRITICAL) {
        // Find available admin (simple round-robin for now)
        const availableAdmin = await safeQuery(
          `SELECT id FROM users WHERE role = 'admin' 
           ORDER BY (SELECT COUNT(*) FROM disputes WHERE assigned_to = users.id AND status IN ('investigating', 'mediating')) ASC 
           LIMIT 1`
        );

        if (availableAdmin.rows.length > 0) {
          const adminId = availableAdmin.rows[0].id;
          await safeQuery(
            'UPDATE disputes SET assigned_to = $1, status = $2, updated_at = NOW() WHERE id = $3',
            [adminId, DISPUTE_STATUS.INVESTIGATING, dispute.id]
          );
          
          dispute.assigned_to = adminId;
          dispute.status = DISPUTE_STATUS.INVESTIGATING;

          // Notify admin
          if (createNotification) {
            await createNotification({
              userId: adminId,
              type: 'dispute_assigned',
              title: 'Yeni Anlaşmazlık Atandı',
              message: `${disputeRef} referanslı ${priority} öncelikli anlaşmazlık size atanmıştır.`,
              metadata: { disputeId: dispute.id, disputeRef, priority }
            });
          }
        }
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'DISPUTE_CREATED',
          entity: 'dispute',
          entityId: dispute.id,
          req,
          metadata: {
            disputeRef,
            priority,
            amount: parseFloat(amount),
            disputeType: dispute_type
          }
        });
      }

      // Emit real-time update
      if (io) {
        io.to('admin-room').emit('dispute_created', {
          dispute: dispute,
          priority: priority
        });
      }

      return res.status(201).json({
        success: true,
        data: dispute,
        message: 'Dispute created successfully'
      });

    } catch (error) {
      console.error('Create dispute error:', error);
      return res.status(500).json({
        success: false,
        message: 'Dispute creation failed',
        error: error.message
      });
    }
  });

  // GET /api/disputes/:id - Get specific dispute details
  router.get('/:id', async (req, res) => {
    try {
      const disputeId = req.params.id;

      const query = `
        SELECT 
          d.*,
          u1.email as complainant_email,
          u1."fullName" as complainant_name,
          u2.email as respondent_email,  
          u2."fullName" as respondent_name,
          s.id as shipment_tracking_number,
          admin.email as admin_email,
          admin."fullName" as admin_name
        FROM disputes d
        LEFT JOIN users u1 ON d.complainant_id = u1.id
        LEFT JOIN users u2 ON d.respondent_id = u2.id
        LEFT JOIN shipments s ON d.shipment_id = s.id  
        LEFT JOIN users admin ON d.assigned_to = admin.id
        WHERE d.id = $1
      `;

      const dispute = await safeQuery(query, [disputeId]);

      if (dispute.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      // Get dispute timeline/activities
      const timelineQuery = `
        SELECT * FROM dispute_activities 
        WHERE dispute_id = $1 
        ORDER BY created_at DESC
      `;
      const timeline = await safeQuery(timelineQuery, [disputeId]);

      // Get related messages/communications
      const messagesQuery = `
        SELECT * FROM dispute_messages 
        WHERE dispute_id = $1 
        ORDER BY created_at ASC  
      `;
      const messages = await safeQuery(messagesQuery, [disputeId]);

      const disputeData = dispute.rows[0];
      disputeData.timeline = timeline.rows || [];
      disputeData.messages = messages.rows || [];
      
      // Parse evidence URLs if stored as JSON
      try {
        disputeData.evidence_urls = JSON.parse(disputeData.evidence_urls || '[]');
      } catch (e) {
        disputeData.evidence_urls = [];
      }

      return res.json({
        success: true,
        data: disputeData
      });

    } catch (error) {
      console.error('Get dispute details error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dispute details',
        error: error.message
      });
    }
  });

  // PUT /api/disputes/:id/assign - Assign dispute to admin
  router.put('/:id/assign', async (req, res) => {
    try {
      const disputeId = req.params.id;
      const { admin_id } = req.body;

      if (!admin_id) {
        return res.status(400).json({
          success: false,
          message: 'admin_id is required'
        });
      }

      // Verify admin exists and has admin role
      const adminCheck = await safeQuery(
        'SELECT id, email FROM users WHERE id = $1 AND role = $2',
        [admin_id, 'admin']
      );

      if (adminCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Update dispute assignment
      const updateResult = await safeQuery(
        'UPDATE disputes SET assigned_to = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [admin_id, DISPUTE_STATUS.INVESTIGATING, disputeId]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      const dispute = updateResult.rows[0];

      // Log activity
      await safeQuery(
        `INSERT INTO dispute_activities (dispute_id, activity_type, description, created_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [disputeId, 'assigned', `Dispute assigned to admin ${adminCheck.rows[0].email}`, req.user.id]
      );

      // Notify assigned admin
      if (createNotification) {
        await createNotification({
          userId: admin_id,
          type: 'dispute_assigned',
          title: 'Anlaşmazlık Atandı', 
          message: `${dispute.dispute_ref} referanslı anlaşmazlık size atanmıştır.`,
          metadata: { disputeId: dispute.id, disputeRef: dispute.dispute_ref }
        });
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'DISPUTE_ASSIGNED',
          entity: 'dispute',
          entityId: disputeId,
          req,
          metadata: { assignedTo: admin_id }
        });
      }

      return res.json({
        success: true,
        data: dispute,
        message: 'Dispute assigned successfully'
      });

    } catch (error) {
      console.error('Assign dispute error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign dispute',
        error: error.message
      });
    }
  });

  // PUT /api/disputes/:id/status - Update dispute status
  router.put('/:id/status', async (req, res) => {
    try {
      const disputeId = req.params.id;
      const { status, resolution_notes, resolution_amount } = req.body;

      if (!status || !Object.values(DISPUTE_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required'
        });
      }

      // Update dispute
      const updateResult = await safeQuery(
        'UPDATE disputes SET status = $1, resolution_notes = $2, resolution_amount = $3, resolved_at = $4, resolved_by = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
        [
          status, 
          resolution_notes || null,
          resolution_amount ? parseFloat(resolution_amount) : null,
          (status === DISPUTE_STATUS.RESOLVED || status === DISPUTE_STATUS.CLOSED) ? new Date() : null,
          (status === DISPUTE_STATUS.RESOLVED || status === DISPUTE_STATUS.CLOSED) ? req.user.id : null,
          disputeId
        ]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      const dispute = updateResult.rows[0];

      // Log activity
      const activityDescription = status === DISPUTE_STATUS.RESOLVED 
        ? `Dispute resolved: ${resolution_notes || 'No notes provided'}`
        : `Status updated to ${status}`;

      await safeQuery(
        `INSERT INTO dispute_activities (dispute_id, activity_type, description, created_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [disputeId, 'status_updated', activityDescription, req.user.id]
      );

      // Notify involved parties
      if (createNotification && (status === DISPUTE_STATUS.RESOLVED || status === DISPUTE_STATUS.CLOSED)) {
        const notificationTitle = status === DISPUTE_STATUS.RESOLVED ? 'Anlaşmazlık Çözüldü' : 'Anlaşmazlık Kapatıldı';
        const notificationMessage = `${dispute.dispute_ref} referanslı anlaşmazlık ${status === DISPUTE_STATUS.RESOLVED ? 'çözümlenmiştir' : 'kapatılmıştır'}.`;

        // Notify complainant
        await createNotification({
          userId: dispute.complainant_id,
          type: 'dispute_resolved',
          title: notificationTitle,
          message: notificationMessage,
          metadata: { 
            disputeId: dispute.id, 
            disputeRef: dispute.dispute_ref,
            resolutionAmount: resolution_amount || null
          }
        });

        // Notify respondent
        await createNotification({
          userId: dispute.respondent_id,
          type: 'dispute_resolved', 
          title: notificationTitle,
          message: notificationMessage,
          metadata: { 
            disputeId: dispute.id, 
            disputeRef: dispute.dispute_ref,
            resolutionAmount: resolution_amount || null
          }
        });
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'DISPUTE_STATUS_UPDATED',
          entity: 'dispute', 
          entityId: disputeId,
          req,
          metadata: { 
            oldStatus: 'previous', 
            newStatus: status,
            resolutionAmount: resolution_amount || null
          }
        });
      }

      // Emit real-time update
      if (io) {
        io.to('admin-room').emit('dispute_updated', {
          dispute: dispute,
          status: status
        });
      }

      return res.json({
        success: true,
        data: dispute,
        message: 'Dispute status updated successfully'
      });

    } catch (error) {
      console.error('Update dispute status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update dispute status',
        error: error.message
      });
    }
  });

  // POST /api/disputes/:id/messages - Add message to dispute
  router.post('/:id/messages', async (req, res) => {
    try {
      const disputeId = req.params.id;
      const { message, recipient_id, attachments = [] } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required'
        });
      }

      // Verify dispute exists
      const disputeCheck = await safeQuery('SELECT * FROM disputes WHERE id = $1', [disputeId]);
      if (disputeCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      // Create message
      const newMessage = await safeQuery(
        `INSERT INTO dispute_messages (dispute_id, sender_id, recipient_id, message, attachments, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [disputeId, req.user.id, recipient_id, message.trim(), JSON.stringify(attachments)]
      );

      if (newMessage.rows.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create message'
        });
      }

      // Log activity
      await safeQuery(
        `INSERT INTO dispute_activities (dispute_id, activity_type, description, created_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [disputeId, 'message_sent', `Message sent to ${recipient_id ? 'specific user' : 'all parties'}`, req.user.id]
      );

      // Notify recipient(s)
      if (createNotification && recipient_id) {
        await createNotification({
          userId: recipient_id,
          type: 'dispute_message',
          title: 'Yeni Anlaşmazlık Mesajı',
          message: `${disputeCheck.rows[0].dispute_ref} referanslı anlaşmazlık için yeni mesaj.`,
          metadata: { disputeId, messageId: newMessage.rows[0].id }
        });
      }

      return res.status(201).json({
        success: true,
        data: newMessage.rows[0],
        message: 'Message sent successfully'
      });

    } catch (error) {
      console.error('Send dispute message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  });

  // GET /api/disputes/stats - Get dispute statistics for admin dashboard
  router.get('/stats/overview', async (req, res) => {
    try {
      const stats = {};

      // Total disputes by status
      const statusStats = await safeQuery(`
        SELECT status, COUNT(*) as count 
        FROM disputes 
        GROUP BY status
      `);
      stats.byStatus = statusStats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});

      // Disputes by priority
      const priorityStats = await safeQuery(`
        SELECT priority, COUNT(*) as count 
        FROM disputes 
        GROUP BY priority
      `);
      stats.byPriority = priorityStats.rows.reduce((acc, row) => {
        acc[row.priority] = parseInt(row.count);
        return acc;
      }, {});

      // Resolution metrics
      const resolutionMetrics = await safeQuery(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
          COUNT(*) as total_count
        FROM disputes 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      if (resolutionMetrics.rows.length > 0) {
        const metrics = resolutionMetrics.rows[0];
        stats.avgResolutionHours = parseFloat(metrics.avg_resolution_hours || 0);
        stats.resolutionRate = metrics.total_count > 0 
          ? (parseInt(metrics.resolved_count) / parseInt(metrics.total_count)) * 100 
          : 0;
      }

      // Recent activity
      const recentActivity = await safeQuery(`
        SELECT COUNT(*) as count
        FROM disputes 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `);
      stats.recentDisputes = parseInt(recentActivity.rows[0]?.count || 0);

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get dispute stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dispute statistics',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createDisputeRoutes;
