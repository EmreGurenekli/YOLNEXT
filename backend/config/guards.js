/**
 * Guards Configuration
 * Setup admin guard, idempotency guard, and audit log
 */

const errorLogger = require('../utils/errorLogger');

/**
 * Setup admin guard middleware
 * @returns {Function} Express middleware function
 */
function setupAdminGuard() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user is admin
    // Admin roles: 'admin', 'super_admin', 'support_admin', 'ops_admin'
    const userRole = req.user.role || req.user.panel_type || '';
    const adminRoles = ['admin', 'super_admin', 'support_admin', 'ops_admin'];
    
    if (!adminRoles.includes(userRole.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  };
}

/**
 * Setup idempotency guard
 * Prevents duplicate requests using idempotency keys
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Promise<Function>} Express middleware function
 */
async function setupIdempotencyGuard(pool) {
  // Create idempotency_keys table if it doesn't exist
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER,
        endpoint VARCHAR(255),
        response_status INTEGER,
        response_body JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
      )
    `);

    // Create index for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key)
    `);

    // Cleanup expired keys periodically
    setInterval(async () => {
      try {
        await pool.query("DELETE FROM idempotency_keys WHERE expires_at < NOW()");
      } catch (e) {
        errorLogger.warn('Idempotency cleanup failed', { error: e.message });
      }
    }, 3600000); // Every hour
  } catch (error) {
    errorLogger.warn('Idempotency table creation failed', { error: error.message });
  }

  return async (req, res, next) => {
    // Only apply to POST, PUT, PATCH, DELETE methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
    
    if (!idempotencyKey) {
      // Idempotency key is optional, continue without it
      return next();
    }

    try {
      // Check if key already exists
      const existing = await pool.query(
        'SELECT response_status, response_body FROM idempotency_keys WHERE key = $1 AND expires_at > NOW()',
        [idempotencyKey]
      );

      if (existing.rows.length > 0) {
        // Return cached response
        const cached = existing.rows[0];
        return res.status(cached.response_status).json(cached.response_body);
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = function(body) {
        // Store response in idempotency table
        pool.query(
          `INSERT INTO idempotency_keys (key, user_id, endpoint, response_status, response_body)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (key) DO UPDATE SET
             response_status = EXCLUDED.response_status,
             response_body = EXCLUDED.response_body,
             expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours'`,
          [
            idempotencyKey,
            req.user?.id || null,
            req.path,
            res.statusCode,
            JSON.stringify(body)
          ]
        ).catch(err => {
          errorLogger.warn('Failed to store idempotency key', { error: err.message });
        });

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      errorLogger.error('Idempotency guard error', { error: error.message });
      // Continue without idempotency if there's an error
      next();
    }
  };
}

/**
 * Setup audit log function
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Promise<Function>} Audit log function
 */
async function setupAuditLog(pool) {
  // Create audit_logs table if it doesn't exist
  // Handle case where table might exist with different structure
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      await pool.query(`
        CREATE TABLE audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          action VARCHAR(255) NOT NULL,
          resource_type VARCHAR(100),
          resource_id VARCHAR(255),
          details JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await pool.query(`
        CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)
      `);
      await pool.query(`
        CREATE INDEX idx_audit_logs_action ON audit_logs(action)
      `);
      await pool.query(`
        CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)
      `);
    } else {
      // Table exists, check if user_id column exists
      const columnCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_logs' 
          AND column_name = 'user_id'
        )
      `);
      
      if (!columnCheck.rows[0].exists) {
        // Try to add user_id column if it doesn't exist
        try {
          await pool.query(`ALTER TABLE audit_logs ADD COLUMN user_id INTEGER`);
        } catch (e) {
          errorLogger.warn('Could not add user_id column to audit_logs', { error: e.message });
        }
      }
    }
  } catch (error) {
    errorLogger.warn('Audit log table setup failed', { error: error.message });
  }

  return async (userId, action, details = {}) => {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          action,
          details.resourceType || null,
          details.resourceId || null,
          JSON.stringify(details),
          details.ipAddress || null,
          details.userAgent || null
        ]
      );
    } catch (error) {
      errorLogger.error('Audit log write failed', { error: error.message });
    }
  };
}

module.exports = {
  setupAdminGuard,
  setupIdempotencyGuard,
  setupAuditLog,
};

