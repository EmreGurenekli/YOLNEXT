const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const wallet = require('./Wallet');

class Offer {
  constructor() {
    this.dbPath = path.join(__dirname, '../YolNext.db');
  }

  // Teklif ver (komisyon kontrolü ile)
  async createOffer(nakliyeciId, shipmentId, price, estimatedDelivery, message = '') {
    return new Promise(async (resolve, reject) => {
      try {
        // Komisyon hesapla
        const commission = price * 0.01;
        
        // Nakliyeci bakiyesi kontrol et
        const balance = await wallet.getBalance(nakliyeciId);
        if (balance < commission) {
          return reject(new Error('Yetersiz bakiye. Teklif verebilmek için cüzdanınıza para yatırın.'));
        }

        const db = new sqlite3.Database(this.dbPath);
        
        db.run(`
          INSERT INTO offers (nakliyeci_id, shipment_id, price, estimated_delivery, message, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
        `, [nakliyeciId, shipmentId, price, estimatedDelivery, message], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              nakliyeciId, 
              shipmentId, 
              price, 
              estimatedDelivery,
              message,
              status: 'pending'
            });
          }
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Teklif kabul et (komisyon kes)
  async acceptOffer(offerId, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = new sqlite3.Database(this.dbPath);
        
        // Teklif bilgilerini al
        db.get(`
          SELECT o.*, s.user_id as sender_id
          FROM offers o
          JOIN shipments s ON o.shipment_id = s.id
          WHERE o.id = ? AND o.status = 'pending'
        `, [offerId], async (err, offer) => {
          if (err) {
            reject(err);
            return;
          }

          if (!offer) {
            reject(new Error('Teklif bulunamadı veya zaten işlenmiş'));
            return;
          }

          // Sadece gönderici kabul edebilir
          if (offer.sender_id !== userId) {
            reject(new Error('Bu teklifi kabul etme yetkiniz yok'));
            return;
          }

          db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Teklifi kabul et
            db.run(`
              UPDATE offers 
              SET status = 'accepted', accepted_at = datetime('now')
              WHERE id = ?
            `, [offerId], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
            });

            // Gönderi durumunu güncelle
            db.run(`
              UPDATE shipments 
              SET status = 'accepted', nakliyeci_id = ?, updated_at = datetime('now')
              WHERE id = ?
            `, [offer.nakliyeci_id, offer.shipment_id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
            });

            // Komisyon kes
            db.run(`
              UPDATE wallets 
              SET balance = balance - ?, updated_at = datetime('now')
              WHERE user_id = ?
            `, [offer.price * 0.01, offer.nakliyeci_id], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
            });

            // Komisyon işlemi kaydet
            db.run(`
              INSERT INTO transactions (user_id, type, amount, description, created_at)
              VALUES (?, 'commission', ?, ?, datetime('now'))
            `, [offer.nakliyeci_id, offer.price * 0.01, `Komisyon: ${offer.price} TL'nin %1'i`], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
            });

            db.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({ 
                  success: true, 
                  offerId, 
                  commission: offer.price * 0.01 
                });
              }
              db.close();
            });
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Teklif reddet
  rejectOffer(offerId, userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(`
        UPDATE offers 
        SET status = 'rejected', rejected_at = datetime('now')
        WHERE id = ? AND status = 'pending'
      `, [offerId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Teklif bulunamadı veya zaten işlenmiş'));
        } else {
          resolve({ success: true });
        }
        db.close();
      });
    });
  }

  // Kullanıcının teklifleri
  getUserOffers(userId, userType) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let query = '';
      if (userType === 'individual' || userType === 'corporate') {
        // Gönderici teklifleri
        query = `
          SELECT o.*, u.name as nakliyeci_name, s.title, s.pickup_address, s.delivery_address
          FROM offers o
          JOIN users u ON o.nakliyeci_id = u.id
          JOIN shipments s ON o.shipment_id = s.id
          WHERE s.user_id = ?
          ORDER BY o.created_at DESC
        `;
      } else if (userType === 'nakliyeci') {
        // Nakliyeci teklifleri
        query = `
          SELECT o.*, u.name as sender_name, s.title, s.pickup_address, s.delivery_address
          FROM offers o
          JOIN users u ON s.user_id = u.id
          JOIN shipments s ON o.shipment_id = s.id
          WHERE o.nakliyeci_id = ?
          ORDER BY o.created_at DESC
        `;
      }

      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Şehir bazlı açık gönderiler
  getOpenShipmentsByCity(cityId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT s.*, u.name as sender_name, c.name as city_name
        FROM shipments s
        JOIN users u ON s.user_id = u.id
        JOIN cities c ON s.pickup_city_id = c.id
        WHERE s.pickup_city_id = ? AND s.status = 'open'
        ORDER BY s.created_at DESC
      `, [cityId], (err, rows) => {
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

module.exports = new Offer();