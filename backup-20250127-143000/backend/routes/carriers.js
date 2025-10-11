const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get carrier profile
router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // Check if user is a carrier
  if (!['nakliyeci', 'tasiyici'].includes(req.user.panel_type)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get(
    `SELECT c.*, u.name, u.email, u.phone, u.location
     FROM carriers c
     JOIN users u ON c.user_id = u.id
     WHERE c.user_id = ?`,
    [userId],
    (err, carrier) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!carrier) {
        return res.status(404).json({ error: 'Carrier profile not found' });
      }

      res.json({ carrier });
    }
  );
});

// Update carrier profile
router.put('/profile', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { company_name, vehicle_type, capacity, location, is_available } = req.body;

  // Check if user is a carrier
  if (!['nakliyeci', 'tasiyici'].includes(req.user.panel_type)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.run(
    `UPDATE carriers SET 
      company_name = ?, 
      vehicle_type = ?, 
      capacity = ?, 
      location = ?, 
      is_available = ?,
      updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = ?`,
    [company_name, vehicle_type, capacity, location, is_available, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update carrier profile' });
      }

      res.json({ message: 'Carrier profile updated successfully' });
    }
  );
});

// Get carrier statistics
router.get('/stats', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // Check if user is a carrier
  if (!['nakliyeci', 'tasiyici'].includes(req.user.panel_type)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get(
    `SELECT 
      c.wallet_balance,
      c.total_jobs,
      c.completed_jobs,
      c.rating,
      COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_offers,
      COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) as accepted_offers,
      SUM(CASE WHEN o.status = 'accepted' AND o.created_at >= date('now', '-30 days') THEN o.price ELSE 0 END) as this_month_earnings,
      SUM(CASE WHEN o.status = 'accepted' THEN o.price ELSE 0 END) as total_earnings
     FROM carriers c
     LEFT JOIN offers o ON c.user_id = o.carrier_id
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
        pendingOffers: stats.pending_offers || 0,
        acceptedOffers: stats.accepted_offers || 0,
        rating: stats.rating || 0,
        thisMonthEarnings: stats.this_month_earnings || 0,
        totalEarnings: stats.total_earnings || 0,
        activeJobs: (stats.total_jobs || 0) - (stats.completed_jobs || 0)
      });
    }
  );
});

// Get carrier's active jobs
router.get('/active-jobs', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // Check if user is a carrier
  if (!['nakliyeci', 'tasiyici'].includes(req.user.panel_type)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(
    `SELECT o.*, s.title, s.from_location, s.to_location, s.weight, s.volume,
            u.name as shipper_name, u.company_name
     FROM offers o
     JOIN shipments s ON o.shipment_id = s.id
     JOIN users u ON s.user_id = u.id
     WHERE o.carrier_id = ? AND o.status = 'accepted'
     ORDER BY o.created_at DESC`,
    [userId],
    (err, jobs) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ jobs });
    }
  );
});

// Complete job
router.put('/jobs/:offerId/complete', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const offerId = req.params.offerId;

  // Check if user is a carrier
  if (!['nakliyeci', 'tasiyici'].includes(req.user.panel_type)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get offer details
  db.get(
    `SELECT o.*, s.user_id as shipper_id, s.title
     FROM offers o
     JOIN shipments s ON o.shipment_id = s.id
     WHERE o.id = ? AND o.carrier_id = ? AND o.status = 'accepted'`,
    [offerId, userId],
    (err, offer) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!offer) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Start transaction
      db.serialize(() => {
        // Update offer status
        db.run(
          `UPDATE offers SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [offerId]
        );

        // Update shipment status
        db.run(
          `UPDATE shipments SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [offer.shipment_id]
        );

        // Update carrier stats
        db.run(
          `UPDATE carriers SET 
            completed_jobs = completed_jobs + 1,
            wallet_balance = wallet_balance + ?,
            updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ?`,
          [offer.price, userId]
        );

        // Create notifications
        db.run(
          `INSERT INTO notifications (user_id, title, message, type) 
           VALUES (?, 'İş Tamamlandı', '${offer.title} işi tamamlandı', 'success')`,
          [userId]
        );

        db.run(
          `INSERT INTO notifications (user_id, title, message, type) 
           VALUES (?, 'Gönderi Teslim Edildi', 'Gönderiniz teslim edildi', 'success')`,
          [offer.shipper_id]
        );

        res.json({ message: 'Job completed successfully' });
      });
    }
  );
});

// Get available carriers
router.get('/available', (req, res) => {
  const { location, vehicle_type, limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT c.*, u.name, u.company_name, u.location as user_location
    FROM carriers c
    JOIN users u ON c.user_id = u.id
    WHERE c.is_available = 1
  `;
  
  const params = [];

  if (location) {
    query += ` AND c.location LIKE ?`;
    params.push(`%${location}%`);
  }

  if (vehicle_type) {
    query += ` AND c.vehicle_type = ?`;
    params.push(vehicle_type);
  }

  query += ` ORDER BY c.rating DESC, c.completed_jobs DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.all(query, params, (err, carriers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ carriers });
  });
});

module.exports = router;





