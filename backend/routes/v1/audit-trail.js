const express = require('express');

function createAuditTrailRoutes(pool, authenticateToken, requireAdminRole) {
  const router = express.Router();

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

  // Create audit trail entry
  const createAuditEntry = async (auditData) => {
    try {
      const {
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        riskLevel = 'low',
        metadata = {}
      } = auditData;

      const insertQuery = `
        INSERT INTO audit_trail (
          user_id, action, entity_type, entity_id,
          old_values, new_values, ip_address, user_agent,
          risk_level, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING id, created_at
      `;

      const result = await pool.query(insertQuery, [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
        riskLevel,
        JSON.stringify(metadata)
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating audit entry:', error);
      throw error;
    }
  };

  // Get audit trail for admin
  router.get('/logs', authenticateToken, requireAdminRole, async (req, res) => {
    try {
      const {
        userId,
        action,
        entityType,
        riskLevel,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereConditions = [];
      let params = [];
      let paramCounter = 1;

      if (userId) {
        whereConditions.push(`user_id = $${paramCounter}`);
        params.push(parseInt(userId));
        paramCounter++;
      }

      if (action && action !== 'all') {
        whereConditions.push(`action = $${paramCounter}`);
        params.push(action);
        paramCounter++;
      }

      if (entityType && entityType !== 'all') {
        whereConditions.push(`entity_type = $${paramCounter}`);
        params.push(entityType);
        paramCounter++;
      }

      if (riskLevel && riskLevel !== 'all') {
        whereConditions.push(`risk_level = $${paramCounter}`);
        params.push(riskLevel);
        paramCounter++;
      }

      if (startDate) {
        whereConditions.push(`created_at >= $${paramCounter}`);
        params.push(startDate);
        paramCounter++;
      }

      if (endDate) {
        whereConditions.push(`created_at <= $${paramCounter}`);
        params.push(endDate);
        paramCounter++;
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      // Get user info for join
      const { schema: userSchema, cols: userCols } = await resolveTable('users');
      const nameCol = userCols.has('fullName') ? 'fullName' : userCols.has('full_name') ? 'full_name' : 'name';
      const emailCol = userCols.has('email') ? 'email' : 'e_mail';

      const auditQuery = `
        SELECT 
          a.*,
          u.${nameCol} as user_name,
          u.${emailCol} as user_email
        FROM audit_trail a
        LEFT JOIN "${userSchema}".users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;

      params.push(parseInt(limit), offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_trail a
        ${whereClause}
      `;

      const [auditResult, countResult] = await Promise.all([
        pool.query(auditQuery, params),
        pool.query(countQuery, params.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Get statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_entries,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_entries,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_entries,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_entries
        FROM audit_trail
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const statsResult = await pool.query(statsQuery);

      res.json({
        success: true,
        data: {
          logs: auditResult.rows,
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
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Audit logları getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Get user-specific audit trail (for user to see their own actions)
  router.get('/my-actions', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Kimlik doğrulama gereklidir.' });
      }

      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const auditQuery = `
        SELECT 
          action, entity_type, entity_id, created_at, metadata
        FROM audit_trail
        WHERE user_id = $1 AND risk_level IN ('low', 'medium')
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_trail
        WHERE user_id = $1 AND risk_level IN ('low', 'medium')
      `;

      const [auditResult, countResult] = await Promise.all([
        pool.query(auditQuery, [userId, parseInt(limit), offset]),
        pool.query(countQuery, [userId])
      ]);

      const total = parseInt(countResult.rows[0]?.total || 0);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          actions: auditResult.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user actions:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem geçmişi getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  // Critical action logging endpoint (for system use)
  router.post('/log-action', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const {
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        riskLevel = 'medium',
        metadata = {}
      } = req.body;

      if (!action || !entityType) {
        return res.status(400).json({
          success: false,
          message: 'Action ve entityType gereklidir.'
        });
      }

      // Enhanced metadata with request info
      const enhancedMetadata = {
        ...metadata,
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl,
        method: req.method
      };

      const auditEntry = await createAuditEntry({
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        riskLevel,
        metadata: enhancedMetadata
      });

      // If this is a critical action, send notification to admins
      if (riskLevel === 'critical') {
        try {
          // Get admin users for notification
          const { schema: userSchema } = await resolveTable('users');
          const adminQuery = `SELECT id FROM "${userSchema}".users WHERE role = 'admin'`;
          const adminResult = await pool.query(adminQuery);
          
          // Create notification for each admin (if createNotification is available)
          if (req.createNotification) {
            for (const admin of adminResult.rows) {
              await req.createNotification(admin.id, {
                type: 'critical_action',
                title: 'Kritik İşlem Tespit Edildi',
                message: `${action} işlemi ${entityType} üzerinde gerçekleştirildi.`,
                metadata: { auditId: auditEntry.id, action, entityType, entityId }
              });
            }
          }
        } catch (notificationError) {
          console.error('Error sending critical action notification:', notificationError);
        }
      }

      res.json({
        success: true,
        message: 'İşlem başarıyla kaydedildi.',
        data: auditEntry
      });

    } catch (error) {
      console.error('Error logging action:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem kaydedilemedi.',
        error: error.message
      });
    }
  });

  // Get audit summary for dashboard
  router.get('/summary', authenticateToken, requireAdminRole, async (req, res) => {
    try {
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_actions,
          COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_actions,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_actions,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_actions,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as yesterday_actions,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_actions,
          COUNT(DISTINCT user_id) as active_users,
          AVG(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as daily_avg
        FROM audit_trail
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const topActionsQuery = `
        SELECT 
          action,
          entity_type,
          COUNT(*) as count
        FROM audit_trail
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY action, entity_type
        ORDER BY count DESC
        LIMIT 10
      `;

      const riskTrendsQuery = `
        SELECT 
          DATE(created_at) as date,
          risk_level,
          COUNT(*) as count
        FROM audit_trail
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at), risk_level
        ORDER BY date DESC
      `;

      const [summaryResult, topActionsResult, riskTrendsResult] = await Promise.all([
        pool.query(summaryQuery),
        pool.query(topActionsQuery),
        pool.query(riskTrendsQuery)
      ]);

      res.json({
        success: true,
        data: {
          summary: summaryResult.rows[0],
          topActions: topActionsResult.rows,
          riskTrends: riskTrendsResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({
        success: false,
        message: 'Audit özeti getirilirken hata oluştu.',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createAuditTrailRoutes;
