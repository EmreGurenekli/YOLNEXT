const express = require('express');
const { query, validationResult } = require('express-validator');
const { Carrier, User, Offer, Shipment } = require('../models');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/carriers
// @desc    Get carriers
// @access  Public
router.get('/', [
  query('city').optional().trim().isLength({ min: 2 }),
  query('serviceArea').optional().trim().isLength({ min: 2 }),
  query('vehicleType').optional().trim().isLength({ min: 2 }),
  query('rating').optional().isFloat({ min: 0, max: 5 }),
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

    const { city, serviceArea, vehicleType, rating, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true, isVerified: true };
    
    if (city) whereClause.city = city;
    if (rating) whereClause.rating = { [Carrier.sequelize.Op.gte]: parseFloat(rating) };

    const { count, rows: carriers } = await Carrier.findAndCountAll({
      where: whereClause,
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }
      ],
      order: [['rating', 'DESC'], ['totalShipments', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter by service area and vehicle type if provided
    let filteredCarriers = carriers;
    
    if (serviceArea) {
      filteredCarriers = filteredCarriers.filter(carrier => 
        carrier.serviceAreas && carrier.serviceAreas.includes(serviceArea)
      );
    }
    
    if (vehicleType) {
      filteredCarriers = filteredCarriers.filter(carrier => 
        carrier.vehicleTypes && carrier.vehicleTypes.includes(vehicleType)
      );
    }

    res.json({
      success: true,
      data: {
        carriers: filteredCarriers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get carriers error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/carriers/:id
// @desc    Get carrier by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const carrier = await Carrier.findByPk(req.params.id, {
      include: [
        { association: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { association: 'drivers' }
      ]
    });

    if (!carrier) {
      return res.status(404).json({
        success: false,
        message: 'Nakliyeci bulunamadı'
      });
      }

      res.json({
      success: true,
      data: { carrier }
    });
  } catch (error) {
    logger.error('Get carrier error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/carriers/:id/offers
// @desc    Get carrier's offers
// @access  Public
router.get('/:id/offers', [
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

    const whereClause = { carrierId: req.params.id };
    if (status) whereClause.status = status;

    const { count, rows: offers } = await Offer.findAndCountAll({
      where: whereClause,
      include: [
        { association: 'shipment' }
      ],
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
    logger.error('Get carrier offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/carriers/:id/shipments
// @desc    Get carrier's shipments
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

    const whereClause = { carrierId: req.params.id };
    if (status) whereClause.status = status;

    const { count, rows: shipments } = await Shipment.findAndCountAll({
      where: whereClause,
      include: [
        { association: 'sender' },
        { association: 'driver' }
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
    logger.error('Get carrier shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/carriers/:id/stats
// @desc    Get carrier statistics
// @access  Public
router.get('/:id/stats', async (req, res) => {
  try {
    const carrier = await Carrier.findByPk(req.params.id);
    
    if (!carrier) {
      return res.status(404).json({
        success: false,
        message: 'Nakliyeci bulunamadı'
      });
    }

    // Get statistics
    const totalOffers = await Offer.count({
      where: { carrierId: req.params.id }
    });

    const acceptedOffers = await Offer.count({
      where: { carrierId: req.params.id, status: 'accepted' }
    });

    const totalShipments = await Shipment.count({
      where: { carrierId: req.params.id }
    });

    const completedShipments = await Shipment.count({
      where: { carrierId: req.params.id, status: 'delivered' }
    });

    const successRate = totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalOffers,
          acceptedOffers,
          totalShipments,
          completedShipments,
          successRate: Math.round(successRate * 100) / 100,
          rating: carrier.rating,
          totalShipments: carrier.totalShipments,
          successfulShipments: carrier.successfulShipments
        }
      }
    });
  } catch (error) {
    logger.error('Get carrier stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
