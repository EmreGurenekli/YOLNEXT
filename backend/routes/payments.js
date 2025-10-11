const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Shipment, Offer } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent
// @access  Private
router.post('/create-payment-intent', [
  auth,
  authorize('individual', 'corporate'),
  body('shipmentId').isUUID(),
  body('amount').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { shipmentId, amount } = req.body;

    // Check if shipment exists and belongs to user
    const shipment = await Shipment.findOne({
      where: {
        id: shipmentId,
        senderId: req.user.id
      }
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    // In a real implementation, you would integrate with Stripe or another payment provider
    // For now, we'll return a mock payment intent
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'try',
      status: 'requires_payment_method'
    };

    logger.info(`Ödeme intent oluşturuldu: ${paymentIntent.id} - ${req.user.email}`);

      res.json({
      success: true,
      data: { paymentIntent }
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment
// @access  Private
router.post('/confirm-payment', [
  auth,
  authorize('individual', 'corporate'),
  body('paymentIntentId').trim().isLength({ min: 1 }),
  body('shipmentId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { paymentIntentId, shipmentId } = req.body;

    // Check if shipment exists and belongs to user
    const shipment = await Shipment.findOne({
      where: {
        id: shipmentId,
        senderId: req.user.id
      }
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    // In a real implementation, you would confirm the payment with Stripe
    // For now, we'll simulate a successful payment
    const payment = {
      id: paymentIntentId,
      status: 'succeeded',
      amount: shipment.finalPrice,
      currency: 'try',
      createdAt: new Date()
    };

    // Update shipment status
    await shipment.update({ status: 'accepted' });

    logger.info(`Ödeme onaylandı: ${paymentIntentId} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Ödeme başarıyla onaylandı',
      data: { payment }
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history
// @access  Private
router.get('/history', [
  auth,
  authorize('individual', 'corporate')
], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get shipments with payments
    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: { senderId: req.user.id },
      include: [
        { association: 'carrier' },
        { association: 'driver' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform shipments to payment history format
    const payments = shipments.map(shipment => ({
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      amount: shipment.finalPrice,
      commission: shipment.commission,
      status: shipment.status,
      carrier: shipment.carrier?.companyName,
      driver: shipment.driver ? `${shipment.driver.firstName} ${shipment.driver.lastName}` : null,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt
    }));

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/payments/commission-history
// @desc    Get commission history for carriers
// @access  Private
router.get('/commission-history', [
  auth,
  authorize('carrier')
], async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get carrier profile
    const carrier = await Carrier.findOne({
      where: { userId: req.user.id }
    });

    if (!carrier) {
      return res.status(400).json({
        success: false,
        message: 'Nakliyeci profili bulunamadı'
      });
    }

    // Get shipments carried by this carrier
    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: { carrierId: carrier.id },
      include: [
        { association: 'sender' },
        { association: 'driver' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform shipments to commission history format
    const commissions = shipments.map(shipment => ({
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      amount: shipment.finalPrice,
      commission: shipment.commission,
      status: shipment.status,
      sender: shipment.sender?.firstName ? 
        `${shipment.sender.firstName} ${shipment.sender.lastName}` : 
        shipment.senderName,
      driver: shipment.driver ? `${shipment.driver.firstName} ${shipment.driver.lastName}` : null,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt
    }));

    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get commission history error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;