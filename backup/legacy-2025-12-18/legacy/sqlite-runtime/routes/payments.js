const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const whereClause = { userId };
    if (status) whereClause.status = status;

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: payments.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.count,
        pages: Math.ceil(payments.count / limit),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create payment
router.post(
  '/',
  [
    body('amount').isNumeric(),
    body('type').isIn(['shipment', 'wallet', 'subscription']),
    body('method').isIn(['credit_card', 'bank_transfer', 'wallet']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const userId = req.user?.id;
      const { amount, type, method, description, shipmentId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const paymentData = {
        userId,
        amount,
        type,
        method,
        description: description || '',
        shipmentId: shipmentId || null,
        status: 'pending',
        transactionId: generateTransactionId(),
      };

      const payment = await Payment.create(paymentData);

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: payment,
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Get wallet
router.get('/wallet', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // In a real app, you would have a Wallet model
    const wallet = {
      balance: 0,
      currency: 'TRY',
    };

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Add funds to wallet
router.post(
  '/wallet/add-funds',
  [
    body('amount').isNumeric(),
    body('method').isIn(['credit_card', 'bank_transfer']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const userId = req.user?.id;
      const { amount, method } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // In a real app, you would process the payment and update wallet
      res.json({
        success: true,
        message: 'Funds added to wallet successfully',
      });
    } catch (error) {
      console.error('Add funds error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Generate transaction ID
function generateTransactionId() {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = router;
