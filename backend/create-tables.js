const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'yolnext',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '2563',
});

// Eksik tabloları oluştur
const createMissingTables = async () => {
  try {
    console.log('📋 Creating missing tables...');

    // Offers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        shipmentId INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        isRead BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        senderId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        message TEXT NOT NULL,
        userType VARCHAR(20) NOT NULL,
        isRead BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Shipment status history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipment_status_history (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);

    // Shipments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        userRole VARCHAR(50) NOT NULL DEFAULT 'individual',
        from_city VARCHAR(100) NOT NULL,
        to_city VARCHAR(100) NOT NULL,
        cargo_type VARCHAR(100) NOT NULL,
        weight DECIMAL(10,2) DEFAULT 0,
        volume DECIMAL(10,2) DEFAULT 0,
        delivery_date TIMESTAMP,
        special_requirements TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Missing tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
};

// Tabloları oluştur
createMissingTables();
