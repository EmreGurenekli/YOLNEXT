const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL bağlantı ayarları
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'YolNext_kargo',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Veritabanı oluşturma
async function createDatabase() {
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Varsayılan veritabanı
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await adminPool.query(`CREATE DATABASE YolNext_kargo`);
    console.log('✅ Veritabanı oluşturuldu: YolNext_kargo');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️ Veritabanı zaten mevcut: YolNext_kargo');
    } else {
      console.error('❌ Veritabanı oluşturma hatası:', error.message);
    }
  } finally {
    await adminPool.end();
  }
}

// Tabloları oluşturma
async function createTables() {
  const createTablesSQL = `
    -- Kullanıcılar tablosu
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('individual', 'corporate', 'nakliyeci', 'tasiyici')),
      company_name VARCHAR(255),
      tax_number VARCHAR(50),
      license_number VARCHAR(50),
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Gönderiler tablosu
    CREATE TABLE IF NOT EXISTS shipments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      weight DECIMAL(10,2),
      dimensions VARCHAR(100),
      quantity INTEGER DEFAULT 1,
      pickup_address TEXT NOT NULL,
      pickup_city VARCHAR(100),
      pickup_district VARCHAR(100),
      delivery_address TEXT NOT NULL,
      delivery_city VARCHAR(100),
      delivery_district VARCHAR(100),
      pickup_date DATE,
      delivery_date DATE,
      price DECIMAL(10,2) DEFAULT 0,
      special_requirements TEXT,
      room_count VARCHAR(50),
      floor_info VARCHAR(100),
      elevator_available BOOLEAN DEFAULT FALSE,
      vehicle_info JSONB,
      vehicle_year VARCHAR(10),
      vehicle_model VARCHAR(100),
      value DECIMAL(12,2),
      insurance BOOLEAN DEFAULT FALSE,
      special_handling TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Teklifler tablosu
    CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
      carrier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      price DECIMAL(10,2) NOT NULL,
      message TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      kontor_used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Mesajlar tablosu
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Bildirimler tablosu
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      action_url VARCHAR(500),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Kontör sistemi tablosu
    CREATE TABLE IF NOT EXISTS kontor_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
      description TEXT,
      balance_after INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Kullanıcı kontör bakiyesi
    CREATE TABLE IF NOT EXISTS user_kontor (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- İndexler
    CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
    CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
    CREATE INDEX IF NOT EXISTS idx_offers_shipment_id ON offers(shipment_id);
    CREATE INDEX IF NOT EXISTS idx_offers_carrier_id ON offers(carrier_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  `;

  try {
    await pool.query(createTablesSQL);
    console.log('✅ Tüm tablolar oluşturuldu');
  } catch (error) {
    console.error('❌ Tablo oluşturma hatası:', error.message);
  }
}

// Demo verileri ekleme
async function insertDemoData() {
  const demoUsers = [
    {
      first_name: 'Ahmet',
      last_name: 'Yılmaz',
      email: 'ahmet@demo.com',
      password_hash: '$2b$10$demo.hash.individual',
      phone: '+90 555 123 4567',
      address: 'İstanbul, Türkiye',
      user_type: 'individual',
      is_verified: true
    },
    {
      first_name: 'Mehmet',
      last_name: 'Kaya',
      email: 'mehmet@demo.com',
      password_hash: '$2b$10$demo.hash.corporate',
      phone: '+90 555 234 5678',
      address: 'Ankara, Türkiye',
      user_type: 'corporate',
      company_name: 'ABC Lojistik A.Ş.',
      tax_number: '1234567890',
      is_verified: true
    },
    {
      first_name: 'Ali',
      last_name: 'Demir',
      email: 'ali@demo.com',
      password_hash: '$2b$10$demo.hash.nakliyeci',
      phone: '+90 555 345 6789',
      address: 'İzmir, Türkiye',
      user_type: 'nakliyeci',
      company_name: 'Demir Nakliyat',
      tax_number: '0987654321',
      is_verified: true
    },
    {
      first_name: 'Fatma',
      last_name: 'Öz',
      email: 'fatma@demo.com',
      password_hash: '$2b$10$demo.hash.tasiyici',
      phone: '+90 555 456 7890',
      address: 'Bursa, Türkiye',
      user_type: 'tasiyici',
      is_verified: true
    }
  ];

  try {
    // Kullanıcıları ekle
    for (const user of demoUsers) {
      await pool.query(`
        INSERT INTO users (first_name, last_name, email, password_hash, phone, address, user_type, company_name, tax_number, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (email) DO NOTHING
      `, [
        user.first_name, user.last_name, user.email, user.password_hash,
        user.phone, user.address, user.user_type, user.company_name || null,
        user.tax_number || null, user.is_verified
      ]);
    }

    // Kontör bakiyeleri ekle
    await pool.query(`
      INSERT INTO user_kontor (user_id, balance)
      SELECT id, 100 FROM users WHERE user_type = 'nakliyeci'
      ON CONFLICT (user_id) DO NOTHING
    `);

    console.log('✅ Demo veriler eklendi');
  } catch (error) {
    console.error('❌ Demo veri ekleme hatası:', error.message);
  }
}

// Ana setup fonksiyonu
async function setupDatabase() {
  try {
    console.log('🚀 PostgreSQL veritabanı kurulumu başlıyor...\n');
    
    await createDatabase();
    await createTables();
    await insertDemoData();
    
    console.log('\n✅ PostgreSQL veritabanı kurulumu tamamlandı!');
    console.log('📊 Veritabanı: YolNext_kargo');
    console.log('👥 Demo kullanıcılar eklendi');
    console.log('💰 Kontör sistemi hazır');
    
  } catch (error) {
    console.error('❌ Veritabanı kurulum hatası:', error);
  } finally {
    await pool.end();
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, pool };


