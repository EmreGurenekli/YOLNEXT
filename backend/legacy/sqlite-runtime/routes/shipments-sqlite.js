const express = require('express');
const router = express.Router();
router.use(express.json());

// Database connection
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Database connection helper
const getDb = () => {
  const db = new sqlite3.Database(dbPath);
  // Ensure tables exist
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        carrierId INTEGER,
        title TEXT,
        description TEXT,
        pickupAddress TEXT,
        pickupCity TEXT,
        deliveryAddress TEXT,
        deliveryCity TEXT,
        pickupDate TEXT,
        deliveryDate TEXT,
        weight REAL,
        volume REAL DEFAULT 0,
        dimensions TEXT,
        specialRequirements TEXT,
        price REAL,
        cargoType TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT,
        updatedAt TEXT,
        shipperName TEXT
      )`);

      // Add volume column if it doesn't exist (for existing databases)
      db.run(`ALTER TABLE shipments ADD COLUMN volume REAL DEFAULT 0`, () => {});
      // Add carrierId column if it doesn't exist
      db.run(`ALTER TABLE shipments ADD COLUMN carrierId INTEGER`, () => {});
      
      // Create notifications table
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        title TEXT,
        message TEXT,
        type TEXT DEFAULT 'info',
        isRead INTEGER DEFAULT 0,
        createdAt TEXT
      )`);
      
      // Create wallets table
      db.run(`CREATE TABLE IF NOT EXISTS wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER UNIQUE,
        balance REAL DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
      )`);
      
      // Create wallet_transactions table
      db.run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        amount REAL,
        type TEXT,
        description TEXT,
        status TEXT DEFAULT 'completed',
        createdAt TEXT
      )`);
    });
  return db;
};

// Helper to get user ID from header
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

// GET /api/shipments - List shipments
router.get('/', (req, res) => {
  try {
    const { userId, status, page = 1, limit = 50 } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM shipments WHERE 1=1';
    let params = [];

    // Filter by userId if provided
    const queryUserId = userId || getUserId(req);
    if (queryUserId) {
      query += ' AND userId = ?';
      params.push(queryUserId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC';

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Gönderiler sayılırken hata oluştu',
          error: err.message,
        });
      }

      // Get paginated results
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Gönderiler alınırken hata oluştu',
            error: err.message,
          });
        }

        res.json({
          success: true,
          data: rows || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult?.total || 0,
            pages: Math.ceil((countResult?.total || 0) / parseInt(limit)),
          },
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderiler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/shipments/open - Get open/pending shipments (must be before /:id)
router.get('/open', (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const db = getDb();

    const query = `SELECT * FROM shipments 
                   WHERE status = 'pending' 
                   ORDER BY createdAt DESC 
                   LIMIT ? OFFSET ?`;

    db.all(
      query,
      [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)],
      (err, rows) => {
        db.close();
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Açık gönderiler alınırken hata oluştu',
            error: err.message,
          });
        }

        res.json({
          success: true,
          data: rows || [],
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Açık gönderiler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/shipments/nakliyeci - Get accepted shipments for nakliyeci
router.get('/nakliyeci', (req, res) => {
  try {
    const nakliyeciId = getUserId(req);
    if (!nakliyeciId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli',
      });
    }

    const db = getDb();

    // Get shipments where offers from this nakliyeci were accepted
    const query = `SELECT s.*, o.price as offerPrice, o.status as offerStatus
                   FROM shipments s
                   INNER JOIN offers o ON s.id = o.shipmentId
                   WHERE o.carrierId = ? AND (o.status = 'accepted' OR s.status = 'accepted')
                   ORDER BY s.createdAt DESC`;

    db.all(query, [nakliyeciId], (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Gönderiler alınırken hata oluştu',
          error: err.message,
        });
      }

      res.json({
        success: true,
        data: rows || [],
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderiler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/shipments/tasiyici - Get active shipments for tasiyici (carrier)
router.get('/tasiyici', (req, res) => {
  try {
    const carrierId = getUserId(req);
    if (!carrierId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli',
      });
    }

    const db = getDb();
    const query = `SELECT * FROM shipments 
                   WHERE carrierId = ?
                   ORDER BY updatedAt DESC, createdAt DESC`;

    db.all(query, [carrierId], (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Aktif işler alınırken hata oluştu',
          error: err.message,
        });
      }
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Aktif işler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/shipments/tasiyici/completed - Get completed shipments for tasiyici
router.get('/tasiyici/completed', (req, res) => {
  try {
    const carrierId = getUserId(req);
    if (!carrierId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli',
      });
    }

    const db = getDb();
    const query = `SELECT * FROM shipments 
                   WHERE carrierId = ? AND status = 'completed'
                   ORDER BY updatedAt DESC, createdAt DESC`;

    db.all(query, [carrierId], (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Tamamlanan işler alınırken hata oluştu',
          error: err.message,
        });
      }
      res.json({ success: true, data: rows || [] });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Tamamlanan işler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/shipments - Create new shipment
router.post('/', express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const userId = getUserId(req) || body.userId || 1; // Fallback for demo

    const now = new Date().toISOString();
    const db = getDb();

    const shipment = {
      userId: userId,
      title: body.title || `Gönderi ${Date.now()}`,
      description: body.description || '',
      pickupAddress: body.pickupAddress || body.fromCity || 'İstanbul',
      pickupCity: body.pickupCity || body.fromCity || 'İstanbul',
      deliveryAddress: body.deliveryAddress || body.toCity || 'Ankara',
      deliveryCity: body.deliveryCity || body.toCity || 'Ankara',
      pickupDate: body.pickupDate || body.pickup_date || now,
      deliveryDate: body.deliveryDate || body.delivery_date || now,
      weight: Number(body.weight || body.weight_kg || 0),
      volume: Number(body.volume || body.volume_m3 || 0),
      dimensions: body.dimensions || '',
      specialRequirements:
        body.specialRequirements || body.special_requirements || '',
      price: Number(body.price || body.budget_max || 0),
      cargoType: body.cargoType || body.cargo_type || 'general',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      shipperName: body.shipperName || body.sender_name || 'Gönderici',
    };

    const sql = `INSERT INTO shipments (
      userId, title, description, pickupAddress, pickupCity, deliveryAddress, deliveryCity,
      pickupDate, deliveryDate, weight, volume, dimensions, specialRequirements, price,
      cargoType, status, createdAt, updatedAt, shipperName
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [
        shipment.userId,
        shipment.title,
        shipment.description,
        shipment.pickupAddress,
        shipment.pickupCity,
        shipment.deliveryAddress,
        shipment.deliveryCity,
        shipment.pickupDate,
        shipment.deliveryDate,
        shipment.weight,
        shipment.volume,
        shipment.dimensions,
        shipment.specialRequirements,
        shipment.price,
        shipment.cargoType,
        shipment.status,
        shipment.createdAt,
        shipment.updatedAt,
        shipment.shipperName,
      ],
      function (err) {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Gönderi oluşturulamadı',
            error: err.message,
          });
        }

        // Get the created shipment
        db.get(
          'SELECT * FROM shipments WHERE id = ?',
          [this.lastID],
          (err, row) => {
            db.close();
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Gönderi oluşturuldu ancak getirilemedi',
                error: err.message,
              });
            }

            res.status(201).json({
              success: true,
              message: 'Gönderi oluşturuldu',
              data: row,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi oluşturulamadı',
      error: error.message,
    });
  }
});

// GET /api/loads/available - Available loads for route planner (maps from pending shipments)
// This route is mounted at /api/loads, so this becomes /api/loads/available
router.get('/available', (req, res) => {
  try {
    const db = getDb();

    const query = `SELECT 
      id,
      title,
      pickupAddress,
      deliveryAddress,
      weight,
      volume,
      price,
      pickupDate,
      deliveryDate,
      shipperName,
      pickupCity,
      deliveryCity,
      cargoType
    FROM shipments 
    WHERE status = 'pending'
    ORDER BY createdAt DESC`;

    db.all(query, [], (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Yükler alınırken hata oluştu',
          error: err.message,
        });
      }

      // Map to expected format
      const loads = (rows || []).map(row => {
        // Format deadline date - handle ISO string or date string
        let deadline = '';
        if (row.pickupDate) {
          try {
            // If it's already formatted (no T or Z), use as is
            if (
              !row.pickupDate.includes('T') &&
              !row.pickupDate.includes('Z')
            ) {
              deadline = row.pickupDate;
            } else {
              const date = new Date(row.pickupDate);
              if (!isNaN(date.getTime())) {
                deadline = date.toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
              } else {
                deadline = row.pickupDate;
              }
            }
          } catch (e) {
            deadline = row.pickupDate;
          }
        }

        return {
          id: row.id,
          title:
            row.title || `${row.pickupCity || ''} → ${row.deliveryCity || ''}`,
          pickupAddress: row.pickupAddress || `${row.pickupCity || ''}`,
          deliveryAddress: row.deliveryAddress || `${row.deliveryCity || ''}`,
          weight: row.weight || 0,
          volume: row.volume || 0,
          price: row.price || 0,
          deadline: deadline || 'Belirtilmemiş',
          distance: 0, // TODO: Calculate real distance
          shipper: {
            name: row.shipperName || 'Gönderici',
            phone: '',
            email: '',
          },
        };
      });

      res.json({
        success: true,
        data: loads,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Yükler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/shipments/:id/assign-carrier - Assign carrier to shipment
router.post('/:id/assign-carrier', express.json(), (req, res) => {
  try {
    const { id } = req.params;
    const { carrierId, driverId } = req.body || {};
    const db = getDb();

    if (!carrierId) {
      db.close();
      return res.status(400).json({
        success: false,
        message: 'Taşıyıcı ID gerekli',
      });
    }

    const now = new Date().toISOString();

    // Update shipment status
    db.run(
      'UPDATE shipments SET status = ?, updatedAt = ? WHERE id = ?',
      ['accepted', now, id],
      function (err) {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Gönderi güncellenemedi',
            error: err.message,
          });
        }

        res.json({
          success: true,
          message: 'Taşıyıcı atandı',
          data: {
            shipmentId: Number(id),
            carrierId: Number(carrierId),
            driverId: driverId ? Number(driverId) : null,
          },
        });
        db.close();
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Taşıyıcı atanamadı',
      error: error.message,
    });
  }
});

// POST /api/shipments/:id/open-broadcast - Open shipment for broadcast
router.post('/:id/open-broadcast', express.json(), (req, res) => {
  try {
    const { id } = req.params;
    const { target = 'my-network' } = req.body || {};
    const db = getDb();

    const now = new Date().toISOString();

    // Update shipment status to pending (open for offers)
    db.run(
      'UPDATE shipments SET status = ?, updatedAt = ? WHERE id = ?',
      ['pending', now, id],
      function (err) {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Gönderi güncellenemedi',
            error: err.message,
          });
        }

        res.json({
          success: true,
          message: 'İlan taşıyıcılara açıldı',
          data: {
            shipmentId: Number(id),
            target,
          },
        });
        db.close();
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İlan açılamadı',
      error: error.message,
    });
  }
});

// PUT /api/shipments/:id - Update shipment (especially status)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, ...otherFields } = req.body;
    const db = getDb();
    const now = new Date().toISOString();

    // First get current shipment to validate status transitions
    db.get('SELECT * FROM shipments WHERE id = ?', [id], (getErr, currentShipment) => {
      if (getErr) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Gönderi alınırken hata oluştu',
          error: getErr.message,
        });
      }

      if (!currentShipment) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      // Validate status transitions
      if (status) {
        const currentStatus = currentShipment.status;
        const validTransitions = {
          'pending': ['accepted', 'cancelled'],
          'accepted': ['in_progress', 'in_transit', 'cancelled'],
          'in_progress': ['in_transit', 'completed', 'cancelled'],
          'in_transit': ['completed', 'cancelled'],
          'completed': [], // Terminal state
          'cancelled': [], // Terminal state
          'delivered': ['completed'],
        };

        const allowed = validTransitions[currentStatus] || [];
        if (!allowed.includes(status) && currentStatus !== status) {
          db.close();
          return res.status(400).json({
            success: false,
            message: `Geçersiz durum geçişi: "${currentStatus}" durumundan "${status}" durumuna geçilemez. İzin verilen geçişler: ${allowed.join(', ')}`,
          });
        }

        // Additional validation: in_progress requires accepted status
        if (status === 'in_progress' && currentStatus !== 'accepted' && currentStatus !== 'pending') {
          db.close();
          return res.status(400).json({
            success: false,
            message: 'İşe başlamak için gönderi "accepted" veya "pending" durumunda olmalıdır',
          });
        }

        // Additional validation: completed requires in_progress or in_transit
        if (status === 'completed' && !['in_progress', 'in_transit', 'delivered'].includes(currentStatus)) {
          db.close();
          return res.status(400).json({
            success: false,
            message: 'Tamamlamak için gönderi "in_progress", "in_transit" veya "delivered" durumunda olmalıdır',
          });
        }
      }

      // Build update query dynamically
      const updates = [];
      const values = [];

      if (status) {
        updates.push('status = ?');
        values.push(status);
      }

      // Add other fields if needed
      if (otherFields.price !== undefined) {
        updates.push('price = ?');
        values.push(otherFields.price);
      }
      if (otherFields.description !== undefined) {
        updates.push('description = ?');
        values.push(otherFields.description);
      }

      if (updates.length === 0) {
        db.close();
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek alan belirtilmedi',
        });
      }

      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id);

      const sql = `UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`;

      db.run(sql, values, function (updateErr) {
        if (updateErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Gönderi güncellenemedi',
            error: updateErr.message,
          });
        }

        if (this.changes === 0) {
          db.close();
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        // Get updated shipment for notifications
        db.get('SELECT * FROM shipments WHERE id = ?', [id], (err2, updatedShipment) => {
          if (err2) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Gönderi güncellendi ancak getirilemedi',
              error: err2.message,
            });
          }

          // Process completed shipment: payment and review request
          if (status === 'completed' && status !== currentShipment.status && updatedShipment) {
            // 1. Process payment to carrier wallet
            if (updatedShipment.carrierId && updatedShipment.price) {
              const paymentAmount = updatedShipment.price;
              const commissionRate = 0.05; // 5% platform commission
              const carrierAmount = paymentAmount * (1 - commissionRate);
              const commission = paymentAmount * commissionRate;

              // Get or create wallet for carrier
              db.get('SELECT * FROM wallets WHERE userId = ?', [updatedShipment.carrierId], (walletErr, wallet) => {
                if (!walletErr) {
                  if (wallet) {
                    // Update existing wallet
                    const newBalance = (wallet.balance || 0) + carrierAmount;
                    db.run(
                      'UPDATE wallets SET balance = ?, updatedAt = ? WHERE userId = ?',
                      [newBalance, now, updatedShipment.carrierId],
                      () => {}
                    );
                  } else {
                    // Create new wallet
                    db.run(
                      'INSERT INTO wallets (userId, balance, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
                      [updatedShipment.carrierId, carrierAmount, now, now],
                      () => {}
                    );
                  }

                  // Record transaction
                  db.run(
                    `INSERT INTO wallet_transactions (userId, type, amount, description, status, createdAt)
                     VALUES (?, 'payment', ?, ?, 'completed', ?)`,
                    [
                      updatedShipment.carrierId,
                      carrierAmount,
                      `İş tamamlandı: ${updatedShipment.title || 'Gönderi'} (Komisyon: ₺${commission.toFixed(2)})`,
                      now,
                    ],
                    () => {}
                  );
                }
              });
            }

            // 2. Send review request notifications
            // Notify shipment owner to review carrier
            if (updatedShipment.userId && updatedShipment.carrierId) {
              createNotification(
                updatedShipment.userId,
                'Değerlendirme Yapın',
                `"${updatedShipment.title || 'Gönderi'}" tamamlandı. Taşıyıcıyı değerlendirin.`,
                'info',
                db
              );
            }

            // Notify carrier that they can request review from sender
            if (updatedShipment.carrierId && updatedShipment.userId) {
              createNotification(
                updatedShipment.carrierId,
                'İş Tamamlandı - Ödeme Alındı',
                `"${updatedShipment.title || 'Gönderi'}" tamamlandı. ${updatedShipment.price ? `₺${(updatedShipment.price * 0.95).toFixed(2)} cüzdanınıza yatırıldı.` : 'Ödeme işlendi.'}`,
                'success',
                db
              );
            }
          }

          // Send notifications for other status changes
          if (status && status !== currentShipment.status && status !== 'completed' && updatedShipment) {
            const statusMessages = {
              'in_progress': 'İşe başlandı',
              'in_transit': 'Yolda',
              'delivered': 'Teslim edildi',
              'cancelled': 'İptal edildi',
            };

            const statusMessage = statusMessages[status] || `Durum "${status}" olarak güncellendi`;

            // Notify shipment owner
            if (updatedShipment.userId) {
              createNotification(
                updatedShipment.userId,
                'Gönderi Durumu Güncellendi',
                `"${updatedShipment.title || 'Gönderi'}" için ${statusMessage}.`,
                status === 'cancelled' ? 'error' : 'info',
                db
              );
            }

            // Notify carrier
            if (updatedShipment.carrierId) {
              createNotification(
                updatedShipment.carrierId,
                'Gönderi Durumu Güncellendi',
                `"${updatedShipment.title || 'Gönderi'}" için ${statusMessage}.`,
                status === 'cancelled' ? 'error' : 'info',
                db
              );
            }
          }

          res.json({
            success: true,
            message: 'Gönderi başarıyla güncellendi',
            data: updatedShipment,
          });
          db.close();
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi güncellenemedi',
      error: error.message,
    });
  }
});

// PUT /api/shipments/:id/cancel - Cancel shipment
router.put('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const db = getDb();
    const now = new Date().toISOString();

    // Get current shipment
    db.get('SELECT * FROM shipments WHERE id = ?', [id], (getErr, shipment) => {
      if (getErr) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Gönderi alınırken hata oluştu',
          error: getErr.message,
        });
      }

      if (!shipment) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      // Can only cancel pending or accepted shipments
      if (!['pending', 'accepted'].includes(shipment.status)) {
        db.close();
        return res.status(400).json({
          success: false,
          message: `"${shipment.status}" durumundaki gönderiler iptal edilemez`,
        });
      }

      // Cancel shipment
      db.run(
        'UPDATE shipments SET status = ?, updatedAt = ? WHERE id = ?',
        ['cancelled', now, id],
        function (updateErr) {
          if (updateErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Gönderi iptal edilemedi',
              error: updateErr.message,
            });
          }

          // Cancel all pending offers for this shipment
          db.run(
            "UPDATE offers SET status = ?, updatedAt = ? WHERE shipmentId = ? AND status = ?",
            ['cancelled', now, id, 'pending'],
            (offerErr) => {
              // Cancel carrier market listings
              db.all(
                'SELECT id FROM carrier_market_listings WHERE shipmentId = ? AND status = ?',
                [id, 'open'],
                (listingErr, listings) => {
                  if (!listingErr && listings && listings.length > 0) {
                    listings.forEach((listing) => {
                      // Cancel listing
                      db.run(
                        "UPDATE carrier_market_listings SET status = ? WHERE id = ?",
                        ['cancelled', listing.id],
                        () => {}
                      );
                      // Cancel all pending bids for this listing
                      db.run(
                        "UPDATE carrier_market_bids SET status = ? WHERE listingId = ? AND status = ?",
                        ['cancelled', listing.id, 'pending'],
                        () => {}
                      );
                    });
                  }

                  // Send notifications
                  if (shipment.userId) {
                    createNotification(
                      shipment.userId,
                      'Gönderi İptal Edildi',
                      `"${shipment.title || 'Gönderi'}" iptal edildi.${reason ? ` Sebep: ${reason}` : ''}`,
                      'error',
                      db
                    );
                  }

                  if (shipment.carrierId) {
                    createNotification(
                      shipment.carrierId,
                      'Gönderi İptal Edildi',
                      `"${shipment.title || 'Gönderi'}" iptal edildi.`,
                      'error',
                      db
                    );
                  }

                  // Notify all offer creators
                  db.all(
                    'SELECT DISTINCT carrierId FROM offers WHERE shipmentId = ? AND status = ?',
                    [id, 'cancelled'],
                    (notifyErr, offerCreators) => {
                      if (!notifyErr && offerCreators) {
                        offerCreators.forEach((offerCreator) => {
                          if (offerCreator.carrierId && offerCreator.carrierId !== shipment.carrierId) {
                            createNotification(
                              offerCreator.carrierId,
                              'Gönderi İptal Edildi',
                              `"${shipment.title || 'Gönderi'}" için verdiğiniz teklif iptal edildi.`,
                              'info',
                              db
                            );
                          }
                        });
                      }

                      res.json({
                        success: true,
                        message: 'Gönderi başarıyla iptal edildi',
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
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi iptal edilemedi',
      error: error.message,
    });
  }
});

// GET /api/shipments/:id - Get single shipment (must be last, after all specific routes)
// Note: This must be after /open, /nakliyeci, /tasiyici, /tasiyici/completed, /available
router.get('/:id', (req, res, next) => {
  // Skip if this matches a specific route (shouldn't happen due to route order, but double-check)
  const path = req.path;
  if (
    path === '/open' ||
    path === '/nakliyeci' ||
    path.startsWith('/tasiyici') ||
    path === '/available'
  ) {
    return next();
  }

  try {
    const { id } = req.params;
    const db = getDb();

    // First try to get shipment with nakliyeci info via carrierId (if it exists in users table)
    // If users table doesn't exist or doesn't have the needed structure, just return shipment
    db.get(`
      SELECT s.*, 
             u.email as nakliyeciEmail,
             COALESCE(u.fullName, u.firstName || ' ' || u.lastName, u.first_name || ' ' || u.last_name) as nakliyeciName,
             COALESCE(u.phone, u.phone_number) as nakliyeciPhone,
             COALESCE(u.companyName, u.company_name) as nakliyeciCompany
      FROM shipments s
      LEFT JOIN users u ON s.carrierId = u.id AND (u.userType = 'nakliyeci' OR u.role = 'nakliyeci' OR u.user_type = 'nakliyeci')
      WHERE s.id = ?
    `, [id], (err, row) => {
      if (err) {
        // If JOIN fails (maybe users table doesn't exist), fall back to simple query
        db.get('SELECT * FROM shipments WHERE id = ?', [id], (err2, row2) => {
          db.close();
          if (err2) {
            return res.status(500).json({
              success: false,
              message: 'Gönderi alınırken hata oluştu',
              error: err2.message,
            });
          }

          if (!row2) {
            return res.status(404).json({
              success: false,
              message: 'Gönderi bulunamadı',
            });
          }

          res.json({
            success: true,
            data: row2,
          });
        });
        return;
      }

      db.close();
      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Gönderi bulunamadı',
        });
      }

      res.json({
        success: true,
        data: row,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi alınırken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;
