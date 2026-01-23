const express = require('express');
const router = express.Router();
const Carrier = require('../models/Carrier');
const { authenticateToken, requireUserType } = require('../middleware/auth');

// Profil bilgilerini getir
router.get(
  '/profile',
  authenticateToken,
  requireUserType(['carrier']),
  async (req, res) => {
    try {
      const profile = await Carrier.findOne({ userId: req.user._id });

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
  requireUserType(['carrier']),
  async (req, res) => {
    try {
      const profile = await Carrier.findOneAndUpdate(
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

// Cüzdan bilgilerini getir
router.get(
  '/wallet',
  authenticateToken,
  requireUserType(['carrier']),
  async (req, res) => {
    try {
      const carrier = await Carrier.findOne({ userId: req.user._id });

      if (!carrier) {
        return res.status(404).json({
          success: false,
          message: 'Nakliyeci profili bulunamadı',
        });
      }

      res.json({
        success: true,
        data: carrier.wallet,
      });
    } catch (error) {
      console.error('Cüzdan getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Cüzdan bilgileri alınırken hata oluştu',
        error: error.message,
      });
    }
  }
);

// Cüzdan yükleme
router.post(
  '/wallet/deposit',
  authenticateToken,
  requireUserType(['carrier']),
  async (req, res) => {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir miktar giriniz',
        });
      }

      const carrier = await Carrier.findOne({ userId: req.user._id });

      if (!carrier) {
        return res.status(404).json({
          success: false,
          message: 'Nakliyeci profili bulunamadı',
        });
      }

      carrier.wallet.balance += amount;
      await carrier.save();

      res.json({
        success: true,
        message: 'Cüzdan yüklendi',
        data: carrier.wallet,
      });
    } catch (error) {
      console.error('Cüzdan yükleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Cüzdan yüklenirken hata oluştu',
        error: error.message,
      });
    }
  }
);

module.exports = router;
