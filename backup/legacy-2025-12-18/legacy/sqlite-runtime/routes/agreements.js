const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

// Database connection
const dbPath = path.join(__dirname, '..', 'YolNext.db');
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Database connection error:', err.message);
  }
});

// Anlaşma oluşturma (teklif onaylandıktan sonra)
router.post('/', authenticateToken, (req, res) => {
  const { offer_id } = req.body;
  const user_id = req.user.userId;

  if (!offer_id) {
    return res.status(400).json({ error: 'Teklif ID gereklidir' });
  }

  // Onaylanmış teklif var mı kontrol et
  db.get(
    `SELECT o.*, s.user_id as shipment_owner, s.title, s.from_location, s.to_location
     FROM offers o
     JOIN shipments s ON o.shipment_id = s.id
     WHERE o.id = ? AND o.status = 'accepted' AND s.user_id = ?`,
    [offer_id, user_id],
    (err, offer) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!offer) {
        return res.status(404).json({ error: 'Onaylanmış teklif bulunamadı' });
      }

      // Zaten anlaşma var mı kontrol et
      db.get(
        'SELECT * FROM agreements WHERE offer_id = ?',
        [offer_id],
        (err, existingAgreement) => {
          if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
          }
          if (existingAgreement) {
            return res
              .status(400)
              .json({ error: 'Bu teklif için zaten anlaşma yapılmış' });
          }

          // Komisyon hesapla (%1)
          const commission_amount = offer.price * 0.01;
          const nakliyeci_receives = offer.price - commission_amount;

          // Anlaşma oluştur
          db.run(
            `INSERT INTO agreements (offer_id, shipment_id, sender_id, nakliyeci_id, agreed_price, 
             commission_amount, nakliyeci_receives, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
            [
              offer_id,
              offer.shipment_id,
              user_id,
              offer.nakliyeci_id,
              offer.price,
              commission_amount,
              nakliyeci_receives,
            ],
            function (err) {
              if (err) {
                return res
                  .status(500)
                  .json({ error: 'Anlaşma oluşturulamadı' });
              }

              // Komisyon kaydı oluştur
              db.run(
                `INSERT INTO commissions (agreement_id, shipment_id, nakliyeci_id, agreed_price, 
                 commission_amount, nakliyeci_receives, status, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
                [
                  this.lastID,
                  offer.shipment_id,
                  offer.nakliyeci_id,
                  offer.price,
                  commission_amount,
                  nakliyeci_receives,
                ],
                err => {
                  if (err) {
                    console.error('Komisyon kaydı oluşturulamadı:', err);
                  }
                }
              );

              res.status(201).json({
                id: this.lastID,
                offer_id,
                shipment_id: offer.shipment_id,
                sender_id: user_id,
                nakliyeci_id: offer.nakliyeci_id,
                agreed_price: offer.price,
                commission_amount,
                nakliyeci_receives,
                status: 'pending',
                created_at: new Date().toISOString(),
              });
            }
          );
        }
      );
    }
  );
});

// Anlaşma onaylama (nakliyeci)
router.put('/:agreement_id/accept', authenticateToken, (req, res) => {
  const { agreement_id } = req.params;
  const nakliyeci_id = req.user.userId;

  // Anlaşma var mı ve nakliyeci mi kontrol et
  db.get(
    'SELECT * FROM agreements WHERE id = ? AND nakliyeci_id = ?',
    [agreement_id, nakliyeci_id],
    (err, agreement) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!agreement) {
        return res
          .status(404)
          .json({ error: 'Anlaşma bulunamadı veya yetkiniz yok' });
      }
      if (agreement.status !== 'pending') {
        return res.status(400).json({ error: 'Bu anlaşma zaten işlenmiş' });
      }

      // Anlaşmayı onayla
      db.run(
        'UPDATE agreements SET status = ? WHERE id = ?',
        ['accepted', agreement_id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Anlaşma onaylanamadı' });
          }

          // Gönderi durumunu güncelle
          db.run(
            'UPDATE shipments SET status = ? WHERE id = ?',
            ['in_progress', agreement.shipment_id],
            err => {
              if (err) {
                console.error('Gönderi durumu güncellenemedi:', err);
              }
            }
          );

          // Komisyon durumunu güncelle
          db.run(
            'UPDATE commissions SET status = ? WHERE agreement_id = ?',
            ['accepted', agreement_id],
            err => {
              if (err) {
                console.error('Komisyon durumu güncellenemedi:', err);
              }
            }
          );

          res.json({ message: 'Anlaşma onaylandı', agreement_id });
        }
      );
    }
  );
});

// Anlaşma reddetme (nakliyeci)
router.put('/:agreement_id/reject', authenticateToken, (req, res) => {
  const { agreement_id } = req.params;
  const nakliyeci_id = req.user.userId;

  // Anlaşma var mı ve nakliyeci mi kontrol et
  db.get(
    'SELECT * FROM agreements WHERE id = ? AND nakliyeci_id = ?',
    [agreement_id, nakliyeci_id],
    (err, agreement) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!agreement) {
        return res
          .status(404)
          .json({ error: 'Anlaşma bulunamadı veya yetkiniz yok' });
      }
      if (agreement.status !== 'pending') {
        return res.status(400).json({ error: 'Bu anlaşma zaten işlenmiş' });
      }

      // Anlaşmayı reddet
      db.run(
        'UPDATE agreements SET status = ? WHERE id = ?',
        ['rejected', agreement_id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Anlaşma reddedilemedi' });
          }

          // Gönderi durumunu güncelle
          db.run(
            'UPDATE shipments SET status = ? WHERE id = ?',
            ['pending', agreement.shipment_id],
            err => {
              if (err) {
                console.error('Gönderi durumu güncellenemedi:', err);
              }
            }
          );

          res.json({ message: 'Anlaşma reddedildi', agreement_id });
        }
      );
    }
  );
});

// Gönderen anlaşmalarını getir
router.get('/sender', authenticateToken, (req, res) => {
  const sender_id = req.user.userId;
  const { status } = req.query;

  let query = `
    SELECT a.*, s.title, s.from_location, s.to_location, s.weight, s.volume,
           u.name as nakliyeci_name, u.company_name, u.phone, u.avatar
    FROM agreements a
    JOIN shipments s ON a.shipment_id = s.id
    JOIN users u ON a.nakliyeci_id = u.id
    WHERE a.sender_id = ?
  `;
  const params = [sender_id];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  query += ' ORDER BY a.created_at DESC';

  db.all(query, params, (err, agreements) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(agreements);
  });
});

// Nakliyeci anlaşmalarını getir
router.get('/nakliyeci', authenticateToken, (req, res) => {
  const nakliyeci_id = req.user.userId;
  const { status } = req.query;

  let query = `
    SELECT a.*, s.title, s.from_location, s.to_location, s.weight, s.volume,
           u.name as sender_name, u.company_name as sender_company, u.phone as sender_phone
    FROM agreements a
    JOIN shipments s ON a.shipment_id = s.id
    JOIN users u ON a.sender_id = u.id
    WHERE a.nakliyeci_id = ?
  `;
  const params = [nakliyeci_id];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  query += ' ORDER BY a.created_at DESC';

  db.all(query, params, (err, agreements) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(agreements);
  });
});

// Anlaşma detayı getir
router.get('/:agreement_id', authenticateToken, (req, res) => {
  const { agreement_id } = req.params;
  const user_id = req.user.userId;

  db.get(
    `SELECT a.*, s.title, s.description, s.from_location, s.to_location, s.weight, s.volume,
            u1.name as sender_name, u1.company_name as sender_company, u1.phone as sender_phone,
            u2.name as nakliyeci_name, u2.company_name as nakliyeci_company, u2.phone as nakliyeci_phone
     FROM agreements a
     JOIN shipments s ON a.shipment_id = s.id
     JOIN users u1 ON a.sender_id = u1.id
     JOIN users u2 ON a.nakliyeci_id = u2.id
     WHERE a.id = ? AND (a.sender_id = ? OR a.nakliyeci_id = ?)`,
    [agreement_id, user_id, user_id],
    (err, agreement) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!agreement) {
        return res
          .status(404)
          .json({ error: 'Anlaşma bulunamadı veya yetkiniz yok' });
      }
      res.json(agreement);
    }
  );
});

module.exports = router;
