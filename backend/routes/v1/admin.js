const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const NODE_ENV = process.env.NODE_ENV || 'development';

// Admin roles definition
const ADMIN_ROLES = {
  SUPER_ADMIN: 'admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

// Admin permissions definition
const ADMIN_PERMISSIONS = {
  VIEW_OVERVIEW: 'view_overview',
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  VIEW_COMPLAINTS: 'view_complaints',
  VIEW_FLAGS: 'view_flags',
  MANAGE_FLAGS: 'manage_flags',
  VIEW_AUDIT: 'view_audit'
};

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: Object.values(ADMIN_PERMISSIONS),
  [ADMIN_ROLES.ADMIN]: Object.values(ADMIN_PERMISSIONS),
  [ADMIN_ROLES.MODERATOR]: [
    ADMIN_PERMISSIONS.VIEW_OVERVIEW,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_COMPLAINTS,
    ADMIN_PERMISSIONS.VIEW_FLAGS,
    ADMIN_PERMISSIONS.VIEW_AUDIT
  ]
};

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function safeQuery(pool, sql, params = []) {
  if (!pool) return { rows: [] };
  try {
    return await pool.query(sql, params);
  } catch {
    return { rows: [] };
  }
}

async function safeQueryFallback(pool, primarySql, fallbackSql, params = []) {
  const primary = await safeQuery(pool, primarySql, params);
  if (primary.rows && primary.rows.length) return primary;
  // If primary failed, safeQuery already returned empty. Try fallback.
  if (!fallbackSql) return primary;
  return await safeQuery(pool, fallbackSql, params);
}

async function strictQueryFallback(pool, primarySql, fallbackSql, params = []) {
  if (!pool) throw new Error('Database not available');
  try {
    const r = await pool.query(primarySql, params);
    if ((r.rowCount || 0) <= 0) throw new Error('No rows affected');
    return r;
  } catch (e1) {
    if (!fallbackSql) throw e1;
    const r2 = await pool.query(fallbackSql, params);
    if ((r2.rowCount || 0) <= 0) throw new Error('No rows affected');
    return r2;
  }
}

function createAdminRoutes(pool, authenticateToken, requireAdmin, writeAuditLog) {
  const router = express.Router();

  // Admin caching middleware for performance optimization
  const adminCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache for admin data

  const getCachedData = (key) => {
    const cached = adminCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  };

  const setCachedData = (key, data) => {
    adminCache.set(key, {
      data,
      timestamp: Date.now()
    });
  };

  const clearAdminCache = (pattern = null) => {
    if (!pattern) {
      adminCache.clear();
      return;
    }

    for (const key of adminCache.keys()) {
      if (key.includes(pattern)) {
        adminCache.delete(key);
      }
    }
  };

  // Admin performance monitoring middleware
  const adminPerformanceMonitor = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const originalSend = res.send;

    res.send = function(data) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      // Log slow admin queries (>500ms)
      if (duration > 500) {
        console.warn(`⚠️ Slow admin request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
      }

      // Add performance metrics to response headers
      res.set('X-Admin-Response-Time', duration.toFixed(2) + 'ms');

      return originalSend.call(this, data);
    };

    next();
  };

  // Admin input validation helpers
  const adminValidators = {
    // Sanitize and validate string inputs
    sanitizeString: (input, options = {}) => {
      const {
        maxLength = 1000,
        minLength = 0,
        allowHtml = false,
        required = false
      } = options;

      if (required && (!input || typeof input !== 'string')) {
        throw new Error('Required string input is missing or invalid');
      }

      if (!input) return input;

      let sanitized = String(input).trim();

      // Length validation
      if (sanitized.length < minLength) {
        throw new Error(`Input too short (minimum ${minLength} characters)`);
      }
      if (sanitized.length > maxLength) {
        throw new Error(`Input too long (maximum ${maxLength} characters)`);
      }

      // HTML sanitization if not allowed
      if (!allowHtml) {
        // Basic XSS prevention - remove script tags and dangerous attributes
        sanitized = sanitized
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '') // Remove all HTML tags
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }

      // SQL injection basic prevention (additional to parameterized queries)
      const sqlPatterns = /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bEXEC\b|\bEXECUTE\b)/i;
      if (sqlPatterns.test(sanitized)) {
        throw new Error('Potentially dangerous SQL keywords detected');
      }

      return sanitized;
    },

    // Validate user ID
    validateUserId: (userId) => {
      if (!userId || typeof userId !== 'string') {
        throw new Error('User ID is required');
      }

      const cleanId = userId.trim();

      // Check if it's a valid UUID or numeric ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const numericRegex = /^\d+$/;

      if (!uuidRegex.test(cleanId) && !numericRegex.test(cleanId)) {
        throw new Error('Invalid user ID format');
      }

      return cleanId;
    },

    // Validate pagination parameters
    validatePagination: (query) => {
      const limit = parseInt(query.limit) || 50;
      const page = parseInt(query.page) || 1;

      if (limit < 1 || limit > 500) {
        throw new Error('Limit must be between 1 and 500');
      }

      if (page < 1) {
        throw new Error('Page must be greater than 0');
      }

      return { limit, page };
    },

    // Validate search query
    validateSearchQuery: (query) => {
      if (!query || typeof query !== 'string') {
        throw new Error('Search query is required');
      }

      const cleanQuery = query.trim();

      if (cleanQuery.length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      if (cleanQuery.length > 100) {
        throw new Error('Search query too long (maximum 100 characters)');
      }

      // Prevent wildcard-only searches
      if (/^[*%]+$/.test(cleanQuery)) {
        throw new Error('Invalid search query');
      }

      return cleanQuery;
    },

    // Validate reason field
    validateReason: (reason) => {
      return adminValidators.sanitizeString(reason, {
        maxLength: 500,
        minLength: 3,
        required: true
      });
    },

    // Validate flag type
    validateFlagType: (type) => {
      const allowedTypes = ['spam', 'abuse', 'fraud', 'harassment', 'other'];
      const cleanType = adminValidators.sanitizeString(type, {
        maxLength: 50,
        required: true
      });

      if (!allowedTypes.includes(cleanType)) {
        throw new Error('Invalid flag type');
      }

      return cleanType;
    },

    // Validate target type
    validateTargetType: (targetType) => {
      const allowedTypes = ['user', 'shipment', 'message', 'complaint'];
      const cleanType = adminValidators.sanitizeString(targetType, {
        maxLength: 50,
        required: true
      });

      if (!allowedTypes.includes(cleanType)) {
        throw new Error('Invalid target type');
      }

      return cleanType;
    }
  };

  // Enhanced admin authentication middleware with granular permissions
  const requireAdminRole = (requiredPermissions = []) => {
    return (req, res, next) => {
      try {
        // First check if user is authenticated
        if (!req.user || !req.user.id) {
          return res.status(401).json({
            success: false,
            message: 'Admin authentication required',
            code: 'ADMIN_AUTH_REQUIRED'
          });
        }

        // Check admin role
        const userRole = req.user.role;
        console.log('[ADMIN DEBUG] User:', req.user.id, 'Role:', userRole, 'Panel:', req.user.panel_type, 'Valid roles:', Object.values(ADMIN_ROLES));
        if (!Object.values(ADMIN_ROLES).includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: 'Admin access denied',
            code: 'ADMIN_ACCESS_DENIED'
          });
        }

        // Get user permissions based on role
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];
        req.user.permissions = userPermissions;

        // Check granular permissions if specified
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requiredPermissions.every(perm =>
            userPermissions.includes(perm)
          );

          if (!hasRequiredPermissions) {
            return res.status(403).json({
              success: false,
              message: 'Insufficient admin permissions',
              code: 'ADMIN_INSUFFICIENT_PERMISSIONS',
              required: requiredPermissions,
              userPermissions: userPermissions
            });
          }
        }

        // Log admin access with role info
        console.log(`🛡️ Admin access granted: ${req.user.id} (${userRole}) - ${req.method} ${req.path}`);

        // Add admin context to request
        req.adminContext = {
          userId: req.user.id,
          role: userRole,
          permissions: userPermissions,
          accessTime: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.headers['user-agent']
        };

        next();
      } catch (error) {
        console.error('Admin auth middleware error:', error);
        return res.status(500).json({
          success: false,
          message: 'Admin authentication error',
          code: 'ADMIN_AUTH_ERROR'
        });
      }
    };
  };

  // Admin security headers middleware
  const adminSecurityHeaders = (req, res, next) => {
    // Enhanced security headers for admin routes
    res.set({
      'X-Admin-Access': 'true',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    next();
  };

  // Admin rate limiting middleware
  const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 50 : 500, // Lower limit for admin actions
    message: {
      success: false,
      message: 'Too many admin requests',
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      retryAfter: '900' // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks and read-only operations
      return req.method === 'GET' && (
        req.path.includes('/overview') ||
        req.path.includes('/planner/briefing') ||
        req.path.includes('/health')
      );
    },
    keyGenerator: (req) => {
      // Rate limit by admin user ID + IP for better security
      // Use ipKeyGenerator helper for IPv6 support
      const ip = ipKeyGenerator(req);
      return `${req.user?.id || 'unknown'}_${ip}`;
    }
  });

  // Admin error sanitization middleware
  const adminErrorHandler = (error, req, res, next) => {
    console.error('Admin route error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    // Sanitize error for production - never expose internal details
    const isDevelopment = process.env.NODE_ENV !== 'production';

    let statusCode = 500;
    let errorCode = 'ADMIN_INTERNAL_ERROR';
    let message = 'Admin operation failed';

    // Handle specific error types
    if (error.message?.includes('permission') || error.message?.includes('access')) {
      statusCode = 403;
      errorCode = 'ADMIN_PERMISSION_DENIED';
      message = 'Admin permission denied';
    } else if (error.message?.includes('not found')) {
      statusCode = 404;
      errorCode = 'ADMIN_RESOURCE_NOT_FOUND';
      message = 'Admin resource not found';
    } else if (error.message?.includes('validation')) {
      statusCode = 400;
      errorCode = 'ADMIN_VALIDATION_ERROR';
      message = 'Admin validation error';
    }

    // Log sensitive admin errors
    if (writeAuditLog) {
      writeAuditLog({
        userId: req.user?.id || null,
        action: 'ADMIN_ERROR',
        entity: 'admin_system',
        entityId: errorCode,
        req,
        metadata: {
          errorCode,
          statusCode,
          path: req.path,
          method: req.method,
          sanitized: true,
          originalError: isDevelopment ? error.message : '[REDACTED]'
        }
      }).catch(err => console.error('Admin error audit log failed:', err));
    }

    return res.status(statusCode).json({
      success: false,
      message,
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      ...(isDevelopment && {
        debug: {
          originalError: error.message,
          stack: error.stack?.split('\n').slice(0, 5) // First 5 lines only
        }
      })
    });
  };

  // Apply admin security middleware to all routes
  router.use(adminRateLimit);
  router.use(adminSecurityHeaders);
  router.use(requireAdminRole()); // Basic admin role check
  router.use((req, res, next) => {
    // Custom error handler for admin routes
    const originalJson = res.json;
    res.json = function(data) {
      // Add admin context to all responses
      if (data && typeof data === 'object') {
        data.adminContext = req.adminContext;
      }
      return originalJson.call(this, data);
    };
    next();
  });

  // Admin audit logging enhancement
  const adminAuditLogger = (action, entity, entityId, additionalMetadata = {}) => {
    return (req, res, next) => {
      const originalSend = res.send;
      res.send = function(data) {
        // Log successful admin operations
        if (res.statusCode >= 200 && res.statusCode < 300 && writeAuditLog) {
          writeAuditLog({
            userId: req.user?.id || null,
            action: `ADMIN_${action}`,
            entity,
            entityId,
            req,
            metadata: {
              ...additionalMetadata,
              statusCode: res.statusCode,
              responseSize: data ? data.length : 0,
              adminContext: req.adminContext
            }
          }).catch(err => console.error('Admin audit log error:', err));
        }
        return originalSend.call(this, data);
      };
      next();
    };
  };

  // Apply admin performance monitoring to all routes
  router.use(adminPerformanceMonitor);

  // Add audit logging to critical admin routes with permission checks
  router.get('/overview', requireAdminRole([ADMIN_PERMISSIONS.VIEW_OVERVIEW]), adminAuditLogger('VIEW_OVERVIEW', 'admin_system', 'overview'));
  router.get('/planner/briefing', requireAdminRole([ADMIN_PERMISSIONS.VIEW_OVERVIEW]), adminAuditLogger('VIEW_BRIEFING', 'admin_system', 'briefing'));
  router.get('/inbox', requireAdminRole([ADMIN_PERMISSIONS.VIEW_OVERVIEW]), adminAuditLogger('VIEW_INBOX', 'admin_system', 'inbox'));
  router.get('/users', requireAdminRole([ADMIN_PERMISSIONS.VIEW_USERS]), adminAuditLogger('LIST_USERS', 'admin_system', 'users_list'));
  router.get('/users/:id/summary', requireAdminRole([ADMIN_PERMISSIONS.VIEW_USERS]), adminAuditLogger('VIEW_USER_SUMMARY', 'user', req => req.params.id));
  router.get('/search', requireAdminRole([ADMIN_PERMISSIONS.VIEW_USERS]), adminAuditLogger('SEARCH_USERS', 'admin_system', 'search'));
  router.patch('/users/:id/active', requireAdminRole([ADMIN_PERMISSIONS.MANAGE_USERS]), adminAuditLogger('UPDATE_USER_STATUS', 'user', req => req.params.id, req => ({ isActive: req.body?.isActive, reason: req.body?.reason })));
  router.get('/complaints', requireAdminRole([ADMIN_PERMISSIONS.VIEW_COMPLAINTS]), adminAuditLogger('LIST_COMPLAINTS', 'admin_system', 'complaints_list'));
  router.get('/flags', requireAdminRole([ADMIN_PERMISSIONS.VIEW_FLAGS]), adminAuditLogger('LIST_FLAGS', 'admin_system', 'flags_list'));
  router.post('/flags', requireAdminRole([ADMIN_PERMISSIONS.MANAGE_FLAGS]), adminAuditLogger('CREATE_FLAG', 'admin_flag', req => req.body?.targetId, req => ({ type: req.body?.type, targetType: req.body?.targetType })));
  router.get('/audit', requireAdminRole([ADMIN_PERMISSIONS.VIEW_AUDIT]), adminAuditLogger('VIEW_AUDIT_LOGS', 'admin_system', 'audit_logs'));
  router.get('/tasks', requireAdminRole([ADMIN_PERMISSIONS.VIEW_OVERVIEW]), adminAuditLogger('VIEW_TASKS', 'admin_system', 'tasks'));

  router.get('/overview', async (_req, res) => {
    try {
      // Check cache first for performance
      const cacheKey = 'admin_overview';
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('✅ Admin overview served from cache');
        return res.json(cached);
      }

      const usersCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM users');
      const shipmentsCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM shipments');
      const offersCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM offers');
      const messagesCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM messages');

      const usersTotal = safeNumber(usersCount.rows?.[0]?.count);
      const shipmentsTotal = safeNumber(shipmentsCount.rows?.[0]?.count);
      const offersTotal = safeNumber(offersCount.rows?.[0]?.count);
      const messagesTotal = safeNumber(messagesCount.rows?.[0]?.count);

      const result = {
        success: true,
        data: { usersTotal, shipmentsTotal, offersTotal, messagesTotal },
        cached: false,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      setCachedData(cacheKey, result);

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Admin overview yüklenemedi', error: error.message });
    }
  });

  // Briefing endpoint handler - moved to middleware chain above

  // Platform stats endpoint for public homepage
  router.get('/stats', async (_req, res) => {
    try {
      const totalUsersRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM users');
      const totalShipmentsRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM shipments');
      const activeUsers24hRes = await safeQueryFallback(
        pool,
        'SELECT COUNT(*)::int as count FROM users WHERE "updatedAt" >= NOW() - INTERVAL \'24 hours\'',
        'SELECT COUNT(*)::int as count FROM users WHERE updated_at >= NOW() - INTERVAL \'24 hours\''
      );
      const newUsers7dRes = await safeQueryFallback(
        pool,
        'SELECT COUNT(*)::int as count FROM users WHERE "createdAt" >= NOW() - INTERVAL \'7 days\'',
        'SELECT COUNT(*)::int as count FROM users WHERE created_at >= NOW() - INTERVAL \'7 days\''
      );
      const inactiveUsersRes = await safeQuery(
        pool,
        'SELECT COUNT(*)::int as count FROM users WHERE NOT EXISTS (SELECT 1 FROM shipments WHERE shipments."senderId" = users.id)'
      );

      const totalUsers = safeNumber(totalUsersRes.rows?.[0]?.count);
      const totalShipments = safeNumber(totalShipmentsRes.rows?.[0]?.count);
      const activeUsers24h = safeNumber(activeUsers24hRes.rows?.[0]?.count);
      const newUsers7d = safeNumber(newUsers7dRes.rows?.[0]?.count);
      const inactiveUsers = safeNumber(inactiveUsersRes.rows?.[0]?.count);

      return res.json({
        success: true,
        data: {
          totalUsers,
          totalShipments,
          activeUsers24h,
          newUsers7d,
          inactiveUsers,
          satisfactionRate: 4.8, // Static for now
          avgDeliveryDays: 2.3 // Static for now
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Stats yüklenemedi', error: error.message });
    }
  });

  // Inbox and Users endpoint handlers - moved to middleware chain above

  router.get('/users/:id/summary', async (req, res) => {
    try {
      const targetUserId = String(req.params.id || '').trim();
      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'userId required' });
      }

      const userRes = await safeQueryFallback(
        pool,
        'SELECT id, email, role, phone, "fullName", "isActive", admin_ref, "createdAt", "updatedAt" FROM users WHERE id::text = $1 LIMIT 1',
        'SELECT id, email, role, phone, full_name as "fullName", is_active as "isActive", admin_ref, created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE id::text = $1 LIMIT 1',
        [targetUserId]
      );

      const flagsOpenRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM admin_flags WHERE status = 'open' AND target_type = 'user' AND target_id = $1", [targetUserId]);
      const flagsOpen = safeNumber(flagsOpenRes.rows?.[0]?.count);

      const complaintsOpenRes = await safeQueryFallback(
        pool,
        "SELECT COUNT(*)::int as count FROM complaints WHERE status IN ('pending','reviewing') AND (user_id::text = $1 OR related_user_id::text = $1)",
        "SELECT COUNT(*)::int as count FROM complaints WHERE status IN ('pending','reviewing') AND (\"userId\"::text = $1 OR \"relatedUserId\"::text = $1)",
        [targetUserId]
      );
      const complaintsOpen = safeNumber(complaintsOpenRes.rows?.[0]?.count);

      const auditRes = await safeQueryFallback(
        pool,
        'SELECT id, action, resource_type, resource_id, created_at, details FROM audit_logs WHERE user_id::text = $1 ORDER BY created_at DESC LIMIT 25',
        'SELECT id, action, resourceType as resource_type, resourceId as resource_id, createdAt as created_at, details FROM audit_logs WHERE user_id::text = $1 ORDER BY createdAt DESC LIMIT 25',
        [targetUserId]
      );

      const lastAudit = (auditRes.rows || []).map(r => ({
        id: r.id,
        action: r.action,
        resourceType: r.resource_type,
        resourceId: r.resource_id,
        createdAt: r.created_at,
        details: r.details,
      }));

      const user = (userRes.rows && userRes.rows[0]) ? userRes.rows[0] : null;
      return res.json({
        success: true,
        data: {
          user,
          summary: {
            flagsOpen,
            complaintsOpen,
          },
          lastAudit,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'User summary failed', error: error.message });
    }
  });

  // NEW ADMIN SYSTEMS INTEGRATION
  
  // Disputes management quick access
  router.get('/disputes/summary', async (req, res) => {
    try {
      const disputesSummary = await safeQuery(`
        SELECT 
          COUNT(*) as total_disputes,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_disputes,
          COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_disputes,
          COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_disputes,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_disputes
        FROM disputes
      `);

      const recentDisputes = await safeQuery(`
        SELECT d.dispute_ref, d.title, d.priority, d.status, d.created_at,
               u1.email as complainant_email, u2.email as respondent_email
        FROM disputes d
        LEFT JOIN users u1 ON d.complainant_id = u1.id
        LEFT JOIN users u2 ON d.respondent_id = u2.id
        ORDER BY d.created_at DESC
        LIMIT 10
      `);

      return res.json({
        success: true,
        data: {
          summary: disputesSummary.rows[0] || {},
          recent: recentDisputes.rows || []
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Disputes summary failed', error: error.message });
    }
  });

  // Suspicious activities quick access
  router.get('/suspicious/summary', async (req, res) => {
    try {
      const suspiciousSummary = await safeQuery(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_activities,
          COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_activities,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_activities,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_activities
        FROM suspicious_activities
      `);

      const recentActivities = await safeQuery(`
        SELECT sa.activity_type, sa.risk_level, sa.details, sa.created_at,
               u.email as user_email, u.role as user_role
        FROM suspicious_activities sa
        LEFT JOIN users u ON sa.user_id = u.id
        WHERE sa.status = 'active'
        ORDER BY 
          CASE sa.risk_level
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            ELSE 4
          END,
          sa.created_at DESC
        LIMIT 10
      `);

      return res.json({
        success: true,
        data: {
          summary: suspiciousSummary.rows[0] || {},
          recent: recentActivities.rows || []
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Suspicious activities summary failed', error: error.message });
    }
  });

  // Financial transparency quick access
  router.get('/financial/summary', async (req, res) => {
    try {
      const financialSummary = await safeQuery(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
          SUM(CASE WHEN transaction_type = 'commission' AND status = 'completed' THEN amount ELSE 0 END) as total_commission,
          SUM(CASE WHEN transaction_type = 'refund' AND status = 'completed' THEN amount ELSE 0 END) as total_refunds,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
        FROM financial_transactions
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      const recentTransactions = await safeQuery(`
        SELECT ft.reference_id, ft.transaction_type, ft.amount, ft.status, ft.created_at,
               u.email as user_email, u.role as user_role
        FROM financial_transactions ft
        LEFT JOIN users u ON ft.user_id = u.id
        ORDER BY ft.created_at DESC
        LIMIT 10
      `);

      return res.json({
        success: true,
        data: {
          summary: financialSummary.rows[0] || {},
          recent: recentTransactions.rows || []
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Financial summary failed', error: error.message });
    }
  });

  // Notifications summary
  router.get('/notifications/summary', async (req, res) => {
    try {
      const notificationsSummary = await safeQuery(`
        SELECT 
          COUNT(*) as total_sent,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_count
        FROM admin_notifications
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `);

      const recentNotifications = await safeQuery(`
        SELECT an.notification_type, an.title, an.priority, an.status, an.created_at,
               u.email as recipient_email, admin.email as sent_by_email
        FROM admin_notifications an
        LEFT JOIN users u ON an.user_id = u.id
        LEFT JOIN users admin ON an.created_by = admin.id
        ORDER BY an.created_at DESC
        LIMIT 10
      `);

      return res.json({
        success: true,
        data: {
          summary: notificationsSummary.rows[0] || {},
          recent: recentNotifications.rows || []
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Notifications summary failed', error: error.message });
    }
  });

  // Search, complaints, flags, audit, tasks handlers - moved to middleware chain above

  // Actual route implementations with proper middleware protection
  router.get('/overview', async (_req, res) => {
    try {
      // Check cache first for performance
      const cacheKey = 'admin_overview';
      const cachedData = adminCache.get(cacheKey);
      if (cachedData) {
        return res.json({ success: true, data: cachedData, cached: true });
      }

      // Get basic platform stats for the admin overview
      const totalUsersRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM users');
      const totalShipmentsRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM shipments');
      const activeShipmentsRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM shipments WHERE status IN ('pending','waiting','open','waiting_for_offers','in_transit','dispatched')");
      const inTransitRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM shipments WHERE status IN ('in_transit','dispatched')");
      const activeListingsRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM shipments WHERE status IN ('pending','waiting','open','waiting_for_offers')");
      const totalOffersRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM offers');

      // Role based counts (tasiyici = carrier, nakliyeci = shipper)
      const carriersApprovedRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM users WHERE role IN ('tasiyici','carrier') AND (status IN ('approved','active') OR COALESCE(is_verified,false) = true)");
      const shippersTotalRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM users WHERE role IN ('nakliyeci','shipper')");
      const carriersPendingRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM users WHERE role IN ('tasiyici','carrier') AND status IN ('pending','waiting','unapproved')");

      // Commission (fallback to 0 if table/column missing)
      const commissionTodayRes = await safeQueryFallback(
        pool,
        "SELECT COALESCE(SUM(commission_amount),0)::numeric AS total FROM payments WHERE created_at::date = CURRENT_DATE",
        "SELECT COALESCE(SUM(commission),0)::numeric AS total FROM transactions WHERE created_at::date = CURRENT_DATE"
      );

      // Get recent activity (last 24 hours)
      const recentUsersRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM users WHERE created_at >= NOW() - INTERVAL '24 hours'");
      const recentShipmentsRes = await safeQuery(pool, "SELECT COUNT(*)::int as count FROM shipments WHERE created_at >= NOW() - INTERVAL '24 hours'");

      // Get flagged/complaint counts
      const flagsRes = await safeQueryFallback(
        pool,
        "SELECT COUNT(*)::int as count FROM admin_flags WHERE status = 'open'",
        "SELECT COUNT(*)::int as count FROM adminFlags WHERE status = 'open'"
      );
      const complaintsRes = await safeQueryFallback(
        pool,
        "SELECT COUNT(*)::int as count FROM admin_complaints WHERE status = 'open'",
        "SELECT COUNT(*)::int as count FROM adminComplaints WHERE status = 'open'"
      );

      const data = {
        stats: {
          // Kullanıcı & rol dağılımları
          totalUsers: safeNumber(totalUsersRes.rows[0]?.count),
          approvedCarriers: safeNumber(carriersApprovedRes.rows[0]?.count),
          totalShippers: safeNumber(shippersTotalRes.rows[0]?.count),
          pendingCarriers: safeNumber(carriersPendingRes.rows[0]?.count),

          // Gönderi & teklif durumu
          totalShipments: safeNumber(totalShipmentsRes.rows[0]?.count),
          activeListings: safeNumber(activeListingsRes.rows[0]?.count),
          activeShipments: safeNumber(activeShipmentsRes.rows[0]?.count),
          inTransitShipments: safeNumber(inTransitRes.rows[0]?.count),
          totalOffers: safeNumber(totalOffersRes.rows[0]?.count),

          // Finans
          todayCommission: Number(commissionTodayRes.rows?.[0]?.total || 0),

          // Son 24 saat
          recentUsers: safeNumber(recentUsersRes.rows[0]?.count),
          recentShipments: safeNumber(recentShipmentsRes.rows[0]?.count),

          // Flag / anlaşmazlık
          openFlags: safeNumber(flagsRes.rows[0]?.count),
          openComplaints: safeNumber(complaintsRes.rows[0]?.count)
        },
        timestamp: new Date().toISOString()
      };

      // Cache the data for 5 minutes
      adminCache.set(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Overview load failed', error: error.message });
    }
  });

  router.get('/planner/briefing', async (_req, res) => {
    try {
      const cacheKey = 'admin_briefing';
      const cachedData = adminCache.get(cacheKey);
      if (cachedData) {
        return res.json({ success: true, data: cachedData, cached: true });
      }

      const usersTotalRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM users');
      const shipmentsTotalRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM shipments');

      const usersTotal = safeNumber(usersTotalRes.rows?.[0]?.count);
      const shipmentsTotal = safeNumber(shipmentsTotalRes.rows?.[0]?.count);

      const data = {
        briefing: {
          window: { start: '07:00', end: '18:00' },
          note: 'Briefing hazır (MVP).',
          totals: { usersTotal, shipmentsTotal }
        },
        tasks: [],
        critical: []
      };

      adminCache.set(cacheKey, data);
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Briefing load failed', error: error.message });
    }
  });

  router.get('/inbox', async (_req, res) => {
    try {
      const flagsRes = await safeQueryFallback(
        pool,
        "SELECT COUNT(*)::int as count FROM admin_flags WHERE status = 'open'",
        "SELECT COUNT(*)::int as count FROM adminFlags WHERE status = 'open'"
      );
      const flagCount = safeNumber(flagsRes.rows[0]?.count);

      const items = flagCount > 0 ? 
        [{ id: 'flags', type: 'flag', title: `${flagCount} açık flag`, summary: 'İnceleme gerekiyor' }] :
        [{ id: 'inbox-empty', type: 'info', title: 'Açık iş yok', summary: 'Şu an pending şikayet/flag yok.' }];

      return res.json({ success: true, data: { items } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Inbox load failed', error: error.message });
    }
  });

  router.get('/users', async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();
      const roleParam = String(req.query.role || '').trim().toLowerCase();
      const statusParam = String(req.query.status || '').trim().toLowerCase();
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10) || 20, 1), 100);
      const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
      const offset = (page - 1) * limit;

      const where = [];
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        where.push(`(email ILIKE $${params.length} OR phone ILIKE $${params.length} OR COALESCE("fullName", '') ILIKE $${params.length})`);
      }

      if (roleParam && roleParam !== 'all') {
        params.push(roleParam);
        where.push(`LOWER(role) = $${params.length}`);
      }

      if (statusParam && statusParam !== 'all') {
        params.push(statusParam);
        where.push(`LOWER(status) = $${params.length}`);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const q = `
        SELECT id, email, role, status, phone, "fullName", "createdAt", "isActive"
        FROM users
        ${whereClause}
        ORDER BY COALESCE("updatedAt", "createdAt") DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rowsRes = await safeQuery(pool, q, params);
      return res.json({ success: true, data: rowsRes.rows || [], meta: { page, limit } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Users load failed', error: error.message });
    }
  });

  // Admin shipments list for operations dashboard
  router.get('/shipments', async (req, res) => {
    try {
      const statusParam = String(req.query.status || 'all').toLowerCase();
      const qParam = String(req.query.q || '').trim();
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
      const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
      const offset = (page - 1) * limit;

      const where = [];
      const params = [];

      const statusSets = {
        active: ["pending", "waiting", "open", "waiting_for_offers", "in_transit", "dispatched"],
        done: ["delivered", "completed"],
        cancelled: ["cancelled", "failed"],
        dispute: ["dispute", "escalated", "flag", "complaint"]
      };

      if (statusParam !== 'all') {
        const list = statusSets[statusParam] || [];
        if (list.length) {
          params.push(list);
          where.push(`LOWER(status) = ANY($${params.length})`);
        }
      }

      if (qParam) {
        params.push(`%${qParam}%`);
        const idx = params.length;
        where.push(`(tracking_number ILIKE $${idx} OR tracking_code ILIKE $${idx} OR pickup_address ILIKE $${idx} OR delivery_address ILIKE $${idx})`);
      }

      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const sql = `
        SELECT 
          id,
          tracking_number AS "trackingCode",
          tracking_code AS "trackingCodeAlt",
          pickup_address AS "from",
          delivery_address AS "to",
          status,
          price AS "offerPrice",
          agreed_price AS "agreedPrice",
          created_at AS "createdAt",
          sender_name AS "shipperName",
          carrier_name AS "carrierName"
        FROM shipments
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rowsRes = await safeQuery(pool, sql, params);
      const rows = (rowsRes.rows || []).map(r => ({
        ...r,
        trackingCode: r.trackingCode || r.trackingCodeAlt,
      }));

      return res.json({ success: true, data: rows, meta: { page, limit } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Shipments load failed', error: error.message });
    }
  });

  // UNIFIED CROSS-SYSTEM SEARCH - Tüm admin sistemlerde birleşik arama
  router.get('/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const searchType = String(req.query.type || 'all').trim(); // all, users, disputes, suspicious, financial, notifications
      
      if (!q) {
        return res.json({ 
          success: true, 
          data: { 
            users: [], shipments: [], disputes: [], suspicious_activities: [], 
            financial_transactions: [], notifications: [], summary: { total: 0 } 
          } 
        });
      }

      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10) || 20, 1), 100);
      const like = `%${q}%`;
      const isNumeric = /^[0-9]+$/.test(q);
      const results = {};
      let totalResults = 0;

      // USERS SEARCH
      if (searchType === 'all' || searchType === 'users') {
        try {
          const usersQuery = `
            SELECT id, email, role, phone, "fullName" as full_name, "isActive" as is_active, "createdAt" as created_at
            FROM users 
            WHERE email ILIKE $1 OR phone ILIKE $1 OR COALESCE("fullName", '') ILIKE $1 
               OR (CASE WHEN $2 THEN id::text = $3 ELSE false END)
            ORDER BY "createdAt" DESC 
            LIMIT $4
          `;
          const usersRes = await pool.query(usersQuery, [like, isNumeric, q, limit]);
          results.users = usersRes.rows || [];
          totalResults += results.users.length;
        } catch (e) {
          console.error('[ADMIN_SEARCH] Users query failed:', e.message);
          results.users = [];
        }
      }

      // DISPUTES SEARCH
      if (searchType === 'all' || searchType === 'disputes') {
        const disputesRes = await safeQuery(`
          SELECT d.*, u1.email as complainant_email, u2.email as respondent_email
          FROM disputes d
          LEFT JOIN users u1 ON d.complainant_id = u1.id
          LEFT JOIN users u2 ON d.respondent_id = u2.id
          WHERE d.dispute_ref ILIKE $1 OR d.title ILIKE $1 OR d.description ILIKE $1
             OR u1.email ILIKE $1 OR u2.email ILIKE $1
             OR (CASE WHEN $2 THEN d.id::text = $3 ELSE false END)
          ORDER BY d.created_at DESC 
          LIMIT $4
        `, [like, isNumeric, q, limit]);
        
        results.disputes = disputesRes.rows || [];
        totalResults += results.disputes.length;
      }

      // SUSPICIOUS ACTIVITIES SEARCH
      if (searchType === 'all' || searchType === 'suspicious') {
        const suspiciousRes = await safeQuery(`
          SELECT sa.*, u.email as user_email, u.role as user_role
          FROM suspicious_activities sa
          LEFT JOIN users u ON sa.user_id = u.id
          WHERE sa.details ILIKE $1 OR sa.activity_type ILIKE $1 OR u.email ILIKE $1
             OR (CASE WHEN $2 THEN sa.user_id::text = $3 OR sa.id::text = $3 ELSE false END)
          ORDER BY sa.created_at DESC 
          LIMIT $4
        `, [like, isNumeric, q, limit]);
        
        results.suspicious_activities = suspiciousRes.rows || [];
        totalResults += results.suspicious_activities.length;
      }

      // FINANCIAL TRANSACTIONS SEARCH
      if (searchType === 'all' || searchType === 'financial') {
        const financialRes = await safeQuery(`
          SELECT ft.*, u.email as user_email, u.role as user_role
          FROM financial_transactions ft
          LEFT JOIN users u ON ft.user_id = u.id
          WHERE ft.reference_id ILIKE $1 OR ft.description ILIKE $1 OR u.email ILIKE $1
             OR (CASE WHEN $2 THEN ft.user_id::text = $3 OR ft.id::text = $3 ELSE false END)
          ORDER BY ft.created_at DESC 
          LIMIT $4
        `, [like, isNumeric, q, limit]);
        
        results.financial_transactions = financialRes.rows || [];
        totalResults += results.financial_transactions.length;
      }

      // ADMIN NOTIFICATIONS SEARCH  
      if (searchType === 'all' || searchType === 'notifications') {
        const notificationsRes = await safeQuery(`
          SELECT an.*, u.email as user_email, admin.email as created_by_email
          FROM admin_notifications an
          LEFT JOIN users u ON an.user_id = u.id
          LEFT JOIN users admin ON an.created_by = admin.id
          WHERE an.title ILIKE $1 OR an.message ILIKE $1 OR an.reference_id ILIKE $1 
             OR u.email ILIKE $1 OR admin.email ILIKE $1
             OR (CASE WHEN $2 THEN an.user_id::text = $3 OR an.id::text = $3 ELSE false END)
          ORDER BY an.created_at DESC 
          LIMIT $4
        `, [like, isNumeric, q, limit]);
        
        results.notifications = notificationsRes.rows || [];
        totalResults += results.notifications.length;
      }

      // SHIPMENTS SEARCH (existing)
      if (searchType === 'all' || searchType === 'shipments') {
        const shipmentsRes = await safeQuery(`
          SELECT s.*, u.email as sender_email
          FROM shipments s
          LEFT JOIN users u ON s.sender_id = u.id
          WHERE s.tracking_number ILIKE $1 OR s.pickup_address ILIKE $1 
             OR s.delivery_address ILIKE $1 OR u.email ILIKE $1
             OR (CASE WHEN $2 THEN s.id::text = $3 OR s.sender_id::text = $3 ELSE false END)
          ORDER BY s.created_at DESC 
          LIMIT $4
        `, [like, isNumeric, q, limit]);
        
        results.shipments = shipmentsRes.rows || [];
        totalResults += results.shipments.length;
      }

      // PRIORITY RANKING - Kritik durumlar öncelik alır
      const criticalMatches = [];
      
      // Critical disputes
      if (results.disputes) {
        results.disputes.forEach(dispute => {
          if (dispute.priority === 'critical' || dispute.status === 'escalated') {
            criticalMatches.push({
              type: 'dispute',
              priority: 'critical',
              title: `Kritik Anlaşmazlık: ${dispute.title}`,
              id: dispute.id,
              ref: dispute.dispute_ref,
              details: dispute.description
            });
          }
        });
      }

      // Critical suspicious activities
      if (results.suspicious_activities) {
        results.suspicious_activities.forEach(activity => {
          if (activity.risk_level === 'critical' && activity.status === 'active') {
            criticalMatches.push({
              type: 'suspicious_activity',
              priority: 'critical', 
              title: `Kritik Şüpheli Aktivite: ${activity.activity_type}`,
              id: activity.id,
              details: activity.details
            });
          }
        });
      }

      // High-value financial transactions
      if (results.financial_transactions) {
        results.financial_transactions.forEach(transaction => {
          if (transaction.amount > 10000 && transaction.status === 'pending') {
            criticalMatches.push({
              type: 'financial_transaction',
              priority: 'high',
              title: `Yüksek Tutarlı İşlem: ${transaction.amount}₺`,
              id: transaction.id,
              ref: transaction.reference_id,
              details: transaction.description
            });
          }
        });
      }

      // SEARCH RELEVANCE SCORING
      const searchRelevance = {
        exactMatches: 0,
        partialMatches: 0,
        contextMatches: 0
      };

      // Count exact matches (email, reference IDs, etc.)
      const allResults = [
        ...(results.users || []),
        ...(results.disputes || []),
        ...(results.suspicious_activities || []),
        ...(results.financial_transactions || []),
        ...(results.notifications || []),
        ...(results.shipments || [])
      ];

      allResults.forEach(item => {
        const searchableText = JSON.stringify(item).toLowerCase();
        if (searchableText.includes(q.toLowerCase())) {
          if (item.email === q || item.reference_id === q || item.dispute_ref === q) {
            searchRelevance.exactMatches++;
          } else if (searchableText.includes(q.toLowerCase())) {
            searchRelevance.partialMatches++;
          }
        }
      });

      // ADMIN ACTION SUGGESTIONS
      const actionSuggestions = [];
      
      if (results.users && results.users.length > 0) {
        const user = results.users[0];
        actionSuggestions.push({
          type: 'user_action',
          title: `Kullanıcı Profili: ${user.email}`,
          actions: ['Ban/Unban', 'Flag Oluştur', 'Mesaj Gönder', 'Şüpheli Aktivite Tara'],
          target: { type: 'user', id: user.id }
        });
      }

      if (criticalMatches.length > 0) {
        actionSuggestions.push({
          type: 'critical_action',
          title: `${criticalMatches.length} Kritik Durum Tespit Edildi`,
          actions: ['Öncelikli İnceleme', 'Acil Müdahale', 'Üst Yönetime Raporla'],
          urgency: 'high'
        });
      }

      return res.json({
        success: true,
        data: {
          ...results,
          criticalMatches: criticalMatches,
          actionSuggestions: actionSuggestions,
          searchRelevance: searchRelevance,
          summary: {
            query: q,
            searchType: searchType,
            totalResults: totalResults,
            criticalCount: criticalMatches.length,
            searchTime: Date.now(),
            categories: {
              users: (results.users || []).length,
              disputes: (results.disputes || []).length,
              suspicious: (results.suspicious_activities || []).length,
              financial: (results.financial_transactions || []).length,
              notifications: (results.notifications || []).length,
              shipments: (results.shipments || []).length
            }
          }
        }
      });

    } catch (error) {
      return res.status(500).json({ success: false, message: 'Search failed', error: error.message });
    }
  });

  // Ban/unban behavior B will be implemented after DB + complaint/flag models are confirmed.
  router.patch('/users/:id/active', async (req, res) => {
    try {
      const userId = req.params.id;
      const { isActive, reason } = req.body || {};
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, message: 'isActive boolean olmalı' });
      }
      if (!reason || String(reason).trim().length < 3) {
        return res.status(400).json({ success: false, message: 'reason zorunlu' });
      }

      let updatedUser = false;
      if (pool) {
        try {
          const r = await pool.query(
            'UPDATE users SET "isActive" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1',
            [userId, isActive]
          );
          updatedUser = (r.rowCount || 0) > 0;
        } catch (_) {
          try {
            const r = await pool.query(
              'UPDATE users SET is_active = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
              [userId, isActive]
            );
            updatedUser = (r.rowCount || 0) > 0;
          } catch (_) {
            updatedUser = false;
          }
        }
      }

      let createdFlag = false;
      let flagError = null;
      if (pool && isActive === false) {
        try {
          const params = [String(userId), String(reason).trim(), req.user?.id || null];
          let ins;
          try {
            ins = await strictQueryFallback(
              pool,
              "INSERT INTO admin_flags (type, status, target_type, target_id, reason, created_by) VALUES ('spam','open','user',$1,$2,$3)",
              "INSERT INTO admin_flags (type, status, targetType, targetId, reason, createdBy) VALUES ('spam','open','user',$1,$2,$3)",
              params
            );
          } catch (e1) {
            ins = await strictQueryFallback(
              pool,
              "INSERT INTO adminFlags (type, status, target_type, target_id, reason, created_by) VALUES ('spam','open','user',$1,$2,$3)",
              "INSERT INTO adminFlags (type, status, targetType, targetId, reason, createdBy) VALUES ('spam','open','user',$1,$2,$3)",
              params
            );
          }
          createdFlag = (ins.rowCount || 0) > 0;
        } catch (e) {
          flagError = e?.message ? String(e.message) : 'flag insert failed';
          createdFlag = false;
        }
      }

      let complaintsMoved = 0;
      if (pool && isActive === false) {
        try {
          const upd = await pool.query(
            "UPDATE complaints SET status = 'reviewing', updated_at = CURRENT_TIMESTAMP WHERE status = 'pending' AND (user_id = $1 OR related_user_id = $1)",
            [userId]
          );
          complaintsMoved = upd.rowCount || 0;
        } catch (_) {
          try {
            const upd = await pool.query(
              "UPDATE complaints SET status = 'reviewing', \"updatedAt\" = CURRENT_TIMESTAMP WHERE status = 'pending' AND (\"userId\" = $1 OR \"relatedUserId\" = $1)",
              [userId]
            );
            complaintsMoved = upd.rowCount || 0;
          } catch (_) {
            complaintsMoved = 0;
          }
        }
      }

      if (typeof writeAuditLog === 'function') {
        await writeAuditLog({
          userId: req.user?.id || null,
          action: isActive ? 'ADMIN_UNBAN_USER' : 'ADMIN_BAN_USER',
          entity: 'user',
          entityId: userId,
          req,
          metadata: {
            reason,
            updatedUser,
            createdFlag,
            complaintsMoved,
          },
        });
      }

      // Clear admin caches after user status change
      clearAdminCache('admin_overview');
      clearAdminCache('admin_briefing');

      return res.json({
        success: true,
        data: {
          updatedUser,
          createdFlag,
          flagError,
          complaintsMoved,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'User update failed', error: error.message });
    }
  });

  router.get('/complaints', async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
      const status = String(req.query.status || '').trim();

      const where = status ? 'WHERE status = $1' : '';
      const params = status ? [status] : [];

      const rows = await safeQueryFallback(
        pool,
        `
          SELECT id, title, status, user_id, related_user_id, created_at, updated_at
          FROM complaints
          ${where}
          ORDER BY COALESCE(updated_at, created_at) DESC
          LIMIT ${limit}
        `,
        `
          SELECT id, title, status, "userId" as user_id, "relatedUserId" as related_user_id, "createdAt" as created_at, "updatedAt" as updated_at
          FROM complaints
          ${where}
          ORDER BY COALESCE("updatedAt", "createdAt") DESC
          LIMIT ${limit}
        `,
        params
      );

      return res.json({ success: true, data: rows.rows || [], meta: { limit, status: status || null } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Complaints load failed', error: error.message });
    }
  });

  router.get('/flags', async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
      const status = String(req.query.status || '').trim();

      const where = status ? 'WHERE status = $1' : '';
      const params = status ? [status] : [];

      if (!pool) throw new Error('Database not available');

      const queries = [
        {
          sql: `
            SELECT id, type, status, target_type, target_id, reason, created_by, created_at
            FROM admin_flags
            ${where}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `,
          params,
        },
        {
          sql: `
            SELECT id, type, status, targetType as target_type, targetId as target_id, reason, createdBy as created_by, createdAt as created_at
            FROM admin_flags
            ${where}
            ORDER BY createdAt DESC
            LIMIT ${limit}
          `,
          params,
        },
        {
          sql: `
            SELECT id, type, status, target_type, target_id, reason, created_by, created_at
            FROM adminFlags
            ${where}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `,
          params,
        },
        {
          sql: `
            SELECT id, type, status, targetType as target_type, targetId as target_id, reason, createdBy as created_by, createdAt as created_at
            FROM adminFlags
            ${where}
            ORDER BY createdAt DESC
            LIMIT ${limit}
          `,
          params,
        },
      ];

      let lastErr = null;
      for (const q of queries) {
        try {
          const r = await pool.query(q.sql, q.params);
          return res.json({ success: true, data: r.rows || [], meta: { limit, status: status || null } });
        } catch (e) {
          lastErr = e;
        }
      }

      throw lastErr || new Error('Flags query failed');
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Flags load failed', error: error.message });
    }
  });

  router.post('/flags', async (req, res) => {
    try {
      const body = req.body || {};
      const type = String(body.type || 'spam');
      const targetType = String(body.targetType || 'user');
      const targetId = String(body.targetId || '').trim();
      const reason = String(body.reason || '').trim();

      if (!targetId) {
        return res.status(400).json({ success: false, message: 'targetId required' });
      }
      if (reason.length < 3) {
        return res.status(400).json({ success: false, message: 'reason zorunlu' });
      }

      const params = [type, targetType, targetId, reason, req.user?.id || null];
      try {
        await strictQueryFallback(
          pool,
          "INSERT INTO admin_flags (type, status, target_type, target_id, reason, created_by) VALUES ($1,'open',$2,$3,$4,$5)",
          "INSERT INTO admin_flags (type, status, targetType, targetId, reason, createdBy) VALUES ($1,'open',$2,$3,$4,$5)",
          params
        );
      } catch (e1) {
        await strictQueryFallback(
          pool,
          "INSERT INTO adminFlags (type, status, target_type, target_id, reason, created_by) VALUES ($1,'open',$2,$3,$4,$5)",
          "INSERT INTO adminFlags (type, status, targetType, targetId, reason, createdBy) VALUES ($1,'open',$2,$3,$4,$5)",
          params
        );
      }

      if (typeof writeAuditLog === 'function') {
        await writeAuditLog({
          userId: req.user?.id || null,
          action: 'ADMIN_CREATE_FLAG',
          entity: 'admin_flag',
          entityId: targetId,
          req,
          metadata: { type, targetType, targetId, reason },
        });
      }

      return res.status(201).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Flag create failed', error: error.message });
    }
  });

  router.get('/tasks', async (_req, res) => {
    return res.json({ success: true, data: [], meta: { page: 1, limit: 20 } });
  });

  router.get('/audit', async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
      if (!pool) throw new Error('Database not available');

      // Prefer the schema created by server-modular.js: audit_logs(userId, entity, entityId, ip, userAgent, metadata, createdAt)
      const queries = [
        {
          sql: `SELECT id,
                       "userId" as user_id,
                       action,
                       entity as resource_type,
                       entityId as resource_id,
                       ip as ip_address,
                       userAgent as user_agent,
                       metadata as details,
                       createdAt as created_at
                FROM audit_logs
                ORDER BY createdAt DESC
                LIMIT ${limit}`,
          params: [],
        },
        // Common Postgres behavior: unquoted identifiers are folded to lowercase.
        // server-modular.js creates columns like userId/createdAt without quotes => userid/createdat.
        {
          sql: `SELECT id,
                       userid as user_id,
                       action,
                       entity as resource_type,
                       entityid as resource_id,
                       ip as ip_address,
                       useragent as user_agent,
                       metadata as details,
                       createdat as created_at
                FROM audit_logs
                ORDER BY createdat DESC
                LIMIT ${limit}`,
          params: [],
        },
        // Legacy snake_case schema compatibility
        {
          sql: `SELECT id,
                       user_id,
                       action,
                       resource_type,
                       resource_id,
                       ip_address,
                       user_agent,
                       details,
                       created_at
                FROM audit_logs
                ORDER BY created_at DESC
                LIMIT ${limit}`,
          params: [],
        },
      ];

      let lastErr = null;
      for (const q of queries) {
        try {
          const r = await pool.query(q.sql, q.params);
          return res.json({ success: true, data: r.rows || [], meta: { limit } });
        } catch (e) {
          lastErr = e;
        }
      }

      throw lastErr || new Error('Audit load failed');
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Audit load failed', error: error.message });
    }
  });

  router.use(adminErrorHandler);

  return router;
}

module.exports = createAdminRoutes;
