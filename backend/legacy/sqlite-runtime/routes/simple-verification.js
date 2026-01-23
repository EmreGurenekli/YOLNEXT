const express = require('express');
const router = express.Router();

// GET /api/verify - Verification durumunu kontrol et
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: { verified: true },
      message: 'Verification başarılı',
    });
  } catch (error) {
    console.error('Verification GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification hatası',
      message: error.message,
    });
  }
});

module.exports = router;
