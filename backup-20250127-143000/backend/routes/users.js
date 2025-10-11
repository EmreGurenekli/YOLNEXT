const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard stats
router.get('/dashboard-stats', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const panelType = req.user.panel_type;

  if (panelType === 'individual' || panelType === 'corporate') {
    // Get shipment stats
    db.get(
      `SELECT 
        COUNT(*) as totalShipments,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as deliveredShipments,
        SUM(CASE WHEN status IN ('pending', 'offers_received', 'accepted', 'in_transit') THEN 1 ELSE 0 END) as pendingShipments,
        SUM(CASE WHEN status = 'delivered' THEN price ELSE 0 END) as totalSpent,
        SUM(CASE WHEN status = 'delivered' AND created_at >= date('now', '-30 days') THEN price ELSE 0 END) as thisMonthSpent
       FROM shipments WHERE user_id = ?`,
      [userId],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const successRate = stats.totalShipments > 0 
          ? Math.round((stats.deliveredShipments / stats.totalShipments) * 100) 
          : 0;

        res.json({
          totalShipments: stats.totalShipments || 0,
          deliveredShipments: stats.deliveredShipments || 0,
          pendingShipments: stats.pendingShipments || 0,
          successRate,
          totalSpent: stats.totalSpent || 0,
          thisMonthSpent: stats.thisMonthSpent || 0,
          totalSavings: Math.round((stats.totalSpent || 0) * 0.15), // 15% savings estimate
          thisMonthSavings: Math.round((stats.thisMonthSpent || 0) * 0.15)
        });
      }
    );
  } else if (panelType === 'nakliyeci' || panelType === 'tasiyici') {
    // Get carrier stats
    db.get(
      `SELECT 
        c.wallet_balance,
        c.total_jobs,
        c.completed_jobs,
        c.rating,
        COUNT(o.id) as pendingOffers,
        SUM(CASE WHEN o.status = 'accepted' AND o.created_at >= date('now', '-30 days') THEN o.price ELSE 0 END) as thisMonthEarnings
       FROM carriers c
       LEFT JOIN offers o ON c.user_id = o.carrier_id AND o.status = 'pending'
       WHERE c.user_id = ?
       GROUP BY c.id`,
      [userId],
      (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          walletBalance: stats.wallet_balance || 0,
          totalJobs: stats.total_jobs || 0,
          completedJobs: stats.completed_jobs || 0,
          pendingOffers: stats.pendingOffers || 0,
          rating: stats.rating || 0,
          thisMonthEarnings: stats.thisMonthEarnings || 0,
          totalEarnings: stats.wallet_balance || 0,
          activeJobs: stats.total_jobs - stats.completed_jobs || 0
        });
      }
    );
  }
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.get(
    `SELECT id, name, email, panel_type, company_name, location, phone, avatar, created_at 
     FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    }
  );
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { name, phone, location, avatar } = req.body;

  db.run(
    `UPDATE users SET name = ?, phone = ?, location = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, phone, location, avatar, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Get user notifications
router.get('/notifications', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { limit = 20, offset = 0 } = req.query;

  db.all(
    `SELECT id, title, message, type, is_read, created_at 
     FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ notifications });
    }
  );
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const notificationId = req.params.id;

  db.run(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification marked as read' });
    }
  );
});

// Get unread notification count
router.get('/notifications/unread-count', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.get(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ unreadCount: result.count });
    }
  );
});

module.exports = router;