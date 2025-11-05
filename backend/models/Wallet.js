const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Wallet {
  constructor() {
    this.dbPath = path.join(__dirname, '../yolnext.db');
  }

  // Cüzdan oluştur
  createWallet(userId, initialBalance = 0) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(`
        INSERT INTO wallets (user_id, balance, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `, [userId, initialBalance], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, userId, balance: initialBalance });
        }
        db.close();
      });
    });
  }

  // Cüzdan bakiyesi getir
  getBalance(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.get(`
        SELECT balance FROM wallets WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row.balance);
        } else {
          resolve(0);
        }
        db.close();
      });
    });
  }

  // Para yatır
  deposit(userId, amount, paymentMethod = 'credit_card') {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Bakiye güncelle
        db.run(`
          UPDATE wallets 
          SET balance = balance + ?, updated_at = datetime('now')
          WHERE user_id = ?
        `, [amount, userId], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
        });

        // İşlem kaydı
        db.run(`
          INSERT INTO transactions (user_id, type, amount, description, payment_method, created_at)
          VALUES (?, 'deposit', ?, ?, ?, datetime('now'))
        `, [userId, amount, `Para yatırma: ${amount} TL`, paymentMethod], function(err) {
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
            resolve({ success: true, amount });
          }
          db.close();
        });
      });
    });
  }

  // Para çek (komisyon için)
  withdraw(userId, amount, description) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Bakiye kontrolü
        db.get(`
          SELECT balance FROM wallets WHERE user_id = ?
        `, [userId], (err, row) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          if (!row || row.balance < amount) {
            db.run('ROLLBACK');
            reject(new Error('Yetersiz bakiye'));
            return;
          }

          // Bakiye güncelle
          db.run(`
            UPDATE wallets 
            SET balance = balance - ?, updated_at = datetime('now')
            WHERE user_id = ?
          `, [amount, userId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
          });

          // İşlem kaydı
          db.run(`
            INSERT INTO transactions (user_id, type, amount, description, created_at)
            VALUES (?, 'withdraw', ?, ?, datetime('now'))
          `, [userId, amount, description], function(err) {
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
              resolve({ success: true, amount });
            }
            db.close();
          });
        });
      });
    });
  }

  // Komisyon kes
  deductCommission(userId, offerAmount, commissionRate = 0.01) {
    const commission = offerAmount * commissionRate;
    return this.withdraw(userId, commission, `Komisyon: ${offerAmount} TL'nin %1'i`);
  }

  // İşlem geçmişi
  getTransactionHistory(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(`
        SELECT * FROM transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [userId, limit], (err, rows) => {
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

module.exports = new Wallet();

