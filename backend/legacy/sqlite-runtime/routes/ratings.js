const express = require('express');
const router = express.Router();
const rating = require('../models/Rating');
const { authenticateToken } = require('../middleware/auth');

// Puan ver
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { ratedId, shipmentId, rating: ratingValue, comment = '' } = req.body;

    if (
      !ratedId ||
      !shipmentId ||
      !ratingValue ||
      ratingValue < 1 ||
      ratingValue > 5
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Geçerli puan değeri giriniz (1-5)' });
    }

    const result = await rating.createRating(
      userId,
      ratedId,
      shipmentId,
      ratingValue,
      comment
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kullanıcının puanları
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await rating.getUserRatings(userId);
    res.json({ success: true, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kullanıcının ortalama puanı
router.get('/user/:userId/average', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await rating.getUserAverageRating(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Puan dağılımı
router.get('/user/:userId/distribution', async (req, res) => {
  try {
    const { userId } = req.params;

    const distribution = await rating.getRatingDistribution(userId);
    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Gönderi puanları
router.get('/shipment/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const ratings = await rating.getShipmentRatings(shipmentId);
    res.json({ success: true, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Puan güncelle
router.put('/:ratingId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { ratingId } = req.params;
    const { rating: ratingValue, comment = '' } = req.body;

    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      return res
        .status(400)
        .json({ success: false, message: 'Geçerli puan değeri giriniz (1-5)' });
    }

    await rating.updateRating(ratingId, userId, ratingValue, comment);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Puan sil
router.delete('/:ratingId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { ratingId } = req.params;

    await rating.deleteRating(ratingId, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
