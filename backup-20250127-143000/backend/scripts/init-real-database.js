const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Gerçek veritabanı oluştur
const dbPath = path.join(__dirname, '../database/yolnet_real.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Gerçek YolNet veritabanı oluşturuluyor...');

// Tabloları oluştur
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT,
          user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'corporate', 'carrier', 'driver')),
          company_name TEXT,
          tax_number TEXT,
          address TEXT,
          city TEXT,
          district TEXT,
          postal_code TEXT,
          avatar_url TEXT,
          is_verified INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          email_verified_at DATETIME,
          phone_verified_at DATETIME,
          last_login_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          deleted_at DATETIME
        )
      `);

      // User profiles table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          bio TEXT,
          website TEXT,
          social_media TEXT,
          preferences TEXT,
          notification_settings TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // KYC documents table
      db.run(`
        CREATE TABLE IF NOT EXISTS kyc_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          document_type TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          rejection_reason TEXT,
          verified_at DATETIME,
          verified_by INTEGER REFERENCES users(id),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Shipments table
      db.run(`
        CREATE TABLE IF NOT EXISTS shipments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          subcategory TEXT,
          pickup_address TEXT NOT NULL,
          pickup_city TEXT NOT NULL,
          pickup_district TEXT,
          pickup_postal_code TEXT,
          pickup_latitude REAL,
          pickup_longitude REAL,
          pickup_contact_name TEXT,
          pickup_contact_phone TEXT,
          delivery_address TEXT NOT NULL,
          delivery_city TEXT NOT NULL,
          delivery_district TEXT,
          delivery_postal_code TEXT,
          delivery_latitude REAL,
          delivery_longitude REAL,
          delivery_contact_name TEXT,
          delivery_contact_phone TEXT,
          weight_kg REAL,
          volume_m3 REAL,
          length_cm REAL,
          width_cm REAL,
          height_cm REAL,
          pickup_date DATE NOT NULL,
          pickup_time_start TIME,
          pickup_time_end TIME,
          delivery_date DATE NOT NULL,
          delivery_time_start TIME,
          delivery_time_end TIME,
          budget_min REAL,
          budget_max REAL,
          currency TEXT DEFAULT 'TRY',
          status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'in_progress', 'completed', 'cancelled')),
          visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
          tags TEXT,
          special_requirements TEXT,
          insurance_required INTEGER DEFAULT 0,
          insurance_value REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          completed_at DATETIME
        )
      `);

      // Offers table
      db.run(`
        CREATE TABLE IF NOT EXISTS offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
          shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
          carrier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          price REAL NOT NULL,
          currency TEXT DEFAULT 'TRY',
          estimated_delivery_date DATE,
          estimated_delivery_time TIME,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
          message TEXT,
          terms_conditions TEXT,
          valid_until DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          responded_at DATETIME
        )
      `);

      // Orders table
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
          shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
          offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          carrier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          total_amount REAL NOT NULL,
          currency TEXT DEFAULT 'TRY',
          commission_rate REAL DEFAULT 5.00,
          commission_amount REAL,
          carrier_amount REAL,
          status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed')),
          payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed')),
          payment_method TEXT,
          payment_reference TEXT,
          confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          picked_up_at DATETIME,
          delivered_at DATETIME,
          cancelled_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Wallets table
      db.run(`
        CREATE TABLE IF NOT EXISTS wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
          balance REAL DEFAULT 0.00,
          currency TEXT DEFAULT 'TRY',
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
          wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'commission', 'bonus', 'penalty')),
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'TRY',
          balance_before REAL NOT NULL,
          balance_after REAL NOT NULL,
          reference_type TEXT,
          reference_id INTEGER,
          description TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Conversations table
      db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
          shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
          participant1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          participant2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          last_message_at DATETIME,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
          conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
          file_url TEXT,
          file_name TEXT,
          file_size INTEGER,
          mime_type TEXT,
          is_read INTEGER DEFAULT 0,
          read_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Notifications table
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data TEXT,
          is_read INTEGER DEFAULT 0,
          read_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Vehicles table
      db.run(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          plate_number TEXT UNIQUE NOT NULL,
          vehicle_type TEXT NOT NULL,
          brand TEXT,
          model TEXT,
          year INTEGER,
          color TEXT,
          max_weight_kg REAL,
          max_volume_m3 REAL,
          length_cm REAL,
          width_cm REAL,
          height_cm REAL,
          is_active INTEGER DEFAULT 1,
          is_available INTEGER DEFAULT 1,
          current_location_lat REAL,
          current_location_lng REAL,
          current_location_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Drivers table
      db.run(`
        CREATE TABLE IF NOT EXISTS drivers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
          license_number TEXT UNIQUE NOT NULL,
          license_type TEXT NOT NULL,
          license_expiry_date DATE,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          is_active INTEGER DEFAULT 1,
          is_available INTEGER DEFAULT 1,
          rating REAL DEFAULT 0.00,
          total_ratings INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Reviews table
      db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          reviewed_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
          communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
          service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // System settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          is_public INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_shipments_pickup_city ON shipments(pickup_city)');
      db.run('CREATE INDEX IF NOT EXISTS idx_shipments_delivery_city ON shipments(delivery_city)');
      db.run('CREATE INDEX IF NOT EXISTS idx_offers_shipment_id ON offers(shipment_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_offers_carrier_id ON offers(carrier_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_orders_carrier_id ON orders(carrier_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id)');

      resolve();
    });
  });
};

// Gerçek kullanıcılar oluştur
const createRealUsers = async () => {
  const users = [
    {
      email: 'ahmet.yilmaz@email.com',
      password: 'password123',
      first_name: 'Ahmet',
      last_name: 'Yılmaz',
      phone: '0532 111 2233',
      user_type: 'individual',
      city: 'İstanbul',
      is_verified: 1
    },
    {
      email: 'migros@migros.com.tr',
      password: 'migros123',
      first_name: 'Migros',
      last_name: 'Ticaret A.Ş.',
      phone: '0212 444 5566',
      user_type: 'corporate',
      company_name: 'Migros Ticaret A.Ş.',
      tax_number: '1234567890',
      city: 'İstanbul',
      is_verified: 1
    },
    {
      email: 'kargo@aras.com.tr',
      password: 'aras123',
      first_name: 'Aras',
      last_name: 'Kargo',
      phone: '0212 333 4455',
      user_type: 'carrier',
      company_name: 'Aras Kargo A.Ş.',
      tax_number: '9876543210',
      city: 'İstanbul',
      is_verified: 1
    },
    {
      email: 'mehmet.demir@email.com',
      password: 'driver123',
      first_name: 'Mehmet',
      last_name: 'Demir',
      phone: '0533 777 8899',
      user_type: 'driver',
      city: 'Ankara',
      is_verified: 1
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, user_type, 
                          company_name, tax_number, city, is_verified, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.email, hashedPassword, user.first_name, user.last_name, user.phone,
        user.user_type, user.company_name || null, user.tax_number || null,
        user.city, user.is_verified, 1
      ], function(err) {
        if (err) {
          console.log(`Kullanıcı oluşturma hatası (${user.email}):`, err.message);
        } else {
          console.log(`✅ Kullanıcı oluşturuldu: ${user.email}`);
          
          // Cüzdan oluştur
          db.run('INSERT INTO wallets (user_id) VALUES (?)', [this.lastID], (err) => {
            if (err) console.log('Cüzdan oluşturma hatası:', err.message);
          });
        }
        resolve();
      });
    });
  }
};

// Sistem ayarları oluştur
const createSystemSettings = () => {
  return new Promise((resolve, reject) => {
    const settings = [
      ['platform_name', 'YolNet', 'Platform adı', 1],
      ['platform_version', '2.0', 'Platform versiyonu', 1],
      ['commission_rate', '5.00', 'Platform komisyon oranı (%)', 0],
      ['min_withdrawal_amount', '50.00', 'Minimum çekim tutarı', 0],
      ['max_file_size', '10485760', 'Maksimum dosya boyutu (bytes)', 1],
      ['supported_file_types', 'jpg,jpeg,png,pdf,doc,docx', 'Desteklenen dosya türleri', 1]
    ];

    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO system_settings (key, value, description, is_public)
        VALUES (?, ?, ?, ?)
      `);

      settings.forEach(setting => {
        stmt.run(setting);
      });

      stmt.finalize();
      resolve();
    });
  });
};

// Ana işlem
const initializeDatabase = async () => {
  try {
    console.log('📊 Tablolar oluşturuluyor...');
    await createTables();
    
    console.log('👥 Gerçek kullanıcılar oluşturuluyor...');
    await createRealUsers();
    
    console.log('⚙️ Sistem ayarları oluşturuluyor...');
    await createSystemSettings();
    
    console.log('✅ Gerçek YolNet veritabanı başarıyla oluşturuldu!');
    console.log('📍 Veritabanı konumu:', dbPath);
    
    db.close();
  } catch (error) {
    console.error('❌ Veritabanı oluşturma hatası:', error);
    db.close();
  }
};

// Scripti çalıştır
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };




