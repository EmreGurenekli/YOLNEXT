const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../YolNext.db');
const db = new sqlite3.Database(dbPath);

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Access token required' });
  }

  // Simple token validation (in production, use JWT verification)
  if (token === 'demo-token') {
    req.user = { id: 'demo-user-id' };
    next();
  } else {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Get active tracking for individual users
router.get('/individual/active', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `
    SELECT 
      s.*,
      a.id as agreement_id,
      a.status as agreement_status,
      tu.status as tracking_status,
      tu.location,
      tu.description as tracking_description,
      tu.created_at as last_update
    FROM shipments s
    LEFT JOIN agreements a ON s.id = a.shipment_id
    LEFT JOIN tracking_updates tu ON s.id = tu.shipment_id
    WHERE s.user_id = ? 
      AND s.status IN ('accepted', 'in_transit')
    ORDER BY tu.created_at DESC
  `,
    [userId],
    (err, shipments) => {
      if (err) {
        console.error('Tracking error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      res.json({
        success: true,
        data: shipments,
      });
    }
  );
});

// Update tracking status
router.post('/update', authenticateToken, (req, res) => {
  const { shipmentId, status, location, latitude, longitude, description } =
    req.body;
  const updatedBy = req.user.id;

  if (!shipmentId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Shipment ID and status are required',
    });
  }

  const updateId = uuidv4();

  // Insert tracking update
  db.run(
    `
    INSERT INTO tracking_updates (id, shipment_id, status, location, latitude, longitude, description, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      updateId,
      shipmentId,
      status,
      location,
      latitude,
      longitude,
      description,
      updatedBy,
    ],
    function (err) {
      if (err) {
        console.error('Tracking update error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      // Update shipment status
      db.run(
        `
      UPDATE shipments 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
        [status, shipmentId],
        err => {
          if (err) {
            console.error('Shipment update error:', err);
            return res
              .status(500)
              .json({ success: false, message: 'Database error' });
          }

          res.json({
            success: true,
            message: 'Tracking updated successfully',
            data: {
              id: updateId,
              shipmentId,
              status,
              location,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      );
    }
  );
});

// Confirm delivery
router.post('/confirm', authenticateToken, (req, res) => {
  const { shipmentId, confirmationCode, notes } = req.body;
  const confirmedBy = req.user.id;

  if (!shipmentId) {
    return res.status(400).json({
      success: false,
      message: 'Shipment ID is required',
    });
  }

  const updateId = uuidv4();
  const description = `Delivery confirmed${notes ? ` - ${notes}` : ''}`;

  // Insert tracking update
  db.run(
    `
    INSERT INTO tracking_updates (id, shipment_id, status, description, updated_by)
    VALUES (?, ?, ?, ?, ?)
  `,
    [updateId, shipmentId, 'delivered', description, confirmedBy],
    function (err) {
      if (err) {
        console.error('Delivery confirmation error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      // Update shipment status
      db.run(
        `
      UPDATE shipments 
      SET status = 'delivered', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
        [shipmentId],
        err => {
          if (err) {
            console.error('Shipment update error:', err);
            return res
              .status(500)
              .json({ success: false, message: 'Database error' });
          }

          res.json({
            success: true,
            message: 'Delivery confirmed successfully',
            data: {
              id: updateId,
              shipmentId,
              status: 'delivered',
              confirmedAt: new Date().toISOString(),
            },
          });
        }
      );
    }
  );
});

// Get tracking history for a shipment
router.get('/history/:shipmentId', authenticateToken, (req, res) => {
  const { shipmentId } = req.params;

  db.all(
    `
    SELECT 
      tu.*,
      u.first_name,
      u.last_name
    FROM tracking_updates tu
    LEFT JOIN users u ON tu.updated_by = u.id
    WHERE tu.shipment_id = ?
    ORDER BY tu.created_at ASC
  `,
    [shipmentId],
    (err, updates) => {
      if (err) {
        console.error('Tracking history error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      res.json({
        success: true,
        data: updates,
      });
    }
  );
});

module.exports = router;
