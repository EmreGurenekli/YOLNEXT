const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { authenticateToken } = require('./middleware/auth');
const rateLimit = require('express-rate-limit');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'yolnet-super-secret-jwt-key-2024-production-ready';

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
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Database initialization with comprehensive schema
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

// Routes
app.use('/api/offers', require('./routes/offers'));
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/commission', require('./routes/commission'));

// Health check endpoint
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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, panel_type, company_name, location } = req.body;

    if (!name || !email || !password || !panel_type) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, panel_type, company_name, location) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, panel_type, company_name || null, location || null],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
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
    res.status(500).json({ error: 'Internal server error' });
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
        return res.status(500).json({ error: 'Database error' });
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
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend: http://localhost:5173`);
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
