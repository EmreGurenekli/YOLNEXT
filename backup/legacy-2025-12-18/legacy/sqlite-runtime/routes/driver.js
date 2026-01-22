const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { authenticateToken, requireUserType } = require('../middleware/auth');

// Profil bilgilerini getir
router.get(
  '/profile',
  authenticateToken,
  requireUserType(['driver']),
  async (req, res) => {
    try {
      const profile = await Driver.findOne({ userId: req.user._id });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profil bulunamadı',
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Profil getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Profil bilgileri alınırken hata oluştu',
        error: error.message,
      });
    }
  }
);

// Profil güncelleme
router.put(
  '/profile',
  authenticateToken,
  requireUserType(['driver']),
  async (req, res) => {
    try {
      const profile = await Driver.findOneAndUpdate(
        { userId: req.user._id },
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profil bulunamadı',
        });
      }

      res.json({
        success: true,
        message: 'Profil güncellendi',
        data: profile,
      });
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Profil güncellenirken hata oluştu',
        error: error.message,
      });
    }
  }
);

// İstatistikleri getir
router.get(
  '/stats',
  authenticateToken,
  requireUserType(['driver']),
  async (req, res) => {
    try {
      const profile = await Driver.findOne({ userId: req.user._id });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profil bulunamadı',
        });
      }

      res.json({
        success: true,
        data: profile.stats,
      });
    } catch (error) {
      console.error('İstatistik getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınırken hata oluştu',
        error: error.message,
      });
    }
  }
);

// Durum güncelleme (müsait/müsait değil)
router.put(
  '/status',
  authenticateToken,
  requireUserType(['driver']),
  async (req, res) => {
    try {
      const { isAvailable } = req.body;

      const driver = await Driver.findOneAndUpdate(
        { userId: req.user._id },
        { isAvailable, updatedAt: new Date() },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Sürücü profili bulunamadı',
        });
      }

      res.json({
        success: true,
        message: 'Durum güncellendi',
        data: { isAvailable: driver.isAvailable },
      });
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Durum güncellenirken hata oluştu',
        error: error.message,
      });
    }
  }
);

module.exports = router;
