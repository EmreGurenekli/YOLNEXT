/**
 * Comprehensive Audit Logger
 * Logs all critical operations for security and compliance
 */

/**
 * Log audit event
 */
async function logAuditEvent(pool, event) {
  if (!pool) {
    console.warn('⚠️ Audit log: Database not available, logging to console');
    console.log('AUDIT:', event);
    return;
  }

  try {
    await pool.query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        ip_address, user_agent, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        event.userId || null,
        event.action,
        event.resourceType || null,
        event.resourceId || null,
        event.ipAddress || null,
        event.userAgent || null,
        JSON.stringify(event.details || {}),
      ]
    );
  } catch (error) {
    // If audit_logs table doesn't exist, log to console
    console.warn('⚠️ Audit log failed (table may not exist):', error.message);
    console.log('AUDIT:', event);
  }
}

/**
 * Create audit log middleware
 */
function createAuditLogger(pool) {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override json to log after response
    res.json = function(data) {
      // Log critical operations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const action = `${req.method} ${req.path}`;
        const resourceType = req.path.split('/')[2] || 'unknown';
        const resourceId = req.params.id || req.body?.id || null;

        logAuditEvent(pool, {
          userId: req.user?.id || null,
          action,
          resourceType,
          resourceId,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            success: data.success || false,
          },
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  logAuditEvent,
  createAuditLogger,
};









