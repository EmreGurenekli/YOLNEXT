// Notifications routes - Modular version
const express = require('express');

function createNotificationRoutes(pool, authenticateToken) {
  const router = express.Router();

  async function queryWithFallback(primaryQuery, fallbackQuery, params) {
    try {
      return await pool.query(primaryQuery, params);
    } catch (error) {
      if (error && error.code === '42703' && fallbackQuery) {
        return await pool.query(fallbackQuery, params);
      }
      throw error;
    }
  }

  const resolveUserIdForRequest = async (user) => {
    const candidates = [user?.id, user?.userId, user?.user_id, user?.userid].filter(v => v != null);
    for (const c of candidates) {
      const n = typeof c === 'number' ? c : parseInt(String(c), 10);
      if (Number.isFinite(n)) {
        try {
          const exists = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [n]);
          if (exists.rows && exists.rows[0]?.id) return exists.rows[0].id;
        } catch (_) {
          // ignore
        }
      }
    }
    return null;
  };

  const resolveNotificationsMeta = async () => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'notifications'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' AND table_schema = $1`,
      [schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pick = (...names) => names.find(n => cols.has(n)) || null;
    const qCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

    const userCol = pick('userId', 'user_id', 'userid');
    const isReadCol = pick('isRead', 'is_read', 'isread');
    const createdCol = pick('createdAt', 'created_at', 'createdat');
    const readAtCol = pick('readAt', 'read_at', 'readat');

    return {
      schema,
      userExpr: userCol ? qCol(userCol) : null,
      isReadExpr: isReadCol ? qCol(isReadCol) : null,
      createdExpr: createdCol ? qCol(createdCol) : null,
      readAtExpr: readAtCol ? qCol(readAtCol) : null,
    };
  };

  // Get unread notifications count
  router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = await resolveUserIdForRequest(req.user);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const meta = await resolveNotificationsMeta();
      if (!meta.userExpr || !meta.isReadExpr) {
        return res.json({ success: true, data: { count: 0, unreadCount: 0 } });
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM "${meta.schema}".notifications WHERE ${meta.userExpr} = $1 AND ${meta.isReadExpr} = false`,
        [userId]
      );

      return res.json({
        success: true,
        data: {
          count: parseInt(countResult.rows[0].count, 10) || 0,
          unreadCount: parseInt(countResult.rows[0].count, 10) || 0,
        },
      });
    } catch (error) {
      console.error('Get unread notifications count error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get unread notifications count',
      });
    }
  });

  // Get user notifications
  router.get('/', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = await resolveUserIdForRequest(req.user);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }
      const { limit = 50, offset = 0 } = req.query;

      const meta = await resolveNotificationsMeta();
      if (!meta.userExpr) {
        return res.json({ success: true, data: [], meta: { total: 0, limit: parseInt(limit), offset: parseInt(offset) } });
      }
      const orderExpr = meta.createdExpr ? meta.createdExpr : 'id';

      const result = await pool.query(
        `SELECT * FROM "${meta.schema}".notifications WHERE ${meta.userExpr} = $1 ORDER BY ${orderExpr} DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM "${meta.schema}".notifications WHERE ${meta.userExpr} = $1`,
        [userId]
      );

      res.json({
        success: true,
        data: result.rows,
        meta: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notifications',
      });
    }
  });

  // Mark notification as read
  const markReadHandler = async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = await resolveUserIdForRequest(req.user);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const meta = await resolveNotificationsMeta();
      if (!meta.userExpr || !meta.isReadExpr) {
        return res.status(500).json({ success: false, error: 'Notifications schema not compatible' });
      }

      const setParts = [`${meta.isReadExpr} = true`];
      if (meta.readAtExpr) setParts.push(`${meta.readAtExpr} = CURRENT_TIMESTAMP`);
      const result = await pool.query(
        `UPDATE "${meta.schema}".notifications SET ${setParts.join(', ')} WHERE id = $1 AND ${meta.userExpr} = $2 RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  };

  router.patch('/:id/read', authenticateToken, markReadHandler);
  // Compatibility: some clients use PUT instead of PATCH
  router.put('/:id/read', authenticateToken, markReadHandler);

  // Mark all notifications as read (compatibility)
  const markAllReadHandler = async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = await resolveUserIdForRequest(req.user);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const meta = await resolveNotificationsMeta();
      if (!meta.userExpr || !meta.isReadExpr) {
        return res.status(500).json({ success: false, error: 'Notifications schema not compatible' });
      }

      const setParts = [`${meta.isReadExpr} = true`];
      if (meta.readAtExpr) setParts.push(`${meta.readAtExpr} = CURRENT_TIMESTAMP`);

      await pool.query(
        `UPDATE "${meta.schema}".notifications SET ${setParts.join(', ')} WHERE ${meta.userExpr} = $1`,
        [userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({ success: false, error: 'Failed to mark all as read' });
    }
  };

  router.put('/mark-all-read', authenticateToken, markAllReadHandler);
  router.put('/read-all', authenticateToken, markAllReadHandler);

  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const result = await queryWithFallback(
        'SELECT * FROM notifications WHERE id = $1 AND userId = $2',
        'SELECT * FROM notifications WHERE id = $1 AND "userId" = $2',
        [id, userId]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get notification by id error:', error);
      return res.status(500).json({ success: false, error: 'Failed to get notification' });
    }
  });

  // Compatibility: delete a notification (legacy clients)
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.json({ success: true });
      }

      const { id } = req.params;
      const userId = req.user.id;

      await queryWithFallback(
        'DELETE FROM notifications WHERE id = $1 AND userId = $2',
        'DELETE FROM notifications WHERE id = $1 AND "userId" = $2',
        [id, userId]
      );

      return res.json({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete notification' });
    }
  });

  // Compatibility: delete all notifications for current user (legacy clients)
  router.delete('/', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.json({ success: true });
      }

      const userId = req.user.id;

      await queryWithFallback(
        'DELETE FROM notifications WHERE userId = $1',
        'DELETE FROM notifications WHERE "userId" = $1',
        [userId]
      );

      return res.json({ success: true });
    } catch (error) {
      console.error('Delete all notifications error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete notifications' });
    }
  });

  return router;
}

module.exports = createNotificationRoutes;


















