const express = require('express');
const { query, validationResult } = require('express-validator');
const { Driver, User, Carrier, Shipment } = require('../models');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/drivers
// @desc    Get drivers
// @access  Public
router.get('/', [
  query('city').optional().trim().isLength({ min: 2 }),
  query('vehicleType').optional().trim().isLength({ min: 2 }),
  query('rating').optional().isFloat({ min: 0, max: 5 }),
  query('isAvailable').optional().isBoolean(),
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

    const { city, vehicleType, rating, isAvailable, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true, isVerified: true };
    
    if (city) whereClause.city = city;
    if (rating) whereClause.rating = { [Driver.sequelize.Op.gte]: parseFloat(rating) };
    if (isAvailable !== undefined) whereClause.isAvailable = isAvailable === 'true';

    const { count, rows: drivers } = await Driver.findAndCountAll({
      where: whereClause,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { association: 'carrier' }
      ],
      order: [['rating', 'DESC'], ['totalTrips', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter by vehicle type if provided
    let filteredDrivers = drivers;
    
    if (vehicleType) {
      filteredDrivers = filteredDrivers.filter(driver => 
        driver.vehicleTypes && driver.vehicleTypes.includes(vehicleType)
      );
    }

    res.json({
      success: true,
      data: {
        drivers: filteredDrivers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/drivers/:id
// @desc    Get driver by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { association: 'carrier' }
      ]
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Şoför bulunamadı'
      });
    }

    res.json({
      success: true,
      data: { driver }
    });
  } catch (error) {
    logger.error('Get driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/drivers/:id/shipments
// @desc    Get driver's shipments
// @access  Public
router.get('/:id/shipments', [
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

    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { driverId: req.params.id };
    if (status) whereClause.status = status;

    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: whereClause,
      include: [
        { association: 'sender' },
        { association: 'carrier' }
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
    logger.error('Get driver shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/drivers/:id/stats
// @desc    Get driver statistics
// @access  Public
router.get('/:id/stats', async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Şoför bulunamadı'
      });
    }

    // Get statistics
    const totalShipments = await Shipment.count({
      where: { driverId: req.params.id }
    });

    const completedShipments = await Shipment.count({
      where: { driverId: req.params.id, status: 'delivered' }
    });

    const successRate = totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalShipments,
          completedShipments,
          successRate: Math.round(successRate * 100) / 100,
          rating: driver.rating,
          totalTrips: driver.totalTrips,
          successfulTrips: driver.successfulTrips,
          isAvailable: driver.isAvailable
        }
      }
    });
  } catch (error) {
    logger.error('Get driver stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/drivers/:id/availability
// @desc    Update driver availability
// @access  Private
router.put('/:id/availability', [
  auth,
  authorize('logistics')
], async (req, res) => {
  try {
    const { isAvailable, currentLocation } = req.body;

    const driver = await Driver.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Şoför bulunamadı'
      });
    }

    const updateData = {};
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (currentLocation) updateData.currentLocation = currentLocation;

    await driver.update(updateData);

    logger.info(`Şoför müsaitlik durumu güncellendi: ${driver.id} - ${req.user.email}`);

    res.json({
      success: true,
      message: 'Müsaitlik durumu başarıyla güncellendi',
      data: { driver }
    });
  } catch (error) {
    logger.error('Update driver availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;

