const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

const getDb = () => {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerId INTEGER,
      name TEXT NOT NULL,
      type TEXT,
      plateNumber TEXT,
      maxWeight REAL,
      maxVolume REAL,
      currentWeight REAL DEFAULT 0,
      currentVolume REAL DEFAULT 0,
      status TEXT DEFAULT 'available',
      createdAt TEXT,
      updatedAt TEXT
    )`);
  });
  return db;
};

// Helper to get user ID from header
const getUserId = req => {
  return req.headers['x-user-id'] || req.user?.id || null;
};

// GET /api/vehicles/nakliyeci - List vehicles for nakliyeci
router.get('/nakliyeci', (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();

    if (!userId) {
      db.close();
      return res.json({
        success: true,
        vehicles: [],
      });
    }

    const query =
      'SELECT * FROM vehicles WHERE ownerId = ? ORDER BY createdAt DESC';

    db.all(query, [userId], (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Araçlar alınırken hata oluştu',
          error: err.message,
        });
      }

      // Map to expected format
      const vehicles = (rows || []).map(row => ({
        id: row.id,
        name: row.name,
        type: row.type || 'truck',
        maxWeight: row.maxWeight || 0,
        maxVolume: row.maxVolume || 0,
        currentWeight: row.currentWeight || 0,
        currentVolume: row.currentVolume || 0,
      }));

      // If no vehicles, return empty array (frontend will show empty state)
      res.json({
        success: true,
        vehicles: vehicles,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Araçlar alınırken hata oluştu',
      error: error.message,
    });
  }
});

// POST /api/vehicles - Create new vehicle
router.post('/', express.json(), (req, res) => {
  try {
    const body = req.body || {};
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli',
      });
    }

    if (!body.name || !body.type || !body.maxWeight || !body.maxVolume) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar doldurulmalı',
      });
    }

    const now = new Date().toISOString();
    const db = getDb();

    const sql = `INSERT INTO vehicles (
      ownerId, name, type, plateNumber, maxWeight, maxVolume, 
      currentWeight, currentVolume, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'available', ?, ?)`;

    db.run(
      sql,
      [
        userId,
        body.name,
        body.type,
        body.plateNumber || '',
        Number(body.maxWeight),
        Number(body.maxVolume),
        now,
        now,
      ],
      function (err) {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Araç oluşturulamadı',
            error: err.message,
          });
        }

        // Get the created vehicle
        db.get(
          'SELECT * FROM vehicles WHERE id = ?',
          [this.lastID],
          (err, row) => {
            db.close();
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Araç oluşturuldu ancak getirilemedi',
                error: err.message,
              });
            }

            res.status(201).json({
              success: true,
              message: 'Araç oluşturuldu',
              data: {
                id: row.id,
                name: row.name,
                type: row.type,
                maxWeight: row.maxWeight,
                maxVolume: row.maxVolume,
                currentWeight: row.currentWeight || 0,
                currentVolume: row.currentVolume || 0,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Araç oluşturulamadı',
      error: error.message,
    });
  }
});

module.exports = router;
