const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

// Database connection
const dbPath = path.join(__dirname, '..', 'yolnet.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  }
});

// Commission calculation
router.post('/calculate', (req, res) => {
  const { agreedPrice } = req.body;
  
  if (!agreedPrice || agreedPrice <= 0) {
    return res.status(400).json({ error: 'Geçerli bir fiyat giriniz' });
  }

  const commission_amount = agreedPrice * 0.01; // %1
  const nakliyeci_receives = agreedPrice - commission_amount;

  res.json({
    agreedPrice,
    commissionRate: 0.01,
    commissionAmount: commission_amount,
    nakliyeciReceives: nakliyeci_receives,
    yolnetReceives: commission_amount
  });
});

// Get commission rate
router.get('/rate', (req, res) => {
  res.json({ rate: '1%' });
});

// Get commission examples
router.get('/examples', (req, res) => {
  const examples = [100, 500, 1000, 5000, 10000];
  
  const result = examples.map(price => {
    const commission_amount = price * 0.01;
    return {
      agreedPrice: price,
      nakliyeciReceives: price - commission_amount,
      yolnetCommission: commission_amount,
      percentage: '1%'
    };
  });

  res.json(result);
});

// Get user commissions
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { status } = req.query;

  let query = 'SELECT * FROM commissions WHERE nakliyeci_id = ?';
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(rows);
  });
});

module.exports = router;