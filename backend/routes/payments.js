const express = require('express');
const { body, validationResult } = require('express-validator');
const { Payment, User, Shipment, Offer } = require('../models');
const { auth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/payments
// @desc    Get user payments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, shipmentId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };

    if (type) whereClause.paymentType = type;
    if (status) whereClause.status = status;
    if (shipmentId) whereClause.shipmentId = shipmentId;

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'title', 'status']
        },
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'price', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        payments: payments.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(payments.count / limit),
          totalItems: payments.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Ödemeler alınırken hata oluştu.'
    });
  }
});

// @route   POST /api/payments/deposit
// @desc    Create deposit payment
// @access  Private
router.post('/deposit', [
  auth,
  body('amount').isFloat({ min: 1 }).withMessage('Miktar 1 TL\'den fazla olmalı'),
  body('paymentMethod').isIn(['credit_card', 'bank_transfer', 'stripe']).withMessage('Geçersiz ödeme yöntemi'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Açıklama 200 karakterden az olmalı')
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

    const { amount, paymentMethod, description } = req.body;

    const payment = await Payment.create({
      userId: req.user.id,
      amount,
      currency: 'TRY',
      paymentType: 'deposit',
      paymentMethod,
      status: 'pending',
      description: description || 'Hesap bakiyesi yatırma',
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Para yatırma işlemi başlatıldı.'
    });
  } catch (error) {
    logger.error('Create deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Para yatırma işlemi oluşturulurken hata oluştu.'
    });
  }
});

// @route   POST /api/payments/commission
// @desc    Create commission payment
// @access  Private
router.post('/commission', [
  auth,
  body('offerId').isUUID().withMessage('Geçerli teklif ID gerekli'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Miktar 0.01 TL\'den fazla olmalı')
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

    const { offerId, amount } = req.body;

    // Check if offer exists and belongs to user
    const offer = await Offer.findByPk(offerId, {
      include: [
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'title', 'status']
        }
      ]
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı.'
      });
    }

    if (offer.carrierId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklif için komisyon ödemesi yapamazsınız.'
      });
    }

    const payment = await Payment.create({
      userId: req.user.id,
      offerId,
      shipmentId: offer.shipmentId,
      amount,
      currency: 'TRY',
      paymentType: 'commission',
      paymentMethod: 'wallet',
      status: 'completed',
      description: `Komisyon ödemesi - ${offer.shipment.title}`,
      processedAt: new Date(),
      metadata: {
        offerPrice: offer.price,
        commissionRate: 0.01,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Komisyon ödemesi tamamlandı.'
    });
  } catch (error) {
    logger.error('Create commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Komisyon ödemesi oluşturulurken hata oluştu.'
    });
  }
});

// @route   GET /api/payments/balance
// @desc    Get user balance
// @access  Private
router.get('/balance', auth, async (req, res) => {
  try {
    const completedPayments = await Payment.findAll({
      where: {
        userId: req.user.id,
        status: 'completed'
      },
      attributes: ['paymentType', 'amount']
    });

    let balance = 0;
    completedPayments.forEach(payment => {
      if (payment.paymentType === 'deposit' || payment.paymentType === 'refund' || payment.paymentType === 'bonus') {
        balance += parseFloat(payment.amount);
      } else if (payment.paymentType === 'commission' || payment.paymentType === 'withdrawal') {
        balance -= parseFloat(payment.amount);
      }
    });

    res.json({
      success: true,
      data: {
        balance: balance.toFixed(2),
        currency: 'TRY'
      }
    });
  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Bakiye alınırken hata oluştu.'
    });
  }
});

// @route   GET /api/payments/stats
// @desc    Get payment statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = { userId: req.user.id };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Payment.findAll({
      where: whereClause,
      attributes: [
        'paymentType',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      group: ['paymentType', 'status']
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Ödeme istatistikleri alınırken hata oluştu.'
    });
  }
});

module.exports = router;
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