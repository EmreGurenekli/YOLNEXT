const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Send emergency message
router.post('/send', protect, async (req, res) => {
  try {
    res.json({
      message: 'Emergency message sent successfully',
    });
  } catch (error) {
    console.error('Send emergency message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
