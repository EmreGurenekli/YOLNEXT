// Admin Real-time Notification System - Admin Panel Bildirim Sistemi
// YolNext Admin Panel "Anında Müdahale" Bildirim Zincirleri

const express = require('express');
const router = express.Router();

function createAdminNotificationRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification) {
  
  router.use(authenticateToken);
  router.use(requireAdmin);

  // Notification types for admin actions
  const ADMIN_NOTIFICATION_TYPES = {
    USER_BANNED: 'user_banned',
    USER_UNBANNED: 'user_unbanned',
    DISPUTE_RESOLVED: 'dispute_resolved',
    PAYMENT_PROCESSED: 'payment_processed',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    SECURITY_ALERT: 'security_alert',
    POLICY_UPDATE: 'policy_update',
    URGENT_ACTION: 'urgent_action',
    BULK_ACTION: 'bulk_action'
  };

  // Notification priority levels
  const NOTIFICATION_PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high', 
    URGENT: 'urgent'
  };

  // Delivery channels
  const DELIVERY_CHANNELS = {
    IN_APP: 'in_app',
    EMAIL: 'email',
    PUSH: 'push',
    WEBHOOK: 'webhook'
  };

  async function safeQuery(query, params = []) {
    if (!pool) return { rows: [] };
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Admin Notification DB error:', error);
      return { rows: [] };
    }
  }

  // Helper function to determine notification channels based on user preferences and urgency
  async function getDeliveryChannels(userId, priority) {
    const userPrefs = await safeQuery(`
      SELECT notification_preferences 
      FROM users 
      WHERE id = $1
    `, [userId]);

    let channels = [DELIVERY_CHANNELS.IN_APP]; // Always include in-app

    if (userPrefs.rows.length > 0) {
      try {
        const prefs = JSON.parse(userPrefs.rows[0].notification_preferences || '{}');
        if (prefs.email) channels.push(DELIVERY_CHANNELS.EMAIL);
        // SMS removed - no longer supported
        if (prefs.push) channels.push(DELIVERY_CHANNELS.PUSH);
      } catch (e) {
        console.error('Error parsing notification preferences:', e);
      }
    }

    // Force email for urgent notifications
    if (priority === NOTIFICATION_PRIORITY.URGENT && !channels.includes(DELIVERY_CHANNELS.EMAIL)) {
      channels.push(DELIVERY_CHANNELS.EMAIL);
    }

    return channels;
  }

  // POST /api/admin-notifications/send - Send notification to specific user(s)
  router.post('/send', async (req, res) => {
    try {
      const {
        user_ids = [],
        notification_type,
        title,
        message,
        priority = NOTIFICATION_PRIORITY.NORMAL,
        channels = [],
        scheduled_for = null,
        metadata = {},
        action_url = null
      } = req.body;

      // Validation
      if (user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one user_id is required'
        });
      }

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
      }

      if (!Object.values(ADMIN_NOTIFICATION_TYPES).includes(notification_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type'
        });
      }

      const results = [];
      const failedUsers = [];

      for (const userId of user_ids) {
        try {
          // Verify user exists
          const userCheck = await safeQuery('SELECT id, email, role FROM users WHERE id = $1', [userId]);
          if (userCheck.rows.length === 0) {
            failedUsers.push({ userId, error: 'User not found' });
            continue;
          }

          const user = userCheck.rows[0];

          // Determine delivery channels
          const deliveryChannels = channels.length > 0 ? channels : await getDeliveryChannels(userId, priority);

          // Create notification record
          const notificationRef = `ADMIN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          
          const notificationResult = await safeQuery(`
            INSERT INTO admin_notifications (
              reference_id,
              user_id,
              notification_type,
              title,
              message,
              priority,
              delivery_channels,
              scheduled_for,
              metadata,
              action_url,
              created_by,
              created_at,
              status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), 'pending')
            RETURNING *
          `, [
            notificationRef,
            userId,
            notification_type,
            title,
            message,
            priority,
            JSON.stringify(deliveryChannels),
            scheduled_for,
            JSON.stringify(metadata),
            action_url,
            req.user.id
          ]);

          if (notificationResult.rows.length === 0) {
            failedUsers.push({ userId, error: 'Failed to create notification record' });
            continue;
          }

          const notification = notificationResult.rows[0];

          // Send immediately if not scheduled
          if (!scheduled_for) {
            const deliveryResults = [];

            for (const channel of deliveryChannels) {
              try {
                switch (channel) {
                  case DELIVERY_CHANNELS.IN_APP:
                    // Use existing createNotification function
                    if (createNotification) {
                      await createNotification({
                        userId: userId,
                        type: notification_type,
                        title: title,
                        message: message,
                        metadata: {
                          ...metadata,
                          adminNotificationId: notification.id,
                          priority: priority,
                          actionUrl: action_url
                        }
                      });
                      deliveryResults.push({ channel, status: 'delivered' });
                    }
                    break;

                  case DELIVERY_CHANNELS.EMAIL:
                    // TODO: Integrate with email service
                    deliveryResults.push({ channel, status: 'pending_integration' });
                    break;

                  // SMS removed - no longer supported

                  case DELIVERY_CHANNELS.PUSH:
                    // TODO: Integrate with push notification service
                    deliveryResults.push({ channel, status: 'pending_integration' });
                    break;
                }
              } catch (channelError) {
                console.error(`Delivery error for channel ${channel}:`, channelError);
                deliveryResults.push({ channel, status: 'failed', error: channelError.message });
              }
            }

            // Update notification status
            const allDelivered = deliveryResults.every(r => r.status === 'delivered');
            const newStatus = allDelivered ? 'delivered' : 'partially_delivered';
            
            await safeQuery(`
              UPDATE admin_notifications 
              SET status = $1, delivery_results = $2, delivered_at = $3
              WHERE id = $4
            `, [
              newStatus,
              JSON.stringify(deliveryResults),
              allDelivered ? new Date() : null,
              notification.id
            ]);

            // Socket.io removed - real-time updates not needed
            // Notifications available via REST API polling
            if (false && deliveryChannels.includes(DELIVERY_CHANNELS.IN_APP)) { // io removed
              // io.to(`user-${userId}`).emit('admin_notification', {
                id: notification.id,
                type: notification_type,
                title: title,
                message: message,
                priority: priority,
                actionUrl: action_url,
                metadata: metadata,
                timestamp: new Date()
              });
            }

            results.push({
              userId: userId,
              userEmail: user.email,
              notificationId: notification.id,
              deliveryResults: deliveryResults,
              status: newStatus
            });
          } else {
            results.push({
              userId: userId,
              userEmail: user.email,
              notificationId: notification.id,
              status: 'scheduled',
              scheduledFor: scheduled_for
            });
          }

        } catch (userError) {
          console.error(`Error processing notification for user ${userId}:`, userError);
          failedUsers.push({ userId, error: userError.message });
        }
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'ADMIN_NOTIFICATION_SENT',
          entity: 'notification_system',
          entityId: 'bulk_send',
          req,
          metadata: {
            notificationType: notification_type,
            recipientCount: user_ids.length,
            successCount: results.length,
            failedCount: failedUsers.length,
            priority: priority,
            scheduled: !!scheduled_for
          }
        });
      }

      // Real-time update to admin panel
      // Socket.io removed - real-time updates not needed
      // Notification updates available via REST API polling
      if (false && results.length > 0) { // io removed
        // io.to('admin-room').emit('notification_sent', {
          notificationType: notification_type,
          recipientCount: results.length,
          priority: priority,
          sentBy: req.user.email || req.user.id,
          timestamp: new Date()
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          results: results,
          failed: failedUsers,
          summary: {
            total: user_ids.length,
            successful: results.length,
            failed: failedUsers.length
          }
        },
        message: `Notifications processed for ${user_ids.length} users. ${results.length} successful, ${failedUsers.length} failed.`
      });

    } catch (error) {
      console.error('Send admin notification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send notifications',
        error: error.message
      });
    }
  });

  // POST /api/admin-notifications/broadcast - Broadcast to user groups
  router.post('/broadcast', async (req, res) => {
    try {
      const {
        target_groups = [], // e.g., ['individual', 'corporate', 'nakliyeci', 'tasiyici', 'admin']
        target_conditions = {}, // e.g., { active_since: '2024-01-01', location: 'istanbul' }
        notification_type,
        title,
        message,
        priority = NOTIFICATION_PRIORITY.NORMAL,
        channels = [],
        scheduled_for = null,
        metadata = {}
      } = req.body;

      if (target_groups.length === 0 && Object.keys(target_conditions).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Target groups or conditions must be specified'
        });
      }

      if (!title || !message || !notification_type) {
        return res.status(400).json({
          success: false,
          message: 'Title, message, and notification type are required'
        });
      }

      // Build user selection query
      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      if (target_groups.length > 0) {
        const groupPlaceholders = target_groups.map(() => `$${++paramCount}`).join(',');
        whereConditions.push(`role IN (${groupPlaceholders})`);
        params.push(...target_groups);
      }

      if (target_conditions.active_since) {
        whereConditions.push(`created_at >= $${++paramCount}`);
        params.push(target_conditions.active_since);
      }

      if (target_conditions.location) {
        whereConditions.push(`(address ILIKE $${++paramCount} OR city ILIKE $${paramCount})`);
        params.push(`%${target_conditions.location}%`);
      }

      if (target_conditions.is_verified !== undefined) {
        whereConditions.push(`is_verified = $${++paramCount}`);
        params.push(target_conditions.is_verified);
      }

      // Add default condition to exclude inactive users
      whereConditions.push(`is_active = true`);

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get target users
      const usersQuery = `
        SELECT id, email, role 
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 10000
      `;

      const targetUsers = await safeQuery(usersQuery, params);

      if (targetUsers.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No users found matching the specified criteria'
        });
      }

      // Create broadcast record
      const broadcastRef = `BROADCAST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const broadcastResult = await safeQuery(`
        INSERT INTO admin_broadcasts (
          reference_id,
          notification_type,
          title,
          message,
          priority,
          target_groups,
          target_conditions,
          target_user_count,
          delivery_channels,
          scheduled_for,
          metadata,
          created_by,
          created_at,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'pending')
        RETURNING *
      `, [
        broadcastRef,
        notification_type,
        title,
        message,
        priority,
        JSON.stringify(target_groups),
        JSON.stringify(target_conditions),
        targetUsers.rows.length,
        JSON.stringify(channels),
        scheduled_for,
        JSON.stringify(metadata),
        req.user.id
      ]);

      const broadcast = broadcastResult.rows[0];

      // Process notifications (limit to prevent overwhelming the system)
      const batchSize = 100;
      const userIds = targetUsers.rows.map(u => u.id);
      const batches = [];
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        batches.push(userIds.slice(i, i + batchSize));
      }

      let processedCount = 0;
      let failedCount = 0;

      // Process first batch immediately, schedule others if there are many
      if (batches.length > 0) {
        for (let i = 0; i < Math.min(batches.length, 3); i++) { // Process max 3 batches immediately
          const batch = batches[i];
          
          try {
            // Create individual notification records
            for (const userId of batch) {
              const deliveryChannels = channels.length > 0 ? channels : await getDeliveryChannels(userId, priority);
              
              await safeQuery(`
                INSERT INTO admin_notifications (
                  reference_id,
                  user_id,
                  notification_type,
                  title,
                  message,
                  priority,
                  delivery_channels,
                  scheduled_for,
                  metadata,
                  broadcast_id,
                  created_by,
                  created_at,
                  status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
              `, [
                `${broadcastRef}_${userId}`,
                userId,
                notification_type,
                title,
                message,
                priority,
                JSON.stringify(deliveryChannels),
                scheduled_for,
                JSON.stringify(metadata),
                broadcast.id,
                req.user.id,
                scheduled_for ? 'scheduled' : 'pending'
              ]);

              // Send immediately if not scheduled
              if (!scheduled_for) {
                if (createNotification) {
                  await createNotification({
                    userId: userId,
                    type: notification_type,
                    title: title,
                    message: message,
                    metadata: {
                      ...metadata,
                      broadcastId: broadcast.id,
                      priority: priority
                    }
                  });
                }

                // Real-time WebSocket to user
                if (io && deliveryChannels.includes(DELIVERY_CHANNELS.IN_APP)) {
                  io.to(`user-${userId}`).emit('admin_broadcast', {
                    broadcastId: broadcast.id,
                    type: notification_type,
                    title: title,
                    message: message,
                    priority: priority,
                    metadata: metadata,
                    timestamp: new Date()
                  });
                }
              }

              processedCount++;
            }
          } catch (batchError) {
            console.error(`Batch ${i} processing error:`, batchError);
            failedCount += batch.length;
          }
        }
      }

      // Update broadcast status
      const broadcastStatus = failedCount === 0 ? 'completed' : 'partially_completed';
      await safeQuery(`
        UPDATE admin_broadcasts 
        SET status = $1, processed_count = $2, failed_count = $3, completed_at = $4
        WHERE id = $5
      `, [
        broadcastStatus,
        processedCount,
        failedCount,
        !scheduled_for ? new Date() : null,
        broadcast.id
      ]);

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'ADMIN_BROADCAST_SENT',
          entity: 'broadcast_system',
          entityId: broadcast.id,
          req,
          metadata: {
            broadcastRef,
            notificationType: notification_type,
            targetUserCount: targetUsers.rows.length,
            processedCount: processedCount,
            failedCount: failedCount,
            targetGroups: target_groups,
            priority: priority,
            scheduled: !!scheduled_for
          }
        });
      }

      // Real-time update to admin panel
      if (io) {
        io.to('admin-room').emit('broadcast_sent', {
          broadcastId: broadcast.id,
          broadcastRef: broadcastRef,
          notificationType: notification_type,
          targetUserCount: targetUsers.rows.length,
          processedCount: processedCount,
          priority: priority,
          sentBy: req.user.email || req.user.id,
          timestamp: new Date()
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          broadcast: broadcast,
          targetUserCount: targetUsers.rows.length,
          processedCount: processedCount,
          failedCount: failedCount,
          status: broadcastStatus
        },
        message: `Broadcast created and processed for ${processedCount} users. ${failedCount} failed.`
      });

    } catch (error) {
      console.error('Admin broadcast error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create broadcast',
        error: error.message
      });
    }
  });

  // GET /api/admin-notifications/history - Get notification history
  router.get('/history', async (req, res) => {
    try {
      const {
        notification_type = '',
        priority = '',
        status = '',
        user_id = '',
        date_from = '',
        date_to = '',
        page = 1,
        limit = 50
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      if (notification_type) {
        whereConditions.push(`an.notification_type = $${++paramCount}`);
        params.push(notification_type);
      }

      if (priority) {
        whereConditions.push(`an.priority = $${++paramCount}`);
        params.push(priority);
      }

      if (status) {
        whereConditions.push(`an.status = $${++paramCount}`);
        params.push(status);
      }

      if (user_id) {
        whereConditions.push(`an.user_id = $${++paramCount}`);
        params.push(user_id);
      }

      if (date_from) {
        whereConditions.push(`an.created_at >= $${++paramCount}`);
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push(`an.created_at <= $${++paramCount}`);
        params.push(date_to + ' 23:59:59');
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          an.*,
          u.email as user_email,
          u.role as user_role,
          admin.email as created_by_email,
          ab.reference_id as broadcast_reference
        FROM admin_notifications an
        LEFT JOIN users u ON an.user_id = u.id
        LEFT JOIN users admin ON an.created_by = admin.id
        LEFT JOIN admin_broadcasts ab ON an.broadcast_id = ab.id
        ${whereClause}
        ORDER BY an.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(parseInt(limit), offset);

      const notifications = await safeQuery(query, params);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM admin_notifications an
        ${whereClause}
      `;
      const countResult = await safeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.total || 0);

      return res.json({
        success: true,
        data: notifications.rows,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get notification history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notification history',
        error: error.message
      });
    }
  });

  // GET /api/admin-notifications/stats - Get notification statistics
  router.get('/stats', async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      let intervalClause;
      switch (period) {
        case '7d': intervalClause = "7 days"; break;
        case '30d': intervalClause = "30 days"; break;
        case '90d': intervalClause = "90 days"; break;
        default: intervalClause = "30 days";
      }

      // Notification stats by type
      const typeStats = await safeQuery(`
        SELECT notification_type, COUNT(*) as count
        FROM admin_notifications 
        WHERE created_at >= NOW() - INTERVAL '${intervalClause}'
        GROUP BY notification_type
        ORDER BY count DESC
      `);

      // Delivery success rates
      const deliveryStats = await safeQuery(`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
        FROM admin_notifications 
        WHERE created_at >= NOW() - INTERVAL '${intervalClause}'
        GROUP BY status
        ORDER BY count DESC
      `);

      // Broadcast statistics
      const broadcastStats = await safeQuery(`
        SELECT 
          COUNT(*) as total_broadcasts,
          SUM(target_user_count) as total_targeted_users,
          SUM(processed_count) as total_processed,
          ROUND(AVG(processed_count * 100.0 / NULLIF(target_user_count, 0)), 2) as avg_success_rate
        FROM admin_broadcasts
        WHERE created_at >= NOW() - INTERVAL '${intervalClause}'
      `);

      // Daily notification volume
      const dailyVolume = await safeQuery(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as notification_count,
          COUNT(DISTINCT user_id) as unique_users,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count
        FROM admin_notifications
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `);

      // Top notification creators
      const topCreators = await safeQuery(`
        SELECT 
          u.email as admin_email,
          COUNT(an.id) as notifications_sent,
          COUNT(DISTINCT an.notification_type) as unique_types_used
        FROM admin_notifications an
        JOIN users u ON an.created_by = u.id
        WHERE an.created_at >= NOW() - INTERVAL '${intervalClause}'
        GROUP BY u.id, u.email
        ORDER BY notifications_sent DESC
        LIMIT 10
      `);

      const stats = {
        period: period,
        byType: typeStats.rows,
        deliveryStats: deliveryStats.rows,
        broadcastStats: broadcastStats.rows[0] || {},
        dailyVolume: dailyVolume.rows,
        topCreators: topCreators.rows,
        generated_at: new Date()
      };

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get notification stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notification statistics',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createAdminNotificationRoutes;
