const express = require('express');
const router = express.Router();
const wallet = require('../models/Wallet');
const { authenticateToken } = require('../middleware/auth');

// Cüzdan oluştur
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { initialBalance = 0 } = req.body;

    const result = await wallet.createWallet(userId, initialBalance);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cüzdan bakiyesi
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const balance = await wallet.getBalance(userId);
    res.json({ success: true, balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Para yatır
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, paymentMethod = 'credit_card' } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Geçerli bir miktar giriniz' });
    }

    const result = await wallet.deposit(userId, amount, paymentMethod);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// İşlem geçmişi
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 50 } = req.query;

    const transactions = await wallet.getTransactionHistory(userId, limit);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
