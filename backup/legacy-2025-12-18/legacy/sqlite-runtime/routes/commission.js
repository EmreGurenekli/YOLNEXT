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

// Get commission rate
router.get('/rate', (req, res) => {
  db.get(
    `
    SELECT value FROM system_settings WHERE key = 'commission_rate'
  `,
    (err, row) => {
      if (err) {
        console.error('Commission rate error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      const rate = row ? parseFloat(row.value) : 0.01; // Default 1%

      res.json({
        success: true,
        data: {
          rate: rate,
          percentage: (rate * 100).toFixed(2) + '%',
        },
      });
    }
  );
});

// Calculate commission
router.post('/calculate', authenticateToken, (req, res) => {
  const { price, rate } = req.body;

  if (!price || isNaN(price)) {
    return res.status(400).json({
      success: false,
      message: 'Valid price is required',
    });
  }

  const commissionRate = rate || 0.01; // Default 1%
  const commissionAmount = price * commissionRate;
  const netAmount = price - commissionAmount;

  res.json({
    success: true,
    data: {
      originalPrice: parseFloat(price),
      commissionRate: commissionRate,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      percentage: (commissionRate * 100).toFixed(2) + '%',
    },
  });
});

// Get commission history for nakliyeci
router.get('/nakliyeci/history', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `
    SELECT 
      c.*,
      a.shipment_id,
      s.title as shipment_title,
      s.price as shipment_price,
      u.first_name as sender_first_name,
      u.last_name as sender_last_name
    FROM commissions c
    LEFT JOIN agreements a ON c.agreement_id = a.id
    LEFT JOIN shipments s ON a.shipment_id = s.id
    LEFT JOIN users u ON a.sender_id = u.id
    WHERE c.nakliyeci_id = ?
    ORDER BY c.created_at DESC
  `,
    [userId],
    (err, commissions) => {
      if (err) {
        console.error('Commission history error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      // Calculate totals
      const totalCommissions = commissions.reduce(
        (sum, c) => sum + c.amount,
        0
      );
      const paidCommissions = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);
      const pendingCommissions = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0);

      res.json({
        success: true,
        data: {
          commissions,
          summary: {
            total: parseFloat(totalCommissions.toFixed(2)),
            paid: parseFloat(paidCommissions.toFixed(2)),
            pending: parseFloat(pendingCommissions.toFixed(2)),
          },
        },
      });
    }
  );
});

// Create commission record
router.post('/create', authenticateToken, (req, res) => {
  const { agreementId, nakliyeciId, amount, rate } = req.body;

  if (!agreementId || !nakliyeciId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Agreement ID, nakliyeci ID, and amount are required',
    });
  }

  const commissionId = uuidv4();
  const commissionRate = rate || 0.01;

  db.run(
    `
    INSERT INTO commissions (id, agreement_id, nakliyeci_id, amount, rate, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `,
    [commissionId, agreementId, nakliyeciId, amount, commissionRate],
    function (err) {
      if (err) {
        console.error('Commission creation error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      res.json({
        success: true,
        message: 'Commission created successfully',
        data: {
          id: commissionId,
          agreementId,
          nakliyeciId,
          amount: parseFloat(amount),
          rate: commissionRate,
          status: 'pending',
        },
      });
    }
  );
});

// Update commission status
router.put('/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required (pending, paid, cancelled)',
    });
  }

  const updateData =
    status === 'paid'
      ? { status, paid_at: new Date().toISOString() }
      : { status };

  const setClause =
    status === 'paid' ? 'status = ?, paid_at = ?' : 'status = ?';

  const values =
    status === 'paid' ? [status, new Date().toISOString(), id] : [status, id];

  db.run(
    `
    UPDATE commissions 
    SET ${setClause}
    WHERE id = ?
  `,
    values,
    function (err) {
      if (err) {
        console.error('Commission update error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Commission not found',
        });
      }

      res.json({
        success: true,
        message: 'Commission status updated successfully',
        data: {
          id,
          status,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  );
});

// Get commission statistics
router.get('/nakliyeci/stats', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `
    SELECT 
      c.status,
      COUNT(*) as count,
      SUM(c.amount) as total_amount
    FROM commissions c
    WHERE c.nakliyeci_id = ?
    GROUP BY c.status
  `,
    [userId],
    (err, stats) => {
      if (err) {
        console.error('Commission stats error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      const summary = {
        pending: { count: 0, amount: 0 },
        paid: { count: 0, amount: 0 },
        cancelled: { count: 0, amount: 0 },
      };

      stats.forEach(stat => {
        summary[stat.status] = {
          count: stat.count,
          amount: parseFloat(stat.total_amount || 0),
        };
      });

      res.json({
        success: true,
        data: summary,
      });
    }
  );
});

module.exports = router;
