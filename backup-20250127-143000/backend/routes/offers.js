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

// Teklif verme
router.post('/', authenticateToken, (req, res) => {
  const { shipment_id, price, message, estimated_delivery } = req.body;
  const nakliyeci_id = req.user.userId;

  if (!shipment_id || !price) {
    return res.status(400).json({ error: 'Gönderi ID ve fiyat gereklidir' });
  }

  // Gönderi var mı kontrol et
  db.get('SELECT * FROM shipments WHERE id = ?', [shipment_id], (err, shipment) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (!shipment) {
      return res.status(404).json({ error: 'Gönderi bulunamadı' });
    }

    // Daha önce teklif verilmiş mi kontrol et
    db.get(
      'SELECT * FROM offers WHERE shipment_id = ? AND nakliyeci_id = ?',
      [shipment_id, nakliyeci_id],
      (err, existingOffer) => {
        if (err) {
          return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        if (existingOffer) {
          return res.status(400).json({ error: 'Bu gönderi için zaten teklif verdiniz' });
        }

        // Teklif oluştur
        db.run(
          `INSERT INTO offers (shipment_id, nakliyeci_id, price, message, estimated_delivery, status, created_at) 
           VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
          [shipment_id, nakliyeci_id, price, message || '', estimated_delivery || null],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Teklif oluşturulamadı' });
            }

            res.status(201).json({
              id: this.lastID,
              shipment_id,
              nakliyeci_id,
              price,
              message,
              estimated_delivery,
              status: 'pending',
              created_at: new Date().toISOString()
            });
          }
        );
      }
    );
  });
});

// Gönderi tekliflerini getir (gönderen için)
router.get('/shipment/:shipment_id', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const user_id = req.user.userId;

  // Gönderi sahibi mi kontrol et
  db.get('SELECT * FROM shipments WHERE id = ? AND user_id = ?', [shipment_id, user_id], (err, shipment) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (!shipment) {
      return res.status(404).json({ error: 'Gönderi bulunamadı veya yetkiniz yok' });
    }

    // Teklifleri getir
    db.all(
      `SELECT o.*, u.name as nakliyeci_name, u.company_name, u.location, u.phone, u.avatar
       FROM offers o
       JOIN users u ON o.nakliyeci_id = u.id
       WHERE o.shipment_id = ?
       ORDER BY o.created_at DESC`,
      [shipment_id],
      (err, offers) => {
        if (err) {
          return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(offers);
      }
    );
  });
});

// Nakliyeci tekliflerini getir
router.get('/nakliyeci', authenticateToken, (req, res) => {
  const nakliyeci_id = req.user.userId;
  const { status } = req.query;

  let query = `
    SELECT o.*, s.title, s.description, s.from_location, s.to_location, s.weight, s.volume,
           u.name as sender_name, u.company_name as sender_company
    FROM offers o
    JOIN shipments s ON o.shipment_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE o.nakliyeci_id = ?
  `;
  const params = [nakliyeci_id];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC';

  db.all(query, params, (err, offers) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    res.json(offers);
  });
});

// Teklif onaylama (gönderen)
router.put('/:offer_id/accept', authenticateToken, (req, res) => {
  const { offer_id } = req.params;
  const user_id = req.user.userId;

  // Teklif var mı ve gönderi sahibi mi kontrol et
  db.get(
    `SELECT o.*, s.user_id as shipment_owner
     FROM offers o
     JOIN shipments s ON o.shipment_id = s.id
     WHERE o.id = ? AND s.user_id = ?`,
    [offer_id, user_id],
    (err, offer) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!offer) {
        return res.status(404).json({ error: 'Teklif bulunamadı veya yetkiniz yok' });
      }
      if (offer.status !== 'pending') {
        return res.status(400).json({ error: 'Bu teklif zaten işlenmiş' });
      }

      // Teklifi onayla
      db.run(
        'UPDATE offers SET status = ? WHERE id = ?',
        ['accepted', offer_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Teklif onaylanamadı' });
          }

          // Diğer teklifleri reddet
          db.run(
            'UPDATE offers SET status = ? WHERE shipment_id = ? AND id != ?',
            ['rejected', offer.shipment_id, offer_id],
            (err) => {
              if (err) {
                console.error('Diğer teklifler reddedilemedi:', err);
              }
            }
          );

          // Gönderi durumunu güncelle
          db.run(
            'UPDATE shipments SET status = ? WHERE id = ?',
            ['accepted', offer.shipment_id],
            (err) => {
              if (err) {
                console.error('Gönderi durumu güncellenemedi:', err);
              }
            }
          );

          res.json({ message: 'Teklif onaylandı', offer_id });
        }
      );
    }
  );
});

// Teklif reddetme (gönderen)
router.put('/:offer_id/reject', authenticateToken, (req, res) => {
  const { offer_id } = req.params;
  const user_id = req.user.userId;

  // Teklif var mı ve gönderi sahibi mi kontrol et
  db.get(
    `SELECT o.*, s.user_id as shipment_owner
     FROM offers o
     JOIN shipments s ON o.shipment_id = s.id
     WHERE o.id = ? AND s.user_id = ?`,
    [offer_id, user_id],
    (err, offer) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!offer) {
        return res.status(404).json({ error: 'Teklif bulunamadı veya yetkiniz yok' });
      }
      if (offer.status !== 'pending') {
        return res.status(400).json({ error: 'Bu teklif zaten işlenmiş' });
      }

      // Teklifi reddet
      db.run(
        'UPDATE offers SET status = ? WHERE id = ?',
        ['rejected', offer_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Teklif reddedilemedi' });
          }

          res.json({ message: 'Teklif reddedildi', offer_id });
        }
      );
    }
  );
});

// Teklif güncelleme (nakliyeci)
router.put('/:offer_id', authenticateToken, (req, res) => {
  const { offer_id } = req.params;
  const { price, message, estimated_delivery } = req.body;
  const nakliyeci_id = req.user.userId;

  // Teklif sahibi mi kontrol et
  db.get('SELECT * FROM offers WHERE id = ? AND nakliyeci_id = ?', [offer_id, nakliyeci_id], (err, offer) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (!offer) {
      return res.status(404).json({ error: 'Teklif bulunamadı veya yetkiniz yok' });
    }
    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Bu teklif artık güncellenemez' });
    }

    // Teklifi güncelle
    db.run(
      'UPDATE offers SET price = ?, message = ?, estimated_delivery = ? WHERE id = ?',
      [price, message, estimated_delivery, offer_id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Teklif güncellenemedi' });
        }

        res.json({ message: 'Teklif güncellendi', offer_id });
      }
    );
  });
});

// Teklif silme (nakliyeci)
router.delete('/:offer_id', authenticateToken, (req, res) => {
  const { offer_id } = req.params;
  const nakliyeci_id = req.user.userId;

  // Teklif sahibi mi kontrol et
  db.get('SELECT * FROM offers WHERE id = ? AND nakliyeci_id = ?', [offer_id, nakliyeci_id], (err, offer) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (!offer) {
      return res.status(404).json({ error: 'Teklif bulunamadı veya yetkiniz yok' });
    }
    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Bu teklif silinemez' });
    }

    // Teklifi sil
    db.run('DELETE FROM offers WHERE id = ?', [offer_id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Teklif silinemedi' });
      }

      res.json({ message: 'Teklif silindi', offer_id });
    });
  });
});

module.exports = router;