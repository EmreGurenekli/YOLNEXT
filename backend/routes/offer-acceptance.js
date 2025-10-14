const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, Shipment, Offer, Carrier, Driver, Payment } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   POST /api/offers/:offerId/accept
// @desc    Accept an offer (Gönderici teklifi kabul eder)
// @access  Private
router.post('/:offerId/accept', [
  auth,
  authorize('individual', 'corporate'),
  body('reason').optional().trim().isLength({ max: 500 })
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

    const { offerId } = req.params;
    const { reason } = req.body;

    // Find offer
    const offer = await Offer.findByPk(offerId, {
      include: [
        { model: Shipment, as: 'shipment' },
        { model: Carrier, as: 'carrier' }
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
        message: 'Bu gönderiye ait değilsiniz'
      });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif artık kabul edilemez'
      });
    }

    // Check if shipment is still available
    if (offer.shipment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu gönderi artık teklif kabul etmiyor'
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Accept the offer
      await offer.update({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptanceReason: reason
      }, { transaction });

      // Reject all other offers for this shipment
      await Offer.update({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: 'Başka bir teklif kabul edildi'
      }, {
        where: {
          shipmentId: offer.shipmentId,
          id: { [Op.ne]: offerId },
          status: 'pending'
        },
        transaction
      });

      // Update shipment status
      await offer.shipment.update({
        status: 'accepted',
        acceptedOfferId: offerId,
        carrierId: offer.carrierId,
        price: offer.price,
        estimatedDelivery: offer.estimatedDelivery
      }, { transaction });

      // Create payment record for commission
      await Payment.create({
        type: 'commission',
        amount: offer.commissionAmount,
        currency: 'TRY',
        status: 'pending',
        description: `Komisyon - Gönderi #${offer.shipmentId}`,
        metadata: {
          offerId: offer.id,
          shipmentId: offer.shipmentId,
          carrierId: offer.carrierId
        }
      }, { transaction });

      await transaction.commit();

      logger.info(`Teklif kabul edildi: ${offerId} - Gönderi: ${offer.shipmentId}`);

      res.json({
        success: true,
        message: 'Teklif başarıyla kabul edildi',
        data: {
          offer: {
            id: offer.id,
            price: offer.price,
            estimatedDelivery: offer.estimatedDelivery,
            carrier: {
              companyName: offer.carrier.companyName,
              phone: offer.carrier.phone,
              email: offer.carrier.email
            }
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    logger.error('Teklif kabul hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif kabul edilirken hata oluştu'
    });
  }
});

// @route   POST /api/offers/:offerId/reject
// @desc    Reject an offer (Gönderici teklifi reddeder)
// @access  Private
router.post('/:offerId/reject', [
  auth,
  authorize('individual', 'corporate'),
  body('reason').optional().trim().isLength({ max: 500 })
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

    const { offerId } = req.params;
    const { reason } = req.body;

    // Find offer
    const offer = await Offer.findByPk(offerId, {
      include: [{ model: Shipment, as: 'shipment' }]
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
        message: 'Bu gönderiye ait değilsiniz'
      });
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bu teklif artık reddedilemez'
      });
    }

    // Reject the offer
    await offer.update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason || 'Gönderici tarafından reddedildi'
    });

    logger.info(`Teklif reddedildi: ${offerId} - Gönderi: ${offer.shipmentId}`);

    res.json({
      success: true,
      message: 'Teklif reddedildi'
    });

  } catch (error) {
    logger.error('Teklif reddetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif reddedilirken hata oluştu'
    });
  }
});

// @route   POST /api/offers/:offerId/cancel
// @desc    Cancel an accepted offer (Kabul sonrası iptal)
// @access  Private
router.post('/:offerId/cancel', [
  auth,
  authorize('individual', 'corporate'),
  body('reason').trim().isLength({ min: 10, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'İptal sebebi en az 10 karakter olmalı',
        errors: errors.array()
      });
    }

    const { offerId } = req.params;
    const { reason } = req.body;

    // Find offer
    const offer = await Offer.findByPk(offerId, {
      include: [{ model: Shipment, as: 'shipment' }]
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
        message: 'Bu gönderiye ait değilsiniz'
      });
    }

    // Check if offer is accepted
    if (offer.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Sadece kabul edilmiş teklifler iptal edilebilir'
      });
    }

    // Check if shipment hasn't started yet
    if (offer.shipment.status === 'in_transit') {
      return res.status(400).json({
        success: false,
        message: 'Yolda olan gönderiler iptal edilemez'
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Cancel the offer
      await offer.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      }, { transaction });

      // Update shipment status
      await offer.shipment.update({
        status: 'pending',
        acceptedOfferId: null,
        carrierId: null,
        price: null,
        estimatedDelivery: null
      }, { transaction });

      // Cancel commission payment
      await Payment.update({
        status: 'cancelled'
      }, {
        where: {
          type: 'commission',
          metadata: {
            offerId: offer.id
          }
        },
        transaction
      });

      await transaction.commit();

      logger.info(`Teklif iptal edildi: ${offerId} - Gönderi: ${offer.shipmentId}`);

      res.json({
        success: true,
        message: 'Teklif iptal edildi'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    logger.error('Teklif iptal hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif iptal edilirken hata oluştu'
    });
  }
});

module.exports = router;





