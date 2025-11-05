const express = require('express');
const router = express.Router();
const { db } = require('../database/init');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Gönderi durumları
const SHIPMENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  BIDDING: 'bidding',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Middleware: Token doğrulama
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token gerekli' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-secret-key',
    (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: 'Geçersiz token' });
      }
      req.user = user;
      next();
    }
  );
};

// 1. Gönderi oluşturma (Bireysel)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      cargoType,
      description,
      estimatedValue,
      sender,
      receiver,
      schedule,
      transport,
      payment,
      communication,
      security,
      notes,
      privacy,
    } = req.body;

    const trackingCode = generateTrackingCode();
    const now = new Date().toISOString();

    const shipmentData = {
      user_id: req.user.id,
      tracking_code: trackingCode,
      cargo_type: cargoType,
      description: description,
      estimated_value: estimatedValue || 0,
      sender_name: sender.name,
      sender_phone: sender.phone,
      sender_email: sender.email || '',
      sender_address: sender.address,
      sender_city: sender.city || '',
      sender_district: sender.district || '',
      sender_postal_code: sender.postalCode || '',
      sender_location_type: sender.locationType || 'ev',
      receiver_name: receiver.name,
      receiver_phone: receiver.phone,
      receiver_email: receiver.email || '',
      receiver_address: receiver.address,
      receiver_city: receiver.city || '',
      receiver_district: receiver.district || '',
      receiver_postal_code: receiver.postalCode || '',
      receiver_location_type: receiver.locationType || 'ev',
      loading_date: schedule.loadingDate,
      delivery_date: schedule.deliveryDate,
      loading_time: schedule.loadingTime || '',
      delivery_time: schedule.deliveryTime || '',
      vehicle_type: transport.vehicleType || 'van',
      weight: transport.weight || 0,
      volume: transport.volume || 0,
      special_instructions: notes.specialInstructions || '',
      status: SHIPMENT_STATUS.DRAFT,
      priority: 'normal',
      created_at: now,
      updated_at: now,
    };

    const sql = `INSERT INTO shipments (
      user_id, tracking_code, cargo_type, description, estimated_value,
      sender_name, sender_phone, sender_email, sender_address, sender_city, sender_district, sender_postal_code, sender_location_type,
      receiver_name, receiver_phone, receiver_email, receiver_address, receiver_city, receiver_district, receiver_postal_code, receiver_location_type,
      loading_date, delivery_date, loading_time, delivery_time,
      vehicle_type, weight, volume, special_instructions,
      status, priority, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      shipmentData.user_id,
      shipmentData.tracking_code,
      shipmentData.cargo_type,
      shipmentData.description,
      shipmentData.estimated_value,
      shipmentData.sender_name,
      shipmentData.sender_phone,
      shipmentData.sender_email,
      shipmentData.sender_address,
      shipmentData.sender_city,
      shipmentData.sender_district,
      shipmentData.sender_postal_code,
      shipmentData.sender_location_type,
      shipmentData.receiver_name,
      shipmentData.receiver_phone,
      shipmentData.receiver_email,
      shipmentData.receiver_address,
      shipmentData.receiver_city,
      shipmentData.receiver_district,
      shipmentData.receiver_postal_code,
      shipmentData.receiver_location_type,
      shipmentData.loading_date,
      shipmentData.delivery_date,
      shipmentData.loading_time,
      shipmentData.delivery_time,
      shipmentData.vehicle_type,
      shipmentData.weight,
      shipmentData.volume,
      shipmentData.special_instructions,
      shipmentData.status,
      shipmentData.priority,
      shipmentData.created_at,
      shipmentData.updated_at,
    ];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Gönderi oluşturma hatası:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      // Göndericiye bildirim oluştur
      createNotification(
        req.user.id,
        'Gönderi Oluşturuldu',
        'Gönderiniz başarıyla oluşturuldu ve taslak olarak kaydedildi.',
        'success'
      );

      res.json({
        success: true,
        shipment: {
          id: this.lastID,
          trackingCode: trackingCode,
          status: SHIPMENT_STATUS.DRAFT,
        },
      });
    });
  } catch (error) {
    console.error('Gönderi oluşturma hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Gönderiyi yayınlama (Aktif hale getirme)
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const now = new Date().toISOString();

    // Gönderinin sahibi olduğunu kontrol et
    db.get(
      'SELECT * FROM shipments WHERE id = ? AND user_id = ?',
      [shipmentId, req.user.id],
      (err, shipment) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        if (!shipment) {
          return res
            .status(404)
            .json({ success: false, message: 'Gönderi bulunamadı' });
        }

        // Durumu güncelle
        db.run(
          'UPDATE shipments SET status = ?, published_at = ?, updated_at = ? WHERE id = ?',
          [SHIPMENT_STATUS.ACTIVE, now, now, shipmentId],
          function (err) {
            if (err) {
              return res
                .status(500)
                .json({ success: false, error: err.message });
            }

            // Nakliyecilere bildirim gönder
            notifyCarriers(shipmentId, shipment.tracking_code);

            // Göndericiye bildirim
            createNotification(
              req.user.id,
              'Gönderi Yayınlandı',
              'Gönderiniz yayınlandı ve nakliyeciler teklif verebilir.',
              'success'
            );

            res.json({ success: true, message: 'Gönderi yayınlandı' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Gönderi yayınlama hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Nakliyeciler için aktif gönderileri listeleme
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, cargoType, fromCity, toCity } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT s.*, u.name as sender_name, u.phone as sender_phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = ?
    `;
    let params = [SHIPMENT_STATUS.ACTIVE];

    if (cargoType) {
      sql += ' AND s.cargo_type = ?';
      params.push(cargoType);
    }
    if (fromCity) {
      sql += ' AND s.sender_city LIKE ?';
      params.push(`%${fromCity}%`);
    }
    if (toCity) {
      sql += ' AND s.receiver_city LIKE ?';
      params.push(`%${toCity}%`);
    }

    sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, shipments) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      // Toplam sayıyı al
      let countSql = 'SELECT COUNT(*) as total FROM shipments WHERE status = ?';
      let countParams = [SHIPMENT_STATUS.ACTIVE];

      if (cargoType) {
        countSql += ' AND cargo_type = ?';
        countParams.push(cargoType);
      }
      if (fromCity) {
        countSql += ' AND sender_city LIKE ?';
        countParams.push(`%${fromCity}%`);
      }
      if (toCity) {
        countSql += ' AND receiver_city LIKE ?';
        countParams.push(`%${toCity}%`);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }

        res.json({
          success: true,
          shipments: shipments.map(shipment => ({
            id: shipment.id,
            trackingCode: shipment.tracking_code,
            cargoType: shipment.cargo_type,
            description: shipment.description,
            sender: {
              name: shipment.sender_name,
              city: shipment.sender_city,
            },
            receiver: {
              name: shipment.receiver_name,
              city: shipment.receiver_city,
            },
            schedule: {
              loadingDate: shipment.loading_date,
              deliveryDate: shipment.delivery_date,
            },
            estimatedValue: shipment.estimated_value,
            status: shipment.status,
            createdAt: shipment.created_at,
          })),
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(countResult.total / limit),
            total: countResult.total,
          },
        });
      });
    });
  } catch (error) {
    console.error('Aktif gönderiler listeleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Teklif verme (Nakliyeci)
router.post('/:id/offer', authenticateToken, async (req, res) => {
  try {
    const { price, estimatedDays, notes, vehicleType } = req.body;
    const shipmentId = req.params.id;
    const carrierId = req.user.id;
    const now = new Date().toISOString();

    // Teklif oluştur
    const sql = `INSERT INTO offers (
      shipment_id, nakliyeci_id, price, estimated_delivery, message, vehicle_type, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`;

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);

    db.run(
      sql,
      [
        shipmentId,
        carrierId,
        price,
        estimatedDelivery.toISOString(),
        notes,
        vehicleType,
        now,
        now,
      ],
      function (err) {
        if (err) {
          console.error('Teklif oluşturma hatası:', err);
          return res.status(500).json({ success: false, error: err.message });
        }

        // Gönderi durumunu güncelle
        db.run(
          'UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?',
          [SHIPMENT_STATUS.BIDDING, now, shipmentId],
          err => {
            if (err) {
              console.error('Gönderi durumu güncelleme hatası:', err);
            }

            // Göndericiye bildirim
            createNotification(
              shipmentId,
              'Yeni Teklif Geldi',
              'Gönderiniz için yeni teklif alındı.',
              'info'
            );

            res.json({ success: true, offerId: this.lastID });
          }
        );
      }
    );
  } catch (error) {
    console.error('Teklif verme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Teklifleri listeleme (Gönderici)
router.get('/:id/offers', authenticateToken, async (req, res) => {
  try {
    const shipmentId = req.params.id;

    const sql = `
      SELECT o.*, u.name as carrier_name, u.company_name, u.rating, u.total_jobs, u.completed_jobs
      FROM offers o
      JOIN users u ON o.nakliyeci_id = u.id
      WHERE o.shipment_id = ?
      ORDER BY o.created_at DESC
    `;

    db.all(sql, [shipmentId], (err, offers) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        offers: offers.map(offer => ({
          id: offer.id,
          price: offer.price,
          estimatedDays: Math.ceil(
            (new Date(offer.estimated_delivery) - new Date()) /
              (1000 * 60 * 60 * 24)
          ),
          notes: offer.message,
          vehicleType: offer.vehicle_type,
          status: offer.status,
          carrier: {
            name: offer.carrier_name,
            companyName: offer.company_name,
            rating: offer.rating,
            totalJobs: offer.total_jobs,
            completedJobs: offer.completed_jobs,
          },
          createdAt: offer.created_at,
        })),
      });
    });
  } catch (error) {
    console.error('Teklifler listeleme hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Teklif kabul etme (Gönderici)
router.post(
  '/:id/accept-offer/:offerId',
  authenticateToken,
  async (req, res) => {
    try {
      const { offerId } = req.params;
      const shipmentId = req.params.id;
      const now = new Date().toISOString();

      // Teklifi kabul et
      db.run(
        'UPDATE offers SET status = ?, accepted_at = ? WHERE id = ?',
        ['accepted', now, offerId],
        err => {
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }

          // Diğer teklifleri reddet
          db.run(
            'UPDATE offers SET status = ?, rejected_at = ? WHERE shipment_id = ? AND id != ?',
            ['rejected', now, shipmentId, offerId],
            err => {
              if (err) {
                console.error('Diğer teklifleri reddetme hatası:', err);
              }

              // Gönderi durumunu güncelle
              db.run(
                'UPDATE shipments SET status = ?, accepted_offer_id = ?, updated_at = ? WHERE id = ?',
                [SHIPMENT_STATUS.ACCEPTED, offerId, now, shipmentId],
                err => {
                  if (err) {
                    return res
                      .status(500)
                      .json({ success: false, error: err.message });
                  }

                  // Nakliyeciye bildirim
                  db.get(
                    'SELECT nakliyeci_id FROM offers WHERE id = ?',
                    [offerId],
                    (err, offer) => {
                      if (!err && offer) {
                        createNotification(
                          offer.nakliyeci_id,
                          'Teklifiniz Kabul Edildi',
                          'Gönderi için verdiğiniz teklif kabul edildi.',
                          'success'
                        );
                      }
                    }
                  );

                  res.json({ success: true });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      console.error('Teklif kabul etme hatası:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// 7. Gönderi takibi (Herkes)
router.get('/:id/track', authenticateToken, async (req, res) => {
  try {
    const shipmentId = req.params.id;

    const sql = `
      SELECT s.*, u.name as sender_name, u.phone as sender_phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `;

    db.get(sql, [shipmentId], (err, shipment) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!shipment) {
        return res
          .status(404)
          .json({ success: false, message: 'Gönderi bulunamadı' });
      }

      res.json({
        success: true,
        shipment: {
          id: shipment.id,
          trackingCode: shipment.tracking_code,
          status: shipment.status,
          cargoType: shipment.cargo_type,
          description: shipment.description,
          sender: {
            name: shipment.sender_name,
            phone: shipment.sender_phone,
            address: shipment.sender_address,
            city: shipment.sender_city,
          },
          receiver: {
            name: shipment.receiver_name,
            phone: shipment.receiver_phone,
            address: shipment.receiver_address,
            city: shipment.receiver_city,
          },
          schedule: {
            loadingDate: shipment.loading_date,
            deliveryDate: shipment.delivery_date,
          },
          specialInstructions: shipment.special_instructions,
          createdAt: shipment.created_at,
          updatedAt: shipment.updated_at,
        },
      });
    });
  } catch (error) {
    console.error('Gönderi takip hatası:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Yardımcı fonksiyonlar
function generateTrackingCode() {
  return 'YN' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function createNotification(userId, title, message, type) {
  const sql = `INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?)`;
  const now = new Date().toISOString();

  db.run(sql, [userId, title, message, type, now], err => {
    if (err) {
      console.error('Bildirim oluşturma hatası:', err);
    }
  });
}

function notifyCarriers(shipmentId, trackingCode) {
  // Nakliyecilere bildirim gönder
  const sql = `SELECT id FROM users WHERE panel_type = 'nakliyeci'`;

  db.all(sql, [], (err, carriers) => {
    if (err) {
      console.error('Nakliyeci listesi alma hatası:', err);
      return;
    }

    carriers.forEach(carrier => {
      createNotification(
        carrier.id,
        'Yeni Gönderi',
        `${trackingCode} takip kodlu yeni gönderi yayınlandı.`,
        'info'
      );
    });
  });
}

module.exports = router;
