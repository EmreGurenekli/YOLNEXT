const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { User, Shipment, Offer, Carrier, Driver } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Generate tracking number
const generateTrackingNumber = () => {
  const prefix = 'YN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// @route   POST /api/shipments
// @desc    Create new shipment
// @access  Private
router.post('/', [
  auth,
  authorize('individual', 'corporate'),
  body('receiverName').trim().isLength({ min: 2 }),
  body('receiverPhone').isMobilePhone('tr-TR'),
  body('receiverAddress').trim().isLength({ min: 10 }),
  body('receiverCity').trim().isLength({ min: 2 }),
  body('receiverDistrict').trim().isLength({ min: 2 }),
  body('packageDescription').trim().isLength({ min: 10 }),
  body('packageType').trim().isLength({ min: 2 }),
  body('weight').isFloat({ min: 0.1 }),
  body('value').isFloat({ min: 0 }),
  body('pickupDate').optional().isISO8601(),
  body('deliveryDate').optional().isISO8601()
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
      receiverName,
      receiverPhone,
      receiverEmail,
      receiverAddress,
      receiverCity,
      receiverDistrict,
      receiverPostalCode,
      packageDescription,
      packageType,
    weight,
      dimensions,
      value,
      isFragile,
      isDangerous,
      requiresSignature,
      pickupDate,
      deliveryDate,
      specialInstructions,
      deliveryInstructions,
    priority,
      shipmentType
  } = req.body;

    // Get sender information from user profile
    const sender = await User.findByPk(req.user.id, {
      include: [
        { association: 'corporateProfile' }
      ]
    });

    const senderName = sender.corporateProfile 
      ? sender.corporateProfile.companyName 
      : `${sender.firstName} ${sender.lastName}`;

    // Create shipment
    const shipment = await Shipment.create({
      trackingNumber: generateTrackingNumber(),
      senderId: req.user.id,
      status: 'pending',
      priority: priority || 'normal',
      shipmentType: shipmentType || 'standard',
      senderName,
      senderPhone: req.user.phone,
      senderEmail: req.user.email,
      senderAddress: sender.corporateProfile?.address || 'Adres bilgisi eksik',
      senderCity: sender.corporateProfile?.city || 'Şehir bilgisi eksik',
      senderDistrict: sender.corporateProfile?.district || 'İlçe bilgisi eksik',
      senderPostalCode: sender.corporateProfile?.postalCode,
      receiverName,
      receiverPhone,
      receiverEmail,
      receiverAddress,
      receiverCity,
      receiverDistrict,
      receiverPostalCode,
      packageDescription,
      packageType,
      weight,
      dimensions: dimensions || { length: 0, width: 0, height: 0, unit: 'cm' },
      value,
      isFragile: isFragile || false,
      isDangerous: isDangerous || false,
      requiresSignature: requiresSignature || false,
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      specialInstructions,
      deliveryInstructions
    });

    logger.info(`Yeni gönderi oluşturuldu: ${shipment.trackingNumber} - ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Gönderi başarıyla oluşturuldu',
      data: { shipment }
    });
  } catch (error) {
    logger.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/shipments
// @desc    Get user's shipments
// @access  Private
router.get('/', [
  auth,
  query('status').optional().isIn(['pending', 'quoted', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'returned']),
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

    const { status, page = 1, limit = 10 } = req.body;
    const offset = (page - 1) * limit;

    const whereClause = { senderId: req.user.id };
    if (status) whereClause.status = status;

    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: whereClause,
      include: [
        { association: 'carrier' },
        { association: 'driver' },
        { association: 'offers' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        shipments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/shipments/:id
// @desc    Get shipment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: {
        id: req.params.id,
        senderId: req.user.id
      },
      include: [
        { association: 'carrier' },
        { association: 'driver' },
        { association: 'offers', include: [{ association: 'carrier' }] }
      ]
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    res.json({
      success: true,
      data: { shipment }
    });
  } catch (error) {
    logger.error('Get shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/shipments/:id
// @desc    Update shipment
// @access  Private
router.put('/:id', [
  auth,
  authorize('individual', 'corporate')
], async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: {
        id: req.params.id,
        senderId: req.user.id
      }
    });

      if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    // Only allow updates for pending shipments
    if (shipment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Sadece bekleyen gönderiler güncellenebilir'
      });
    }

    const allowedUpdates = [
      'receiverName', 'receiverPhone', 'receiverEmail', 'receiverAddress',
      'receiverCity', 'receiverDistrict', 'receiverPostalCode',
      'packageDescription', 'packageType', 'weight', 'dimensions', 'value',
      'isFragile', 'isDangerous', 'requiresSignature', 'pickupDate',
      'deliveryDate', 'specialInstructions', 'deliveryInstructions'
    ];

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await shipment.update(updateData);

    logger.info(`Gönderi güncellendi: ${shipment.trackingNumber} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Gönderi başarıyla güncellendi',
      data: { shipment }
    });
  } catch (error) {
    logger.error('Update shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   DELETE /api/shipments/:id
// @desc    Cancel shipment
// @access  Private
router.delete('/:id', [
  auth,
  authorize('individual', 'corporate')
], async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: {
        id: req.params.id,
        senderId: req.user.id
      }
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    // Only allow cancellation for pending or quoted shipments
    if (!['pending', 'quoted'].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Bu gönderi iptal edilemez'
      });
    }

    await shipment.update({ status: 'cancelled' });

    logger.info(`Gönderi iptal edildi: ${shipment.trackingNumber} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Gönderi başarıyla iptal edildi'
    });
  } catch (error) {
    logger.error('Cancel shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/shipments/track/:trackingNumber
// @desc    Track shipment by tracking number
// @access  Public
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: { trackingNumber: req.params.trackingNumber },
      include: [
        { association: 'carrier' },
        { association: 'driver' }
      ]
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    res.json({
      success: true,
      data: { shipment }
    });
  } catch (error) {
    logger.error('Track shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;