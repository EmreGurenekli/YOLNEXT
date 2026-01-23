const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Message {
  constructor() {
    this.dbPath = path.join(__dirname, '../YolNext.db');
  }

  // Mesaj gönder (anlaşma sonrası)
  sendMessage(senderId, receiverId, shipmentId, content, messageType = 'text') {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Anlaşma kontrolü
      db.get(`
        SELECT o.status, s.user_id as sender_id, o.nakliyeci_id
        FROM offers o
        JOIN shipments s ON o.shipment_id = s.id
        WHERE o.shipment_id = ? AND o.status = 'accepted'
      `, [shipmentId], (err, agreement) => {
        if (err) {
          reject(err);
          return;
        }

        if (!agreement) {
          reject(new Error('Bu gönderi için anlaşma sağlanmamış. Mesaj gönderemezsiniz.'));
          return;
        }

        // Sadece anlaşma tarafları mesaj gönderebilir
        if (senderId !== agreement.sender_id && senderId !== agreement.nakliyeci_id) {
          reject(new Error('Bu gönderi için mesaj gönderme yetkiniz yok'));
          return;
        }

        // Mesaj kaydet
        db.run(`
          INSERT INTO messages (sender_id, receiver_id, shipment_id, content, message_type, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [senderId, receiverId, shipmentId, content, messageType], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              id: this.lastID, 
              senderId, 
              receiverId, 
              shipmentId, 
              content,
              messageType,
              createdAt: new Date().toISOString()
            });
          }
          db.close();
        });
      });
    });
  }

  // Mesajları getir
  getMessages(userId, shipmentId, limit = 50) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT m.*, 
               sender.name as sender_name,
               receiver.name as receiver_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE m.shipment_id = ? 
        AND (m.sender_id = ? OR m.receiver_id = ?)
        ORDER BY m.created_at ASC
        LIMIT ?
      `, [shipmentId, userId, userId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Kullanıcının mesaj konuşmaları
  getUserConversations(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT DISTINCT
          m.shipment_id,
          s.title as shipment_title,
          CASE 
            WHEN m.sender_id = ? THEN receiver.name
            ELSE sender.name
          END as other_party_name,
          CASE 
            WHEN m.sender_id = ? THEN m.receiver_id
            ELSE m.sender_id
          END as other_party_id,
          MAX(m.created_at) as last_message_time,
          COUNT(m.id) as message_count
        FROM messages m
        JOIN shipments s ON m.shipment_id = s.id
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        GROUP BY m.shipment_id, other_party_id
        ORDER BY last_message_time DESC
      `, [userId, userId, userId, userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  // Mesaj okundu olarak işaretle
  markAsRead(messageId, userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(`
        UPDATE messages 
        SET is_read = 1, read_at = datetime('now')
        WHERE id = ? AND receiver_id = ?
      `, [messageId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
        db.close();
      });
    });
  }

  // Okunmamış mesaj sayısı
  getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.get(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE receiver_id = ? AND is_read = 0
      `, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
        db.close();
      });
    });
  }
}

module.exports = new Message();