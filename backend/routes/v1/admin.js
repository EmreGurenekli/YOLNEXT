const express = require('express');

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

function createAdminRoutes(pool, authenticateToken, requireAdmin, writeAuditLog) {
  const router = express.Router();

  // Guard all admin endpoints
  router.use(authenticateToken);
  router.use(requireAdmin);

  router.get('/overview', async (_req, res) => {
    try {
      const usersCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM users');
      const shipmentsCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM shipments');
      const offersCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM offers');
      const messagesCount = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM messages');

      const usersTotal = safeNumber(usersCount.rows?.[0]?.count);
      const shipmentsTotal = safeNumber(shipmentsCount.rows?.[0]?.count);
      const offersTotal = safeNumber(offersCount.rows?.[0]?.count);
      const messagesTotal = safeNumber(messagesCount.rows?.[0]?.count);

      return res.json({
        success: true,
        data: { usersTotal, shipmentsTotal, offersTotal, messagesTotal },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Admin overview yüklenemedi', error: error.message });
    }
  });

  // Minimal "assistant briefing" payload. Will be expanded later.
  router.get('/planner/briefing', async (_req, res) => {
    try {
      const usersTotalRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM users');
      const shipmentsTotalRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM shipments');
      const offersTotalRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM offers');
      const messagesTotalRes = await safeQuery(pool, 'SELECT COUNT(*)::int as count FROM messages');

      const usersTotal = safeNumber(usersTotalRes.rows?.[0]?.count);
      const shipmentsTotal = safeNumber(shipmentsTotalRes.rows?.[0]?.count);
      const offersTotal = safeNumber(offersTotalRes.rows?.[0]?.count);
      const messagesTotal = safeNumber(messagesTotalRes.rows?.[0]?.count);

      const usersLast24hRes = await safeQueryFallback(
        pool,
        'SELECT COUNT(*)::int as count FROM users WHERE COALESCE("createdAt", "updatedAt") >= NOW() - INTERVAL \'24 hours\'',
        'SELECT COUNT(*)::int as count FROM users WHERE COALESCE(created_at, updated_at) >= NOW() - INTERVAL \'24 hours\''
      );
      const shipmentsLast24hRes = await safeQueryFallback(
        pool,
        'SELECT COUNT(*)::int as count FROM shipments WHERE COALESCE("createdAt", "updatedAt") >= NOW() - INTERVAL \'24 hours\'',
        'SELECT COUNT(*)::int as count FROM shipments WHERE COALESCE(created_at, updated_at) >= NOW() - INTERVAL \'24 hours\''
      );

      const usersLast24h = safeNumber(usersLast24hRes.rows?.[0]?.count);
      const shipmentsLast24h = safeNumber(shipmentsLast24hRes.rows?.[0]?.count);

      const roleDistRes = await safeQuery(pool, 'SELECT role, COUNT(*)::int as count FROM users GROUP BY role');
      const roleDistribution = (roleDistRes.rows || []).reduce((acc, row) => {
        const key = row.role || 'unknown';
        acc[key] = safeNumber(row.count);
        return acc;
      }, {});

      const openComplaintsRes = await safeQueryFallback(
        pool,
        "SELECT COUNT(*)::int as count FROM complaints WHERE status IN ('pending','reviewing')",
        null
      );
      const openComplaints = safeNumber(openComplaintsRes.rows?.[0]?.count);

      return res.json({
        success: true,
        data: {
          briefing: {
            window: { start: '07:00', end: '18:00' },
            note: 'Briefing hazır (MVP).',
            totals: { usersTotal, shipmentsTotal, offersTotal, messagesTotal },
            last24h: { users: usersLast24h, shipments: shipmentsLast24h },
            roleDistribution,
            openComplaints,
          },
          tasks: [],
          critical: openComplaints > 0 ? [{ type: 'complaints', count: openComplaints }] : [],
          banRecommendations: [],
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Briefing yüklenemedi', error: error.message });
    }
  });

  router.get('/inbox', async (_req, res) => {
    try {
      // Best-effort inbox: list latest complaints that need attention.
      const complaintsRes = await safeQueryFallback(
        pool,
        "SELECT id, title, status, user_id, related_user_id, submitted_at, created_at FROM complaints WHERE status IN ('pending','reviewing') ORDER BY COALESCE(submitted_at, created_at) DESC LIMIT 20",
        null
      );

      const complaintItems = (complaintsRes.rows || []).map(r => ({
        id: r.id,
        type: 'complaint',
        title: r.title || 'Şikayet',
        summary: r.status ? `Durum: ${r.status}` : 'Durum: -',
        userId: r.user_id ?? null,
        relatedUserId: r.related_user_id ?? null,
      }));

      // If there are no complaints, provide fallback triage: open flags + recent audit.
      let flagItems = [];
      try {
        const flagsRes = await safeQuery(
          pool,
          "SELECT id, type, status, target_type, target_id, reason, created_at FROM admin_flags WHERE status = 'open' ORDER BY created_at DESC LIMIT 20"
        );
        flagItems = (flagsRes.rows || []).map(r => ({
          id: r.id,
          type: 'flag',
          title: r.type ? `Flag: ${r.type}` : 'Flag',
          summary: r.reason ? String(r.reason).slice(0, 140) : 'Detay yok',
          targetType: r.target_type || null,
          targetId: r.target_id || null,
          userId: r.target_type === 'user' ? r.target_id : null,
          createdAt: r.created_at || null,
        }));
      } catch (_) {
        flagItems = [];
      }

      let auditItems = [];
      try {
        const auditRes = await safeQueryFallback(
          pool,
          "SELECT id, user_id, action, resource_type, resource_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20",
          "SELECT id, user_id, action, resourceType as resource_type, resourceId as resource_id, createdAt as created_at FROM audit_logs ORDER BY createdAt DESC LIMIT 20"
        );
        auditItems = (auditRes.rows || []).map(r => ({
          id: r.id,
          type: 'audit',
          title: r.action || 'Audit',
          summary: r.resource_type ? `Kaynak: ${r.resource_type}` : 'Kaynak: -',
          userId: r.user_id ?? null,
          targetType: r.resource_type || null,
          targetId: r.resource_id || null,
          createdAt: r.created_at || null,
        }));
      } catch (_) {
        auditItems = [];
      }

      let items = complaintItems.length > 0 ? complaintItems : [...flagItems, ...auditItems].slice(0, 20);

      if (!items.length) {
        items = [
          {
            id: 'inbox-empty',
            type: 'info',
            title: 'Açık iş yok',
            summary: 'Şu an pending şikayet/flag yok. İstersen arama ile kullanıcı/işlem bulabilirsin.',
          },
        ];
      }

      return res.json({ success: true, data: { items } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Inbox yüklenemedi', error: error.message });
    }
  });

  // Users list (basic). search param is best-effort across email/phone/fullName.
  router.get('/users', async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();
      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10) || 20, 1), 100);
      const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
      const offset = (page - 1) * limit;

      const params = [];
      let where = '';
      if (search) {
        params.push(`%${search}%`);
        where = `WHERE (email ILIKE $1 OR phone ILIKE $1 OR COALESCE("fullName", '') ILIKE $1)`;
      }

      const q = `
        SELECT id, email, role, phone, "fullName", "createdAt", "updatedAt", "isActive"
        FROM users
        ${where}
        ORDER BY COALESCE("updatedAt", "createdAt") DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const rowsRes = await safeQuery(pool, q, params);
      return res.json({ success: true, data: rowsRes.rows || [], meta: { page, limit } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Users yüklenemedi', error: error.message });
    }
  });

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

  router.get('/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) {
        return res.json({ success: true, data: { users: [], shipments: [], complaints: [] } });
      }

      const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10) || 10, 1), 50);

      const like = `%${q}%`;
      const maybeId = /^[0-9]+$/.test(q) ? q : null;

      const usersRes = await safeQueryFallback(
        pool,
        `
          SELECT id, email, role, phone, "fullName", "isActive", admin_ref
          FROM users
          WHERE (email ILIKE $1 OR phone ILIKE $1 OR COALESCE("fullName", '') ILIKE $1 OR COALESCE(admin_ref, '') ILIKE $1)
            OR ($2::text IS NOT NULL AND id::text = $2)
          ORDER BY COALESCE("updatedAt", "createdAt") DESC
          LIMIT ${limit}
        `,
        `
          SELECT id, email, role, phone, full_name as "fullName", is_active as "isActive", admin_ref
          FROM users
          WHERE (email ILIKE $1 OR phone ILIKE $1 OR COALESCE(full_name, '') ILIKE $1 OR COALESCE(admin_ref, '') ILIKE $1)
            OR ($2::text IS NOT NULL AND id::text = $2)
          ORDER BY COALESCE(updated_at, created_at) DESC
          LIMIT ${limit}
        `,
        [like, maybeId]
      );

      return res.json({
        success: true,
        data: {
          q,
          users: usersRes.rows || [],
          shipments: [],
          complaints: [],
        },
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
          let ins;
          try {
            ins = await safeQueryFallback(
              pool,
              "INSERT INTO admin_flags (type, status, target_type, target_id, reason, created_by) VALUES ('spam','open','user',$1,$2,$3)",
              "INSERT INTO admin_flags (type, status, targetType, targetId, reason, createdBy) VALUES ('spam','open','user',$1,$2,$3)",
              [String(userId), String(reason).trim(), req.user?.id || null]
            );
          } catch (e) {
            ins = await safeQueryFallback(
              pool,
              "INSERT INTO adminFlags (type, status, target_type, target_id, reason, created_by) VALUES ('spam','open','user',$1,$2,$3)",
              "INSERT INTO adminFlags (type, status, targetType, targetId, reason, createdBy) VALUES ('spam','open','user',$1,$2,$3)",
              [String(userId), String(reason).trim(), req.user?.id || null]
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

      let rows;
      try {
        rows = await safeQueryFallback(
          pool,
          `
            SELECT id, type, status, target_type, target_id, reason, created_by, created_at
            FROM admin_flags
            ${where}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `,
          `
            SELECT id, type, status, targetType as target_type, targetId as target_id, reason, createdBy as created_by, createdAt as created_at
            FROM admin_flags
            ${where}
            ORDER BY createdAt DESC
            LIMIT ${limit}
          `,
          params
        );
      } catch (_) {
        rows = await safeQueryFallback(
          pool,
          `
            SELECT id, type, status, target_type, target_id, reason, created_by, created_at
            FROM adminFlags
            ${where}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `,
          `
            SELECT id, type, status, targetType as target_type, targetId as target_id, reason, createdBy as created_by, createdAt as created_at
            FROM adminFlags
            ${where}
            ORDER BY createdAt DESC
            LIMIT ${limit}
          `,
          params
        );
      }

      return res.json({ success: true, data: rows.rows || [], meta: { limit, status: status || null } });
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

      try {
        await safeQueryFallback(
          pool,
          'INSERT INTO admin_flags (type, status, target_type, target_id, reason, created_by) VALUES ($1,\'open\',$2,$3,$4,$5)',
          'INSERT INTO admin_flags (type, status, targetType, targetId, reason, createdBy) VALUES ($1,\'open\',$2,$3,$4,$5)',
          [type, targetType, targetId, reason, req.user?.id || null]
        );
      } catch (_) {
        await safeQueryFallback(
          pool,
          'INSERT INTO adminFlags (type, status, target_type, target_id, reason, created_by) VALUES ($1,\'open\',$2,$3,$4,$5)',
          'INSERT INTO adminFlags (type, status, targetType, targetId, reason, createdBy) VALUES ($1,\'open\',$2,$3,$4,$5)',
          [type, targetType, targetId, reason, req.user?.id || null]
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
      const rows = await safeQueryFallback(
        pool,
        `SELECT id, user_id, action, resource_type, resource_id, ip_address, user_agent, details, created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT ${limit}`,
        `SELECT id, user_id, action, resourceType as resource_type, resourceId as resource_id, ipAddress as ip_address, userAgent as user_agent, details, createdAt as created_at
         FROM audit_logs
         ORDER BY createdAt DESC
         LIMIT ${limit}`
      );

      return res.json({ success: true, data: rows.rows || [], meta: { limit } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Audit load failed', error: error.message });
    }
  });

  return router;
}

module.exports = createAdminRoutes;
