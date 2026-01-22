const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Rating {
  constructor() {
    this.dbPath = path.join(__dirname, '../YolNext.db');
  }

  // Puan ver
  createRating(raterId, ratedId, shipmentId, rating, comment = '') {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Aynı gönderi için tekrar puan verme kontrolü
      db.get(`
        SELECT id FROM ratings 
        WHERE rater_id = ? AND shipment_id = ? AND rated_user_id = ?
      `, [raterId, shipmentId, ratedId], (err, existing) => {
        if (err) {
          reject(err);
          return;
        }

        if (existing) {
          reject(new Error('Bu gönderi için zaten puan verdiniz'));
          return;
        }

        // Puan kaydet
        db.run(`
          INSERT INTO ratings (rater_id, rated_user_id, shipment_id, rating, comment, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [raterId, ratedId, shipmentId, rating, comment], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              raterId, 
              ratedId, 
              shipmentId, 
              rating,
              comment
            });
          }
          db.close();
        });
      });
    });
  }

  // Kullanıcının puanları
  getUserRatings(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT r.*, 
               rater.name as rater_name,
               s.title as shipment_title
        FROM ratings r
        JOIN users rater ON r.rater_id = rater.id
        JOIN shipments s ON r.shipment_id = s.id
        WHERE r.rated_user_id = ?
        ORDER BY r.created_at DESC
      `, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Kullanıcının ortalama puanı
  getUserAverageRating(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.get(`
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_ratings
        FROM ratings 
        WHERE rated_user_id = ?
      `, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            averageRating: row.average_rating || 0,
            totalRatings: row.total_ratings || 0
          });
        }
        db.close();
      });
    });
  }

  // Puan dağılımı
  getRatingDistribution(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT 
          rating,
          COUNT(*) as count
        FROM ratings 
        WHERE rated_user_id = ?
        GROUP BY rating
        ORDER BY rating DESC
      `, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const distribution = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
          };
          
          rows.forEach(row => {
            distribution[row.rating] = row.count;
          });
          
          resolve(distribution);
        }
        db.close();
      });
    });
  }

  // Gönderi puanları
  getShipmentRatings(shipmentId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT r.*, 
               rater.name as rater_name,
               rated.name as rated_name
        FROM ratings r
        JOIN users rater ON r.rater_id = rater.id
        JOIN users rated ON r.rated_user_id = rated.id
        WHERE r.shipment_id = ?
        ORDER BY r.created_at DESC
      `, [shipmentId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Puan güncelle
  updateRating(ratingId, raterId, rating, comment = '') {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(`
        UPDATE ratings 
        SET rating = ?, comment = ?, updated_at = datetime('now')
        WHERE id = ? AND rater_id = ?
      `, [rating, comment, ratingId, raterId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Puan bulunamadı veya güncelleme yetkiniz yok'));
        } else {
          resolve({ success: true });
        }
        db.close();
      });
    });
  }

  // Puan sil
  deleteRating(ratingId, raterId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(`
        DELETE FROM ratings 
        WHERE id = ? AND rater_id = ?
      `, [ratingId, raterId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Puan bulunamadı veya silme yetkiniz yok'));
        } else {
          resolve({ success: true });
        }
        db.close();
      });
    });
  }
}

module.exports = new Rating();

