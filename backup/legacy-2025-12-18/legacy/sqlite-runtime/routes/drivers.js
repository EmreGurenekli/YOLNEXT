const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

const getDb = () => {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      licenseNumber TEXT UNIQUE,
      licenseExpiry TEXT,
      vehiclePlate TEXT,
      vehicleType TEXT,
      vehicleCapacity REAL,
      vehicleVolume REAL,
      location TEXT,
      specialties TEXT,
      status TEXT DEFAULT 'available',
      rating REAL DEFAULT 4.8,
      totalJobs INTEGER DEFAULT 0,
      completedJobs INTEGER DEFAULT 0,
      successRate REAL DEFAULT 100,
      joinDate TEXT,
      lastActive TEXT
    )`);

    // Ensure ownerCarrierId column exists (ignore error if already exists)
    db.run(`ALTER TABLE drivers ADD COLUMN ownerCarrierId INTEGER`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS driver_registry (
      code TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      licenseNumber TEXT UNIQUE,
      licenseExpiry TEXT,
      vehiclePlate TEXT,
      vehicleType TEXT,
      vehicleCapacity REAL,
      vehicleVolume REAL,
      location TEXT,
      specialties TEXT
    )`);

    // Seed demo codes if not exist
    db.run(
      `INSERT OR IGNORE INTO driver_registry (code, name, phone, email, licenseNumber, licenseExpiry, vehiclePlate, vehicleType, vehicleCapacity, vehicleVolume, location, specialties)
            VALUES ('DRV-IST-001','Mehmet Kaya','0532 000 00 01','mehmet.kaya@example.com','B-IST-001', ?, '34 MK 001','kamyon',12000,45,'İstanbul', ?)`,
      [
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        JSON.stringify(['Uzun Yol', 'Paletli']),
      ]
    );
    db.run(
      `INSERT OR IGNORE INTO driver_registry (code, name, phone, email, licenseNumber, licenseExpiry, vehiclePlate, vehicleType, vehicleCapacity, vehicleVolume, location, specialties)
            VALUES ('DRV-ANK-002','Ayşe Demir','0543 000 00 02','ayse.demir@example.com','C-ANK-002', ?, '06 AD 002','tır',24000,90,'Ankara', ?)`,
      [
        new Date(Date.now() + 540 * 24 * 60 * 60 * 1000).toISOString(),
        JSON.stringify(['Ağır Yük', 'Soğuk Zincir']),
      ]
    );
  });
  return db;
};

function sanitizeCode(raw) {
  if (!raw) return '';
  const map = { ı: 'I', İ: 'I', i: 'I' };
  const replaced = String(raw).replace(/[ıİi]/g, ch => map[ch] || ch);
  return replaced.trim().toUpperCase();
}

// GET /api/drivers/nakliyeci
router.get('/nakliyeci', (req, res) => {
  const ownerCarrierId = String(req.headers['x-user-id'] || '').trim();
  if (!ownerCarrierId) return res.json({ success: true, drivers: [] });
  const db = getDb();
  db.all(
    `SELECT * FROM drivers WHERE ownerCarrierId = ? ORDER BY id DESC`,
    [ownerCarrierId],
    (err, rows) => {
      if (err)
        return res.status(500).json({ success: false, message: 'DB error' });
      const drivers = rows.map(r => ({
        id: String(r.id),
        name: r.name,
        phone: r.phone,
        email: r.email,
        licenseNumber: r.licenseNumber,
        licenseExpiry: r.licenseExpiry,
        vehicle: {
          plate: r.vehiclePlate,
          type: r.vehicleType,
          capacity: r.vehicleCapacity,
          volume: r.vehicleVolume,
        },
        status: r.status,
        rating: r.rating,
        totalJobs: r.totalJobs,
        completedJobs: r.completedJobs,
        successRate: r.successRate,
        joinDate: r.joinDate,
        lastActive: r.lastActive,
        location: r.location,
        specialties: JSON.parse(r.specialties || '[]'),
      }));
      res.json({ success: true, drivers });
    }
  );
});

// POST /api/drivers
router.post('/', express.json(), (req, res) => {
  const b = req.body || {};
  const now = new Date().toISOString();
  const ownerCarrierId = String(req.headers['x-user-id'] || '').trim();
  if (!ownerCarrierId)
    return res
      .status(400)
      .json({ success: false, message: 'ownerCarrierId missing' });
  const db = getDb();
  db.run(
    `INSERT INTO drivers (name, phone, email, licenseNumber, licenseExpiry, vehiclePlate, vehicleType, vehicleCapacity, vehicleVolume, location, specialties, status, rating, totalJobs, completedJobs, successRate, joinDate, lastActive, ownerCarrierId)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.name || '',
      b.phone || '',
      b.email || '',
      b.licenseNumber || null,
      b.licenseExpiry || null,
      null,
      null,
      null,
      null,
      '',
      JSON.stringify([]),
      'available',
      4.8,
      0,
      0,
      100,
      now,
      now,
      ownerCarrierId,
    ],
    function (err) {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: 'Kayıt başarısız' });
      return res
        .status(201)
        .json({ success: true, data: { id: String(this.lastID) } });
    }
  );
});

// GET /api/drivers/lookup/:code
router.get('/lookup/:code', (req, res) => {
  const code = sanitizeCode(req.params.code || '');
  const db = getDb();
  db.get(`SELECT * FROM driver_registry WHERE code = ?`, [code], (err, row) => {
    if (err)
      return res.status(500).json({ success: false, message: 'DB error' });
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: 'Kod bulunamadı' });
    res.json({ success: true, data: row });
  });
});

// POST /api/drivers/link
router.post('/link', express.json(), (req, res) => {
  const code = sanitizeCode((req.body && req.body.code) || '');
  const ownerCarrierId = String(req.headers['x-user-id'] || '').trim();
  if (!ownerCarrierId)
    return res
      .status(400)
      .json({ success: false, message: 'ownerCarrierId missing' });
  const db = getDb();
  db.get(`SELECT * FROM driver_registry WHERE code = ?`, [code], (err, reg) => {
    if (err)
      return res.status(500).json({ success: false, message: 'DB error' });
    if (!reg)
      return res
        .status(404)
        .json({ success: false, message: 'Kod bulunamadı' });
    // Check global uniqueness by licenseNumber
    db.get(
      `SELECT id, ownerCarrierId FROM drivers WHERE licenseNumber = ?`,
      [reg.licenseNumber],
      (e2, existing) => {
        if (e2)
          return res.status(500).json({ success: false, message: 'DB error' });
        if (existing) {
          if (String(existing.ownerCarrierId || '') === ownerCarrierId) {
            return res.json({ success: true, message: 'Zaten eklenmiş' });
          }
          return res.status(409).json({
            success: false,
            message: 'Bu taşıyıcı başka bir hesapta kayıtlı',
          });
        }
        const now = new Date().toISOString();
        db.run(
          `INSERT INTO drivers (name, phone, email, licenseNumber, licenseExpiry, vehiclePlate, vehicleType, vehicleCapacity, vehicleVolume, location, specialties, status, rating, totalJobs, completedJobs, successRate, joinDate, lastActive, ownerCarrierId)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            reg.name,
            reg.phone,
            reg.email,
            reg.licenseNumber,
            reg.licenseExpiry,
            reg.vehiclePlate,
            reg.vehicleType,
            reg.vehicleCapacity,
            reg.vehicleVolume,
            reg.location,
            reg.specialties,
            'available',
            4.9,
            0,
            0,
            100,
            now,
            now,
            ownerCarrierId,
          ],
          function (e3) {
            if (e3)
              return res
                .status(500)
                .json({ success: false, message: 'Kayıt başarısız' });
            return res.status(201).json({
              success: true,
              message: 'Taşıyıcı eklendi',
              data: { id: String(this.lastID) },
            });
          }
        );
      }
    );
  });
});

// Admin: driver code registry management
// GET /api/drivers/admin/driver-codes
router.get('/admin/driver-codes', (req, res) => {
  const db = getDb();
  db.all(`SELECT * FROM driver_registry ORDER BY code ASC`, [], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, message: 'DB error' });
    res.json({ success: true, data: rows });
  });
});

// POST /api/drivers/admin/driver-codes
router.post('/admin/driver-codes', express.json(), (req, res) => {
  const b = req.body || {};
  if (!b.code)
    return res.status(400).json({ success: false, message: 'code zorunlu' });
  if (!b.name)
    return res.status(400).json({ success: false, message: 'name zorunlu' });
  if (!b.licenseNumber)
    return res
      .status(400)
      .json({ success: false, message: 'licenseNumber zorunlu' });
  const db = getDb();
  db.run(
    `INSERT INTO driver_registry (code, name, phone, email, licenseNumber, licenseExpiry, vehiclePlate, vehicleType, vehicleCapacity, vehicleVolume, location, specialties)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(b.code).trim(),
      b.name,
      b.phone || '',
      b.email || '',
      b.licenseNumber,
      b.licenseExpiry || null,
      (b.vehicle && b.vehicle.plate) || null,
      (b.vehicle && b.vehicle.type) || null,
      (b.vehicle && b.vehicle.capacity) || null,
      (b.vehicle && b.vehicle.volume) || null,
      b.location || '',
      JSON.stringify(b.specialties || []),
    ],
    function (err) {
      if (err)
        return res.status(400).json({
          success: false,
          message: 'Kaydedilemedi (kod benzersiz mi?)',
        });
      res.status(201).json({ success: true, data: { code: b.code } });
    }
  );
});

// DELETE /api/drivers/admin/driver-codes/:code
router.delete('/admin/driver-codes/:code', (req, res) => {
  const code = String(req.params.code || '').trim();
  const db = getDb();
  db.run(`DELETE FROM driver_registry WHERE code = ?`, [code], function (err) {
    if (err)
      return res.status(500).json({ success: false, message: 'Silinemedi' });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ success: false, message: 'Kod bulunamadı' });
    res.json({ success: true, message: 'Silindi' });
  });
});

module.exports = router;
