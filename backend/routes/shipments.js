const express = require('express');
const router = express.Router();

// Database connection
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Lightweight helper: open DB, ensure tables, then return handle
const getDb = () => {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      pickupAddress TEXT NOT NULL,
      deliveryAddress TEXT NOT NULL,
      pickupDate TEXT,
      weight REAL,
      dimensions TEXT,
      specialRequirements TEXT,
      price REAL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT,
      updatedAt TEXT
    )`);
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
  });
  return db;
};

// Simple auth guard (expects Bearer token for protected actions)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Accept demo tokens for development
  if (token.startsWith('demo-jwt-token-') || token === 'demo-token') {
    req.user = { id: 1, type: 'demo' }; // Set demo user
    return next();
  }

  // For production, you would validate JWT here
  // For now, accept any token that starts with 'Bearer '
  req.user = { id: 1, type: 'user' };
  next();
};

// GET /api/shipments - Tüm gönderileri listele
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { status, userId, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM shipments WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (userId) {
      query += ' AND userId = ?';
      params.push(parseInt(userId, 10));
    }

    query += ' ORDER BY createdAt DESC';

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Gönderiler sayılırken hata oluştu',
          error: err.message,
        });
      }

      const { total } = countResult;

      // Get paginated results
      query += ' LIMIT ? OFFSET ?';
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10)
      );

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Gönderiler alınırken hata oluştu',
            error: err.message,
          });
        }

        const payload = {
          success: true,
          data: rows,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        };
        db.close();
        res.json(payload);
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

// GET /api/shipments/open - Durumu pending olan gönderileri listele
router.get('/open', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 1 } = req.query;
    const query =
      "SELECT * FROM shipments WHERE status = 'pending' ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    const params = [
      parseInt(limit, 10),
      (parseInt(page, 10) - 1) * parseInt(limit, 10),
    ];

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Gönderiler alınırken hata oluştu',
          error: err.message,
        });
      }
      const payload = { success: true, data: rows };
      db.close();
      res.json(payload);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderiler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/shipments/nakliyeci - Kabul edilmiş gönderileri listele
router.get('/nakliyeci', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 10 } = req.query;
    const params = [
      parseInt(limit, 10),
      (parseInt(page, 10) - 1) * parseInt(limit, 10),
    ];
    const countSql =
      "SELECT COUNT(*) as total FROM shipments WHERE status = 'accepted'";
    db.get(countSql, [], (err, countResult) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Gönderiler sayılırken hata oluştu',
          error: err.message,
        });
      }
      const { total } = countResult;
      const sql =
        "SELECT * FROM shipments WHERE status = 'accepted' ORDER BY updatedAt DESC LIMIT ? OFFSET ?";
      db.all(sql, params, (err, rows) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Gönderiler alınırken hata oluştu',
            error: err.message,
          });
        }
        const payload = {
          success: true,
          data: rows,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        };
        db.close();
        return res.json(payload);
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gönderiler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/shipments/:id - Belirli gönderiyi getir
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    db.get(
      'SELECT * FROM shipments WHERE id = ?',
      [parseInt(id, 10)],
      (err, row) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Gönderi alınırken hata oluştu',
            error: err.message,
          });
        }

        if (!row) {
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        const payload = {
          success: true,
          data: row,
        };
        db.close();
        res.json(payload);
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi alınırken hata oluştu',
      error: error.message,
    });
  }
});

// GET /api/shipments/:id/offers - Gönderiye ait teklifler
router.get('/:id/offers', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const shipmentId = parseInt(id, 10);
    const sql =
      'SELECT * FROM offers WHERE shipmentId = ? ORDER BY createdAt DESC';
    db.all(sql, [shipmentId], (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Teklifler alınırken hata oluştu',
          error: err.message,
        });
      }
      const payload = { success: true, data: rows };
      db.close();
      return res.json(payload);
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Teklifler alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/shipments - Yeni gönderi oluştur
router.post('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const {
      title,
      description,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      weight,
      dimensions,
      specialRequirements,
      price,
      userId,
    } = req.body;

    // Validation
    if (!title || !pickupAddress || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik',
      });
    }

    const sql = `INSERT INTO shipments 
      (userId, title, description, pickupAddress, deliveryAddress, pickupDate, 
       weight, dimensions, specialRequirements, price, status, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      userId || 1, // Default user ID
      title,
      description || '',
      pickupAddress,
      deliveryAddress,
      pickupDate || new Date().toISOString(),
      weight || 0,
      dimensions || '',
      specialRequirements || '',
      price || 0,
      'pending',
      new Date().toISOString(),
      new Date().toISOString(),
    ];

    db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Gönderi oluşturulurken hata oluştu',
          error: err.message,
        });
      }

      // Get the created shipment
      db.get(
        'SELECT * FROM shipments WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Gönderi oluşturuldu ama alınamadı',
              error: err.message,
            });
          }

          const payload = {
            success: true,
            message: 'Gönderi başarıyla oluşturuldu',
            data: row,
          };
          db.close();
          res.status(201).json(payload);
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi oluşturulurken hata oluştu',
      error: error.message,
    });
  }
});

// PUT /api/shipments/:id - Gönderiyi güncelle
router.put('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const {
      title,
      description,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      weight,
      dimensions,
      specialRequirements,
      price,
      status,
    } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Gönderi ID gerekli',
      });
    }

    // Check if shipment exists
    db.get(
      'SELECT * FROM shipments WHERE id = ?',
      [parseInt(id, 10)],
      (err, existingShipment) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Gönderi kontrol edilirken hata oluştu',
            error: err.message,
          });
        }

        if (!existingShipment) {
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        // Update shipment
        const sql = `UPDATE shipments SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        pickupAddress = COALESCE(?, pickupAddress),
        deliveryAddress = COALESCE(?, deliveryAddress),
        pickupDate = COALESCE(?, pickupDate),
        weight = COALESCE(?, weight),
        dimensions = COALESCE(?, dimensions),
        specialRequirements = COALESCE(?, specialRequirements),
        price = COALESCE(?, price),
        status = COALESCE(?, status),
        updatedAt = ?
        WHERE id = ?`;

        const params = [
          title,
          description,
          pickupAddress,
          deliveryAddress,
          pickupDate,
          weight,
          dimensions,
          specialRequirements,
          price,
          status,
          new Date().toISOString(),
          parseInt(id, 10),
        ];

        db.run(sql, params, err => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Gönderi güncellenirken hata oluştu',
              error: err.message,
            });
          }

          // Get updated shipment
          db.get(
            'SELECT * FROM shipments WHERE id = ?',
            [parseInt(id, 10)],
            (err, updatedShipment) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: 'Güncellenmiş gönderi alınırken hata oluştu',
                  error: err.message,
                });
              }

              db.close();
              res.json({
                success: true,
                message: 'Gönderi başarıyla güncellendi',
                data: updatedShipment,
              });
            }
          );
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi güncellenirken hata oluştu',
      error: error.message,
    });
  }
});

// Method not allowed handler for shipments
router.use((req, res) => {
  res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed for ${req.path}`,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
});

// DELETE /api/shipments/:id - Gönderiyi sil
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Check if shipment exists
    db.get(
      'SELECT * FROM shipments WHERE id = ?',
      [parseInt(id, 10)],
      (err, existingShipment) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Gönderi kontrol edilirken hata oluştu',
            error: err.message,
          });
        }

        if (!existingShipment) {
          return res.status(404).json({
            success: false,
            message: 'Gönderi bulunamadı',
          });
        }

        // Delete shipment
        db.run(
          'DELETE FROM shipments WHERE id = ?',
          [parseInt(id, 10)],
          err => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Gönderi silinirken hata oluştu',
                error: err.message,
              });
            }

            db.close();
            res.json({
              success: true,
              message: 'Gönderi başarıyla silindi',
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gönderi silinirken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;
