const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { User, Shipment, Offer, Carrier, Driver } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   POST /api/offers
// @desc    Create new offer
// @access  Private
router.post('/', [
  auth,
  authorize('carrier'),
  body('shipmentId').isUUID(),
  body('price').isFloat({ min: 0 }),
  body('estimatedDelivery').isISO8601(),
  body('deliveryTime').optional().trim().isLength({ min: 1 }),
  body('message').optional().trim().isLength({ max: 500 })
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

    const {
      shipmentId,
      price,
      estimatedDelivery,
      deliveryTime,
      pickupDate,
      deliveryDate,
      message,
      conditions
    } = req.body;

    // Check if shipment exists and is available for offers
    const shipment = await Shipment.findByPk(shipmentId);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    if (shipment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu gönderi için teklif verilemez'
      });
    }

    // Check if carrier already made an offer for this shipment
    const existingOffer = await Offer.findOne({
      where: {
        shipmentId,
        carrierId: req.user.carrierProfile?.id
      }
    });

        if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'Bu gönderi için zaten teklif verdiniz'
      });
    }

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

    // Create offer
    const offer = await Offer.create({
      shipmentId,
      carrierId: carrier.id,
              price,
      estimatedDelivery: new Date(estimatedDelivery),
      deliveryTime,
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
              message,
      conditions: conditions || {},
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      commissionAmount: price * 0.01, // %1 komisyon hesapla
      commissionStatus: 'pending' // Eşleşme sonrası tahsil edilecek
    });

    logger.info(`Yeni teklif oluşturuldu: ${offer.id} - ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Teklif başarıyla oluşturuldu',
      data: { offer }
    });
  } catch (error) {
    logger.error('Create offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/offers
// @desc    Get offers
// @access  Private
router.get('/', [
  auth,
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'expired', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    let includeClause = [];

    if (req.user.userType === 'carrier') {
      // Get offers made by this carrier
      const carrier = await Carrier.findOne({
        where: { userId: req.user.id }
      });
      
      if (!carrier) {
        return res.status(400).json({
          success: false,
          message: 'Nakliyeci profili bulunamadı'
        });
      }

      whereClause.carrierId = carrier.id;
      includeClause = [
        { association: 'shipment', include: [{ association: 'sender' }] }
      ];
    } else {
      // Get offers for shipments by this user
      whereClause['$shipment.senderId$'] = req.user.id;
      includeClause = [
        { 
          association: 'shipment',
          where: { senderId: req.user.id }
        },
        { association: 'carrier' }
      ];
    }

    if (status) whereClause.status = status;

    const { count, rows: offers } = await Offer.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/offers/:id
// @desc    Get offer by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [
        { association: 'shipment' },
        { association: 'carrier' },
        { association: 'driver' }
      ]
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }

    // Check if user has permission to view this offer
    if (req.user.userType === 'carrier') {
      const carrier = await Carrier.findOne({
        where: { userId: req.user.id }
      });
      
      if (offer.carrierId !== carrier?.id) {
        return res.status(403).json({
          success: false,
          message: 'Bu teklifi görme yetkiniz yok'
        });
      }
    } else {
      if (offer.shipment.senderId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bu teklifi görme yetkiniz yok'
        });
      }
    }

    res.json({
      success: true,
      data: { offer }
    });
  } catch (error) {
    logger.error('Get offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/offers/:id/accept
// @desc    Accept offer
// @access  Private
router.put('/:id/accept', [
  auth,
  authorize('individual', 'corporate')
], async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [
        { association: 'shipment' },
        { association: 'carrier' }
      ]
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }

    // Check if user owns the shipment
    if (offer.shipment.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklifi kabul etme yetkiniz yok'
      });
    }

    // Check if offer is still pending
      if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif artık kabul edilemez'
      });
    }

    // Check if offer has expired
    if (offer.expiresAt && new Date() > offer.expiresAt) {
      await offer.update({ status: 'expired' });
      return res.status(400).json({
        success: false,
        message: 'Bu teklifin süresi dolmuş'
      });
    }

    // Start transaction
    const transaction = await Offer.sequelize.transaction();

    try {
      // Accept the offer
      await offer.update({ 
        status: 'accepted',
        acceptedAt: new Date()
      }, { transaction });

      // Update shipment
      await offer.shipment.update({
        status: 'accepted',
        carrierId: offer.carrierId,
        finalPrice: offer.price,
        commission: offer.price * (process.env.COMMISSION_RATE || 0.01)
      }, { transaction });

      // Reject all other offers for this shipment
      await Offer.update(
        { status: 'rejected' },
        {
          where: {
            shipmentId: offer.shipmentId,
            id: { [Offer.sequelize.Op.ne]: offer.id }
          },
          transaction
        }
      );

      await transaction.commit();

      logger.info(`Teklif kabul edildi: ${offer.id} - ${req.user.email}`);

      res.json({
        success: true,
        message: 'Teklif başarıyla kabul edildi',
        data: { offer }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Accept offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/offers/:id/reject
// @desc    Reject offer
// @access  Private
router.put('/:id/reject', [
  auth,
  authorize('individual', 'corporate')
], async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [{ association: 'shipment' }]
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }

    // Check if user owns the shipment
    if (offer.shipment.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklifi reddetme yetkiniz yok'
      });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif artık reddedilemez'
      });
    }

    await offer.update({ 
      status: 'rejected',
      rejectedAt: new Date()
    });

    logger.info(`Teklif reddedildi: ${offer.id} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Teklif başarıyla reddedildi'
    });
  } catch (error) {
    logger.error('Reject offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   DELETE /api/offers/:id
// @desc    Cancel offer
// @access  Private
router.delete('/:id', [
  auth,
  authorize('carrier')
], async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [{ association: 'carrier' }]
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Teklif bulunamadı'
      });
    }

    // Check if user owns the offer
    const carrier = await Carrier.findOne({
      where: { userId: req.user.id }
    });

    if (offer.carrierId !== carrier?.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu teklifi iptal etme yetkiniz yok'
      });
    }

    // Check if offer can be cancelled
    if (!['pending'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif iptal edilemez'
      });
    }

    await offer.update({ status: 'cancelled' });

    logger.info(`Teklif iptal edildi: ${offer.id} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Teklif başarıyla iptal edildi'
    });
  } catch (error) {
    logger.error('Cancel offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;