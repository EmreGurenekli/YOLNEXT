const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class City {
  constructor() {
    this.dbPath = path.join(__dirname, '../YolNext.db');
  }

  // Şehir listesi
  getCities() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT * FROM cities ORDER BY name ASC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Kullanıcı şehri güncelle
  updateUserCity(userId, cityId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(`
        UPDATE users 
        SET city_id = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [cityId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
        db.close();
      });
    });
  }

  // Kullanıcının şehri
  getUserCity(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.get(`
        SELECT c.* FROM cities c
        JOIN users u ON u.city_id = c.id
        WHERE u.id = ?
      `, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
        db.close();
      });
    });
  }

  // Şehir bazlı gönderiler
  getShipmentsByCity(cityId, status = 'open') {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT s.*, u.name as sender_name, c.name as city_name
        FROM shipments s
        JOIN users u ON s.user_id = u.id
        JOIN cities c ON s.pickup_city_id = c.id
        WHERE s.pickup_city_id = ? AND s.status = ?
        ORDER BY s.created_at DESC
      `, [cityId, status], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Nakliyeci şehir kontrolü
  canNakliyeciMakeOffer(nakliyeciId, shipmentId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.get(`
        SELECT 
          s.pickup_city_id,
          u.city_id as nakliyeci_city_id
        FROM shipments s
        JOIN users u ON u.id = ?
        WHERE s.id = ?
      `, [nakliyeciId, shipmentId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row && row.pickup_city_id === row.nakliyeci_city_id) {
          resolve(true);
        } else {
          resolve(false);
        }
        db.close();
      });
    });
  }

  // Rota optimizasyonu için yakın şehirler
  getNearbyCities(cityId, radius = 100) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT c.*, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) AS distance
        FROM cities c
        WHERE c.id != ?
        HAVING distance < ?
        ORDER BY distance ASC
      `, [cityId, cityId, cityId, cityId, radius], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }
}

module.exports = new City();

