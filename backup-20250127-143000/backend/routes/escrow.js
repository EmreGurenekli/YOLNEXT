const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create escrow
router.post('/create', protect, async (req, res) => {
  try {
    res.json({
      message: 'Escrow created successfully',
      escrowId: 'escrow_' + Date.now()
    });
  } catch (error) {
    console.error('Create escrow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


