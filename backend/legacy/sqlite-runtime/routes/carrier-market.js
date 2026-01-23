const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

const getDb = () => {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS carrier_market_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentId INTEGER NOT NULL,
      createdByCarrierId INTEGER NOT NULL,
      status TEXT DEFAULT 'open',
      minPrice REAL,
      notes TEXT,
      createdAt TEXT,
      expiresAt TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS carrier_market_bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listingId INTEGER NOT NULL,
      bidderCarrierId INTEGER NOT NULL,
      bidPrice REAL NOT NULL,
      etaHours INTEGER,
      note TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TEXT
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

const nowIso = () => new Date().toISOString();
const getUserId = req => req.headers['x-user-id'] || req.user?.id || null;

// Notification helper
const createNotification = (userId, title, message, type = 'info', db) => {
  if (!userId || !db) return;
  db.run(
    `INSERT INTO notifications (userId, title, message, type, isRead, createdAt) VALUES (?, ?, ?, ?, 0, ?)`,
    [userId, title, message, type, nowIso()],
    err => {
      if (err) {
        // Silent fail for notifications
      }
    }
  );
};

// POST /api/carrier-market/listings
router.post('/listings', express.json(), (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: 'Kimlik doğrulama gerekli' });
    const { shipmentId, minPrice, notes, expiresAt } = req.body || {};
    if (!shipmentId)
      return res
        .status(400)
        .json({ success: false, message: 'shipmentId zorunlu' });
    const db = getDb();

    // Check if shipment exists and is assigned to this nakliyeci
    db.get(
      'SELECT id, userId, carrierId, title, status FROM shipments WHERE id = ?',
      [shipmentId],
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

        // Check if shipment is assigned to this nakliyeci
        if (shipment.carrierId !== parseInt(userId)) {
          db.close();
          return res.status(403).json({
            success: false,
            message: 'Bu gönderi size atanmamış. Sadece size atanmış gönderileri carrier market\'e açabilirsiniz.',
          });
        }

        // Check if shipment status allows listing
        if (shipment.status !== 'accepted') {
          db.close();
          return res.status(400).json({
            success: false,
            message: 'Sadece "accepted" durumundaki gönderiler carrier market\'e açılabilir',
          });
        }

        // Check if listing already exists for this shipment
        db.get(
          'SELECT id FROM carrier_market_listings WHERE shipmentId = ? AND status = ?',
          [shipmentId, 'open'],
          (listingErr, existingListing) => {
            if (listingErr) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'İlan kontrol edilirken hata oluştu',
                error: listingErr.message,
              });
            }

            if (existingListing) {
              db.close();
              return res.status(409).json({
                success: false,
                message: 'Bu gönderi için zaten açık bir ilan var',
              });
            }

            // Create listing
            const sql = `INSERT INTO carrier_market_listings (shipmentId, createdByCarrierId, status, minPrice, notes, createdAt, expiresAt)
                         VALUES (?, ?, 'open', ?, ?, ?, ?)`;
            db.run(
              sql,
              [
                shipmentId,
                userId,
                Number(minPrice) || null,
                notes || '',
                nowIso(),
                expiresAt || null,
              ],
              function (createErr) {
                if (createErr) {
                  db.close();
                  return res.status(500).json({
                    success: false,
                    message: 'İlan oluşturulamadı',
                    error: createErr.message,
                  });
                }
                db.get(
                  'SELECT * FROM carrier_market_listings WHERE id = ?',
                  [this.lastID],
                  (e, row) => {
                    if (e) {
                      db.close();
                      return res
                        .status(500)
                        .json({ success: false, message: 'İlan getirilemedi' });
                    }
                    res.status(201).json({ success: true, data: row });
                    db.close();
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
      message: 'İlan oluşturulamadı',
      error: error.message,
    });
  }
});

// GET /api/carrier-market/listings (optional ?mine=1)
router.get('/listings', (req, res) => {
  try {
    const userId = getUserId(req);
    const { mine } = req.query;
    const db = getDb();
    let sql = 'SELECT * FROM carrier_market_listings WHERE 1=1';
    const params = [];
    if (mine && userId) {
      sql += ' AND createdByCarrierId = ?';
      params.push(userId);
    }
    sql += ' ORDER BY createdAt DESC';
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err)
        return res.status(500).json({
          success: false,
          message: 'İlanlar alınamadı',
          error: err.message,
        });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İlanlar alınamadı',
      error: error.message,
    });
  }
});

// GET /api/carrier-market/available - open listings for carriers
router.get('/available', (req, res) => {
  try {
    const db = getDb();
    const sql = `SELECT l.*, s.title, s.pickupAddress, s.deliveryAddress, s.weight, s.volume, s.price, s.pickupDate, s.deliveryDate
                 FROM carrier_market_listings l
                 INNER JOIN shipments s ON s.id = l.shipmentId
                 WHERE l.status = 'open'
                 ORDER BY l.createdAt DESC`;
    db.all(sql, [], (err, rows) => {
      db.close();
      if (err)
        return res.status(500).json({
          success: false,
          message: 'Açık ilanlar alınamadı',
          error: err.message,
        });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Açık ilanlar alınamadı',
      error: error.message,
    });
  }
});

// POST /api/carrier-market/bids
router.post('/bids', express.json(), (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: 'Kimlik doğrulama gerekli' });
    const { listingId, bidPrice, etaHours, note } = req.body || {};
    if (!listingId || !bidPrice)
      return res
        .status(400)
        .json({ success: false, message: 'listingId ve bidPrice zorunlu' });
    const db = getDb();

    // Check if listing exists and is open
    db.get(
      'SELECT id, status, createdByCarrierId FROM carrier_market_listings WHERE id = ?',
      [listingId],
      (listErr, listing) => {
        if (listErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'İlan kontrol edilirken hata oluştu',
            error: listErr.message,
          });
        }

        if (!listing) {
          db.close();
          return res.status(404).json({
            success: false,
            message: 'İlan bulunamadı',
          });
        }

        if (listing.status !== 'open') {
          db.close();
          return res.status(400).json({
            success: false,
            message: 'Bu ilan artık açık değil',
          });
        }

        // Check for duplicate pending bid from same carrier
        db.get(
          'SELECT id FROM carrier_market_bids WHERE listingId = ? AND bidderCarrierId = ? AND status = ?',
          [listingId, userId, 'pending'],
          (dupErr, existingBid) => {
            if (dupErr) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'Teklif kontrol edilirken hata oluştu',
                error: dupErr.message,
              });
            }

            if (existingBid) {
              db.close();
              return res.status(409).json({
                success: false,
                message: 'Bu ilan için zaten bekleyen bir teklifiniz var',
              });
            }

            // Create bid
            const sql = `INSERT INTO carrier_market_bids (listingId, bidderCarrierId, bidPrice, etaHours, note, status, createdAt)
                         VALUES (?, ?, ?, ?, ?, 'pending', ?)`;
            db.run(
              sql,
              [listingId, userId, Number(bidPrice), etaHours ? Number(etaHours) : null, note || '', nowIso()],
              function (err) {
                if (err) {
                  db.close();
                  return res.status(500).json({
                    success: false,
                    message: 'Teklif gönderilemedi',
                    error: err.message,
                  });
                }

                // Notify listing creator about new bid
                createNotification(
                  listing.createdByCarrierId,
                  'Yeni Teklif',
                  `İlanınız için yeni bir taşıyıcı teklifi aldınız.`,
                  'info',
                  db
                );

                db.get(
                  'SELECT * FROM carrier_market_bids WHERE id = ?',
                  [this.lastID],
                  (e, row) => {
                    db.close();
                    if (e)
                      return res
                        .status(500)
                        .json({ success: false, message: 'Teklif getirilemedi' });
                    res.status(201).json({ success: true, data: row });
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
      message: 'Teklif gönderilemedi',
      error: error.message,
    });
  }
});

// GET /api/carrier-market/bids?listingId=...
router.get('/bids', (req, res) => {
  try {
    const { listingId } = req.query;
    if (!listingId)
      return res
        .status(400)
        .json({ success: false, message: 'listingId zorunlu' });
    const db = getDb();
    const sql = `SELECT * FROM carrier_market_bids WHERE listingId = ? ORDER BY createdAt DESC`;
    db.all(sql, [listingId], (err, rows) => {
      db.close();
      if (err)
        return res.status(500).json({
          success: false,
          message: 'Teklifler alınamadı',
          error: err.message,
        });
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklifler alınamadı',
      error: error.message,
    });
  }
});

// POST /api/carrier-market/bids/:id/accept
router.post('/bids/:id/accept', (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: 'Kimlik doğrulama gerekli' });
    const { id } = req.params;
    const db = getDb();
    db.get(
      `SELECT b.*, l.shipmentId FROM carrier_market_bids b INNER JOIN carrier_market_listings l ON l.id = b.listingId WHERE b.id = ?`,
      [id],
      (err, bid) => {
        if (err || !bid) {
          db.close();
          return res
            .status(404)
            .json({ success: false, message: 'Teklif bulunamadı' });
        }

        // Accept this bid, reject others for the listing, update listing and shipment
        db.serialize(() => {
          db.run(
            `UPDATE carrier_market_bids SET status = 'accepted' WHERE id = ?`,
            [id],
            e1 => {
              if (e1) {
                db.close();
                return res.status(500).json({
                  success: false,
                  message: 'Teklif güncellenemedi',
                  error: e1.message,
                });
              }

              db.run(
                `UPDATE carrier_market_bids SET status = 'rejected' WHERE listingId = ? AND id <> ?`,
                [bid.listingId, id],
                e2 => {
                  if (e2) {
                    db.close();
                    return res.status(500).json({
                      success: false,
                      message: 'Diğer teklifler güncellenemedi',
                      error: e2.message,
                    });
                  }

                  db.run(
                    `UPDATE carrier_market_listings SET status = 'assigned' WHERE id = ?`,
                    [bid.listingId],
                    e3 => {
                      if (e3) {
                        db.close();
                        return res.status(500).json({
                          success: false,
                          message: 'İlan güncellenemedi',
                          error: e3.message,
                        });
                      }

                      db.run(
                        `UPDATE shipments SET carrierId = ?, status = 'accepted', updatedAt = ? WHERE id = ?`,
                        [bid.bidderCarrierId, nowIso(), bid.shipmentId],
                        e4 => {
                          if (e4) {
                            db.close();
                            return res.status(500).json({
                              success: false,
                              message: 'Gönderi güncellenemedi',
                              error: e4.message,
                            });
                          }

                          // Get shipment and listing info for notifications
                          db.get(
                            'SELECT userId, title, carrierId FROM shipments WHERE id = ?',
                            [bid.shipmentId],
                            (shipErr, shipment) => {
                              db.get(
                                'SELECT createdByCarrierId FROM carrier_market_listings WHERE id = ?',
                                [bid.listingId],
                                (listErr, listing) => {
                                  // Notify tasiyici (bidder) - bid accepted
                                  if (bid.bidderCarrierId) {
                                    createNotification(
                                      bid.bidderCarrierId,
                                      'Teklifiniz Kabul Edildi',
                                      shipment
                                        ? `"${shipment.title || 'Gönderi'}" için verdiğiniz teklif kabul edildi.`
                                        : 'Teklifiniz kabul edildi.',
                                      'success',
                                      db
                                    );
                                  }

                                  // Notify nakliyeci (listing creator) - bid accepted
                                  if (listing && listing.createdByCarrierId) {
                                    createNotification(
                                      listing.createdByCarrierId,
                                      'Teklif Kabul Edildi',
                                      shipment
                                        ? `"${shipment.title || 'Gönderi'}" için bir taşıyıcı teklifi kabul edildi.`
                                        : 'Bir taşıyıcı teklifi kabul edildi.',
                                      'success',
                                      db
                                    );
                                  }

                                  // Notify shipment owner - bid accepted (if different)
                                  if (shipment && shipment.userId && shipment.userId !== listing.createdByCarrierId) {
                                    createNotification(
                                      shipment.userId,
                                      'Taşıyıcı Atandı',
                                      `"${shipment.title || 'Gönderi'}" için bir taşıyıcı atandı.`,
                                      'info',
                                      db
                                    );
                                  }

                                  // Get rejected bidder IDs for notifications
                                  db.all(
                                    'SELECT bidderCarrierId FROM carrier_market_bids WHERE listingId = ? AND id <> ? AND status = ?',
                                    [bid.listingId, id, 'rejected'],
                                    (rejErr, rejectedBids) => {
                                      if (!rejErr && rejectedBids && rejectedBids.length > 0) {
                                        rejectedBids.forEach((rejectedBid) => {
                                          if (rejectedBid.bidderCarrierId !== bid.bidderCarrierId) {
                                            createNotification(
                                              rejectedBid.bidderCarrierId,
                                              'Teklif Reddedildi',
                                              shipment
                                                ? `"${shipment.title || 'Gönderi'}" için verdiğiniz teklif reddedildi.`
                                                : 'Teklifiniz reddedildi.',
                                              'info',
                                              db
                                            );
                                          }
                                        });
                                      }

                                      res.json({
                                        success: true,
                                        message:
                                          'Teklif kabul edildi ve iş taşıyıcıya atandı',
                                        carrierId: bid.bidderCarrierId,
                                        shipmentId: bid.shipmentId,
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
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Teklif kabul edilemedi',
      error: error.message,
    });
  }
});

// PUT /api/carrier-market/listings/:id/cancel - Cancel listing
router.put('/listings/:id/cancel', (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: 'Kimlik doğrulama gerekli' });
    const { id } = req.params;
    const { reason } = req.body || {};
    const db = getDb();

    // Get listing
    db.get(
      'SELECT * FROM carrier_market_listings WHERE id = ?',
      [id],
      (getErr, listing) => {
        if (getErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'İlan alınırken hata oluştu',
            error: getErr.message,
          });
        }

        if (!listing) {
          db.close();
          return res.status(404).json({
            success: false,
            message: 'İlan bulunamadı',
          });
        }

        // Check ownership
        if (listing.createdByCarrierId !== parseInt(userId)) {
          db.close();
          return res.status(403).json({
            success: false,
            message: 'Bu ilanı sadece oluşturan nakliyeci iptal edebilir',
          });
        }

        // Can only cancel open listings
        if (listing.status !== 'open') {
          db.close();
          return res.status(400).json({
            success: false,
            message: 'Sadece açık ilanlar iptal edilebilir',
          });
        }

        // Cancel listing
        db.run(
          "UPDATE carrier_market_listings SET status = ? WHERE id = ?",
          ['cancelled', id],
          function (cancelErr) {
            if (cancelErr) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'İlan iptal edilemedi',
                error: cancelErr.message,
              });
            }

            // Cancel all pending bids for this listing
            db.run(
              "UPDATE carrier_market_bids SET status = ? WHERE listingId = ? AND status = ?",
              ['cancelled', id, 'pending'],
              (bidErr) => {
                // Get bidder IDs for notifications
                db.all(
                  'SELECT DISTINCT bidderCarrierId FROM carrier_market_bids WHERE listingId = ? AND status = ?',
                  [id, 'cancelled'],
                  (notifyErr, bidders) => {
                    // Get shipment info for notifications
                    db.get(
                      'SELECT title FROM shipments WHERE id = ?',
                      [listing.shipmentId],
                      (shipErr, shipment) => {
                        // Notify all bidders
                        if (!notifyErr && bidders) {
                          bidders.forEach((bidder) => {
                            if (bidder.bidderCarrierId) {
                              createNotification(
                                bidder.bidderCarrierId,
                                'İlan İptal Edildi',
                                shipment
                                  ? `"${shipment.title || 'Gönderi'}" için verdiğiniz teklif içeren ilan iptal edildi.`
                                  : 'Teklif verdiğiniz ilan iptal edildi.',
                                'info',
                                db
                              );
                            }
                          });
                        }

                        res.json({
                          success: true,
                          message: 'İlan başarıyla iptal edildi',
                          data: {
                            id: Number(id),
                            status: 'cancelled',
                          },
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İlan iptal edilemedi',
      error: error.message,
    });
  }
});

module.exports = router;
