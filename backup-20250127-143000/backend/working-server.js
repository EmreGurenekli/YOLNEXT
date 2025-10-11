const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = 5000;

// Database setup
const dbPath = path.join(__dirname, 'yolnet.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Initialize database
const initDatabase = () => {
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'normal',
          vehicle_type TEXT,
          delivery_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Offers table
      db.run(`
        CREATE TABLE IF NOT EXISTS offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id INTEGER NOT NULL,
          carrier_id INTEGER NOT NULL,
          price REAL NOT NULL,
          estimated_days INTEGER,
          message TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shipment_id) REFERENCES shipments (id),
          FOREIGN KEY (carrier_id) REFERENCES users (id)
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

      // Commission tracking table
      db.run(`
        CREATE TABLE IF NOT EXISTS commissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id INTEGER NOT NULL,
          nakliyeci_id INTEGER NOT NULL,
          agreed_price REAL NOT NULL,
          commission_amount REAL NOT NULL,
          nakliyeci_receives REAL NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shipment_id) REFERENCES shipments (id),
          FOREIGN KEY (nakliyeci_id) REFERENCES users (id)
        )
      `);

      // Create demo users
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
  });
};

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.use('/api/offers', require('./routes/offers'));
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/commission', require('./routes/commission'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'YolNet Backend is running!'
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get(
    `SELECT id, name, email, password, panel_type, company_name, location, phone, avatar 
     FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, panel_type: user.panel_type },
        'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          panel_type: user.panel_type,
          company_name: user.company_name,
          location: user.location,
          phone: user.phone,
          avatar: user.avatar
        }
      });
    }
  );
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, panel_type, company_name, location, phone } = req.body;

  if (!name || !email || !password || !panel_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['individual', 'corporate', 'nakliyeci', 'tasiyici'].includes(panel_type)) {
    return res.status(400).json({ error: 'Invalid panel type' });
  }

  db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, panel_type, company_name, location, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, panel_type, company_name || null, location || null, phone || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }

        const userId = this.lastID;
        const token = jwt.sign(
          { userId, email, panel_type },
          'your-secret-key',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'User created successfully',
          token,
          user: {
            id: userId,
            name,
            email,
            panel_type,
            company_name,
            location
          }
        });
      }
    );
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get(
    `SELECT id, name, email, panel_type, company_name, location, phone, avatar, created_at 
     FROM users WHERE id = ?`,
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    }
  );
});

// Shipments routes
app.get('/api/shipments', (req, res) => {
  const { user_id, status } = req.query;
  let query = 'SELECT * FROM shipments';
  const params = [];

  if (user_id) {
    query += ' WHERE user_id = ?';
    params.push(user_id);
  }

  if (status) {
    query += user_id ? ' AND status = ?' : ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/shipments', authenticateToken, (req, res) => {
  const { title, description, from_location, to_location, from_address, to_address, weight, volume, price, priority, vehicle_type, delivery_date } = req.body;

  if (!title || !from_location || !to_location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO shipments (user_id, title, description, from_location, to_location, from_address, to_address, weight, volume, price, priority, vehicle_type, delivery_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.userId, title, description, from_location, to_location, from_address, to_address, weight, volume, price, priority, vehicle_type, delivery_date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create shipment' });
      }

      res.status(201).json({
        id: this.lastID,
        user_id: req.user.userId,
        title,
        description,
        from_location,
        to_location,
        from_address,
        to_address,
        weight,
        volume,
        price,
        priority,
        vehicle_type,
        delivery_date,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  );
});

// Messages routes
app.get('/api/messages', authenticateToken, (req, res) => {
  const { shipment_id } = req.query;
  let query = 'SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.receiver_id = ?';
  const params = [req.user.userId];

  if (shipment_id) {
    query += ' AND m.shipment_id = ?';
    params.push(shipment_id);
  }

  query += ' ORDER BY m.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/messages', authenticateToken, (req, res) => {
  const { receiver_id, shipment_id, message } = req.body;

  if (!receiver_id || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO messages (sender_id, receiver_id, shipment_id, message) VALUES (?, ?, ?, ?)`,
    [req.user.userId, receiver_id, shipment_id, message],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to send message' });
      }

      res.status(201).json({
        id: this.lastID,
        sender_id: req.user.userId,
        receiver_id,
        shipment_id,
        message,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
  );
});

// Commission tracking routes
app.get('/api/commissions', authenticateToken, (req, res) => {
  const { user_id } = req.query;
  
  let query = 'SELECT * FROM commissions';
  const params = [];

  if (user_id) {
    query += ' WHERE nakliyeci_id = ?';
    params.push(user_id);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/api/commissions', authenticateToken, (req, res) => {
  const { shipment_id, nakliyeci_id, agreed_price } = req.body;

  if (!shipment_id || !nakliyeci_id || !agreed_price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const commission_amount = agreed_price * 0.01; // %1
  const nakliyeci_receives = agreed_price - commission_amount;

  db.run(
    `INSERT INTO commissions (shipment_id, nakliyeci_id, agreed_price, commission_amount, nakliyeci_receives) 
     VALUES (?, ?, ?, ?, ?)`,
    [shipment_id, nakliyeci_id, agreed_price, commission_amount, nakliyeci_receives],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create commission record' });
      }

      res.status(201).json({
        id: this.lastID,
        shipment_id,
        nakliyeci_id,
        agreed_price,
        commission_amount,
        nakliyeci_receives,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  );
});

// Analytics routes
app.get('/api/analytics', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // Get user statistics
  db.get(
    `SELECT COUNT(*) as total_shipments FROM shipments WHERE user_id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const totalShipments = result.total_shipments;

      db.get(
        `SELECT COUNT(*) as completed_shipments FROM shipments WHERE user_id = ? AND status = 'delivered'`,
        [userId],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const completedShipments = result.completed_shipments;

          res.json({
            totalShipments,
            completedShipments,
            pendingShipments: totalShipments - completedShipments,
            completionRate: totalShipments > 0 ? (completedShipments / totalShipments) * 100 : 0
          });
        }
      );
    }
  );
});

// Commission routes
app.use('/api/commission', require('./routes/commission'));

// Start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 YolNet Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Environment: development`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });

module.exports = app;

