const express = require('express');
const { body, validationResult } = require('express-validator');
const Carrier = require('../models/Carrier');
const router = express.Router();

// Get all carriers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, verified, rating } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (verified !== undefined) whereClause.isVerified = verified === 'true';
    if (rating) whereClause.rating = { [Op.gte]: parseFloat(rating) };

    const carriers = await Carrier.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['rating', 'DESC']],
    });

    res.json({
      success: true,
      data: carriers.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: carriers.count,
        pages: Math.ceil(carriers.count / limit),
      },
    });
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get carrier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const carrier = await Carrier.findByPk(id);

    if (!carrier) {
      return res.status(404).json({
        success: false,
        message: 'Carrier not found',
      });
    }

    res.json({
      success: true,
      data: carrier,
    });
  } catch (error) {
    console.error('Get carrier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Search carriers
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required',
      });
    }

    const carriers = await Carrier.findAndCountAll({
      where: {
        [Op.or]: [
          { companyName: { [Op.like]: `%${q}%` } },
          { address: { [Op.like]: `%${q}%` } },
        ],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['rating', 'DESC']],
    });

    res.json({
      success: true,
      data: carriers.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: carriers.count,
        pages: Math.ceil(carriers.count / limit),
      },
    });
  } catch (error) {
    console.error('Search carriers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get carrier reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const carrier = await Carrier.findByPk(id);
    if (!carrier) {
      return res.status(404).json({
        success: false,
        message: 'Carrier not found',
      });
    }

    // In a real app, you would have a Reviews model
    const reviews = []; // Placeholder

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: reviews.length,
        pages: Math.ceil(reviews.length / limit),
      },
    });
  } catch (error) {
    console.error('Get carrier reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create carrier review
router.post(
  '/:id/reviews',
  [body('rating').isInt({ min: 1, max: 5 }), body('comment').optional().trim()],
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

      const { id } = req.params;
      const userId = req.user?.id;
      const { rating, comment } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const carrier = await Carrier.findByPk(id);
      if (!carrier) {
        return res.status(404).json({
          success: false,
          message: 'Carrier not found',
        });
      }

      // In a real app, you would create a review here
      res.status(201).json({
        success: true,
        message: 'Review created successfully',
      });
    } catch (error) {
      console.error('Create carrier review error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

module.exports = router;
