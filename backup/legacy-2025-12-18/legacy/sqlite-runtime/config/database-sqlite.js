const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

class SQLiteDatabaseManager {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const dbPath = path.join(__dirname, '../yolnext.db');
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('SQLite connection failed:', err);
          throw err;
        }
        this.isConnected = true;
        logger.info('SQLite database connected successfully');
        
        // Create tables if they don't exist
        this.createTables();
      });
      
      return this.db;
    } catch (error) {
      logger.error('SQLite setup failed:', error);
      throw error;
    }
  }

  createTables() {
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'corporate', 'nakliyeci', 'tasiyici')),
        company_name TEXT,
        tax_number TEXT,
        address TEXT,
        is_verified BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Shipments table
      CREATE TABLE IF NOT EXISTS shipments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        weight REAL,
        dimensions TEXT,
        quantity INTEGER DEFAULT 1,
        pickup_address TEXT NOT NULL,
        pickup_city TEXT NOT NULL,
        pickup_district TEXT,
        delivery_address TEXT NOT NULL,
        delivery_city TEXT NOT NULL,
        delivery_district TEXT,
        pickup_date DATE,
        delivery_date DATE,
        price REAL,
        special_requirements TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled')),
        tracking_number TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Offers table
      CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY,
        shipment_id TEXT NOT NULL,
        nakliyeci_id TEXT NOT NULL,
        price REAL NOT NULL,
        message TEXT,
        estimated_delivery DATE,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (shipment_id) REFERENCES shipments (id),
        FOREIGN KEY (nakliyeci_id) REFERENCES users (id)
      );

      -- Messages table
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        shipment_id TEXT,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (receiver_id) REFERENCES users (id),
        FOREIGN KEY (shipment_id) REFERENCES shipments (id)
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Wallets table
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        balance REAL DEFAULT 0.0,
        currency TEXT DEFAULT 'TRY',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        wallet_id TEXT,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'commission', 'refund')),
        amount REAL NOT NULL,
        description TEXT,
        reference_id TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (wallet_id) REFERENCES wallets (id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
      CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
      CREATE INDEX IF NOT EXISTS idx_offers_shipment_id ON offers(shipment_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `;

    this.db.exec(createTablesSQL, (err) => {
      if (err) {
        logger.error('Error creating tables:', err);
      } else {
        logger.info('SQLite tables created successfully');
      }
    });
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sql.trim().toLowerCase().startsWith('select')) {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            logger.error('SQLite query error:', err);
            reject(err);
          } else {
            resolve({ rows, rowCount: rows.length });
          }
        });
      } else {
        this.db.run(sql, params, function(err) {
          if (err) {
            logger.error('SQLite query error:', err);
            reject(err);
          } else {
            resolve({ rowCount: this.changes, lastID: this.lastID });
          }
        });
      }
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing SQLite database:', err);
          } else {
            logger.info('SQLite database connection closed');
          }
          this.isConnected = false;
          resolve();
        });
      });
    }
  }

  getConnection() {
    return this.db;
  }
}

module.exports = new SQLiteDatabaseManager();


