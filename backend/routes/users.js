const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const IndividualUser = require('../models/IndividualUser');
const CorporateUser = require('../models/CorporateUser');
const Carrier = require('../models/Carrier');
const Driver = require('../models/Driver');
const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get specific user data based on type
    let specificUser = null;
    switch (user.userType) {
      case 'individual':
        specificUser = await IndividualUser.findOne({ where: { userId } });
        break;
      case 'corporate':
        specificUser = await CorporateUser.findOne({ where: { userId } });
        break;
      case 'nakliyeci':
        specificUser = await Carrier.findOne({ where: { userId } });
        break;
      case 'tasiyici':
        specificUser = await Driver.findOne({ where: { userId } });
        break;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        phone: user.phone,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        ...(specificUser && specificUser.dataValues),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update user profile
router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone('tr-TR'),
    body('email').optional().isEmail().normalizeEmail(),
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
      const { name, phone, email, ...otherData } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update basic user data
      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }

      // Update specific user data
      let specificUser = null;
      switch (user.userType) {
        case 'individual':
          specificUser = await IndividualUser.findOne({ where: { userId } });
          if (specificUser) {
            await specificUser.update(otherData);
          }
          break;
        case 'corporate':
          specificUser = await CorporateUser.findOne({ where: { userId } });
          if (specificUser) {
            await specificUser.update(otherData);
          }
          break;
        case 'nakliyeci':
          specificUser = await Carrier.findOne({ where: { userId } });
          if (specificUser) {
            await specificUser.update(otherData);
          }
          break;
        case 'tasiyici':
          specificUser = await Driver.findOne({ where: { userId } });
          if (specificUser) {
            await specificUser.update(otherData);
          }
          break;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Upload avatar
router.post('/avatar', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // In a real app, you would handle file upload here
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: '/uploads/avatars/default-avatar.png',
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete account
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete - mark as inactive
    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
