const express = require('express');
const router = express.Router();
const IndividualUser = require('../models/IndividualUser');
const { authenticateToken, requireUserType } = require('../middleware/auth');

// Profil bilgilerini getir
router.get('/profile', authenticateToken, requireUserType(['individual']), async (req, res) => {
  try {
    const profile = await IndividualUser.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil bulunamadı'
      });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil bilgileri alınırken hata oluştu',
      error: error.message
    });
  }
});

// Profil güncelleme
router.put('/profile', authenticateToken, requireUserType(['individual']), async (req, res) => {
  try {
    const profile = await IndividualUser.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Profil güncellendi',
      data: profile
    });

  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// İstatistikleri getir
router.get('/stats', authenticateToken, requireUserType(['individual']), async (req, res) => {
  try {
    const profile = await IndividualUser.findOne({ userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profil bulunamadı'
      });
    }

    res.json({
      success: true,
      data: profile.stats
    });

  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;







