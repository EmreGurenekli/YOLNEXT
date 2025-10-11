const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, CorporateUser, Carrier, Driver } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
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
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone('tr-TR')
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

    const { firstName, lastName, phone, preferences } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (preferences) updateData.preferences = preferences;

    await req.user.update(updateData);

    logger.info(`Kullanıcı profili güncellendi: ${req.user.email}`);

        res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: { user: req.user.toJSON() }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/users/corporate-profile
// @desc    Create/Update corporate profile
// @access  Private
router.post('/corporate-profile', [
  auth,
  authorize('corporate'),
  body('companyName').trim().isLength({ min: 2 }),
  body('taxNumber').isLength({ min: 10, max: 11 }),
  body('address').trim().isLength({ min: 10 }),
  body('city').trim().isLength({ min: 2 }),
  body('district').trim().isLength({ min: 2 }),
  body('contactPerson').trim().isLength({ min: 2 }),
  body('contactPhone').isMobilePhone('tr-TR'),
  body('contactEmail').isEmail()
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
      companyName,
      taxNumber,
      tradeRegistryNumber,
      address,
      city,
      district,
      postalCode,
      website,
      industry,
      employeeCount,
      annualRevenue,
      contactPerson,
      contactPhone,
      contactEmail
    } = req.body;

    // Check if corporate profile already exists
    let corporateProfile = await CorporateUser.findOne({
      where: { userId: req.user.id }
    });

    if (corporateProfile) {
      // Update existing profile
      await corporateProfile.update({
        companyName,
        taxNumber,
        tradeRegistryNumber,
        address,
        city,
        district,
        postalCode,
        website,
        industry,
        employeeCount,
        annualRevenue,
        contactPerson,
        contactPhone,
        contactEmail
      });
    } else {
      // Create new profile
      corporateProfile = await CorporateUser.create({
        userId: req.user.id,
        companyName,
        taxNumber,
        tradeRegistryNumber,
        address,
        city,
        district,
        postalCode,
        website,
        industry,
        employeeCount,
        annualRevenue,
        contactPerson,
        contactPhone,
        contactEmail
      });
    }

    logger.info(`Kurumsal profil güncellendi: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Kurumsal profil başarıyla kaydedildi',
      data: { corporateProfile }
    });
  } catch (error) {
    logger.error('Corporate profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/users/carrier-profile
// @desc    Create/Update carrier profile
// @access  Private
router.post('/carrier-profile', [
  auth,
  authorize('carrier'),
  body('companyName').trim().isLength({ min: 2 }),
  body('taxNumber').isLength({ min: 10, max: 11 }),
  body('address').trim().isLength({ min: 10 }),
  body('city').trim().isLength({ min: 2 }),
  body('district').trim().isLength({ min: 2 }),
  body('phone').isMobilePhone('tr-TR'),
  body('email').isEmail(),
  body('licenseNumber').trim().isLength({ min: 5 }),
  body('licenseExpiry').isISO8601()
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
      companyName,
      taxNumber,
      address,
      city,
      district,
      postalCode,
      phone,
      email,
      website,
      licenseNumber,
      licenseExpiry,
      insuranceNumber,
      insuranceExpiry,
      serviceAreas,
      vehicleTypes
    } = req.body;

    // Check if carrier profile already exists
    let carrierProfile = await Carrier.findOne({
      where: { userId: req.user.id }
    });

    if (carrierProfile) {
      // Update existing profile
      await carrierProfile.update({
        companyName,
        taxNumber,
        address,
        city,
        district,
        postalCode,
        phone,
        email,
        website,
        licenseNumber,
        licenseExpiry,
        insuranceNumber,
        insuranceExpiry,
        serviceAreas,
        vehicleTypes
      });
    } else {
      // Create new profile
      carrierProfile = await Carrier.create({
        userId: req.user.id,
        companyName,
        taxNumber,
        address,
        city,
        district,
        postalCode,
        phone,
        email,
        website,
        licenseNumber,
        licenseExpiry,
        insuranceNumber,
        insuranceExpiry,
        serviceAreas,
        vehicleTypes
      });
    }

    logger.info(`Nakliyeci profili güncellendi: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Nakliyeci profili başarıyla kaydedildi',
      data: { carrierProfile }
    });
  } catch (error) {
    logger.error('Carrier profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/users/driver-profile
// @desc    Create/Update driver profile
// @access  Private
router.post('/driver-profile', [
  auth,
  authorize('logistics'),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('phone').isMobilePhone('tr-TR'),
  body('licenseNumber').trim().isLength({ min: 5 }),
  body('licenseClass').trim().isLength({ min: 1 }),
  body('licenseExpiry').isISO8601(),
  body('identityNumber').isLength({ min: 11, max: 11 }),
  body('address').trim().isLength({ min: 10 }),
  body('city').trim().isLength({ min: 2 }),
  body('district').trim().isLength({ min: 2 }),
  body('birthDate').isISO8601()
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
      carrierId,
      firstName,
      lastName,
      phone,
      email,
      licenseNumber,
      licenseClass,
      licenseExpiry,
      identityNumber,
      address,
      city,
      district,
      postalCode,
      birthDate,
      vehicleTypes
    } = req.body;

    // Check if driver profile already exists
    let driverProfile = await Driver.findOne({
      where: { userId: req.user.id }
    });

    if (driverProfile) {
      // Update existing profile
      await driverProfile.update({
        carrierId,
        firstName,
        lastName,
        phone,
        email,
        licenseNumber,
        licenseClass,
        licenseExpiry,
        identityNumber,
        address,
        city,
        district,
        postalCode,
        birthDate,
        vehicleTypes
      });
    } else {
      // Create new profile
      driverProfile = await Driver.create({
        userId: req.user.id,
        carrierId,
        firstName,
        lastName,
        phone,
        email,
        licenseNumber,
        licenseClass,
        licenseExpiry,
        identityNumber,
        address,
        city,
        district,
        postalCode,
        birthDate,
        vehicleTypes
      });
    }

    logger.info(`Şoför profili güncellendi: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Şoför profili başarıyla kaydedildi',
      data: { driverProfile }
    });
  } catch (error) {
    logger.error('Driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;