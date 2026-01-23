const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'YolNext.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 DATABASE SIFIRLANIYOR');
console.log('========================');

db.serialize(async () => {
  // Drop existing tables
  db.run('DROP TABLE IF EXISTS shipments');
  db.run('DROP TABLE IF EXISTS users');
  console.log('✅ Eski tablolar silindi');

  // Create users table
  db.run(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL,
    company_name TEXT,
    tax_number TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Users tablosu hatası:', err.message);
    } else {
      console.log('✅ Users tablosu oluşturuldu');
    }
  });

  // Create shipments table
  db.run(`CREATE TABLE shipments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    weight REAL,
    dimensions TEXT,
    quantity INTEGER DEFAULT 1,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_date TEXT,
    delivery_date TEXT,
    price REAL DEFAULT 0,
    special_requirements TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('❌ Shipments tablosu hatası:', err.message);
    } else {
      console.log('✅ Shipments tablosu oluşturuldu');
    }
  });

  // Create offers table
  db.run(`CREATE TABLE offers (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL,
    nakliyeci_id TEXT NOT NULL,
    price REAL NOT NULL,
    message TEXT,
    estimated_delivery TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments (id),
    FOREIGN KEY (nakliyeci_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('❌ Offers tablosu hatası:', err.message);
    } else {
      console.log('✅ Offers tablosu oluşturuldu');
    }
  });

  // Insert demo users
  const hashedPassword = await bcrypt.hash('Test123!', 10);
  const now = new Date().toISOString();

  const insertUser = (id, firstName, lastName, email, userType, companyName = null, taxNumber = null, phone = null) => {
    db.run(`INSERT INTO users (id, first_name, last_name, email, password, user_type, company_name, tax_number, phone, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, firstName, lastName, email, hashedPassword, userType, companyName, taxNumber, phone, now, now],
      function (err) {
        if (err) {
          console.error(`❌ Demo ${userType} user hatası:`, err.message);
        } else {
          console.log(`✅ Demo ${userType} user oluşturuldu`);
        }
      });
  };

  insertUser('demo-individual', 'Bireysel', 'Demo', 'individual@yolnext.com', 'individual', null, null, '05001112233');
  insertUser('demo-corporate', 'Kurumsal', 'Demo', 'corporate@yolnext.com', 'corporate', 'YolNext Corp', '1234567890', '05004445566');
  insertUser('demo-nakliyeci', 'Nakliyeci', 'Demo', 'nakliyeci@yolnext.com', 'nakliyeci', 'YolNext Nakliyat', '0987654321', '05007778899');
  insertUser('demo-tasiyici', 'Taşıyıcı', 'Demo', 'tasiyici@yolnext.com', 'tasiyici', null, null, '05001011213');

  console.log('🎉 Database sıfırlama tamamlandı!');
  db.close();
});
