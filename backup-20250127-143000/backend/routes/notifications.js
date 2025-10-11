const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Bildirimleri listeleme
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Mock bildirim verileri - gerçek uygulamada veritabanından gelecek
    const notifications = [
      {
        id: 1,
        title: 'Yeni Teklif',
        message: 'Gönderiniz için yeni bir teklif alındı',
        type: 'offer',
        isRead: false,
        createdAt: new Date()
      },
      {
        id: 2,
        title: 'Teklif Kabul Edildi',
        message: 'Verdiğiniz teklif kabul edildi',
        type: 'success',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: 3,
        title: 'Gönderi Güncellendi',
        message: 'Gönderinizin durumu güncellendi',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 7200000)
      }
    ];

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Bildirim listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Bildirimi okundu olarak işaretleme
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    // Mock işlem - gerçek uygulamada veritabanında güncellenecek
    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi'
    });

  } catch (error) {
    console.error('Bildirim okundu işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// Tüm bildirimleri okundu olarak işaretleme
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    // Mock işlem - gerçek uygulamada veritabanında güncellenecek
    res.json({
      success: true,
      message: 'Tüm bildirimler okundu olarak işaretlendi'
    });

  } catch (error) {
    console.error('Tüm bildirimleri okundu işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler güncellenirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;