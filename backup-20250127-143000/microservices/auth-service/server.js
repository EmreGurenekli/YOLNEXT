const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const redis = require('redis');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.connect().then(() => {
  console.log('✅ Auth Service Redis connected');
}).catch((err) => {
  console.error('❌ Auth Service Redis connection failed:', err);
});

// SQLite database
const db = new sqlite3.Database('./auth.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Auth Service Database connected');
  }
});

// Initialize database
db.serialize(() => {
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

  demoUsers.forEach(user => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    db.run(
      `INSERT OR IGNORE INTO users (name, email, password, panel_type, company_name, location) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.name, user.email, hashedPassword, user.panel_type, user.company_name || null, user.location]
    );
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  panel_type: Joi.string().valid('individual', 'corporate', 'nakliyeci', 'tasiyici').required(),
  company_name: Joi.string().optional(),
  location: Joi.string().optional(),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Routes
app.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, panel_type, company_name, location, phone } = value;

    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (name, email, password, panel_type, company_name, location, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, panel_type, company_name || null, location || null, phone || null],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId, email, panel_type },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Cache user data
    await redisClient.setEx(`user:${token}`, 300, JSON.stringify({ userId, email, panel_type }));

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

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, name, email, password, panel_type, company_name, location, phone, avatar 
         FROM users WHERE email = ?`,
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, panel_type: user.panel_type },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Cache user data
    await redisClient.setEx(`user:${token}`, 300, JSON.stringify({ 
      userId: user.id, 
      email: user.email, 
      panel_type: user.panel_type 
    }));

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

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  db.get(
    `SELECT id, name, email, panel_type, company_name, location, phone, avatar, created_at 
     FROM users WHERE id = ?`,
    [userId],
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;





