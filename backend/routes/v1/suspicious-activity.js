// Suspicious Activity Detection System - Şüpheli Hareket Algılama Sistemi
// YolNext Admin Panel Güvenlik Monitoring

const express = require('express');
const router = express.Router();

function createSuspiciousActivityRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification) {
  
  router.use(authenticateToken);
  router.use(requireAdmin);

  // Suspicious activity types
  const ACTIVITY_TYPES = {
    RAPID_OFFERS: 'rapid_offers',
    UNUSUAL_PRICING: 'unusual_pricing',
    ACCOUNT_TAKEOVER: 'account_takeover',
    FAKE_SHIPMENTS: 'fake_shipments',
    PAYMENT_FRAUD: 'payment_fraud',
    LOCATION_ANOMALY: 'location_anomaly',
    REPEATED_DISPUTES: 'repeated_disputes',
    BULK_REGISTRATION: 'bulk_registration'
  };

  // Risk levels
  const RISK_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  async function safeQuery(query, params = []) {
    if (!pool) return { rows: [] };
    try {
      return await pool.query(query, params);
    } catch (error) {
      console.error('Suspicious Activity DB error:', error);
      return { rows: [] };
    }
  }

  // Real-time monitoring algorithms
  async function detectRapidOffers(userId) {
    const result = await safeQuery(`
      SELECT COUNT(*) as offer_count
      FROM offers 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'
    `, [userId]);
    
    const offerCount = parseInt(result.rows[0]?.offer_count || 0);
    return offerCount > 50 ? { detected: true, severity: RISK_LEVELS.HIGH, details: `${offerCount} offers in 1 hour` } : null;
  }

  async function detectUnusualPricing(userId) {
    const result = await safeQuery(`
      SELECT AVG(price) as avg_price, COUNT(*) as count
      FROM offers 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'
    `, [userId]);
    
    const avgPrice = parseFloat(result.rows[0]?.avg_price || 0);
    const count = parseInt(result.rows[0]?.count || 0);
    
    if (count > 0 && (avgPrice < 100 || avgPrice > 50000)) {
      return { 
        detected: true, 
        severity: avgPrice > 50000 ? RISK_LEVELS.CRITICAL : RISK_LEVELS.MEDIUM,
        details: `Unusual pricing: avg ${avgPrice}₺ (${count} offers)`
      };
    }
    return null;
  }

  async function detectLocationAnomaly(userId) {
    const result = await safeQuery(`
      SELECT DISTINCT pickup_city, delivery_city, COUNT(*) as count
      FROM shipments 
      WHERE sender_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY pickup_city, delivery_city
      ORDER BY count DESC
    `, [userId]);
    
    const uniqueRoutes = result.rows.length;
    return uniqueRoutes > 20 ? { 
      detected: true, 
      severity: RISK_LEVELS.MEDIUM,
      details: `${uniqueRoutes} different routes in 7 days`
    } : null;
  }

  async function detectRepeatedDisputes(userId) {
    const result = await safeQuery(`
      SELECT COUNT(*) as dispute_count
      FROM disputes 
      WHERE (complainant_id = $1 OR respondent_id = $1) 
      AND created_at >= NOW() - INTERVAL '30 days'
    `, [userId]);
    
    const disputeCount = parseInt(result.rows[0]?.dispute_count || 0);
    return disputeCount > 5 ? {
      detected: true,
      severity: RISK_LEVELS.HIGH,
      details: `${disputeCount} disputes in 30 days`
    } : null;
  }

  // Main detection engine
  async function runSuspiciousActivityDetection(userId) {
    const detections = [];
    
    // Run all detection algorithms
    const algorithms = [
      { name: ACTIVITY_TYPES.RAPID_OFFERS, func: detectRapidOffers },
      { name: ACTIVITY_TYPES.UNUSUAL_PRICING, func: detectUnusualPricing },
      { name: ACTIVITY_TYPES.LOCATION_ANOMALY, func: detectLocationAnomaly },
      { name: ACTIVITY_TYPES.REPEATED_DISPUTES, func: detectRepeatedDisputes }
    ];
    
    for (const algorithm of algorithms) {
      try {
        const result = await algorithm.func(userId);
        if (result && result.detected) {
          detections.push({
            activity_type: algorithm.name,
            risk_level: result.severity,
            details: result.details,
            detected_at: new Date()
          });
        }
      } catch (error) {
        console.error(`Detection error for ${algorithm.name}:`, error);
      }
    }
    
    return detections;
  }

  // POST /api/suspicious-activity/scan - Scan specific user
  router.post('/scan', async (req, res) => {
    try {
      const { user_id, force_scan = false } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id is required'
        });
      }

      // Check if user exists
      const userCheck = await safeQuery('SELECT id, email, role FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userCheck.rows[0];

      // Check last scan time unless forced
      if (!force_scan) {
        const lastScan = await safeQuery(`
          SELECT created_at FROM suspicious_activities 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        `, [user_id]);
        
        if (lastScan.rows.length > 0) {
          const lastScanTime = new Date(lastScan.rows[0].created_at);
          const timeSinceLastScan = Date.now() - lastScanTime.getTime();
          const hoursSinceLastScan = timeSinceLastScan / (1000 * 60 * 60);
          
          if (hoursSinceLastScan < 1) {
            return res.status(429).json({
              success: false,
              message: 'User scanned recently. Use force_scan=true to override.',
              data: { lastScanHours: hoursSinceLastScan }
            });
          }
        }
      }

      // Run detection
      const detections = await runSuspiciousActivityDetection(user_id);
      
      // Store results
      const stored = [];
      for (const detection of detections) {
        const result = await safeQuery(`
          INSERT INTO suspicious_activities (
            user_id, activity_type, risk_level, details, status, created_by, created_at
          ) VALUES ($1, $2, $3, $4, 'active', $5, NOW())
          RETURNING *
        `, [
          user_id,
          detection.activity_type,
          detection.risk_level,
          detection.details,
          req.user.id
        ]);
        
        if (result.rows.length > 0) {
          stored.push(result.rows[0]);
        }
      }

      // Auto-actions for critical findings
      for (const detection of stored) {
        if (detection.risk_level === RISK_LEVELS.CRITICAL) {
          // Auto-flag for admin review
          await safeQuery(`
            INSERT INTO admin_flags (
              type, status, target_type, target_id, reason, created_by, created_at
            ) VALUES ('suspicious_activity', 'open', 'user', $1, $2, $3, NOW())
          `, [
            user_id,
            `Critical suspicious activity: ${detection.details}`,
            req.user.id
          ]);

          // Notify admins
          if (createNotification) {
            const adminUsers = await safeQuery('SELECT id FROM users WHERE role = $1', ['admin']);
            for (const admin of adminUsers.rows) {
              await createNotification({
                userId: admin.id,
                type: 'critical_suspicious_activity',
                title: 'Kritik Şüpheli Aktivite',
                message: `Kullanıcı ${user.email} için kritik şüpheli aktivite tespit edildi.`,
                metadata: { userId: user_id, activityType: detection.activity_type }
              });
            }
          }
        }
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'SUSPICIOUS_ACTIVITY_SCAN',
          entity: 'user',
          entityId: user_id,
          req,
          metadata: { 
            detectionsCount: detections.length,
            forceScan: force_scan,
            riskLevels: detections.map(d => d.risk_level)
          }
        });
      }

      // Socket.io removed - real-time updates not needed
      // Suspicious activity updates available via REST API polling
      if (false && stored.length > 0) { // io removed
        // io.to('admin-room').emit('suspicious_activity_detected', {
        //   userId: user_id,
        //   userEmail: user.email,
        //   detections: stored,
        //   timestamp: new Date()
        // });
      }

      return res.json({
        success: true,
        data: {
          user: user,
          detections: stored,
          scanTime: new Date()
        },
        message: `Scan completed. ${detections.length} suspicious activities detected.`
      });

    } catch (error) {
      console.error('Suspicious activity scan error:', error);
      return res.status(500).json({
        success: false,
        message: 'Scan failed',
        error: error.message
      });
    }
  });

  // GET /api/suspicious-activity - List suspicious activities
  router.get('/', async (req, res) => {
    try {
      const {
        risk_level = '',
        activity_type = '',
        status = 'active',
        user_id = '',
        page = 1,
        limit = 50
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      if (risk_level) {
        whereConditions.push(`sa.risk_level = $${++paramCount}`);
        params.push(risk_level);
      }

      if (activity_type) {
        whereConditions.push(`sa.activity_type = $${++paramCount}`);
        params.push(activity_type);
      }

      if (status) {
        whereConditions.push(`sa.status = $${++paramCount}`);
        params.push(status);
      }

      if (user_id) {
        whereConditions.push(`sa.user_id = $${++paramCount}`);
        params.push(user_id);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          sa.*,
          u.email as user_email,
          u.role as user_role,
          admin.email as created_by_email
        FROM suspicious_activities sa
        LEFT JOIN users u ON sa.user_id = u.id
        LEFT JOIN users admin ON sa.created_by = admin.id
        ${whereClause}
        ORDER BY 
          CASE sa.risk_level
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2  
            WHEN 'medium' THEN 3
            ELSE 4
          END,
          sa.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(parseInt(limit), offset);

      const activities = await safeQuery(query, params);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM suspicious_activities sa
        ${whereClause}
      `;
      const countResult = await safeQuery(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.total || 0);

      return res.json({
        success: true,
        data: activities.rows,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get suspicious activities error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch suspicious activities',
        error: error.message
      });
    }
  });

  // PUT /api/suspicious-activity/:id/status - Update activity status
  router.put('/:id/status', async (req, res) => {
    try {
      const activityId = req.params.id;
      const { status, resolution_notes } = req.body;

      const validStatuses = ['active', 'investigating', 'resolved', 'false_positive'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      const updateResult = await safeQuery(`
        UPDATE suspicious_activities 
        SET status = $1, resolution_notes = $2, resolved_at = $3, resolved_by = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [
        status,
        resolution_notes || null,
        ['resolved', 'false_positive'].includes(status) ? new Date() : null,
        ['resolved', 'false_positive'].includes(status) ? req.user.id : null,
        activityId
      ]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Suspicious activity not found'
        });
      }

      const activity = updateResult.rows[0];

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'SUSPICIOUS_ACTIVITY_STATUS_UPDATED',
          entity: 'suspicious_activity',
          entityId: activityId,
          req,
          metadata: { newStatus: status, resolutionNotes: resolution_notes }
        });
      }

      return res.json({
        success: true,
        data: activity,
        message: 'Activity status updated successfully'
      });

    } catch (error) {
      console.error('Update suspicious activity status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: error.message
      });
    }
  });

  // GET /api/suspicious-activity/stats - Get statistics
  router.get('/stats/overview', async (req, res) => {
    try {
      const stats = {};

      // Activities by risk level
      const riskStats = await safeQuery(`
        SELECT risk_level, COUNT(*) as count 
        FROM suspicious_activities 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY risk_level
      `);
      stats.byRiskLevel = riskStats.rows.reduce((acc, row) => {
        acc[row.risk_level] = parseInt(row.count);
        return acc;
      }, {});

      // Activities by type
      const typeStats = await safeQuery(`
        SELECT activity_type, COUNT(*) as count 
        FROM suspicious_activities 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY activity_type
        ORDER BY count DESC
      `);
      stats.byType = typeStats.rows;

      // Recent critical activities
      const criticalActivities = await safeQuery(`
        SELECT COUNT(*) as count
        FROM suspicious_activities 
        WHERE risk_level = 'critical' 
        AND status = 'active'
        AND created_at >= NOW() - INTERVAL '24 hours'
      `);
      stats.recentCritical = parseInt(criticalActivities.rows[0]?.count || 0);

      // Detection efficiency
      const efficiency = await safeQuery(`
        SELECT 
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
          COUNT(CASE WHEN status = 'false_positive' THEN 1 END) as false_positive,
          COUNT(*) as total
        FROM suspicious_activities 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      if (efficiency.rows.length > 0) {
        const eff = efficiency.rows[0];
        const total = parseInt(eff.total);
        stats.accuracy = total > 0 
          ? ((parseInt(eff.resolved) / total) * 100).toFixed(1)
          : 0;
        stats.falsePositiveRate = total > 0 
          ? ((parseInt(eff.false_positive) / total) * 100).toFixed(1)
          : 0;
      }

      return res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get suspicious activity stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  });

  // POST /api/suspicious-activity/bulk-scan - Bulk scan multiple users
  router.post('/bulk-scan', async (req, res) => {
    try {
      const { user_ids = [], scan_criteria = {} } = req.body;

      if (user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'user_ids array is required'
        });
      }

      if (user_ids.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 100 users can be scanned at once'
        });
      }

      const results = [];

      for (const userId of user_ids) {
        try {
          const detections = await runSuspiciousActivityDetection(userId);
          
          // Store only significant detections (medium+ risk)
          const significantDetections = detections.filter(d => 
            [RISK_LEVELS.MEDIUM, RISK_LEVELS.HIGH, RISK_LEVELS.CRITICAL].includes(d.risk_level)
          );

          for (const detection of significantDetections) {
            await safeQuery(`
              INSERT INTO suspicious_activities (
                user_id, activity_type, risk_level, details, status, created_by, created_at
              ) VALUES ($1, $2, $3, $4, 'active', $5, NOW())
            `, [
              userId,
              detection.activity_type,
              detection.risk_level,
              detection.details,
              req.user.id
            ]);
          }

          results.push({
            userId: userId,
            detectionsCount: significantDetections.length,
            highestRisk: significantDetections.length > 0 
              ? significantDetections.reduce((max, d) => 
                  ['critical', 'high', 'medium', 'low'].indexOf(d.risk_level) < 
                  ['critical', 'high', 'medium', 'low'].indexOf(max) ? d.risk_level : max, 'low')
              : null
          });

        } catch (error) {
          console.error(`Bulk scan error for user ${userId}:`, error);
          results.push({
            userId: userId,
            error: error.message
          });
        }
      }

      // Write audit log
      if (writeAuditLog) {
        await writeAuditLog({
          userId: req.user.id,
          action: 'SUSPICIOUS_ACTIVITY_BULK_SCAN',
          entity: 'system',
          entityId: 'bulk_scan',
          req,
          metadata: { 
            userCount: user_ids.length,
            successfulScans: results.filter(r => !r.error).length,
            totalDetections: results.reduce((sum, r) => sum + (r.detectionsCount || 0), 0)
          }
        });
      }

      return res.json({
        success: true,
        data: results,
        message: `Bulk scan completed for ${user_ids.length} users`
      });

    } catch (error) {
      console.error('Bulk scan error:', error);
      return res.status(500).json({
        success: false,
        message: 'Bulk scan failed',
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createSuspiciousActivityRoutes;

