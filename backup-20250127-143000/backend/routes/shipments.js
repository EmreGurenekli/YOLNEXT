const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create shipment
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const {
    title,
    description,
    from_location,
    to_location,
    from_address,
    to_address,
    weight,
    volume,
    price,
    priority,
    vehicle_type,
    delivery_date
  } = req.body;

  // Validation
  if (!title || !from_location || !to_location) {
    return res.status(400).json({ error: 'Title, from_location, and to_location are required' });
  }

  db.run(
    `INSERT INTO shipments (
      user_id, title, description, from_location, to_location, from_address, to_address,
      weight, volume, price, priority, vehicle_type, delivery_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, title, description, from_location, to_location, from_address, to_address,
      weight, volume, price, priority || 'normal', vehicle_type, delivery_date
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create shipment' });
      }

      const shipmentId = this.lastID;

      // Create notification for carriers
      db.run(
        `INSERT INTO notifications (user_id, title, message, type) 
         SELECT id, 'Yeni Yük İlanı', '${title} - ${from_location} → ${to_location}', 'info'
         FROM users WHERE panel_type IN ('nakliyeci', 'tasiyici')`,
        (err) => {
          if (err) {
            console.error('Error creating carrier notifications:', err);
          }
        }
      );

      res.status(201).json({
        message: 'Shipment created successfully',
        shipment: {
          id: shipmentId,
          title,
          from_location,
          to_location,
          status: 'pending'
        }
      });
    }
  );
});

// Get user shipments
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { status, limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT s.*, 
           COUNT(o.id) as offer_count,
           AVG(o.price) as avg_offer_price
    FROM shipments s
    LEFT JOIN offers o ON s.id = o.shipment_id
    WHERE s.user_id = ?
  `;
  
  const params = [userId];

  if (status) {
    query += ` AND s.status = ?`;
    params.push(status);
  }

  query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.all(query, params, (err, shipments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ shipments });
  });
});

// Get shipment by ID
router.get('/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const shipmentId = req.params.id;

  db.get(
    `SELECT s.*, 
            COUNT(o.id) as offer_count,
            AVG(o.price) as avg_offer_price
     FROM shipments s
     LEFT JOIN offers o ON s.id = o.shipment_id
     WHERE s.id = ? AND s.user_id = ?
     GROUP BY s.id`,
    [shipmentId, userId],
    (err, shipment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.json({ shipment });
    }
  );
});

// Update shipment
router.put('/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const shipmentId = req.params.id;
  const updates = req.body;

  // Build dynamic update query
  const fields = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(shipmentId, userId);

  db.run(
    `UPDATE shipments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update shipment' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.json({ message: 'Shipment updated successfully' });
    }
  );
});

// Delete shipment
router.delete('/:id', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const shipmentId = req.params.id;

  db.run(
    `DELETE FROM shipments WHERE id = ? AND user_id = ?`,
    [shipmentId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete shipment' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      res.json({ message: 'Shipment deleted successfully' });
    }
  );
});

// Get available shipments for carriers
router.get('/available/loads', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { limit = 20, offset = 0 } = req.query;

  // Check if user is a carrier
  if (!['nakliyeci', 'tasiyici'].includes(req.user.panel_type)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(
    `SELECT s.*, u.name as shipper_name, u.company_name,
            COUNT(o.id) as offer_count
     FROM shipments s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN offers o ON s.id = o.shipment_id
     WHERE s.status = 'pending'
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, shipments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ shipments });
    }
  );
});

module.exports = router;