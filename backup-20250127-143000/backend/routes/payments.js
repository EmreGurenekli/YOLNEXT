const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Create payment
router.post('/', authenticateToken, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('payment_method').isIn(['credit_card', 'bank_transfer', 'wallet', 'cash']).withMessage('Invalid payment method'),
  body('shipment_id').optional().isInt().withMessage('Shipment ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, payment_method, shipment_id, currency = 'TRY' } = req.body;
    const userId = req.user.userId;

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    db.run(
      `INSERT INTO payments (user_id, shipment_id, amount, currency, payment_method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, shipment_id, amount, currency, payment_method, transactionId],
      function(err) {
        if (err) {
          console.error('Payment creation error:', err);
          return res.status(500).json({ error: 'Failed to create payment' });
        }

        const paymentId = this.lastID;

        // Simulate payment processing
        setTimeout(() => {
          db.run(
            `UPDATE payments SET status = 'completed', gateway_response = ? WHERE id = ?`,
            [JSON.stringify({ status: 'success', transaction_id: transactionId }), paymentId],
            (err) => {
              if (err) {
                console.error('Payment update error:', err);
              }
            }
          );
        }, 2000);

        res.status(201).json({
          message: 'Payment created successfully',
          payment: {
            id: paymentId,
            transaction_id: transactionId,
            amount,
            currency,
            payment_method,
            status: 'pending'
          }
        });
      }
    );
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user payments
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10, status } = req.query;

  let query = `SELECT * FROM payments WHERE user_id = ?`;
  let params = [userId];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, payments) => {
    if (err) {
      console.error('Get payments error:', err);
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM payments WHERE user_id = ?`;
    let countParams = [userId];

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Get payments count error:', err);
        return res.status(500).json({ error: 'Failed to fetch payments count' });
      }

      res.json({
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit))
        }
      });
    });
  });
});

// Get payment by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  db.get(
    `SELECT * FROM payments WHERE id = ? AND user_id = ?`,
    [id, userId],
    (err, payment) => {
      if (err) {
        console.error('Get payment error:', err);
        return res.status(500).json({ error: 'Failed to fetch payment' });
      }

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json(payment);
    }
  );
});

// Update payment status
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Invalid status')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    db.run(
      `UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [status, id, userId],
      function(err) {
        if (err) {
          console.error('Update payment status error:', err);
          return res.status(500).json({ error: 'Failed to update payment status' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({ message: 'Payment status updated successfully' });
      }
    );
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refund payment
router.post('/:id/refund', authenticateToken, [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.userId;

    // Get payment details
    db.get(
      `SELECT * FROM payments WHERE id = ? AND user_id = ? AND status = 'completed'`,
      [id, userId],
      (err, payment) => {
        if (err) {
          console.error('Get payment for refund error:', err);
          return res.status(500).json({ error: 'Failed to fetch payment' });
        }

        if (!payment) {
          return res.status(404).json({ error: 'Payment not found or not eligible for refund' });
        }

        const refundAmount = amount || payment.amount;
        const refundTransactionId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create refund payment
        db.run(
          `INSERT INTO payments (user_id, shipment_id, amount, currency, payment_method, transaction_id, status, gateway_response)
           VALUES (?, ?, ?, ?, 'refund', ?, 'completed', ?)`,
          [userId, payment.shipment_id, -refundAmount, payment.currency, refundTransactionId, 
           JSON.stringify({ reason, original_transaction_id: payment.transaction_id })],
          function(err) {
            if (err) {
              console.error('Refund creation error:', err);
              return res.status(500).json({ error: 'Failed to process refund' });
            }

            res.json({
              message: 'Refund processed successfully',
              refund: {
                id: this.lastID,
                transaction_id: refundTransactionId,
                amount: refundAmount,
                reason
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;