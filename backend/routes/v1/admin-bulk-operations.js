// Admin Bulk Operations System - Admin Panel Toplu İşlem Sistemi
// YolNext Admin Panel "Toplu Müdahale" Araçları

const express = require('express');
const router = express.Router();

function createAdminBulkOperationsRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification) {
  
  router.use(authenticateToken);
  router.use(requireAdmin);

  // Bulk operation types
  const BULK_OPERATION_TYPES = {
    USER_BAN: 'user_ban',
    USER_UNBAN: 'user_unban', 
    USER_DELETE: 'user_delete',
    NOTIFICATION_SEND: 'notification_send',
    FLAG_CREATE: 'flag_create',
    TRANSACTION_PROCESS: 'transaction_process',
    DISPUTE_ASSIGN: 'dispute_assign',
    SUSPICIOUS_SCAN: 'suspicious_scan',
    DATA_EXPORT: 'data_export',
    USER_MIGRATE: 'user_migrate'
  };

  // Operation statuses
  const OPERATION_STATUS = {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PARTIAL: 'partial'
  };

  async function safeQuery(query, params = []) {
    if (!pool) return { rows: [] };
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Bulk Operations DB error:', error);
      return { rows: [] };
    }
  }

  // Helper function to process operations in batches
  async function processBatch(items, batchSize, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(processor)
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({ ...result.value, originalIndex: i + index });
        } else {
          results.push({ 
            error: result.reason.message, 
            originalIndex: i + index,
            item: batch[index]
          });
        }
      });
    }
    
    return results;
  }

  // POST /api/admin-bulk/users/ban - Bulk ban users
  router.post('/users/ban', async (req, res) => {
    try {
      const { user_ids = [], reason, permanent = false } = req.body;

      if (user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'user_ids array is required'
        });
      }

      if (user_ids.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 1000 users can be processed at once'
        });
      }

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Detailed reason (min 10 chars) is required'
        });
      }

      // Create bulk operation record
      const operationRef = `BULK_BAN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const bulkOperation = await safeQuery(`
        INSERT INTO admin_bulk_operations (
          reference_id, operation_type, target_count, status, parameters, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [
        operationRef,
        BULK_OPERATION_TYPES.USER_BAN,
        user_ids.length,
        OPERATION_STATUS.PROCESSING,
        JSON.stringify({ reason, permanent, user_ids }),
        req.user.id
      ]);

      let successCount = 0;
      let failureCount = 0;
      const results = [];

      // Process users in batches of 50
      const batchProcessor = async (userId) => {
        try {
          // Check if user exists
          const userCheck = await safeQuery('SELECT id, email, role FROM users WHERE id = $1', [userId]);
          if (userCheck.rows.length === 0) {
            throw new Error('User not found');
          }

          const user = userCheck.rows[0];

          // Don't ban other admins
          if (user.role === 'admin') {
            throw new Error('Cannot ban admin users');
          }

          // Update user status
          const updateResult = await safeQuery(
            'UPDATE users SET is_active = false, ban_reason = $1, banned_at = NOW(), banned_by = $2 WHERE id = $3',
            [reason, req.user.id, userId]
          );

          if (updateResult.rowCount === 0) {
            throw new Error('Failed to update user status');
          }

          // Create flag
          await safeQuery(`
            INSERT INTO admin_flags (
              type, status, target_type, target_id, reason, created_by, created_at
            ) VALUES ('bulk_ban', 'closed', 'user', $1, $2, $3, NOW())
          `, [userId, `Bulk ban: ${reason}`, req.user.id]);

          // Send notification
          if (createNotification) {
            await createNotification({
              userId: userId,
              type: 'user_banned',
              title: 'Hesap Askıya Alındı',
              message: `Hesabınız ${permanent ? 'kalıcı olarak' : 'geçici olarak'} askıya alınmıştır. Sebep: ${reason}`,
              metadata: { 
                permanent, 
                reason, 
                bulkOperationId: bulkOperation.rows[0].id,
                bannedBy: req.user.id
              }
            });
          }

          return {
            userId: userId,
            userEmail: user.email,
            status: 'success',
            action: 'banned'
          };

        } catch (error) {
          throw new Error(`User ${userId}: ${error.message}`);
        }
      };

      try {
        const batchResults = await processBatch(user_ids, 50, batchProcessor);
        
        batchResults.forEach(result => {
          if (result.error) {
            failureCount++;
            results.push({
              userId: result.item,
              status: 'failed',
              error: result.error
            });
          } else {
            successCount++;
            results.push(result);
          }
        });

        // Update bulk operation status
        const finalStatus = failureCount === 0 ? OPERATION_STATUS.COMPLETED : 
                           successCount === 0 ? OPERATION_STATUS.FAILED : OPERATION_STATUS.PARTIAL;

        await safeQuery(`
          UPDATE admin_bulk_operations 
          SET status = $1, success_count = $2, failure_count = $3, completed_at = NOW(), results = $4
          WHERE id = $5
        `, [
          finalStatus,
          successCount,
          failureCount,
          JSON.stringify(results),
          bulkOperation.rows[0].id
        ]);

        // Write audit log
        if (writeAuditLog) {
          await writeAuditLog({
            userId: req.user.id,
            action: 'ADMIN_BULK_BAN_USERS',
            entity: 'bulk_operation',
            entityId: bulkOperation.rows[0].id,
            req,
            metadata: {
              operationRef,
              targetCount: user_ids.length,
              successCount,
              failureCount,
              reason,
              permanent
            }
          });
        }

        // Socket.io removed - real-time updates not needed
        // Bulk operation updates available via REST API polling
        if (false) { // io removed
          // io.to('admin-room').emit('bulk_operation_completed', {
            type: 'user_ban',
            operationRef,
            successCount,
            failureCount,
            executedBy: req.user.email || req.user.id,
            timestamp: new Date()
          });
        }

        return res.json({
          success: true,
          data: {
            operationId: bulkOperation.rows[0].id,
            operationRef,
            status: finalStatus,
            successCount,
            failureCount,
            results: results
          },
          message: `Bulk ban operation completed. ${successCount} successful, ${failureCount} failed.`
        });

      } catch (processingError) {
        // Update operation as failed
        await safeQuery(`
          UPDATE admin_bulk_operations 
          SET status = $1, failure_count = $2, error_message = $3, completed_at = NOW()
          WHERE id = $4
        `, [
          OPERATION_STATUS.FAILED,
          user_ids.length,
          processingError.message,
          bulkOperation.rows[0].id
        ]);

        throw processingError;
      }

    } catch (error) {
      console.error('Bulk ban operation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Bulk ban operation failed',
        error: error.message
      });
    }
  });

  // POST /api/admin-bulk/notifications/send - Bulk send notifications
  router.post('/notifications/send', async (req, res) => {
    try {
      const {
        user_ids = [],
        user_criteria = {}, // e.g., {role: 'individual', created_after: '2024-01-01'}
        notification_type,
        title,
        message,
        priority = 'normal',
        scheduled_for = null
      } = req.body;

      let targetUserIds = user_ids;

      // If criteria provided, get matching users
      if (Object.keys(user_criteria).length > 0 && user_ids.length === 0) {
        let whereConditions = [];
        let params = [];
        let paramCount = 0;

        if (user_criteria.role) {
          whereConditions.push(`role = $${++paramCount}`);
          params.push(user_criteria.role);
        }

        if (user_criteria.created_after) {
          whereConditions.push(`created_at >= $${++paramCount}`);
          params.push(user_criteria.created_after);
        }

        if (user_criteria.is_active !== undefined) {
          whereConditions.push(`is_active = $${++paramCount}`);
          params.push(user_criteria.is_active);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const usersResult = await safeQuery(`
          SELECT id FROM users ${whereClause} ORDER BY created_at DESC LIMIT 10000
        `, params);

        targetUserIds = usersResult.rows.map(row => row.id);
      }

      if (targetUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No target users specified or found'
        });
      }

      if (targetUserIds.length > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10,000 users can receive notifications at once'
        });
      }

      if (!title || !message || !notification_type) {
        return res.status(400).json({
          success: false,
          message: 'title, message, and notification_type are required'
        });
      }

      // Create bulk operation record
      const operationRef = `BULK_NOTIFY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const bulkOperation = await safeQuery(`
        INSERT INTO admin_bulk_operations (
          reference_id, operation_type, target_count, status, parameters, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [
        operationRef,
        BULK_OPERATION_TYPES.NOTIFICATION_SEND,
        targetUserIds.length,
        scheduled_for ? OPERATION_STATUS.QUEUED : OPERATION_STATUS.PROCESSING,
        JSON.stringify({ title, message, notification_type, priority, scheduled_for, user_criteria }),
        req.user.id
      ]);

      let successCount = 0;
      let failureCount = 0;
      const results = [];

      if (!scheduled_for) {
        // Process immediately
        const batchProcessor = async (userId) => {
          try {
            if (createNotification) {
              await createNotification({
                userId: userId,
                type: notification_type,
                title: title,
                message: message,
                metadata: { 
                  priority, 
                  bulkOperationId: bulkOperation.rows[0].id,
                  sentBy: req.user.id
                }
              });
            }

            // Create admin notification record
            await safeQuery(`
              INSERT INTO admin_notifications (
                reference_id, user_id, notification_type, title, message, priority, 
                status, bulk_operation_id, created_by, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, 'delivered', $7, $8, NOW())
            `, [
              `${operationRef}_${userId}`,
              userId,
              notification_type,
              title,
              message,
              priority,
              bulkOperation.rows[0].id,
              req.user.id
            ]);

            return {
              userId: userId,
              status: 'success',
              action: 'notification_sent'
            };

          } catch (error) {
            throw new Error(`User ${userId}: ${error.message}`);
          }
        };

        try {
          const batchResults = await processBatch(targetUserIds, 100, batchProcessor);
          
          batchResults.forEach(result => {
            if (result.error) {
              failureCount++;
              results.push({
                userId: result.item,
                status: 'failed',
                error: result.error
              });
            } else {
              successCount++;
              results.push(result);
            }
          });

          // Update bulk operation status
          const finalStatus = failureCount === 0 ? OPERATION_STATUS.COMPLETED : 
                             successCount === 0 ? OPERATION_STATUS.FAILED : OPERATION_STATUS.PARTIAL;

          await safeQuery(`
            UPDATE admin_bulk_operations 
            SET status = $1, success_count = $2, failure_count = $3, completed_at = NOW()
            WHERE id = $4
          `, [finalStatus, successCount, failureCount, bulkOperation.rows[0].id]);

        } catch (processingError) {
          await safeQuery(`
            UPDATE admin_bulk_operations 
            SET status = $1, failure_count = $2, error_message = $3, completed_at = NOW()
            WHERE id = $4
          `, [
            OPERATION_STATUS.FAILED,
            targetUserIds.length,
            processingError.message,
            bulkOperation.rows[0].id
          ]);

          throw processingError;
        }
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'ADMIN_BULK_NOTIFICATION_SEND',
          entity: 'bulk_operation',
          entityId: bulkOperation.rows[0].id,
          req,
          metadata: {
            operationRef,
            targetCount: targetUserIds.length,
            notificationType: notification_type,
            priority,
            scheduled: !!scheduled_for
          }
        });
      }

      return res.json({
        success: true,
        data: {
          operationId: bulkOperation.rows[0].id,
          operationRef,
          targetCount: targetUserIds.length,
          status: scheduled_for ? 'scheduled' : 'processing',
          scheduledFor: scheduled_for,
          successCount,
          failureCount
        },
        message: scheduled_for 
          ? `Bulk notification scheduled for ${targetUserIds.length} users`
          : `Bulk notification sent to ${successCount} users. ${failureCount} failed.`
      });

    } catch (error) {
      console.error('Bulk notification operation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Bulk notification operation failed',
        error: error.message
      });
    }
  });

  // POST /api/admin-bulk/data/export - Bulk data export
  router.post('/data/export', async (req, res) => {
    try {
      const { 
        export_type, // users, disputes, transactions, suspicious_activities
        filters = {},
        format = 'json', // json, csv
        include_sensitive = false
      } = req.body;

      const allowedTypes = ['users', 'disputes', 'financial_transactions', 'suspicious_activities', 'admin_notifications'];
      
      if (!allowedTypes.includes(export_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid export_type. Must be one of: ${allowedTypes.join(', ')}`
        });
      }

      // Create bulk operation record
      const operationRef = `BULK_EXPORT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const bulkOperation = await safeQuery(`
        INSERT INTO admin_bulk_operations (
          reference_id, operation_type, target_count, status, parameters, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [
        operationRef,
        BULK_OPERATION_TYPES.DATA_EXPORT,
        0, // Will update after counting
        OPERATION_STATUS.PROCESSING,
        JSON.stringify({ export_type, filters, format, include_sensitive }),
        req.user.id
      ]);

      let query = '';
      let params = [];
      let paramCount = 0;

      // Build export query based on type
      switch (export_type) {
        case 'users':
          query = `SELECT ${include_sensitive ? '*' : 'id, email, role, created_at, is_active'} FROM users`;
          break;
        case 'disputes':
          query = `SELECT * FROM disputes`;
          break;
        case 'financial_transactions':
          query = `SELECT ${include_sensitive ? '*' : 'id, reference_id, transaction_type, amount, status, created_at'} FROM financial_transactions`;
          break;
        case 'suspicious_activities':
          query = `SELECT * FROM suspicious_activities`;
          break;
        case 'admin_notifications':
          query = `SELECT ${include_sensitive ? '*' : 'id, notification_type, title, priority, status, created_at'} FROM admin_notifications`;
          break;
      }

      // Apply filters
      const whereConditions = [];
      
      if (filters.date_from) {
        whereConditions.push(`created_at >= $${++paramCount}`);
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereConditions.push(`created_at <= $${++paramCount}`);
        params.push(filters.date_to + ' 23:59:59');
      }

      if (filters.status) {
        whereConditions.push(`status = $${++paramCount}`);
        params.push(filters.status);
      }

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ` ORDER BY created_at DESC LIMIT 100000`; // Safety limit

      // Execute export query
      const exportResult = await safeQuery(query, params);
      const exportData = exportResult.rows;

      // Update operation with count
      await safeQuery(`
        UPDATE admin_bulk_operations 
        SET target_count = $1, success_count = $2, status = $3, completed_at = NOW()
        WHERE id = $4
      `, [exportData.length, exportData.length, OPERATION_STATUS.COMPLETED, bulkOperation.rows[0].id]);

      // Format data based on requested format
      let formattedData = exportData;
      let contentType = 'application/json';

      if (format === 'csv' && exportData.length > 0) {
        // Convert to CSV
        const headers = Object.keys(exportData[0]).join(',');
        const rows = exportData.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        );
        formattedData = [headers, ...rows].join('\n');
        contentType = 'text/csv';
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'ADMIN_BULK_DATA_EXPORT',
          entity: 'bulk_operation',
          entityId: bulkOperation.rows[0].id,
          req,
          metadata: {
            operationRef,
            exportType: export_type,
            recordCount: exportData.length,
            format,
            includeSensitive: include_sensitive,
            filters
          }
        });
      }

      return res.json({
        success: true,
        data: {
          operationId: bulkOperation.rows[0].id,
          operationRef,
          exportType: export_type,
          recordCount: exportData.length,
          format,
          exportData: formattedData,
          exportedAt: new Date()
        },
        message: `Data export completed. ${exportData.length} records exported.`
      });

    } catch (error) {
      console.error('Bulk data export operation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Bulk data export operation failed',
        error: error.message
      });
    }
  });

  // GET /api/admin-bulk/operations - List bulk operations
  router.get('/operations', async (req, res) => {
    try {
      const {
        operation_type = '',
        status = '',
        created_by = '',
        date_from = '',
        date_to = '',
        page = 1,
        limit = 20
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      if (operation_type) {
        whereConditions.push(`operation_type = $${++paramCount}`);
        params.push(operation_type);
      }

      if (status) {
        whereConditions.push(`status = $${++paramCount}`);
        params.push(status);
      }

      if (created_by) {
        whereConditions.push(`created_by = $${++paramCount}`);
        params.push(created_by);
      }

      if (date_from) {
        whereConditions.push(`created_at >= $${++paramCount}`);
        params.push(date_from);
      }

      if (date_to) {
        whereConditions.push(`created_at <= $${++paramCount}`);
        params.push(date_to + ' 23:59:59');
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          bo.*,
          u.email as created_by_email
        FROM admin_bulk_operations bo
        LEFT JOIN users u ON bo.created_by = u.id
        ${whereClause}
        ORDER BY bo.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(parseInt(limit), offset);

      const operations = await safeQuery(query, params);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM admin_bulk_operations bo
        ${whereClause}
      `;
      const countResult = await safeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.total || 0);

      return res.json({
        success: true,
        data: operations.rows,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get bulk operations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bulk operations',
        error: error.message
      });
    }
  });

  // GET /api/admin-bulk/operations/:id - Get specific bulk operation
  router.get('/operations/:id', async (req, res) => {
    try {
      const operationId = req.params.id;

      const operation = await safeQuery(`
        SELECT 
          bo.*,
          u.email as created_by_email
        FROM admin_bulk_operations bo
        LEFT JOIN users u ON bo.created_by = u.id
        WHERE bo.id = $1
      `, [operationId]);

      if (operation.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bulk operation not found'
        });
      }

      const operationData = operation.rows[0];
      
      // Parse JSON fields
      try {
        operationData.parameters = JSON.parse(operationData.parameters || '{}');
        operationData.results = JSON.parse(operationData.results || '[]');
      } catch (e) {
        console.error('Error parsing JSON fields:', e);
      }

      return res.json({
        success: true,
        data: operationData
      });

    } catch (error) {
      console.error('Get bulk operation details error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bulk operation details',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createAdminBulkOperationsRoutes;