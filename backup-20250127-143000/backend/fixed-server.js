const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'yolnet-super-secret-jwt-key-2024-production-ready';

// Database setup with error handling
const dbPath = path.join(__dirname, 'yolnet.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Database initialization
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
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'offers_received', 'accepted', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled')),
          priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
          vehicle_type TEXT,
          delivery_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Offers table
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
          action_url TEXT,
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
      db.run(`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(sender_id, receiver_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);

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

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'YolNet Backend is running!',
    version: '1.0.0'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = bcrypt.compareSync(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, panelType: user.panel_type },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          panel_type: user.panel_type,
          company_name: user.company_name,
          location: user.location,
          avatar: user.avatar
        },
        token
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, panel_type, company_name, location } = req.body;

    if (!name || !email || !password || !panel_type) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Validate panel_type
    const validPanelTypes = ['individual', 'corporate', 'nakliyeci', 'tasiyici'];
    if (!validPanelTypes.includes(panel_type)) {
      return res.status(400).json({ error: 'Invalid panel type' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, panel_type, company_name, location) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, panel_type, company_name || null, location || null],
      function(err) {
        if (err) {
          console.error('Registration error:', err);
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error', details: err.message });
        }

        const token = jwt.sign(
          { userId: this.lastID, email, panelType: panel_type },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          user: {
            id: this.lastID,
            name,
            email,
            panel_type,
            company_name,
            location
          },
          token
        });
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        panel_type: user.panel_type,
        company_name: user.company_name,
        location: user.location,
        avatar: user.avatar
      }
    });
  });
});

// Shipments routes
app.get('/api/shipments', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all('SELECT * FROM shipments WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, shipments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(shipments);
  });
});

app.post('/api/shipments', authenticateToken, (req, res) => {
  const { title, description, from_location, to_location, weight, volume, price, vehicle_type } = req.body;
  const userId = req.user.userId;

  if (!title || !from_location || !to_location) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  db.run(
    `INSERT INTO shipments (user_id, title, description, from_location, to_location, weight, volume, price, vehicle_type) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, title, description, from_location, to_location, weight, volume, price, vehicle_type],
    function(err) {
      if (err) {
        console.error('Shipment creation error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        user_id: userId,
        title,
        description,
        from_location,
        to_location,
        weight,
        volume,
        price,
        vehicle_type,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  );
});

app.put('/api/shipments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, from_location, to_location, weight, volume, price, vehicle_type } = req.body;
  const userId = req.user.userId;

  if (!title || !from_location || !to_location) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  db.get('SELECT * FROM shipments WHERE id = ? AND user_id = ?', [id, userId], (err, shipment) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found or unauthorized' });
    }

    db.run(
      `UPDATE shipments SET title = ?, description = ?, from_location = ?, to_location = ?, 
       weight = ?, volume = ?, price = ?, vehicle_type = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [title, description, from_location, to_location, weight, volume, price, vehicle_type, id, userId],
      function(err) {
        if (err) {
          console.error('Shipment update error:', err);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }

        res.json({
          id: parseInt(id),
          user_id: userId,
          title,
          description,
          from_location,
          to_location,
          weight,
          volume,
          price,
          vehicle_type,
          status: shipment.status,
          updated_at: new Date().toISOString()
        });
      }
    );
  });
});

app.delete('/api/shipments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  db.get('SELECT * FROM shipments WHERE id = ? AND user_id = ?', [id, userId], (err, shipment) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found or unauthorized' });
    }

    if (shipment.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete shipment that is not pending' });
    }

    db.run('DELETE FROM shipments WHERE id = ? AND user_id = ?', [id, userId], function(err) {
      if (err) {
        console.error('Shipment deletion error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      res.json({ message: 'Shipment deleted successfully', id: parseInt(id) });
    });
  });
});

// Offers routes
app.post('/api/offers', authenticateToken, (req, res) => {
  const { shipment_id, price, message, estimated_delivery } = req.body;
  const nakliyeci_id = req.user.userId;

  if (!shipment_id || !price || !nakliyeci_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO offers (shipment_id, nakliyeci_id, price, message, estimated_delivery) VALUES (?, ?, ?, ?, ?)`,
    [shipment_id, nakliyeci_id, price, message, estimated_delivery],
    function(err) {
      if (err) {
        console.error('Error creating offer:', err.message);
        return res.status(500).json({ error: 'Failed to create offer' });
      }
      res.status(201).json({
        id: this.lastID,
        shipment_id,
        nakliyeci_id,
        price,
        message,
        estimated_delivery,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  );
});

app.get('/api/offers/shipment/:shipment_id', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const user_id = req.user.userId;

  db.get('SELECT user_id FROM shipments WHERE id = ?', [shipment_id], (err, shipment) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!shipment || shipment.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized to view offers for this shipment' });
    }

    db.all(
      `SELECT o.*, u.name as nakliyeci_name, u.company_name, u.location, u.phone, u.avatar 
       FROM offers o 
       JOIN users u ON o.nakliyeci_id = u.id 
       WHERE o.shipment_id = ? ORDER BY o.created_at DESC`,
      [shipment_id],
      (err, rows) => {
        if (err) {
          console.error('Error fetching shipment offers:', err.message);
          return res.status(500).json({ error: 'Failed to fetch shipment offers' });
        }
        res.json(rows);
      }
    );
  });
});

app.get('/api/offers/nakliyeci', authenticateToken, (req, res) => {
  const nakliyeci_id = req.user.userId;
  const { status } = req.query;

  let query = `SELECT o.*, s.title, s.description, s.from_location, s.to_location, s.weight, s.volume,
                      u.name as sender_name, u.company_name as sender_company
               FROM offers o
               JOIN shipments s ON o.shipment_id = s.id
               JOIN users u ON s.user_id = u.id
               WHERE o.nakliyeci_id = ?`;
  const params = [nakliyeci_id];

  if (status) {
    query += ` AND o.status = ?`;
    params.push(status);
  }
  query += ` ORDER BY o.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching nakliyeci offers:', err.message);
      return res.status(500).json({ error: 'Failed to fetch nakliyeci offers' });
    }
    res.json(rows);
  });
});

app.put('/api/offers/:id/accept', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.userId;

  db.get('SELECT * FROM offers WHERE id = ?', [id], (err, offer) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    db.get('SELECT user_id FROM shipments WHERE id = ?', [offer.shipment_id], (err, shipment) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!shipment || shipment.user_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to accept this offer' });
      }

      db.serialize(() => {
        db.run('UPDATE offers SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('Error accepting offer:', err.message);
            return res.status(500).json({ error: 'Failed to accept offer' });
          }

          db.run('UPDATE shipments SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [offer.shipment_id], function(err) {
            if (err) {
              console.error('Error updating shipment status:', err.message);
              return res.status(500).json({ error: 'Failed to update shipment status' });
            }

            db.run('UPDATE offers SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE shipment_id = ? AND id != ? AND status = "pending"',
              [offer.shipment_id, id], function(err) {
                if (err) {
                  console.error('Error rejecting other offers:', err.message);
                }
                res.json({ message: 'Offer accepted and other offers rejected', offer_id: id });
              });
          });
        });
      });
    });
  });
});

app.put('/api/offers/:id/reject', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.userId;

  db.get('SELECT * FROM offers WHERE id = ?', [id], (err, offer) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    db.get('SELECT user_id FROM shipments WHERE id = ?', [offer.shipment_id], (err, shipment) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!shipment || shipment.user_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to reject this offer' });
      }

      db.run('UPDATE offers SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error rejecting offer:', err.message);
          return res.status(500).json({ error: 'Failed to reject offer' });
        }
        res.json({ message: 'Offer rejected', offer_id: id });
      });
    });
  });
});

// Agreements routes
app.post('/api/agreements', authenticateToken, (req, res) => {
  const { offer_id } = req.body;
  const user_id = req.user.userId;

  if (!offer_id) {
    return res.status(400).json({ error: 'Offer ID is required' });
  }

  db.get('SELECT * FROM offers WHERE id = ? AND status = "accepted"', [offer_id], (err, offer) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!offer) return res.status(404).json({ error: 'Accepted offer not found' });

    db.get('SELECT * FROM shipments WHERE id = ? AND user_id = ?', [offer.shipment_id, user_id], (err, shipment) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!shipment) return res.status(403).json({ error: 'Unauthorized or shipment not found' });

      const commission_rate = 0.01; // %1
      const commission_amount = offer.price * commission_rate;
      const nakliyeci_receives = offer.price - commission_amount;

      db.run(
        `INSERT INTO agreements (offer_id, shipment_id, sender_id, nakliyeci_id, agreed_price, commission_amount, nakliyeci_receives, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [offer.id, offer.shipment_id, user_id, offer.nakliyeci_id, offer.price, commission_amount, nakliyeci_receives, 'pending'],
        function(err) {
          if (err) {
            console.error('Error creating agreement:', err.message);
            return res.status(500).json({ error: 'Failed to create agreement' });
          }

          db.run(
            `INSERT INTO commissions (agreement_id, shipment_id, nakliyeci_id, agreed_price, commission_amount, nakliyeci_receives, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [this.lastID, offer.shipment_id, offer.nakliyeci_id, offer.price, commission_amount, nakliyeci_receives, 'pending'],
            function(err) {
              if (err) {
                console.error('Error creating commission record:', err.message);
              }
            }
          );

          res.status(201).json({
            id: this.lastID,
            offer_id: offer.id,
            shipment_id: offer.shipment_id,
            sender_id: user_id,
            nakliyeci_id: offer.nakliyeci_id,
            agreed_price: offer.price,
            commission_amount,
            nakliyeci_receives,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        }
      );
    });
  });
});

app.get('/api/agreements/sender', authenticateToken, (req, res) => {
  const sender_id = req.user.userId;
  const { status } = req.query;

  let query = `SELECT a.*, s.title, s.from_location, s.to_location, s.weight, s.volume,
                      u.name as nakliyeci_name, u.company_name, u.phone, u.avatar
               FROM agreements a
               JOIN shipments s ON a.shipment_id = s.id
               JOIN users u ON a.nakliyeci_id = u.id
               WHERE a.sender_id = ?`;
  const params = [sender_id];

  if (status) {
    query += ` AND a.status = ?`;
    params.push(status);
  }
  query += ` ORDER BY a.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching sender agreements:', err.message);
      return res.status(500).json({ error: 'Failed to fetch sender agreements' });
    }
    res.json(rows);
  });
});

app.get('/api/agreements/nakliyeci', authenticateToken, (req, res) => {
  const nakliyeci_id = req.user.userId;
  const { status } = req.query;

  let query = `SELECT a.*, s.title, s.from_location, s.to_location, s.weight, s.volume,
                      u.name as sender_name, u.company_name as sender_company, u.phone as sender_phone
               FROM agreements a
               JOIN shipments s ON a.shipment_id = s.id
               JOIN users u ON a.sender_id = u.id
               WHERE a.nakliyeci_id = ?`;
  const params = [nakliyeci_id];

  if (status) {
    query += ` AND a.status = ?`;
    params.push(status);
  }
  query += ` ORDER BY a.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching nakliyeci agreements:', err.message);
      return res.status(500).json({ error: 'Failed to fetch nakliyeci agreements' });
    }
    res.json(rows);
  });
});

app.put('/api/agreements/:id/accept', authenticateToken, (req, res) => {
  const { id } = req.params;
  const nakliyeci_id = req.user.userId;

  db.get('SELECT * FROM agreements WHERE id = ? AND nakliyeci_id = ?', [id, nakliyeci_id], (err, agreement) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!agreement) return res.status(404).json({ error: 'Agreement not found or unauthorized' });

    db.serialize(() => {
      db.run('UPDATE agreements SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error accepting agreement:', err.message);
          return res.status(500).json({ error: 'Failed to accept agreement' });
        }

        db.run('UPDATE shipments SET status = "in_transit", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [agreement.shipment_id], function(err) {
          if (err) {
            console.error('Error updating shipment status:', err.message);
          }
          res.json({ message: 'Agreement accepted', agreement_id: id });
        });
      });
    });
  });
});

app.put('/api/agreements/:id/reject', authenticateToken, (req, res) => {
  const { id } = req.params;
  const nakliyeci_id = req.user.userId;

  db.get('SELECT * FROM agreements WHERE id = ? AND nakliyeci_id = ?', [id, nakliyeci_id], (err, agreement) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!agreement) return res.status(404).json({ error: 'Agreement not found or unauthorized' });

    db.run('UPDATE agreements SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error rejecting agreement:', err.message);
        return res.status(500).json({ error: 'Failed to reject agreement' });
      }
      res.json({ message: 'Agreement rejected', agreement_id: id });
    });
  });
});

// Tracking routes
app.put('/api/tracking/:shipment_id/status', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const { status, location, notes, image_url } = req.body;
  const nakliyeci_id = req.user.userId;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  db.get(
    `SELECT a.id FROM agreements a WHERE a.shipment_id = ? AND a.nakliyeci_id = ? AND a.status = 'accepted'`,
    [shipment_id, nakliyeci_id],
    (err, agreement) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!agreement) {
        return res.status(403).json({ error: 'Unauthorized to update status for this shipment' });
      }

      db.serialize(() => {
        db.run(
          `UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [status, shipment_id],
          function(err) {
            if (err) {
              console.error('Error updating shipment status:', err.message);
              return res.status(500).json({ error: 'Failed to update shipment status' });
            }

            db.run(
              `INSERT INTO tracking_updates (shipment_id, status, location, notes, image_url, updated_by)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [shipment_id, status, location, notes, image_url, nakliyeci_id],
              function(err) {
                if (err) {
                  console.error('Error inserting tracking update:', err.message);
                }
                res.json({ message: 'Shipment status updated', shipment_id, status });
              }
            );
          }
        );
      });
    }
  );
});

app.get('/api/tracking/:shipment_id/history', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const user_id = req.user.userId;

  db.get(
    `SELECT s.user_id as sender_id, a.nakliyeci_id
     FROM shipments s
     LEFT JOIN agreements a ON s.id = a.shipment_id
     WHERE s.id = ? AND (s.user_id = ? OR a.nakliyeci_id = ?)`,
    [shipment_id, user_id, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!result) {
        return res.status(403).json({ error: 'Unauthorized to view tracking history for this shipment' });
      }

      db.all(
        `SELECT tu.*, u.name as updated_by_name, u.company_name
         FROM tracking_updates tu
         JOIN users u ON tu.updated_by = u.id
         WHERE tu.shipment_id = ? ORDER BY tu.created_at ASC`,
        [shipment_id],
        (err, rows) => {
          if (err) {
            console.error('Error fetching tracking history:', err.message);
            return res.status(500).json({ error: 'Failed to fetch tracking history' });
          }
          res.json(rows);
        }
      );
    }
  );
});

app.get('/api/tracking/:user_type/active', authenticateToken, (req, res) => {
  const { user_type } = req.params;
  const user_id = req.user.userId;

  let query;
  let params = [user_id];

  if (user_type === 'sender') {
    query = `
      SELECT s.*, a.agreed_price, a.commission_amount, a.nakliyeci_receives,
             u.name as nakliyeci_name, u.company_name as nakliyeci_company, u.phone as nakliyeci_phone
      FROM shipments s
      JOIN agreements a ON s.id = a.shipment_id
      JOIN users u ON a.nakliyeci_id = u.id
      WHERE s.user_id = ? AND s.status IN ('accepted', 'in_transit')
      ORDER BY s.created_at DESC
    `;
  } else if (user_type === 'nakliyeci') {
    query = `
      SELECT s.*, a.agreed_price, a.commission_amount, a.nakliyeci_receives,
             u.name as sender_name, u.company_name as sender_company, u.phone as sender_phone
      FROM shipments s
      JOIN agreements a ON s.id = a.shipment_id
      JOIN users u ON a.sender_id = u.id
      WHERE a.nakliyeci_id = ? AND s.status IN ('accepted', 'in_transit')
      ORDER BY s.created_at DESC
    `;
  } else {
    return res.status(400).json({ error: 'Invalid user_type specified' });
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching active shipments:', err.message);
      return res.status(500).json({ error: 'Failed to fetch active shipments' });
    }
    res.json(rows);
  });
});

app.put('/api/tracking/:shipment_id/deliver', authenticateToken, (req, res) => {
  const { shipment_id } = req.params;
  const { rating, feedback } = req.body;
  const sender_id = req.user.userId;

  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  db.get('SELECT * FROM shipments WHERE id = ? AND user_id = ? AND status = "in_transit"', [shipment_id, sender_id], (err, shipment) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!shipment) {
      return res.status(403).json({ error: 'Unauthorized or shipment not in transit' });
    }

    db.serialize(() => {
      db.run('UPDATE shipments SET status = "delivered", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [shipment_id], function(err) {
        if (err) {
          console.error('Error updating shipment to delivered:', err.message);
          return res.status(500).json({ error: 'Failed to update shipment status' });
        }

        db.run(
          `INSERT INTO delivery_confirmations (shipment_id, rating, feedback, confirmed_by)
           VALUES (?, ?, ?, ?)`,
          [shipment_id, rating, feedback, sender_id],
          function(err) {
            if (err) {
              console.error('Error recording delivery confirmation:', err.message);
            }
          }
        );

        db.run(
          `UPDATE commissions SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE shipment_id = ?`,
          [shipment_id],
          function(err) {
            if (err) {
              console.error('Error updating commission status:', err.message);
            }
          }
        );

        res.json({ message: 'Delivery confirmed and shipment marked as delivered', shipment_id });
      });
    });
  });
});

// Commission routes
app.post('/api/commission/calculate', (req, res) => {
  const { agreedPrice } = req.body;
  if (typeof agreedPrice !== 'number' || agreedPrice <= 0) {
    return res.status(400).json({ error: 'Invalid agreedPrice' });
  }
  
  const commissionRate = 0.01; // %1
  const commissionAmount = agreedPrice * commissionRate;
  const nakliyeciReceives = agreedPrice - commissionAmount;
  const yolnetReceives = commissionAmount;
  
  res.json({
    agreedPrice,
    commissionRate,
    commissionAmount,
    nakliyeciReceives,
    yolnetReceives
  });
});

app.get('/api/commission/rate', (req, res) => {
  res.json({ rate: '1%' });
});

app.get('/api/commission/examples', (req, res) => {
  const examples = [100, 500, 1000, 5000, 10000];
  const commissionExamples = examples.map(price => {
    const commissionRate = 0.01;
    const commissionAmount = price * commissionRate;
    const nakliyeciReceives = price - commissionAmount;
    return {
      agreedPrice: price,
      nakliyeciReceives,
      yolnetCommission: commissionAmount,
      percentage: '1%'
    };
  });
  res.json(commissionExamples);
});

app.get('/api/commission/nakliyeci/history', authenticateToken, (req, res) => {
  const nakliyeci_id = req.user.userId;

  db.all(
    `SELECT c.*, s.title, s.from_location, s.to_location, u.name as sender_name, u.company_name as sender_company
     FROM commissions c
     JOIN shipments s ON c.shipment_id = s.id
     JOIN users u ON s.user_id = u.id
     WHERE c.nakliyeci_id = ? ORDER BY c.created_at DESC`,
    [nakliyeci_id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching nakliyeci commission history:', err.message);
        return res.status(500).json({ error: 'Failed to fetch commission history' });
      }
      res.json(rows);
    }
  );
});

// Real-time features routes
app.get('/api/messages', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.receiver_id = ? OR m.sender_id = ?
     ORDER BY m.created_at DESC`,
    [userId, userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching messages:', err.message);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }
      res.json(rows);
    }
  );
});

app.get('/api/notifications', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching notifications:', err.message);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }
      res.json(rows);
    }
  );
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('sendMessage', (message) => {
    console.log('Message received:', message);
    io.emit('receiveMessage', message);
  });

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room ${room}`);
  });
});

// Start server
initDatabase()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend: http://localhost:5173`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, io, db };
