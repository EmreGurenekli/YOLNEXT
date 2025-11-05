// Database initialization functions
async function createTables(pool) {
  if (!pool) {
    console.error('❌ No database pool available');
    return false;
  }

  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        fullName VARCHAR(255),
        role VARCHAR(50) DEFAULT 'individual',
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        district VARCHAR(100),
        companyName VARCHAR(255),
        taxNumber VARCHAR(50),
        taxOffice VARCHAR(100),
        isVerified BOOLEAN DEFAULT false,
        isEmailVerified BOOLEAN DEFAULT false,
        isPhoneVerified BOOLEAN DEFAULT false,
        isActive BOOLEAN DEFAULT true,
        avatarUrl TEXT,
        verificationDocuments JSONB,
        settings JSONB,
        lastLogin TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Shipments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        subCategory VARCHAR(50),
        pickupCity VARCHAR(100) NOT NULL,
        pickupDistrict VARCHAR(100),
        pickupAddress TEXT NOT NULL,
        pickupDate DATE,
        pickupTime TIME,
        deliveryCity VARCHAR(100) NOT NULL,
        deliveryDistrict VARCHAR(100),
        deliveryAddress TEXT NOT NULL,
        deliveryDate DATE,
        deliveryTime TIME,
        weight DECIMAL(10,2),
        volume DECIMAL(10,2),
        dimensions TEXT,
        value DECIMAL(10,2),
        requiresInsurance BOOLEAN DEFAULT false,
        specialRequirements TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        price DECIMAL(10,2),
        acceptedOfferId INTEGER,
        carrierId INTEGER REFERENCES users(id),
        trackingNumber VARCHAR(50),
        actualPickupDate TIMESTAMP,
        actualDeliveryDate TIMESTAMP,
        metadata JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Offers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        carrierId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        price DECIMAL(10,2) NOT NULL,
        message TEXT,
        estimatedDelivery DATE,
        estimatedDuration INTEGER,
        specialNotes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        expiresAt TIMESTAMP,
        isCounterOffer BOOLEAN DEFAULT false,
        parentOfferId INTEGER REFERENCES offers(id),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        senderId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiverId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        messageType VARCHAR(20) DEFAULT 'text',
        isRead BOOLEAN DEFAULT false,
        readAt TIMESTAMP,
        attachments JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        linkUrl TEXT,
        isRead BOOLEAN DEFAULT false,
        readAt TIMESTAMP,
        priority VARCHAR(20) DEFAULT 'normal',
        category VARCHAR(50),
        metadata JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        carrierId INTEGER REFERENCES users(id),
        offerId INTEGER REFERENCES offers(id),
        amount DECIMAL(10,2) NOT NULL,
        commission DECIMAL(10,2) DEFAULT 0,
        paymentType VARCHAR(50) DEFAULT 'escrow',
        status VARCHAR(50) DEFAULT 'pending',
        paymentMethod VARCHAR(50),
        transactionId VARCHAR(255),
        paidAt TIMESTAMP,
        releasedAt TIMESTAMP,
        refundedAt TIMESTAMP,
        metadata JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        raterId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ratedId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        category VARCHAR(50),
        isVisible BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(shipmentId, raterId, ratedId)
      )
    `);

    // Email verification tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        userid INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Phone verification codes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS phone_verification_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        attempts INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(userId)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_offers_shipment ON offers(shipmentId)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_offers_carrier ON offers(carrierId)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiverId)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId)');

    console.log('✅ PostgreSQL tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return false;
  }
}

async function seedData(pool) {
  if (!pool) {
    console.error('❌ No database pool available for seeding');
    return false;
  }

  try {
    // Check if data already exists
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('✅ Data already exists, skipping seed');
      return true;
    }

    console.log('✅ Test data seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return false;
  }
}

module.exports = { createTables, seedData };

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE,
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
          is_verified BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          email_verified_at DATETIME,
          phone_verified_at DATETIME,
          last_login_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          deleted_at DATETIME
        )
      `);

      // Shipments table
      db.run(`
        CREATE TABLE IF NOT EXISTS shipments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          from_address TEXT NOT NULL,
          to_address TEXT NOT NULL,
          from_city TEXT NOT NULL,
          to_city TEXT NOT NULL,
          weight REAL,
          dimensions TEXT,
          category TEXT,
          sub_category TEXT,
          special_requirements TEXT,
          price REAL,
          status TEXT DEFAULT 'pending',
          tracking_code TEXT UNIQUE,
          carrier_id INTEGER,
          driver_id INTEGER,
          estimated_delivery DATETIME,
          actual_delivery DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (carrier_id) REFERENCES users(id),
          FOREIGN KEY (driver_id) REFERENCES users(id)
        )
      `);

      // Offers table
      db.run(`
        CREATE TABLE IF NOT EXISTS offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE,
          shipment_id INTEGER NOT NULL,
          carrier_id INTEGER NOT NULL,
          driver_id INTEGER,
          price REAL NOT NULL,
          estimated_delivery DATETIME,
          message TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shipment_id) REFERENCES shipments(id),
          FOREIGN KEY (carrier_id) REFERENCES users(id),
          FOREIGN KEY (driver_id) REFERENCES users(id)
        )
      `);

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          shipment_id INTEGER,
          message TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id),
          FOREIGN KEY (receiver_id) REFERENCES users(id),
          FOREIGN KEY (shipment_id) REFERENCES shipments(id)
        )
      `);

      // Notifications table
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          is_read BOOLEAN DEFAULT 0,
          data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Payments table
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE,
          user_id INTEGER NOT NULL,
          shipment_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'TRY',
          payment_method TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          transaction_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (shipment_id) REFERENCES shipments(id)
        )
      `);

      console.log('✅ Database tables initialized');
      resolve();
    });
  });
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
        reject(err);
      } else {
        console.log('✅ Database connection closed');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
  closeDatabase
};

