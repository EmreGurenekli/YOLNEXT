const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, CorporateUser, Carrier, Driver } = require('../models');
const { protect } = require('../middleware/auth');
const auth = protect; // Alias for compatibility
const logger = require('../utils/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'yolnet_super_secret_key_2024_development', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('userType').isIn(['individual', 'corporate', 'carrier', 'logistics'])
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

    const { email, password, firstName, lastName, userType, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      });
      }

      // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userType,
      phone
    });

    // Generate token
    const token = generateToken(user.id);

    logger.info(`Yeni kullanıcı kaydı: ${email} (${userType})`);

          res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
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

    const { email, password } = req.body;

    // Demo kullanıcıları için özel kontrol
    const demoUsers = {
      'individual@demo.com': { password: 'demo123', userType: 'individual' },
      'corporate@demo.com': { password: 'demo123', userType: 'corporate' },
      'nakliyeci@demo.com': { password: 'demo123', userType: 'nakliyeci' },
      'tasiyici@demo.com': { password: 'demo123', userType: 'tasiyici' }
    };

    if (demoUsers[email] && demoUsers[email].password === password) {
      const token = generateToken('demo-' + Date.now());
      const userData = {
        id: 'demo-' + Date.now(),
        firstName: 'Demo',
        lastName: 'User',
        email: email,
        userType: demoUsers[email].userType,
        phone: '+90 555 000 0000',
        avatar: null,
        isActive: true,
        isVerified: true
      };

      return res.json({
        success: true,
        message: 'Demo giriş başarılı',
        data: {
          user: userData,
          token
        }
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
        if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
        }

        // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hesabınız deaktif edilmiş'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    logger.info(`Kullanıcı girişi: ${email}`);

        res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { association: 'corporateProfile' },
        { association: 'carrierProfile' },
        { association: 'driverProfile' }
      ]
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = generateToken(req.user.id);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    logger.info(`Kullanıcı çıkışı: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;