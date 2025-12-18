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

  // Get unread notifications count
  router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;
      const countResult = await queryWithFallback(
        'SELECT COUNT(*) as count FROM notifications WHERE userId = $1 AND isRead = false',
        'SELECT COUNT(*) as count FROM notifications WHERE "userId" = $1 AND "isRead" = false',
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

      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const result = await queryWithFallback(
        `SELECT * FROM notifications 
         WHERE userId = $1 
         ORDER BY createdAt DESC 
         LIMIT $2 OFFSET $3`,
        `SELECT * FROM notifications 
         WHERE "userId" = $1 
         ORDER BY "createdAt" DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await queryWithFallback(
        'SELECT COUNT(*) as total FROM notifications WHERE userId = $1',
        'SELECT COUNT(*) as total FROM notifications WHERE "userId" = $1',
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
      const userId = req.user.id;

      const result = await queryWithFallback(
        `UPDATE notifications 
         SET isRead = true, readAt = CURRENT_TIMESTAMP 
         WHERE id = $1 AND userId = $2
         RETURNING *`,
        `UPDATE notifications 
         SET "isRead" = true, "readAt" = CURRENT_TIMESTAMP 
         WHERE id = $1 AND "userId" = $2
         RETURNING *`,
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

      const userId = req.user.id;

      await queryWithFallback(
        `UPDATE notifications SET isRead = true, readAt = CURRENT_TIMESTAMP WHERE userId = $1`,
        `UPDATE notifications SET "isRead" = true, "readAt" = CURRENT_TIMESTAMP WHERE "userId" = $1`,
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


















