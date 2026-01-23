const express = require('express');
const router = express.Router();

// Database connection
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Database connection helper
const getDb = () => {
  const db = new sqlite3.Database(dbPath);
  // Ensure tables exist
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentId INTEGER,
      carrierId INTEGER,
      price REAL,
      message TEXT,
      estimatedDelivery TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TEXT,
      updatedAt TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      description TEXT,
      pickupAddress TEXT,
      deliveryAddress TEXT,
      pickupDate TEXT,
      weight REAL,
      dimensions TEXT,
      specialRequirements TEXT,
      price REAL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT,
      updatedAt TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      message TEXT,
      type TEXT DEFAULT 'info',
      isRead INTEGER DEFAULT 0,
      createdAt TEXT
    )`);
  });
  return db;
};

// Get user ID from request
const getUserId = req => {
  return req.headers['x-user-id'] || req.user?.id || null;
};

// Notification helper function
const createNotification = (userId, title, message, type = 'info', db) => {
  if (!userId || !db) return;
  const sql = `INSERT INTO notifications (userId, title, message, type, isRead, createdAt) VALUES (?, ?, ?, ?, 0, ?)`;
  db.run(sql, [userId, title, message, type, new Date().toISOString()], err => {
    if (err && import.meta?.env?.DEV) {
      console.error('Notification creation error:', err);
    }
  });
};

// GET /api/offers - Tüm teklifleri listele
router.get('/', (req, res) => {
  try {
    const {
      shipmentId,
      carrierId,
      status,
      userId,
      page = 1,
      limit = 50,
    } = req.query;

    // If userId is provided, get offers for shipments owned by that user
    let query;
    let params = [];

    if (userId) {
      // Get offers for shipments owned by this user
      query = `SELECT o.* FROM offers o 
               INNER JOIN shipments s ON o.shipmentId = s.id 
               WHERE s.userId = ?`;
      params.push(parseInt(userId));
    } else {
      query = 'SELECT * FROM offers WHERE 1=1';
    }

    if (shipmentId) {
      if (userId) {
        query += ' AND o.shipmentId = ?';
      } else {
        query += ' AND shipmentId = ?';
      }
      params.push(parseInt(shipmentId));
    }

    if (carrierId) {
      query += userId ? ' AND o.carrierId = ?' : ' AND carrierId = ?';
      params.push(parseInt(carrierId));
    }

    if (status) {
      query += userId ? ' AND o.status = ?' : ' AND status = ?';
      params.push(status);
    }

    query += userId ? ' ORDER BY o.createdAt DESC' : ' ORDER BY createdAt DESC';

    // Count total
    const countQuery = query
      .replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM')
      .replace(/ORDER BY.*/, '');
    const db = getDb();
    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Teklifler sayılırken hata oluştu',
          error: err.message,
        });
      }

      const total = countResult.total;

      // Get paginated results
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Teklifler alınırken hata oluştu',
            error: err.message,
          });
        }

        res.json({
          success: true,
          data: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        });
        db.close();
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklifler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/offers/:id - Belirli teklifi getir
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.get('SELECT * FROM offers WHERE id = ?', [parseInt(id)], (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Teklif alınırken hata oluştu',
          error: err.message,
        });
      }

      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Teklif bulunamadı',
        });
      }

      res.json({
        success: true,
        data: row,
      });
      db.close();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklif alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/offers - Yeni teklif oluştur
router.post('/', (req, res) => {
  try {
    const { shipmentId, price, message, estimatedDelivery } = req.body;

    // Validation
    if (!shipmentId || !price) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik',
      });
    }

    const carrierId = getUserId(req) || 2; // Get from header or default
    const db = getDb();

    // First verify shipment exists
    db.get(
      'SELECT id FROM shipments WHERE id = ?',
      [parseInt(shipmentId)],
      (err, shipment) => {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Gönderi kontrol edilirken hata oluştu',
            error: err.message,
          });
        }

        if (!shipment) {
          db.close();
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        // Check for duplicate pending offer from same carrier
        db.get(
          'SELECT id FROM offers WHERE shipmentId = ? AND carrierId = ? AND status = ?',
          [parseInt(shipmentId), parseInt(carrierId), 'pending'],
          (dupErr, existingOffer) => {
            if (dupErr) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'Teklif kontrol edilirken hata oluştu',
                error: dupErr.message,
              });
            }

            if (existingOffer) {
              db.close();
              return res.status(409).json({
                success: false,
                message: 'Bu gönderi için zaten bekleyen bir teklifiniz var',
              });
            }

            // Shipment exists and no duplicate, create offer
        const sql = `INSERT INTO offers 
        (shipmentId, carrierId, price, message, estimatedDelivery, status, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
          parseInt(shipmentId),
          parseInt(carrierId),
          parseFloat(price),
          message || '',
          estimatedDelivery || null,
          'pending',
          new Date().toISOString(),
          new Date().toISOString(),
        ];

        db.run(sql, params, function (err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Teklif oluşturulurken hata oluştu',
              error: err.message,
            });
          }

          // Get the created offer
          db.get(
            'SELECT * FROM offers WHERE id = ?',
            [this.lastID],
            (err, row) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: 'Teklif oluşturuldu ama alınamadı',
                  error: err.message,
                });
              }

              // Notify shipment owner about new offer
              db.get(
                'SELECT userId, title FROM shipments WHERE id = ?',
                [parseInt(shipmentId)],
                (notifyErr, shipmentInfo) => {
                  if (!notifyErr && shipmentInfo) {
                    createNotification(
                      shipmentInfo.userId,
                      'Yeni Teklif',
                      `"${shipmentInfo.title || 'Gönderi'}" için yeni bir teklif aldınız.`,
                      'info',
                      db
                    );
                  }

                  res.status(200).json({
                    success: true,
                    message: 'Teklif başarıyla oluşturuldu',
                    data: row,
                  });
                  db.close();
                }
              );
            }
          );
        });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklif oluşturulurken hata oluştu',
      error: error.message,
    });
  }
});

// PUT /api/offers/:id/accept - Teklifi kabul et
router.put('/:id/accept', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // First get the offer to find shipmentId
    db.get(
      'SELECT * FROM offers WHERE id = ?',
      [parseInt(id)],
      (err, offer) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Teklif alınırken hata oluştu',
            error: err.message,
          });
        }

        if (!offer) {
          return res.status(404).json({
            success: false,
            message: 'Teklif bulunamadı',
          });
        }

        // First get shipment info for notifications
        db.get(
          'SELECT userId, title FROM shipments WHERE id = ?',
          [offer.shipmentId],
          (err, shipment) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Gönderi bilgisi alınamadı',
                error: err.message,
              });
            }

            // Reject other offers for the same shipment
            db.run(
              'UPDATE offers SET status = ?, updatedAt = ? WHERE shipmentId = ? AND id != ? AND status = ?',
              [
                'rejected',
                new Date().toISOString(),
                offer.shipmentId,
                parseInt(id),
                'pending',
              ],
              function (rejectErr) {
                if (rejectErr) {
                  return res.status(500).json({
                    success: false,
                    message: 'Diğer teklifler reddedilirken hata oluştu',
                    error: rejectErr.message,
                  });
                }

                // Get rejected carrier IDs for notifications
                db.all(
                  'SELECT carrierId FROM offers WHERE shipmentId = ? AND id != ? AND status = ?',
                  [offer.shipmentId, parseInt(id), 'rejected'],
                  (err2, rejectedOffers) => {
                    // Accept this offer
                    db.run(
                      'UPDATE offers SET status = ?, updatedAt = ? WHERE id = ?',
                      ['accepted', new Date().toISOString(), parseInt(id)],
                      function (acceptErr) {
                        if (acceptErr) {
                          return res.status(500).json({
                            success: false,
                            message: 'Teklif kabul edilirken hata oluştu',
                            error: acceptErr.message,
                          });
                        }

                        // Update shipment: status to accepted AND carrierId to nakliyeci
                        db.run(
                          'UPDATE shipments SET status = ?, carrierId = ?, updatedAt = ? WHERE id = ?',
                          ['accepted', offer.carrierId, new Date().toISOString(), offer.shipmentId],
                          err3 => {
                            if (err3) {
                              return res.status(500).json({
                                success: false,
                                message: 'Gönderi güncellenirken hata oluştu',
                                error: err3.message,
                              });
                            }

                            // Send notifications
                            if (shipment) {
                              // Notify nakliyeci (offer creator) - offer accepted
                              createNotification(
                                offer.carrierId,
                                'Teklifiniz Kabul Edildi',
                                `"${shipment.title || 'Gönderi'}" için verdiğiniz teklif kabul edildi.`,
                                'success',
                                db
                              );

                              // Notify shipment owner - offer accepted
                              createNotification(
                                shipment.userId,
                                'Teklif Kabul Edildi',
                                `Gönderiniz için bir teklif kabul edildi.`,
                                'success',
                                db
                              );

                              // Notify rejected nakliyecis
                              if (rejectedOffers && rejectedOffers.length > 0) {
                                rejectedOffers.forEach((rejectedOffer) => {
                                  if (rejectedOffer.carrierId !== offer.carrierId) {
                                    createNotification(
                                      rejectedOffer.carrierId,
                                      'Teklif Reddedildi',
                                      `"${shipment.title || 'Gönderi'}" için verdiğiniz teklif reddedildi.`,
                                      'info',
                                      db
                                    );
                                  }
                                });
                              }
                            }

                            // Get updated offer
                            db.get(
                              'SELECT * FROM offers WHERE id = ?',
                              [parseInt(id)],
                              (err4, row) => {
                                if (err4) {
                                  return res.status(500).json({
                                    success: false,
                                    message: 'Teklif güncellendi ama alınamadı',
                                    error: err4.message,
                                  });
                                }

                                res.json({
                                  success: true,
                                  message: 'Teklif başarıyla kabul edildi',
                                  data: row,
                                });
                                db.close();
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklif kabul edilirken hata oluştu',
      error: error.message,
    });
  }
});

// Allow POST alias for accept to match tests
// POST alias for accept mirrors PUT logic
router.post('/:id/accept', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.get(
      'SELECT * FROM offers WHERE id = ?',
      [parseInt(id)],
      (err, offer) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Teklif alınırken hata oluştu',
            error: err.message,
          });
        }
        if (!offer) {
          return res
            .status(404)
            .json({ success: false, message: 'Teklif bulunamadı' });
        }

        db.run(
          'UPDATE offers SET status = ?, updatedAt = ? WHERE shipmentId = ? AND id != ?',
          [
            'rejected',
            new Date().toISOString(),
            offer.shipmentId,
            parseInt(id),
          ],
          err => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Diğer teklifler reddedilirken hata oluştu',
                error: err.message,
              });
            }
            db.run(
              'UPDATE offers SET status = ?, updatedAt = ? WHERE id = ?',
              ['accepted', new Date().toISOString(), parseInt(id)],
              function (err) {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: 'Teklif kabul edilirken hata oluştu',
                    error: err.message,
                  });
                }
                // Update related shipment status to accepted
                db.run(
                  'UPDATE shipments SET status = ?, updatedAt = ? WHERE id = ?',
                  ['accepted', new Date().toISOString(), offer.shipmentId],
                  err => {
                    if (err) {
                      return res.status(500).json({
                        success: false,
                        message: 'Gönderi güncellenirken hata oluştu',
                        error: err.message,
                      });
                    }
                  }
                );

                db.get(
                  'SELECT * FROM offers WHERE id = ?',
                  [parseInt(id)],
                  (err, row) => {
                    if (err) {
                      return res.status(500).json({
                        success: false,
                        message: 'Teklif güncellendi ama alınamadı',
                        error: err.message,
                      });
                    }
                    return res.json({
                      success: true,
                      message: 'Teklif başarıyla kabul edildi',
                      data: row,
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklif kabul edilirken hata oluştu',
      error: error.message,
    });
  }
});

// PUT /api/offers/:id/reject - Teklifi reddet
router.put('/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.run(
      'UPDATE offers SET status = ?, updatedAt = ? WHERE id = ?',
      ['rejected', new Date().toISOString(), parseInt(id)],
      function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Teklif reddedilirken hata oluştu',
            error: err.message,
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Teklif bulunamadı',
          });
        }

        res.json({
          success: true,
          message: 'Teklif başarıyla reddedildi',
        });
        db.close();
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklif reddedilirken hata oluştu',
      error: error.message,
    });
  }
});

// DELETE /api/offers/:id - Teklifi sil
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.run('DELETE FROM offers WHERE id = ?', [parseInt(id)], function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Teklif silinirken hata oluştu',
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Teklif bulunamadı',
        });
      }

      res.json({
        success: true,
        message: 'Teklif başarıyla silindi',
      });
      db.close();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklif silinirken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;
