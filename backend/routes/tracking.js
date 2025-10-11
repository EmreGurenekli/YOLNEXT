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

// Gönderi durumu güncelleme (nakliyeci)
router.put('/:shipment_id/status', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const { status, location, notes, image_url } = req.body;
  const user_id = req.user.userId;

  const validStatuses = ['picked_up', 'in_transit', 'delivered', 'delayed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum' });
  }

  // Gönderi var mı ve nakliyeci yetkisi var mı kontrol et
  db.get(
    `SELECT s.*, a.nakliyeci_id 
     FROM shipments s
     LEFT JOIN agreements a ON s.id = a.shipment_id
     WHERE s.id = ? AND (s.user_id = ? OR a.nakliyeci_id = ?)`,
    [shipment_id, user_id, user_id],
    (err, shipment) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!shipment) {
        return res.status(404).json({ error: 'Gönderi bulunamadı veya yetkiniz yok' });
      }

      // Durum güncelleme kaydı oluştur
      db.run(
        `INSERT INTO tracking_updates (shipment_id, status, location, notes, image_url, updated_by, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [shipment_id, status, location || '', notes || '', image_url || '', user_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Durum güncellenemedi' });
          }

          // Gönderi durumunu güncelle
          db.run(
            'UPDATE shipments SET status = ? WHERE id = ?',
            [status, shipment_id],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Gönderi durumu güncellenemedi' });
              }

              // Teslimat onaylandıysa komisyonu kes
              if (status === 'delivered') {
                db.get(
                  'SELECT * FROM commissions WHERE shipment_id = ? AND status = "accepted"',
                  [shipment_id],
                  (err, commission) => {
                    if (err) {
                      console.error('Komisyon bulunamadı:', err);
                    } else if (commission) {
                      // Komisyonu kes (nakliyeci cüzdanından düş)
                      db.run(
                        'UPDATE commissions SET status = "completed" WHERE id = ?',
                        [commission.id],
                        (err) => {
                          if (err) {
                            console.error('Komisyon tamamlanamadı:', err);
                          }
                        }
                      );
                    }
                  }
                );
              }

              res.json({ 
                message: 'Durum güncellendi', 
                shipment_id, 
                status,
                tracking_id: this.lastID
              });
            }
          );
        }
      );
    }
  );
});

// Gönderi takip geçmişi getir
router.get('/:shipment_id/history', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const user_id = req.user.userId;

  // Gönderi yetkisi var mı kontrol et
  db.get(
    `SELECT s.*, a.nakliyeci_id 
     FROM shipments s
     LEFT JOIN agreements a ON s.id = a.shipment_id
     WHERE s.id = ? AND (s.user_id = ? OR a.nakliyeci_id = ?)`,
    [shipment_id, user_id, user_id],
    (err, shipment) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!shipment) {
        return res.status(404).json({ error: 'Gönderi bulunamadı veya yetkiniz yok' });
      }

      // Takip geçmişini getir
      db.all(
        `SELECT tu.*, u.name as updated_by_name, u.company_name
         FROM tracking_updates tu
         LEFT JOIN users u ON tu.updated_by = u.id
         WHERE tu.shipment_id = ?
         ORDER BY tu.created_at ASC`,
        [shipment_id],
        (err, updates) => {
          if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
          }
          res.json(updates);
        }
      );
    }
  );
});

// Aktif gönderileri getir (nakliyeci için)
router.get('/nakliyeci/active', authenticateToken, (req, res) => {
  const nakliyeci_id = req.user.userId;

  db.all(
    `SELECT s.*, a.agreed_price, a.commission_amount, a.nakliyeci_receives,
            u.name as sender_name, u.company_name as sender_company, u.phone as sender_phone
     FROM shipments s
     JOIN agreements a ON s.id = a.shipment_id
     JOIN users u ON s.user_id = u.id
     WHERE a.nakliyeci_id = ? AND s.status IN ('in_progress', 'picked_up', 'in_transit')
     ORDER BY s.created_at DESC`,
    [nakliyeci_id],
    (err, shipments) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json(shipments);
    }
  );
});

// Gönderen aktif gönderileri getir
router.get('/sender/active', authenticateToken, (req, res) => {
  const sender_id = req.user.userId;

  db.all(
    `SELECT s.*, a.agreed_price, a.commission_amount, a.nakliyeci_receives,
            u.name as nakliyeci_name, u.company_name as nakliyeci_company, u.phone as nakliyeci_phone
     FROM shipments s
     JOIN agreements a ON s.id = a.shipment_id
     JOIN users u ON a.nakliyeci_id = u.id
     WHERE s.user_id = ? AND s.status IN ('in_progress', 'picked_up', 'in_transit')
     ORDER BY s.created_at DESC`,
    [sender_id],
    (err, shipments) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      res.json(shipments);
    }
  );
});

// Gerçek zamanlı takip (WebSocket için)
router.get('/:shipment_id/live', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const user_id = req.user.userId;

  // Gönderi yetkisi var mı kontrol et
  db.get(
    `SELECT s.*, a.nakliyeci_id 
     FROM shipments s
     LEFT JOIN agreements a ON s.id = a.shipment_id
     WHERE s.id = ? AND (s.user_id = ? OR a.nakliyeci_id = ?)`,
    [shipment_id, user_id, user_id],
    (err, shipment) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!shipment) {
        return res.status(404).json({ error: 'Gönderi bulunamadı veya yetkiniz yok' });
      }

      // Son durumu getir
      db.get(
        `SELECT * FROM tracking_updates 
         WHERE shipment_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [shipment_id],
        (err, lastUpdate) => {
          if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
          }

          res.json({
            shipment_id,
            current_status: shipment.status,
            last_update: lastUpdate,
            tracking_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tracking/${shipment_id}`
          });
        }
      );
    }
  );
});

// Teslimat onaylama (gönderen)
router.put('/:shipment_id/deliver', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const { rating, feedback } = req.body;
  const user_id = req.user.userId;

  // Gönderi sahibi mi kontrol et
  db.get('SELECT * FROM shipments WHERE id = ? AND user_id = ?', [shipment_id, user_id], (err, shipment) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }
    if (!shipment) {
      return res.status(404).json({ error: 'Gönderi bulunamadı veya yetkiniz yok' });
    }
    if (shipment.status !== 'delivered') {
      return res.status(400).json({ error: 'Gönderi henüz teslim edilmedi' });
    }

    // Teslimat onayı kaydet
    db.run(
      `INSERT INTO delivery_confirmations (shipment_id, rating, feedback, confirmed_by, created_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [shipment_id, rating || 5, feedback || '', user_id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Teslimat onayı kaydedilemedi' });
        }

        // Gönderi durumunu tamamlandı olarak güncelle
        db.run(
          'UPDATE shipments SET status = ? WHERE id = ?',
          ['completed', shipment_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Gönderi durumu güncellenemedi' });
            }

            res.json({ message: 'Teslimat onaylandı', shipment_id });
          }
        );
      }
    );
  });
});

module.exports = router;
