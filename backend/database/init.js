const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'yolnet.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          phone TEXT,
          panel_type TEXT NOT NULL CHECK(panel_type IN ('individual', 'corporate', 'nakliyeci', 'tasiyici')),
          company_name TEXT,
          location TEXT,
          avatar TEXT,
          is_verified BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Shipments table
      db.run(`
        CREATE TABLE IF NOT EXISTS shipments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          from_location TEXT NOT NULL,
          to_location TEXT NOT NULL,
          from_address TEXT,
          to_address TEXT,
          weight REAL,
          volume REAL,
          price REAL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'offers_received', 'accepted', 'in_transit', 'delivered', 'cancelled')),
          priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
          vehicle_type TEXT,
          delivery_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Offers table (updated)
      db.run(`
        CREATE TABLE IF NOT EXISTS offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id INTEGER NOT NULL,
          nakliyeci_id INTEGER NOT NULL,
          price REAL NOT NULL,
          message TEXT,
          estimated_delivery DATETIME,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shipment_id) REFERENCES shipments (id),
          FOREIGN KEY (nakliyeci_id) REFERENCES users (id)
        )
      `);

      // Agreements table
      db.run(`
        CREATE TABLE IF NOT EXISTS agreements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          offer_id INTEGER NOT NULL,
          shipment_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          nakliyeci_id INTEGER NOT NULL,
          agreed_price REAL NOT NULL,
          commission_amount REAL NOT NULL,
          nakliyeci_receives REAL NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (offer_id) REFERENCES offers (id),
          FOREIGN KEY (shipment_id) REFERENCES shipments (id),
          FOREIGN KEY (sender_id) REFERENCES users (id),
          FOREIGN KEY (nakliyeci_id) REFERENCES users (id)
        )
      `);

      // Tracking updates table
      db.run(`
        CREATE TABLE IF NOT EXISTS tracking_updates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id INTEGER NOT NULL,
          status TEXT NOT NULL,
          location TEXT,
          notes TEXT,
          image_url TEXT,
          updated_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shipment_id) REFERENCES shipments (id),
          FOREIGN KEY (updated_by) REFERENCES users (id)
        )
      `);

      // Delivery confirmations table
      db.run(`
        CREATE TABLE IF NOT EXISTS delivery_confirmations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id INTEGER NOT NULL,
          rating INTEGER DEFAULT 5 CHECK(rating >= 1 AND rating <= 5),
          feedback TEXT,
          confirmed_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shipment_id) REFERENCES shipments (id),
          FOREIGN KEY (confirmed_by) REFERENCES users (id)
        )
      `);

      // Commissions table
      db.run(`
        CREATE TABLE IF NOT EXISTS commissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agreement_id INTEGER NOT NULL,
          shipment_id INTEGER NOT NULL,
          nakliyeci_id INTEGER NOT NULL,
          agreed_price REAL NOT NULL,
          commission_amount REAL NOT NULL,
          nakliyeci_receives REAL NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'completed', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agreement_id) REFERENCES agreements (id),
          FOREIGN KEY (shipment_id) REFERENCES shipments (id),
          FOREIGN KEY (nakliyeci_id) REFERENCES users (id)
        )
      `);

      // Carriers table (for nakliyeci and tasiyici)
      db.run(`
        CREATE TABLE IF NOT EXISTS carriers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          company_name TEXT,
          vehicle_type TEXT,
          capacity REAL,
          location TEXT,
          rating REAL DEFAULT 0,
          total_jobs INTEGER DEFAULT 0,
          completed_jobs INTEGER DEFAULT 0,
          wallet_balance REAL DEFAULT 0,
          is_available BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          shipment_id INTEGER,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users (id),
          FOREIGN KEY (receiver_id) REFERENCES users (id),
          FOREIGN KEY (shipment_id) REFERENCES shipments (id)
        )
      `);

      // Notifications table
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'error')),
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Wallets table
      db.run(`
        CREATE TABLE IF NOT EXISTS wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          balance REAL DEFAULT 0,
          currency TEXT DEFAULT 'TRY',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          wallet_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'payment', 'refund', 'commission', 'bonus')),
          amount REAL NOT NULL,
          balance_before REAL NOT NULL,
          balance_after REAL NOT NULL,
          description TEXT,
          reference_id TEXT,
          status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (wallet_id) REFERENCES wallets (id)
        )
      `);

      // Payments table
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          shipment_id INTEGER,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'TRY',
          payment_method TEXT NOT NULL CHECK(payment_method IN ('credit_card', 'bank_transfer', 'wallet', 'cash')),
          payment_provider TEXT,
          transaction_id TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
          gateway_response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (shipment_id) REFERENCES shipments (id)
        )
      `);

      // Reports table
      db.run(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          report_type TEXT NOT NULL CHECK(report_type IN ('financial', 'operational', 'performance', 'analytics')),
          title TEXT NOT NULL,
          data TEXT NOT NULL,
          filters TEXT,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Analytics table
      db.run(`
        CREATE TABLE IF NOT EXISTS analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          event_type TEXT NOT NULL,
          event_data TEXT,
          page_url TEXT,
          user_agent TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // KYC Documents table
      db.run(`
        CREATE TABLE IF NOT EXISTS kyc_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          document_type TEXT NOT NULL CHECK(document_type IN ('id_card', 'passport', 'driver_license', 'company_registration', 'tax_certificate')),
          document_number TEXT,
          file_path TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
          verified_at DATETIME,
          verified_by INTEGER,
          rejection_reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (verified_by) REFERENCES users (id)
        )
      `);

      // Security Logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS security_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          details TEXT,
          risk_level TEXT DEFAULT 'low' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_offers_shipment_id ON offers(shipment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_offers_nakliyeci_id ON offers(nakliyeci_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_agreements_shipment_id ON agreements(shipment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_agreements_sender_id ON agreements(sender_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_agreements_nakliyeci_id ON agreements(nakliyeci_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_tracking_updates_shipment_id ON tracking_updates(shipment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_shipment_id ON delivery_confirmations(shipment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_commissions_shipment_id ON commissions(shipment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_commissions_nakliyeci_id ON commissions(nakliyeci_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_carriers_user_id ON carriers(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(sender_id, receiver_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_payments_shipment_id ON payments(shipment_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id)`);

      // Create demo users
      createDemoUsers()
        .then(() => {
          console.log('✅ Database initialized successfully');
          resolve();
        })
        .catch(reject);
    });
  });
};

// Create demo users
const createDemoUsers = () => {
  return new Promise((resolve, reject) => {
    const demoUsers = [
      {
        name: 'Demo Individual',
        email: 'individual@demo.com',
        password: 'demo123',
        panel_type: 'individual',
        location: 'İstanbul'
      },
      {
        name: 'Demo Corporate',
        email: 'corporate@demo.com',
        password: 'demo123',
        panel_type: 'corporate',
        company_name: 'Demo Şirket A.Ş.',
        location: 'İstanbul'
      },
      {
        name: 'Demo Nakliyeci',
        email: 'nakliyeci@demo.com',
        password: 'demo123',
        panel_type: 'nakliyeci',
        company_name: 'Demo Nakliye A.Ş.',
        location: 'İstanbul'
      },
      {
        name: 'Demo Tasiyici',
        email: 'tasiyici@demo.com',
        password: 'demo123',
        panel_type: 'tasiyici',
        location: 'İstanbul'
      }
    ];

    let completed = 0;
    demoUsers.forEach(user => {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      
      db.run(
        `INSERT OR IGNORE INTO users (name, email, password, panel_type, company_name, location) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.name, user.email, hashedPassword, user.panel_type, user.company_name || null, user.location],
        function(err) {
          if (err) {
            console.error('Error creating demo user:', err);
          } else {
            console.log(`✅ Demo user created: ${user.name}`);
          }
          completed++;
          if (completed === demoUsers.length) {
            resolve();
          }
        }
      );
    });
  });
};

module.exports = { db, initializeDatabase };
