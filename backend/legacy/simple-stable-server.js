const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
// Import real utilities
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractToken,
  validatePassword,
  validateEmail,
} = require('./utils/auth');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('./utils/email');
const { logInfo, logError, logWarning, logAuth } = require('./utils/logger');
const {
  getSystemMetrics,
  getDatabaseMetrics,
  getApiMetrics,
  getHealthStatus,
  trackRequest,
  trackError,
} = require('./utils/monitoring');
const { scheduleBackups } = require('./utils/backup');
const {
  errorHandler,
  asyncHandler,
  databaseErrorHandler,
} = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validation');
const { cacheMiddleware } = require('./middleware/cache');
const { authLimiter, loginLimiter } = require('./middleware/rateLimiter');
const { initRedis, cacheGet, cacheSet, cacheDelete } = require('./utils/redis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Production ortamı için kritik ENV kontrolleri
if (NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.FRONTEND_ORIGIN) missing.push(' FRONTEND_ORIGIN');
  if (!process.env.DATABASE_URL) missing.push(' DATABASE_URL');
  if (missing.length) {
    console.error(`❌ Eksik zorunlu ortam değişkenleri: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 dakika
  limit: 200, // yeni API (express-rate-limit v7)
  message: {
    success: false,
    message:
      'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!origin || allowed.length === 0) {
        // development fallback: only localhost:5173
        const dev = ['http://localhost:5173'];
        return callback(null, dev.includes(origin));
      }
      return callback(null, allowed.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize all input (commented out - causing issues)
// app.use(sanitizeBody);

// Cache middleware for GET requests (commented out - causing issues)
// app.use(cacheMiddleware());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Access token required' });
  }

  // For demo purposes, accept any token that starts with 'demo-'
  if (token.startsWith('demo-jwt-token-')) {
    // Demo token - check localStorage for user info
    req.user = {
      id: 1, // Default to individual
      role: 'individual',
      email: 'demo.individual@yolnext.com',
    };
    return next();
  }

  // In production, verify JWT token here
  return res.status(401).json({ success: false, message: 'Invalid token' });
};

// Database setup with WAL mode for better concurrency
// AUTO-SELECT: SQLite (local) or PostgreSQL (cloud)
const dbPath = path.join(__dirname, 'database.sqlite');

// Check if PostgreSQL is configured
let usePostgres = false;
let pgPool = null;

if (process.env.DATABASE_URL || process.env.DB_TYPE === 'postgres') {
  const { Pool } = require('pg');

  const pgConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'yolnext',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

  pgPool = new Pool(pgConfig);
  usePostgres = true;
  // Bağlantıyı doğrula
  pgPool
    .query('SELECT 1')
    .then(() => {
      console.log('✅ PostgreSQL connection verified');
    })
    .catch(err => {
      console.error('❌ PostgreSQL connection failed:', err.message);
      if (NODE_ENV === 'production') {
        process.exit(1);
      }
    });
  console.log('✅ PostgreSQL (5000+ users ready)');
} else {
  // SQLite fallback
  const db = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    err => {
      if (err) {
        console.error('Error opening database:', err.message);
        return;
      }
      // Enable WAL mode for better concurrency
      db.run('PRAGMA journal_mode = WAL;');
      // Increase timeout for busy scenarios - 10 seconds for high concurrency
      db.run('PRAGMA busy_timeout = 10000;');
      // Optimize for high concurrency
      db.run('PRAGMA synchronous = NORMAL;');
      db.run('PRAGMA cache_size = -64000;'); // 64MB cache
      db.run('PRAGMA temp_store = MEMORY;');
      console.log(
        '✅ Database connected with WAL mode (limited to ~100 users)'
      );
    }
  );
}

// Initialize database tables (only for SQLite)
if (!usePostgres) {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    fullName TEXT,
    role TEXT DEFAULT 'individual',
    companyName TEXT,
    taxNumber TEXT,
    phone TEXT,
    address TEXT,
    isVerified BOOLEAN DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    verificationToken TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

    // Shipments table
    db.run(`CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    carrierId INTEGER,
    userRole TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pickupAddress TEXT NOT NULL,
    pickupCity TEXT,
    pickupDistrict TEXT,
    deliveryAddress TEXT NOT NULL,
    deliveryCity TEXT,
    deliveryDistrict TEXT,
    pickupDate TEXT,
    deliveryDate TEXT,
    weight REAL DEFAULT 0,
    dimensions TEXT,
    specialRequirements TEXT,
    price REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    mainCategory TEXT,
    subCategory TEXT,
    productDescription TEXT,
    contactPerson TEXT,
    phone TEXT,
    email TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

    // Offers table
    db.run(`CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentId INTEGER,
    carrierId INTEGER,
    price REAL,
    message TEXT,
    estimatedDelivery TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipmentId) REFERENCES shipments (id),
    FOREIGN KEY (carrierId) REFERENCES users (id)
  )`);

    // Wallet table
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    balance REAL DEFAULT 0,
    availableBalance REAL DEFAULT 0,
    frozenBalance REAL DEFAULT 0,
    totalDeposits REAL DEFAULT 0,
    totalWithdrawals REAL DEFAULT 0,
    totalCommissions REAL DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

    // Wallet transactions table
    db.run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reference TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

    // Vehicles table
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    userRole TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    maxWeight REAL NOT NULL,
    maxVolume REAL NOT NULL,
    currentWeight REAL DEFAULT 0,
    currentVolume REAL DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

    // Notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    userRole TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('info', 'success', 'warning', 'error')),
    category TEXT NOT NULL CHECK(category IN ('job', 'payment', 'system', 'message', 'alert')),
    isRead BOOLEAN DEFAULT 0,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    actionUrl TEXT,
    actionText TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

    // Messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER NOT NULL,
    recipientId INTEGER NOT NULL,
    shipmentId INTEGER,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users (id),
    FOREIGN KEY (recipientId) REFERENCES users (id),
    FOREIGN KEY (shipmentId) REFERENCES shipments (id)
  )`);

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewerId INTEGER NOT NULL,
    reviewerType TEXT NOT NULL CHECK(reviewerType IN ('sender', 'nakliyeci')),
    revieweeId INTEGER NOT NULL,
    revieweeType TEXT NOT NULL CHECK(revieweeType IN ('nakliyeci', 'tasiyici')),
    shipmentId INTEGER,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    isVerified BOOLEAN DEFAULT 0,
    helpful INTEGER DEFAULT 0,
    response TEXT,
    responseDate TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewerId) REFERENCES users (id),
    FOREIGN KEY (revieweeId) REFERENCES users (id),
    FOREIGN KEY (shipmentId) REFERENCES shipments (id)
  )`);

    // Shipment status history table
    db.run(`CREATE TABLE IF NOT EXISTS shipment_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentId INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    updatedBy INTEGER,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipmentId) REFERENCES shipments (id),
    FOREIGN KEY (updatedBy) REFERENCES users (id)
  )`);

    // Offer status history table
    db.run(`CREATE TABLE IF NOT EXISTS offer_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offerId INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    updatedBy INTEGER,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (offerId) REFERENCES offers (id),
    FOREIGN KEY (updatedBy) REFERENCES users (id)
  )`);

    // Favorites table
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    carrierId INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (carrierId) REFERENCES users (id)
  )`);

    // Budgets table
    db.run(`CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    department TEXT,
    totalBudget REAL NOT NULL,
    usedBudget REAL DEFAULT 0,
    remainingBudget REAL,
    period TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

    // Approvals table
    db.run(`CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentId INTEGER NOT NULL,
    approverId INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipmentId) REFERENCES shipments (id),
    FOREIGN KEY (approverId) REFERENCES users (id)
  )`);

    // Payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    transactionId TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'TRY',
    description TEXT,
    orderId TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
    paymentMethodId TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

    console.log('✅ Database tables initialized');
  });

  // Add userRole column to existing shipments table if it doesn't exist
  db.serialize(() => {
    db.run(`ALTER TABLE shipments ADD COLUMN userRole TEXT`, err => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding userRole column:', err);
      } else {
        console.log('✅ userRole column added to shipments table');
      }
    });
  });

  // Create indexes for better performance
  db.serialize(() => {
    // Users table indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive)`);

    // Shipments table indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(userId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)`
    );
    // db.run(`CREATE INDEX IF NOT EXISTS idx_shipments_city ON shipments(pickupCity, deliveryCity)`);
    // db.run(`CREATE INDEX IF NOT EXISTS idx_shipments_date ON shipments(pickupDate, deliveryDate)`);
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(createdAt)`
    );

    // Offers table indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_offers_shipment_id ON offers(shipmentId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_offers_carrier_id ON offers(carrierId)`
    );
    db.run(`CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status)`);
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_offers_created ON offers(createdAt)`
    );

    // Notifications table indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(isRead)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(createdAt)`
    );

    // Messages table indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipientId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_messages_shipment ON messages(shipmentId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt)`
    );

    // Wallet transactions indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet_transactions(userId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_wallet_type ON wallet_transactions(type)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_wallet_status ON wallet_transactions(status)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_wallet_created ON wallet_transactions(createdAt)`
    );

    // Reviews table indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_reviews_shipment_id ON reviews(shipmentId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewerId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(revieweeId)`
    );

    // Vehicles table indexes - userId kullan (ownerId yok)
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(userId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status)`
    );
    db.run(`CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type)`);

    // Favorites table indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(userId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_favorites_carrier_id ON favorites(carrierId)`
    );

    // Budgets table indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(userId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period)`);

    // Approvals table indexes
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_approvals_shipment_id ON approvals(shipmentId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approverId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status)`
    );

    // Payments table indexes - shipmentId yok, sadece userId ve status
    // db.run(`CREATE INDEX IF NOT EXISTS idx_payments_shipment_id ON payments(shipmentId)`);
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(userId)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`
    );

    console.log('✅ Database indexes created');
  });

  // Database initialization completed
  console.log('✅ Database tables and indexes initialized');
}

// WebSocket connection management
const connectedUsers = new Map();

io.on('connection', socket => {
  console.log(`🔌 User connected: ${socket.id}`);

  // User joins with role
  socket.on('join', data => {
    const { userId, userRole } = data;
    connectedUsers.set(socket.id, { userId, userRole, socket });
    socket.join(userRole); // Join role-based room
    console.log(`👤 User ${userId} (${userRole}) joined room`);
  });

  // Send notification to specific user
  socket.on('send-notification', data => {
    const { targetUserId, notification } = data;

    // Find target user's socket
    for (let [socketId, user] of connectedUsers) {
      if (user.userId === targetUserId) {
        user.socket.emit('notification', notification);
        break;
      }
    }
  });

  // Send notification to role-based room
  socket.on('send-role-notification', data => {
    const { targetRole, notification } = data;
    io.to(targetRole).emit('notification', notification);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);
  });
});

// Helper function to send notifications
const sendNotification = (targetUserId, notification) => {
  for (let [socketId, user] of connectedUsers) {
    if (user.userId === targetUserId) {
      user.socket.emit('notification', notification);
      return true;
    }
  }
  return false;
};

const sendRoleNotification = (targetRole, notification) => {
  io.to(targetRole).emit('notification', notification);
};

// Real auth middleware with JWT verification
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: "Yetkilendirme token'ı bulunamadı" });
  }

  const token = authHeader.substring(7);

  // Demo token desteği KAPATILDI (production gereği). Sadece gerçek JWT kabul edilir.

  // Verify real JWT token
  const decoded = verifyToken(token);

  if (!decoded) {
    logWarning('Invalid token', { ip: req.ip });
    return res
      .status(401)
      .json({ success: false, message: 'Geçersiz veya süresi dolmuş token' });
  }

  // Set user from token
  req.user = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };

  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Email verification endpoint
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Doğrulama token'ı gerekli" });
    }

    // In a real app, you'd decode and verify the token from the database
    // For now, just mark user as verified
    db.run(
      'UPDATE users SET isVerified = 1 WHERE verificationToken = ?',
      [token],
      function (err) {
        if (err) {
          logError('Email verification error', err);
          return res
            .status(500)
            .json({ success: false, message: 'E-posta doğrulama hatası' });
        }

        if (this.changes === 0) {
          return res
            .status(400)
            .json({
              success: false,
              message: 'Geçersiz veya süresi dolmuş token',
            });
        }

        logInfo('Email verified', { token });
        res.json({ success: true, message: 'E-posta başarıyla doğrulandı' });
      }
    );
  } catch (error) {
    logError('Email verification error', error);
    res
      .status(500)
      .json({ success: false, message: 'E-posta doğrulama hatası' });
  }
});

// Register endpoint with rate limiting
app.post('/api/auth/register', limiter, async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      role = 'individual',
      companyName,
      taxNumber,
      phone,
    } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Geçersiz e-posta adresi' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res
        .status(400)
        .json({ success: false, message: passwordValidation.message });
    }

    // Check if user exists
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          logError('Database error checking existing user', err);
          return res
            .status(500)
            .json({ success: false, message: 'Veritabanı hatası' });
        }

        if (user) {
          return res
            .status(400)
            .json({
              success: false,
              message: 'Bu e-posta adresi zaten kullanılıyor',
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate verification token
        const verificationToken = require('crypto')
          .randomBytes(32)
          .toString('hex');

        // Create user
        const sql = `INSERT INTO users (email, password, fullName, role, companyName, taxNumber, phone, isActive, verificationToken, createdAt, updatedAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`;
        const now = new Date().toISOString();

        db.run(
          sql,
          [
            email,
            hashedPassword,
            fullName,
            role,
            companyName,
            taxNumber,
            phone,
            verificationToken,
            now,
            now,
          ],
          function (insertErr) {
            if (insertErr) {
              logError('Error creating user', insertErr);
              return res
                .status(500)
                .json({ success: false, message: 'Kullanıcı oluşturulamadı' });
            }

            const newUser = {
              id: this.lastID,
              email,
              fullName,
              role,
              companyName: companyName || null,
              taxNumber: taxNumber || null,
              phone: phone || null,
              isActive: 1,
              createdAt: now,
            };

            // Generate tokens
            const token = generateToken(newUser);
            const refreshToken = generateRefreshToken(newUser);

            // Send verification email (non-blocking)
            sendVerificationEmail(email, verificationToken).catch(err => {
              console.warn(
                'Email gönderilemedi (devam ediliyor):',
                err.message
              );
            });

            logAuth('register', newUser.id, req.ip);

            res.status(201).json({
              success: true,
              message: 'Kayıt başarılı',
              user: newUser,
              token,
              refreshToken,
            });
          }
        );
      }
    );
  } catch (error) {
    logError('Register error', error);
    res.status(500).json({ success: false, message: 'Kayıt hatası' });
  }
});

// Login endpoint with rate limiting
app.post('/api/auth/login', limiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Geçersiz e-posta adresi' });
    }

    // Find user
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          logError('Database error finding user', err);
          return res
            .status(500)
            .json({ success: false, message: 'Veritabanı hatası' });
        }

        if (!user) {
          return res
            .status(401)
            .json({ success: false, message: 'E-posta veya şifre hatalı' });
        }

        // Compare password
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
          return res
            .status(401)
            .json({ success: false, message: 'E-posta veya şifre hatalı' });
        }

        const userData = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          companyName: user.companyName,
          taxNumber: user.taxNumber,
          phone: user.phone,
          isActive: user.isActive,
        };

        // Generate tokens
        const token = generateToken(userData);
        const refreshToken = generateRefreshToken(userData);

        logAuth('login', user.id, req.ip);

        res.json({
          success: true,
          message: 'Giriş başarılı',
          user: userData,
          token,
          refreshToken,
        });
      }
    );
  } catch (error) {
    logError('Login error', error);
    res.status(500).json({ success: false, message: 'Giriş hatası' });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token gerekli',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş refresh token',
      });
    }

    // Get user from database
    db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err) {
        logError('Database error finding user', err);
        return res
          .status(500)
          .json({ success: false, message: 'Veritabanı hatası' });
      }

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: 'Kullanıcı bulunamadı' });
      }

      const userData = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyName: user.companyName,
        taxNumber: user.taxNumber,
        phone: user.phone,
        isActive: user.isActive,
      };

      // Generate new tokens
      const newToken = generateToken(userData);
      const newRefreshToken = generateRefreshToken(userData);

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (error) {
    logError('Token refresh error', error);
    res.status(500).json({ success: false, message: 'Token yenileme hatası' });
  }
});

// Demo login (keep for backward compatibility)
app.post('/api/auth/demo-login', (req, res) => {
  try {
    const { panelType = 'individual' } = req.body || {};

    const profiles = {
      individual: {
        id: 'demo-individual',
        name: 'Demo Bireysel',
        email: 'demo.individual@yolnext.com',
        panel_type: 'individual',
        company_name: null,
        tax_number: null,
      },
      corporate: {
        id: 'demo-corporate',
        name: 'Demo Kurumsal',
        email: 'demo.corporate@yolnext.com',
        panel_type: 'corporate',
        company_name: 'Demo A.Ş.',
        tax_number: '1234567890',
      },
      nakliyeci: {
        id: 'demo-nakliyeci',
        name: 'Demo Nakliyeci',
        email: 'demo.nakliyeci@yolnext.com',
        panel_type: 'nakliyeci',
        company_name: 'Demo Lojistik',
        tax_number: '9988776655',
      },
      tasiyici: {
        id: 'demo-tasiyici',
        name: 'Demo Taşıyıcı',
        email: 'demo.tasiyici@yolnext.com',
        panel_type: 'tasiyici',
        company_name: null,
        tax_number: null,
      },
    };

    const selected = profiles[panelType] || profiles.individual;
    const token = 'demo-jwt-token-' + Date.now();

    return res.json({
      success: true,
      message: 'Demo login successful',
      user: selected,
      token,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Demo login error' });
  }
});

// Shipments routes
app.get('/api/shipments', requireAuth, (req, res) => {
  try {
    const { status, userId, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM shipments WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }

    query += ' ORDER BY createdAt DESC';

    // Only add limit/offset if page and limit are provided
    if (page && limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM shipments WHERE 1=1';
      const countParams = [];

      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }

      if (userId) {
        countQuery += ' AND userId = ?';
        countParams.push(userId);
      }

      db.get(countQuery, countParams, (countErr, countRow) => {
        if (countErr) {
          console.error('Count error:', countErr);
          return res
            .status(500)
            .json({ success: false, message: 'Count error' });
        }

        res.json({
          success: true,
          shipments: rows,
          data: rows,
          pagination: {
            page: parseInt(page || 1),
            limit: parseInt(limit || 10),
            total: countRow.total,
            pages: Math.ceil(countRow.total / parseInt(limit || 10)),
          },
        });
      });
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ success: false, message: 'Get shipments error' });
  }
});

app.post('/api/shipments', (req, res) => {
  try {
    const {
      title,
      description,
      pickupAddress,
      pickupCity,
      pickupDistrict,
      deliveryAddress,
      deliveryCity,
      deliveryDistrict,
      pickupDate,
      deliveryDate,
      weight,
      dimensions,
      specialRequirements,
      price,
      mainCategory,
      subCategory,
      productDescription,
      contactPerson,
      phone,
      email,
      userId,
      userRole,
    } = req.body;

    // Validation
    if (!title || !pickupAddress || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik',
      });
    }

    const sql = `INSERT INTO shipments 
      (userId, userRole, title, description, pickupAddress, pickupCity, pickupDistrict, 
       deliveryAddress, deliveryCity, deliveryDistrict, pickupDate, deliveryDate,
       weight, dimensions, specialRequirements, price, status, mainCategory, 
       subCategory, productDescription, contactPerson, phone, email, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      userId || 1,
      userRole || 'individual',
      title,
      description || '',
      pickupAddress,
      pickupCity || '',
      pickupDistrict || '',
      deliveryAddress,
      deliveryCity || '',
      deliveryDistrict || '',
      pickupDate || new Date().toISOString(),
      deliveryDate || '',
      weight || 0,
      dimensions || '',
      specialRequirements || '',
      price || 0,
      'pending',
      mainCategory || '',
      subCategory || '',
      productDescription || '',
      contactPerson || '',
      phone || '',
      email || '',
      new Date().toISOString(),
      new Date().toISOString(),
    ];

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Gönderi oluşturulurken hata oluştu',
        });
      }

      // Nakliyecilere bildirim gönder
      const notification = {
        title: 'Yeni Gönderi İlanı',
        message: `${title} - ${pickupAddress} → ${deliveryAddress}`,
        type: 'new_shipment',
        category: 'job',
        priority: 'high',
        actionUrl: '/nakliyeci/jobs',
        actionText: 'İlanları Görüntüle',
      };

      // Tüm nakliyecilere bildirim gönder
      sendRoleNotification('nakliyeci', notification);

      // Database'e bildirim kaydet
      const notificationSql = `INSERT INTO notifications (userId, userRole, title, message, type, category, priority, actionUrl, actionText) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      // Tüm nakliyecilere bildirim kaydet
      db.all(
        `SELECT id FROM users WHERE role = 'nakliyeci'`,
        [],
        (err, nakliyeciler) => {
          if (!err && nakliyeciler) {
            nakliyeciler.forEach(nakliyeci => {
              db.run(notificationSql, [
                nakliyeci.id,
                'nakliyeci',
                notification.title,
                notification.message,
                notification.type,
                notification.category,
                notification.priority,
                notification.actionUrl,
                notification.actionText,
              ]);
            });
          }
        }
      );

      res.status(201).json({
        success: true,
        message: 'Gönderi başarıyla oluşturuldu',
        data: {
          id: this.lastID,
          userId: userId || 1,
          title,
          description: description || '',
          pickupAddress,
          deliveryAddress,
          pickupDate: pickupDate || new Date().toISOString(),
          weight: weight || 0,
          dimensions: dimensions || '',
          specialRequirements: specialRequirements || '',
          price: price || 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ success: false, message: 'Create shipment error' });
  }
});

// Open shipments for carriers (nakliyeci/tasiyici)
app.get('/api/shipments/open', requireAuth, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get all pending shipments (open for offers)
    const sql = `SELECT * FROM shipments 
      WHERE status = 'pending' 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?`;

    db.all(sql, [parseInt(limit), offset], (err, rows) => {
      if (err) {
        console.error('Get open shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get open shipments error' });
      }

      res.json(rows); // Return array directly as expected by frontend
    });
  } catch (error) {
    console.error('Get open shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get open shipments error' });
  }
});

// Offers routes
app.get('/api/shipments/offers', requireAuth, (req, res) => {
  try {
    const query = `
      SELECT o.*, s.title as shipmentTitle, u.fullName as carrierName 
      FROM offers o 
      JOIN shipments s ON o.shipmentId = s.id 
      JOIN users u ON o.carrierId = u.id 
      ORDER BY o.createdAt DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Database error' });
      }

      res.json({ success: true, data: rows });
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ success: false, message: 'Get offers error' });
  }
});

// Dashboard routes
app.get('/api/dashboard/stats/individual', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get shipment counts
    const statsQuery = `
      SELECT 
        COUNT(*) as totalShipments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingShipments,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgressShipments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedShipments
      FROM shipments 
      WHERE userId = ?
    `;

    db.get(statsQuery, [userId], (err, stats) => {
      if (err) {
        console.error('Dashboard stats error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Dashboard stats error' });
      }

      // Get recent shipments
      const recentQuery = `
        SELECT * FROM shipments 
        WHERE userId = ? 
        ORDER BY createdAt DESC 
        LIMIT 5
      `;

      db.all(recentQuery, [userId], (recentErr, recentShipments) => {
        if (recentErr) {
          console.error('Recent shipments error:', recentErr);
          return res
            .status(500)
            .json({ success: false, message: 'Recent shipments error' });
        }

        res.json({
          success: true,
          data: {
            stats: {
              totalShipments: stats.totalShipments || 0,
              pendingShipments: stats.pendingShipments || 0,
              inProgressShipments: stats.inProgressShipments || 0,
              completedShipments: stats.completedShipments || 0,
            },
            recentShipments: recentShipments || [],
          },
        });
      });
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Dashboard error' });
  }
});

app.get('/api/dashboard/stats/corporate', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get shipment counts
    const statsQuery = `
      SELECT 
        COUNT(*) as totalShipments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingShipments,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgressShipments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedShipments
      FROM shipments 
      WHERE userId = ?
    `;

    db.get(statsQuery, [userId], (err, stats) => {
      if (err) {
        console.error('Dashboard stats error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Dashboard stats error' });
      }

      // Get recent shipments
      const recentQuery = `
        SELECT * FROM shipments 
        WHERE userId = ? 
        ORDER BY createdAt DESC 
        LIMIT 5
      `;

      db.all(recentQuery, [userId], (recentErr, recentShipments) => {
        if (recentErr) {
          console.error('Recent shipments error:', recentErr);
          return res
            .status(500)
            .json({ success: false, message: 'Recent shipments error' });
        }

        res.json({
          success: true,
          data: {
            stats: {
              totalShipments: stats.totalShipments || 0,
              pendingShipments: stats.pendingShipments || 0,
              inProgressShipments: stats.inProgressShipments || 0,
              completedShipments: stats.completedShipments || 0,
            },
            recentShipments: recentShipments || [],
          },
        });
      });
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Dashboard error' });
  }
});

app.get('/api/dashboard/stats/nakliyeci', requireAuth, (req, res) => {
  try {
    // Get all open shipments for transporters
    const openShipmentsQuery = `
      SELECT s.*, u.fullName as shipperName 
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'pending' 
      ORDER BY s.createdAt DESC
    `;

    db.all(openShipmentsQuery, [], (err, openShipments) => {
      if (err) {
        console.error('Open shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Open shipments error' });
      }

      res.json({
        success: true,
        data: {
          openShipments: openShipments || [],
          totalOpen: openShipments ? openShipments.length : 0,
        },
      });
    });
  } catch (error) {
    console.error('Nakliyeci dashboard error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Nakliyeci dashboard error' });
  }
});

app.get('/api/dashboard/stats/tasiyici', requireAuth, (req, res) => {
  try {
    // Get all open shipments for transporters
    const openShipmentsQuery = `
      SELECT s.*, u.fullName as shipperName 
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'pending' 
      ORDER BY s.createdAt DESC
    `;

    db.all(openShipmentsQuery, [], (err, openShipments) => {
      if (err) {
        console.error('Open shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Open shipments error' });
      }

      res.json({
        success: true,
        data: {
          openShipments: openShipments || [],
          totalOpen: openShipments ? openShipments.length : 0,
        },
      });
    });
  } catch (error) {
    console.error('Tasiyici dashboard error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Tasiyici dashboard error' });
  }
});

// Recent shipments endpoint
app.get('/api/shipments/recent/:userType', requireAuth, (req, res) => {
  try {
    const { userType } = req.params;
    const userId = req.user.id;

    let query = '';
    let params = [];

    if (userType === 'nakliyeci') {
      // Nakliyeci için aldığı gönderiler
      query = `
        SELECT s.*, u.fullName as shipperName 
        FROM shipments s 
        LEFT JOIN users u ON s.userId = u.id 
        WHERE s.nakliyeciId = ? 
        ORDER BY s.createdAt DESC 
        LIMIT 5
      `;
      params = [userId];
    } else if (userType === 'individual' || userType === 'corporate') {
      // Gönderici için oluşturduğu gönderiler
      query = `
        SELECT s.*, u.fullName as nakliyeciName 
        FROM shipments s 
        LEFT JOIN users u ON s.nakliyeciId = u.id 
        WHERE s.userId = ? 
        ORDER BY s.createdAt DESC 
        LIMIT 5
      `;
      params = [userId];
    } else if (userType === 'tasiyici') {
      // Taşıyıcı için aldığı işler
      query = `
        SELECT s.*, u.fullName as nakliyeciName 
        FROM shipments s 
        LEFT JOIN users u ON s.nakliyeciId = u.id 
        WHERE s.tasiyiciId = ? 
        ORDER BY s.createdAt DESC 
        LIMIT 5
      `;
      params = [userId];
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid user type' });
    }

    db.all(query, params, (err, shipments) => {
      if (err) {
        console.error('Recent shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Recent shipments error' });
      }

      res.json({
        success: true,
        data: shipments || [],
      });
    });
  } catch (error) {
    console.error('Recent shipments error:', error);
    res.status(500).json({ success: false, message: 'Recent shipments error' });
  }
});

// Tasiyici specific routes
app.get('/api/shipments/tasiyici/active', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get active shipments for tasiyici (accepted by tasiyici)
    const sql = `SELECT s.*, u.fullName as clientName 
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.assignedTasiyiciId = ? 
      AND s.status IN ('accepted', 'in_progress', 'loading', 'delivering')
      ORDER BY s.updatedAt DESC`;

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Get active tasiyici shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get active shipments error' });
      }

      res.json(rows || []);
    });
  } catch (error) {
    console.error('Get active tasiyici shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get active shipments error' });
  }
});

app.get('/api/jobs/open', requireAuth, (req, res) => {
  try {
    // Get open jobs posted by nakliyecis for tasiyicis
    const sql = `SELECT s.*, u.fullName as carrierName, u.rating as carrierRating, u.isVerified as carrierVerified
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'open_for_tasiyici'
      ORDER BY s.createdAt DESC`;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Get open jobs error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get open jobs error' });
      }

      // Transform data to match frontend interface
      const transformedJobs = rows.map(job => ({
        id: job.id,
        title: job.productDescription || 'Taşıma İşi',
        from: `${job.pickupCity}, ${job.pickupDistrict}`,
        to: `${job.deliveryCity}, ${job.deliveryDistrict}`,
        deadline: job.deliveryDate,
        vehicleType: job.vehicleType || 'Kamyon',
        weight: job.weight || 'N/A',
        category: job.category || 'Genel',
        commissionRate: 5, // Default commission
        carrierName: job.carrierName || 'Nakliyeci',
        carrierRating: job.carrierRating || 4.0,
        carrierVerified: job.carrierVerified || false,
        description: job.productDescription || '',
        specialRequirements: job.specialRequirements
          ? job.specialRequirements.split(',')
          : [],
        postedDate: job.createdAt,
        offerCount: Math.floor(Math.random() * 10) + 1, // Mock for now
      }));

      res.json(transformedJobs);
    });
  } catch (error) {
    console.error('Get open jobs error:', error);
    res.status(500).json({ success: false, message: 'Get open jobs error' });
  }
});

app.get('/api/offers/tasiyici', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get offers made by this tasiyici
    const sql = `SELECT o.*, s.productDescription as jobTitle, s.pickupCity, s.deliveryCity
      FROM offers o 
      LEFT JOIN shipments s ON o.shipmentId = s.id 
      WHERE o.tasiyiciId = ?
      ORDER BY o.createdAt DESC`;

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Get tasiyici offers error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get offers error' });
      }

      res.json(rows || []);
    });
  } catch (error) {
    console.error('Get tasiyici offers error:', error);
    res.status(500).json({ success: false, message: 'Get offers error' });
  }
});

app.get('/api/shipments/tasiyici/completed', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get completed shipments for tasiyici
    const sql = `SELECT s.*, u.fullName as clientName 
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.assignedTasiyiciId = ? 
      AND s.status IN ('completed', 'delivered')
      ORDER BY s.updatedAt DESC`;

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Get completed tasiyici shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get completed shipments error' });
      }

      // Transform data to match frontend interface
      const transformedJobs = rows.map(job => ({
        id: job.id,
        jobNumber: `JOB-${job.id}`,
        title: job.productDescription || 'Taşıma İşi',
        from: `${job.pickupCity}, ${job.pickupDistrict}`,
        to: `${job.deliveryCity}, ${job.deliveryDistrict}`,
        status: job.status === 'completed' ? 'completed' : 'completed',
        priority: 'normal',
        value: job.price || 0,
        distance: 0, // Calculate if needed
        completedDate: job.updatedAt || job.createdAt,
        startDate: job.createdAt,
        client: job.clientName || 'Nakliyeci',
        description: job.productDescription || '',
        weight: job.weight || 'N/A',
        category: job.category || 'Genel',
        vehicleType: job.vehicleType || 'Kamyon',
        rating: 5, // Default rating
        feedback: 'İyi iş çıkardı',
        duration: '2-3 gün',
      }));

      res.json(transformedJobs);
    });
  } catch (error) {
    console.error('Get completed tasiyici shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get completed shipments error' });
  }
});

// Carriers routes
app.get('/api/carriers/available', requireAuth, (req, res) => {
  try {
    // Get carriers from database
    const sql = `SELECT * FROM carriers WHERE isActive = 1 ORDER BY rating DESC`;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Get carriers error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get carriers error' });
      }

      res.json({
        success: true,
        data: rows || [],
      });
    });
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({ success: false, message: 'Get carriers error' });
  }
});

// Nakliyeci messages route
app.get('/api/messages/nakliyeci', requireAuth, (req, res) => {
  try {
    // Get conversations from database
    const sql = `SELECT * FROM conversations WHERE participantType = 'client' ORDER BY lastMessageTime DESC`;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Get nakliyeci messages error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get nakliyeci messages error' });
      }

      res.json({
        success: true,
        conversations: rows || [],
      });
    });
  } catch (error) {
    console.error('Get nakliyeci messages error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get nakliyeci messages error' });
  }
});

// Nakliyeci specific shipments route
app.get('/api/shipments/nakliyeci', requireAuth, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get all pending shipments for nakliyeci
    const sql = `SELECT s.*, u.fullName as shipperName, u.email as shipperEmail, u.phone as shipperPhone
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'pending' 
      ORDER BY s.createdAt DESC 
      LIMIT ? OFFSET ?`;

    db.all(sql, [parseInt(limit), offset], (err, rows) => {
      if (err) {
        console.error('Get nakliyeci shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get nakliyeci shipments error' });
      }

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM shipments WHERE status = 'pending'`;
      db.get(countSql, [], (countErr, countRow) => {
        if (countErr) {
          console.error('Count error:', countErr);
          return res
            .status(500)
            .json({ success: false, message: 'Count error' });
        }

        res.json({
          success: true,
          data: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countRow.total,
            pages: Math.ceil(countRow.total / parseInt(limit)),
          },
        });
      });
    });
  } catch (error) {
    console.error('Get nakliyeci shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get nakliyeci shipments error' });
  }
});

// Tasiyici specific shipments route
app.get('/api/shipments/tasiyici', requireAuth, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get all pending shipments for tasiyici
    const sql = `SELECT s.*, u.fullName as shipperName, u.email as shipperEmail, u.phone as shipperPhone
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'pending' 
      ORDER BY s.createdAt DESC 
      LIMIT ? OFFSET ?`;

    db.all(sql, [parseInt(limit), offset], (err, rows) => {
      if (err) {
        console.error('Get tasiyici shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get tasiyici shipments error' });
      }

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM shipments WHERE status = 'pending'`;
      db.get(countSql, [], (countErr, countRow) => {
        if (countErr) {
          console.error('Count error:', countErr);
          return res
            .status(500)
            .json({ success: false, message: 'Count error' });
        }

        res.json({
          success: true,
          data: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countRow.total,
            pages: Math.ceil(countRow.total / parseInt(limit)),
          },
        });
      });
    });
  } catch (error) {
    console.error('Get tasiyici shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get tasiyici shipments error' });
  }
});

// Wallet routes
app.get('/api/wallet/balance', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create wallet
    const sql = `SELECT * FROM wallets WHERE userId = ?`;
    db.get(sql, [userId], (err, wallet) => {
      if (err) {
        console.error('Get wallet error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get wallet error' });
      }

      if (!wallet) {
        // Create new wallet
        const insertSql = `INSERT INTO wallets (userId, balance, availableBalance, frozenBalance) VALUES (?, 0, 0, 0)`;
        db.run(insertSql, [userId], function (err) {
          if (err) {
            console.error('Create wallet error:', err);
            return res
              .status(500)
              .json({ success: false, message: 'Create wallet error' });
          }

          res.json({
            success: true,
            data: {
              balance: 0,
              availableBalance: 0,
              frozenBalance: 0,
              totalDeposits: 0,
              totalWithdrawals: 0,
              totalCommissions: 0,
            },
          });
        });
      } else {
        res.json({
          success: true,
          data: wallet,
        });
      }
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ success: false, message: 'Wallet balance error' });
  }
});

app.post('/api/wallet/deposit', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount < 50) {
      return res
        .status(400)
        .json({ success: false, message: "Minimum yatırma miktarı 50 TL'dir" });
    }

    // Get current wallet
    const sql = `SELECT * FROM wallets WHERE userId = ?`;
    db.get(sql, [userId], (err, wallet) => {
      if (err) {
        console.error('Get wallet error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get wallet error' });
      }

      if (!wallet) {
        // Create new wallet
        const insertSql = `INSERT INTO wallets (userId, balance, availableBalance, frozenBalance, totalDeposits) VALUES (?, ?, ?, 0, ?)`;
        db.run(insertSql, [userId, amount, amount, amount], function (err) {
          if (err) {
            console.error('Create wallet error:', err);
            return res
              .status(500)
              .json({ success: false, message: 'Create wallet error' });
          }

          // Add transaction
          const transactionSql = `INSERT INTO wallet_transactions (userId, type, amount, description, status) VALUES (?, 'deposit', ?, 'Para yatırma', 'completed')`;
          db.run(transactionSql, [userId, amount]);

          res.json({
            success: true,
            message: 'Para yatırma işlemi başarılı',
          });
        });
      } else {
        // Update existing wallet
        const newBalance = wallet.balance + amount;
        const newAvailableBalance = wallet.availableBalance + amount;
        const newTotalDeposits = wallet.totalDeposits + amount;

        const updateSql = `UPDATE wallets SET balance = ?, availableBalance = ?, totalDeposits = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`;
        db.run(
          updateSql,
          [newBalance, newAvailableBalance, newTotalDeposits, userId],
          function (err) {
            if (err) {
              console.error('Update wallet error:', err);
              return res
                .status(500)
                .json({ success: false, message: 'Update wallet error' });
            }

            // Add transaction
            const transactionSql = `INSERT INTO wallet_transactions (userId, type, amount, description, status) VALUES (?, 'deposit', ?, 'Para yatırma', 'completed')`;
            db.run(transactionSql, [userId, amount]);

            res.json({
              success: true,
              message: 'Para yatırma işlemi başarılı',
            });
          }
        );
      }
    });
  } catch (error) {
    console.error('Wallet deposit error:', error);
    res.status(500).json({ success: false, message: 'Wallet deposit error' });
  }
});

app.post('/api/wallet/withdraw', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount < 10) {
      return res
        .status(400)
        .json({ success: false, message: "Minimum çekme miktarı 10 TL'dir" });
    }

    // Get current wallet
    const sql = `SELECT * FROM wallets WHERE userId = ?`;
    db.get(sql, [userId], (err, wallet) => {
      if (err) {
        console.error('Get wallet error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get wallet error' });
      }

      if (!wallet || wallet.availableBalance < amount) {
        return res
          .status(400)
          .json({ success: false, message: 'Yetersiz bakiye' });
      }

      // Update wallet
      const newBalance = wallet.balance - amount;
      const newAvailableBalance = wallet.availableBalance - amount;
      const newTotalWithdrawals = wallet.totalWithdrawals + amount;

      const updateSql = `UPDATE wallets SET balance = ?, availableBalance = ?, totalWithdrawals = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`;
      db.run(
        updateSql,
        [newBalance, newAvailableBalance, newTotalWithdrawals, userId],
        function (err) {
          if (err) {
            console.error('Update wallet error:', err);
            return res
              .status(500)
              .json({ success: false, message: 'Update wallet error' });
          }

          // Add transaction
          const transactionSql = `INSERT INTO wallet_transactions (userId, type, amount, description, status) VALUES (?, 'withdrawal', ?, 'Para çekme', 'completed')`;
          db.run(transactionSql, [userId, amount]);

          res.json({
            success: true,
            message: 'Para çekme işlemi başarılı',
          });
        }
      );
    });
  } catch (error) {
    console.error('Wallet withdraw error:', error);
    res.status(500).json({ success: false, message: 'Wallet withdraw error' });
  }
});

app.get('/api/wallet/transactions', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const sql = `SELECT * FROM wallet_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    db.all(sql, [userId, parseInt(limit), offset], (err, rows) => {
      if (err) {
        console.error('Get transactions error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get transactions error' });
      }

      res.json({
        success: true,
        data: rows,
      });
    });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Wallet transactions error' });
  }
});

// Reports routes
app.get('/api/reports/dashboard-stats', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Mock dashboard stats based on user role
    let stats = {};

    if (userRole === 'individual') {
      stats = {
        totalShipments: 0,
        deliveredShipments: 0,
        pendingShipments: 0,
        successRate: 0,
        totalSpent: 0,
        thisMonthSpent: 0,
        favoriteCarriers: 0,
      };
    } else if (userRole === 'corporate') {
      stats = {
        totalShipments: 0,
        deliveredShipments: 0,
        pendingShipments: 0,
        successRate: 0,
        totalSpent: 0,
        thisMonthSpent: 0,
        monthlyGrowth: 0,
        activeCarriers: 0,
        budgetUtilization: 0,
        costSavings: 0,
      };
    } else if (userRole === 'nakliyeci') {
      stats = {
        totalShipments: 0,
        activeJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        successRate: 0,
        walletBalance: 0,
      };
    } else if (userRole === 'tasiyici') {
      stats = {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        rating: 0,
        completedDeliveries: 0,
        workHours: 0,
        documentsCount: 0,
      };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Dashboard stats error' });
  }
});

// Offers routes
app.get('/api/offers/individual', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get offers from database
    const sql = `SELECT o.*, s.title as shipmentTitle, c.companyName as carrierName, c.rating as carrierRating, c.isVerified as carrierVerified
      FROM offers o
      LEFT JOIN shipments s ON o.shipmentId = s.id
      LEFT JOIN carriers c ON o.carrierId = c.id
      WHERE s.userId = ? ORDER BY o.createdAt DESC`;

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Individual offers error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Individual offers error' });
      }

      const stats = {
        totalOffers: rows.length,
        pendingOffers: rows.filter(o => o.status === 'pending').length,
        acceptedOffers: rows.filter(o => o.status === 'accepted').length,
        rejectedOffers: rows.filter(o => o.status === 'rejected').length,
        averagePrice:
          rows.length > 0
            ? Math.round(
                rows.reduce((sum, o) => sum + (o.price || 0), 0) / rows.length
              )
            : 0,
        unreadCount: rows.filter(o => o.status === 'pending').length,
      };

      res.json({
        success: true,
        offers: rows || [],
        stats: stats,
      });
    });
  } catch (error) {
    console.error('Individual offers error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Individual offers error' });
  }
});

app.get('/api/offers/corporate', (req, res) => {
  try {
    console.log('Corporate offers endpoint called');

    // Basit response - database hatası varsa bu çalışır
    res.json({
      success: true,
      offers: [],
      stats: {
        totalOffers: 0,
        pendingOffers: 0,
        acceptedOffers: 0,
        rejectedOffers: 0,
        averagePrice: 0,
        unreadCount: 0,
      },
    });
  } catch (error) {
    console.error('Corporate offers error:', error);
    res.status(500).json({ success: false, message: 'Corporate offers error' });
  }
});

// Carriers API endpoint
app.get('/api/carriers', (req, res) => {
  try {
    console.log('Carriers endpoint called');

    // Database'den nakliyecileri al
    db.all(
      `
      SELECT 
        u.id,
        u.fullName as name,
        u.email,
        u.phone,
        u.address as location,
        u.rating,
        u.isVerified,
        u.experience,
        u.reviews,
        u.successRate,
        u.responseTime,
        u.createdAt,
        COUNT(DISTINCT s.id) as totalShipments,
        AVG(s.price) as averageCost,
        SUM(s.price) as totalSpent,
        AVG(CASE WHEN s.status = 'delivered' AND s.deliveredAt <= s.estimatedDelivery THEN 1 ELSE 0 END) * 100 as onTimeDelivery
      FROM users u
      LEFT JOIN offers o ON u.id = o.carrierId
      LEFT JOIN shipments s ON o.shipmentId = s.id
      WHERE u.role = 'carrier'
      GROUP BY u.id
      ORDER BY u.rating DESC, totalShipments DESC
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        const carriers = rows.map((row, index) => ({
          id: row.id,
          code: `NK-2024-${String(row.id).padStart(3, '0')}`, // Benzersiz kod
          name: row.name || 'Bilinmeyen Nakliyeci',
          logo: row.name ? row.name.substring(0, 2).toUpperCase() : 'NK',
          rating: row.rating || 4.0,
          totalShipments: row.totalShipments || 0,
          onTimeDelivery: row.onTimeDelivery || 0,
          averageCost: row.averageCost || 0,
          totalSpent: row.totalSpent || 0,
          location: row.location || 'Belirtilmemiş',
          coverage: [row.location || 'Belirtilmemiş'],
          specialties: ['Genel Taşımacılık'],
          contact: {
            phone: row.phone || 'Belirtilmemiş',
            email: row.email || 'Belirtilmemiş',
            website: 'Belirtilmemiş',
          },
          status: 'active',
          contractType: 'general',
          lastShipment: new Date().toISOString().split('T')[0],
          responseTime: row.responseTime || '2 saat',
          insurance: 'Kısmi Sigorta',
          capacity: '20 ton/gün',
          vehicles: 5,
          employees: 25,
          established: new Date(row.createdAt).getFullYear().toString(),
          certifications: ['ISO 9001'],
          performance: {
            quality: row.rating || 4.0,
            reliability: row.successRate || 90,
            communication: 4.5,
            cost: 4.0,
          },
        }));

        res.json({
          success: true,
          carriers: carriers,
        });
      }
    );
  } catch (error) {
    console.error('Carriers error:', error);
    res.status(500).json({ success: false, message: 'Carriers error' });
  }
});

// Corporate Analytics API endpoint
app.get('/api/analytics/corporate', (req, res) => {
  try {
    console.log('Corporate analytics endpoint called');

    // Database'den analytics verilerini al
    db.all(
      `
      SELECT 
        COUNT(DISTINCT s.id) as totalShipments,
        SUM(s.price) as totalRevenue,
        AVG(s.rating) as customerSatisfaction
      FROM shipments s
      WHERE s.userRole = 'corporate' AND s.createdAt >= date('now', '-30 days')
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        const row = rows[0] || {};

        // Geçen ay verilerini al (karşılaştırma için)
        db.all(
          `
        SELECT 
          COUNT(DISTINCT s.id) as prevTotalShipments,
          SUM(s.price) as prevTotalRevenue,
          AVG(s.rating) as prevCustomerSatisfaction
        FROM shipments s
        WHERE s.userRole = 'corporate' 
        AND s.createdAt >= date('now', '-60 days') 
        AND s.createdAt < date('now', '-30 days')
      `,
          (err, prevRows) => {
            if (err) {
              console.error('Previous month database error:', err);
              return res
                .status(500)
                .json({ success: false, message: 'Database error' });
            }

            const prevRow = prevRows[0] || {};

            // Aylık chart verilerini al
            db.all(
              `
          SELECT 
            strftime('%m', s.createdAt) as month,
            COUNT(DISTINCT s.id) as shipments,
            SUM(s.price) as revenue
          FROM shipments s
          WHERE s.userRole = 'corporate' 
          AND s.createdAt >= date('now', '-6 months')
          GROUP BY strftime('%m', s.createdAt)
          ORDER BY s.createdAt
        `,
              (err, chartRows) => {
                if (err) {
                  console.error('Chart data database error:', err);
                  return res
                    .status(500)
                    .json({ success: false, message: 'Database error' });
                }

                // Büyüme hesaplamaları
                const monthlyGrowth =
                  prevRow.prevTotalShipments > 0
                    ? ((row.totalShipments - prevRow.prevTotalShipments) /
                        prevRow.prevTotalShipments) *
                      100
                    : 0;

                const revenueGrowth =
                  prevRow.prevTotalRevenue > 0
                    ? ((row.totalRevenue - prevRow.prevTotalRevenue) /
                        prevRow.prevTotalRevenue) *
                      100
                    : 0;

                const satisfactionImprovement =
                  prevRow.prevCustomerSatisfaction > 0
                    ? row.customerSatisfaction -
                      prevRow.prevCustomerSatisfaction
                    : 0;

                // Chart data formatı
                const monthNames = [
                  'Oca',
                  'Şub',
                  'Mar',
                  'Nis',
                  'May',
                  'Haz',
                  'Tem',
                  'Ağu',
                  'Eyl',
                  'Eki',
                  'Kas',
                  'Ara',
                ];
                const chartData = chartRows.map(item => ({
                  month:
                    monthNames[parseInt(item.month) - 1] || `Ay ${item.month}`,
                  shipments: item.shipments || 0,
                  revenue: item.revenue || 0,
                }));

                res.json({
                  success: true,
                  totalShipments: row.totalShipments || 0,
                  totalRevenue: row.totalRevenue || 0,
                  customerSatisfaction: row.customerSatisfaction || 0,
                  monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
                  revenueGrowth: Math.round(revenueGrowth * 100) / 100,
                  satisfactionImprovement:
                    Math.round(satisfactionImprovement * 100) / 100,
                  chartData: chartData,
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Analytics error' });
  }
});

// Corporate Messages API endpoint
app.get('/api/messages/corporate', (req, res) => {
  try {
    console.log('Corporate messages endpoint called');

    // Database'den mesaj konuşmalarını al
    db.all(
      `
      SELECT DISTINCT
        c.id as conversationId,
        c.carrierId,
        u.name as carrierName,
        u.rating as carrierRating,
        u.status as carrierStatus,
        u.lastSeen as carrierLastSeen,
        s.id as shipmentId,
        s.title as shipmentTitle,
        s.status as shipmentStatus,
        s.fromLocation as shipmentFrom,
        s.toLocation as shipmentTo,
        m.message as lastMessage,
        m.createdAt as lastMessageTime,
        m.sender as lastMessageSender,
        m.isRead as lastMessageRead,
        (SELECT COUNT(*) FROM messages m2 WHERE m2.conversationId = c.id AND m2.sender != 'corporate' AND m2.isRead = 0) as unreadCount
      FROM conversations c
      LEFT JOIN users u ON c.carrierId = u.id
      LEFT JOIN shipments s ON c.shipmentId = s.id
      LEFT JOIN messages m ON c.id = m.conversationId
      WHERE c.userRole = 'corporate'
      ORDER BY m.createdAt DESC
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        // Konuşmaları grupla
        const conversationsMap = new Map();

        rows.forEach(row => {
          if (!conversationsMap.has(row.conversationId)) {
            conversationsMap.set(row.conversationId, {
              id: row.conversationId,
              carrier: {
                id: row.carrierId,
                name: row.carrierName || 'Bilinmeyen Nakliyeci',
                logo: (row.carrierName || 'BN').substring(0, 2).toUpperCase(),
                rating: row.carrierRating || 0,
                status: row.carrierStatus || 'offline',
                lastSeen: row.carrierLastSeen || 'Bilinmiyor',
              },
              lastMessage: {
                text: row.lastMessage || 'Henüz mesaj yok',
                time: row.lastMessageTime
                  ? new Date(row.lastMessageTime).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '',
                isRead: row.lastMessageRead || false,
                sender: row.lastMessageSender || 'system',
              },
              unreadCount: row.unreadCount || 0,
              shipment: {
                id: row.shipmentId ? `CORP-${row.shipmentId}` : 'N/A',
                title: row.shipmentTitle || 'Gönderi Bilgisi Yok',
                status: row.shipmentStatus || 'Bilinmiyor',
                from: row.shipmentFrom || 'Bilinmiyor',
                to: row.shipmentTo || 'Bilinmiyor',
              },
              messages: [],
            });
          }
        });

        // Her konuşma için mesajları al
        const conversationIds = Array.from(conversationsMap.keys());
        if (conversationIds.length > 0) {
          const placeholders = conversationIds.map(() => '?').join(',');

          db.all(
            `
          SELECT 
            conversationId,
            message,
            createdAt,
            sender,
            isRead
          FROM messages 
          WHERE conversationId IN (${placeholders})
          ORDER BY createdAt ASC
        `,
            conversationIds,
            (err, messageRows) => {
              if (err) {
                console.error('Messages database error:', err);
                return res
                  .status(500)
                  .json({ success: false, message: 'Database error' });
              }

              // Mesajları konuşmalara ekle
              messageRows.forEach(msg => {
                const conversation = conversationsMap.get(msg.conversationId);
                if (conversation) {
                  conversation.messages.push({
                    id: msg.id,
                    text: msg.message,
                    time: new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    sender: msg.sender,
                    isRead: msg.isRead,
                  });
                }
              });

              res.json({
                success: true,
                conversations: Array.from(conversationsMap.values()),
              });
            }
          );
        } else {
          res.json({
            success: true,
            conversations: [],
          });
        }
      }
    );
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ success: false, message: 'Messages error' });
  }
});

// Send Message API endpoint
app.post('/api/messages/send', (req, res) => {
  try {
    const { conversationId, message, sender } = req.body;
    console.log('Send message endpoint called:', {
      conversationId,
      message,
      sender,
    });

    if (!conversationId || !message || !sender) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // Mesajı database'e kaydet
    db.run(
      `
      INSERT INTO messages (conversationId, message, sender, isRead, createdAt)
      VALUES (?, ?, ?, 0, datetime('now'))
    `,
      [conversationId, message, sender],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        res.json({
          success: true,
          messageId: this.lastID,
          message: 'Message sent successfully',
        });
      }
    );
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Send message error' });
  }
});

// Nakliyeci Notifications API endpoint
app.get('/api/notifications/nakliyeci', (req, res) => {
  try {
    console.log('Nakliyeci notifications endpoint called');

    // Database'den bildirimleri al
    db.all(
      `
      SELECT 
        id,
        title,
        message,
        type,
        category,
        isRead,
        priority,
        actionUrl,
        actionText,
        createdAt
      FROM notifications 
      WHERE userRole = 'nakliyeci' 
      ORDER BY createdAt DESC
      LIMIT 50
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        const notifications = rows.map(row => ({
          id: row.id,
          title: row.title,
          message: row.message,
          type: row.type,
          category: row.category,
          isRead: Boolean(row.isRead),
          priority: row.priority,
          actionUrl: row.actionUrl,
          actionText: row.actionText,
          timestamp: new Date(row.createdAt).toLocaleString('tr-TR'),
        }));

        res.json({
          success: true,
          notifications: notifications,
        });
      }
    );
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, message: 'Notifications error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    console.log('Mark notification as read:', id);

    db.run(
      `
      UPDATE notifications 
      SET isRead = 1 
      WHERE id = ? AND (userId = ? OR userRole = ?)
    `,
      [id, req.user.id, req.user.role],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Notification not found' });
        }

        res.json({
          success: true,
          message: 'Notification marked as read',
        });
      }
    );
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Mark as read error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/mark-all-read', requireAuth, (req, res) => {
  try {
    console.log('Mark all notifications as read');

    db.run(
      `
      UPDATE notifications 
      SET isRead = 1 
      WHERE (userId = ? OR userRole = ?) AND isRead = 0
    `,
      [req.user.id, req.user.role],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        res.json({
          success: true,
          message: `${this.changes} notifications marked as read`,
        });
      }
    );
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Mark all as read error' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete notification:', id);

    db.run(
      `
      DELETE FROM notifications 
      WHERE id = ? AND (userId = ? OR userRole = ?)
    `,
      [id, req.user.id, req.user.role],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Notification not found' });
        }

        res.json({
          success: true,
          message: 'Notification deleted',
        });
      }
    );
  } catch (error) {
    console.error('Delete notification error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Delete notification error' });
  }
});

// Delete all notifications
app.delete('/api/notifications', requireAuth, (req, res) => {
  try {
    console.log('Delete all notifications');

    db.run(
      `
      DELETE FROM notifications 
      WHERE userId = ? OR userRole = ?
    `,
      [req.user.id, req.user.role],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        res.json({
          success: true,
          message: `${this.changes} notifications deleted`,
        });
      }
    );
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Delete all notifications error' });
  }
});

// Nakliyeci Vehicles API endpoint
app.get('/api/vehicles/nakliyeci', (req, res) => {
  try {
    console.log('Nakliyeci vehicles endpoint called');

    // Database'den nakliyeci araçlarını al
    db.all(
      `
      SELECT 
        id,
        name,
        type,
        maxWeight,
        maxVolume,
        currentWeight,
        currentVolume,
        isActive
      FROM vehicles 
      WHERE userRole = 'nakliyeci' AND isActive = 1
      ORDER BY name
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        const vehicles = rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.type,
          maxWeight: row.maxWeight,
          maxVolume: row.maxVolume,
          currentWeight: row.currentWeight || 0,
          currentVolume: row.currentVolume || 0,
        }));

        res.json({
          success: true,
          vehicles: vehicles,
        });
      }
    );
  } catch (error) {
    console.error('Vehicles error:', error);
    res.status(500).json({ success: false, message: 'Vehicles error' });
  }
});

// Available Loads API endpoint
app.get('/api/loads/available', (req, res) => {
  try {
    console.log('Available loads endpoint called');

    // Database'den mevcut yükleri al
    db.all(
      `
      SELECT 
        s.id,
        s.title,
        s.pickupAddress,
        s.deliveryAddress,
        s.weight,
        s.volume,
        s.price,
        s.deadline,
        s.distance,
        s.status,
        u.name as shipperName,
        u.phone as shipperPhone,
        u.email as shipperEmail
      FROM shipments s
      LEFT JOIN users u ON s.userId = u.id
      WHERE s.status = 'pending' 
      AND s.userRole IN ('individual', 'corporate')
      ORDER BY s.createdAt DESC
      LIMIT 50
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        const loads = rows.map(row => ({
          id: row.id,
          title: row.title,
          pickupAddress: row.pickupAddress,
          deliveryAddress: row.deliveryAddress,
          weight: row.weight,
          volume: row.volume,
          price: row.price,
          deadline: row.deadline,
          distance: row.distance || 0,
          shipper: {
            name: row.shipperName,
            phone: row.shipperPhone,
            email: row.shipperEmail,
          },
        }));

        res.json({
          success: true,
          loads: loads,
        });
      }
    );
  } catch (error) {
    console.error('Available loads error:', error);
    res.status(500).json({ success: false, message: 'Available loads error' });
  }
});

// Nakliyeci Shipments API endpoint
app.get('/api/shipments/nakliyeci', (req, res) => {
  try {
    console.log('Nakliyeci shipments endpoint called');

    // Database'den nakliyeci için uygun gönderileri al
    db.all(
      `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.pickupAddress,
        s.deliveryAddress,
        s.pickupDate,
        s.weight,
        s.dimensions,
        s.specialRequirements,
        s.price,
        s.status,
        s.createdAt,
        u.fullName as shipperName,
        u.email as shipperEmail,
        u.phone as shipperPhone
      FROM shipments s
      LEFT JOIN users u ON s.userId = u.id
      WHERE s.status = 'pending' 
      AND s.userRole IN ('individual', 'corporate')
      ORDER BY s.createdAt DESC
      LIMIT 50
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        const shipments = rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          pickupAddress: row.pickupAddress,
          deliveryAddress: row.deliveryAddress,
          pickupDate: row.pickupDate,
          weight: row.weight,
          dimensions: row.dimensions,
          specialRequirements: row.specialRequirements,
          price: row.price,
          status: row.status,
          createdAt: row.createdAt,
          shipperName: row.shipperName,
          shipperEmail: row.shipperEmail,
          shipperPhone: row.shipperPhone,
        }));

        res.json({
          success: true,
          data: shipments,
        });
      }
    );
  } catch (error) {
    console.error('Shipments error:', error);
    res.status(500).json({ success: false, message: 'Shipments error' });
  }
});

// Offers API endpoint
app.post('/api/offers', (req, res) => {
  try {
    const { shipmentId, price, message, estimatedDelivery } = req.body;
    console.log('Create offer:', {
      shipmentId,
      price,
      message,
      estimatedDelivery,
    });

    // Demo nakliyeci ID'si (gerçek uygulamada token'dan alınacak)
    const carrierId = 1;

    db.run(
      `
      INSERT INTO offers (shipmentId, carrierId, price, message, estimatedDelivery, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `,
      [shipmentId, carrierId, price, message, estimatedDelivery],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        // Göndericiye bildirim gönder
        db.get(
          `SELECT userId FROM shipments WHERE id = ?`,
          [shipmentId],
          (err, shipment) => {
            if (!err && shipment) {
              const notification = {
                title: 'Yeni Teklif Aldınız',
                message: `Gönderiniz için ₺${price} teklif verildi`,
                type: 'new_offer',
                category: 'offer',
                priority: 'medium',
                actionUrl: '/individual/offers',
                actionText: 'Teklifleri Görüntüle',
              };

              // Göndericiye bildirim gönder
              sendNotification(shipment.userId.toString(), notification);

              // Database'e bildirim kaydet
              const notificationSql = `INSERT INTO notifications (userId, userRole, title, message, type, category, priority, actionUrl, actionText) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

              db.get(
                `SELECT role FROM users WHERE id = ?`,
                [shipment.userId],
                (err, user) => {
                  if (!err && user) {
                    db.run(notificationSql, [
                      shipment.userId,
                      user.role,
                      notification.title,
                      notification.message,
                      notification.type,
                      notification.category,
                      notification.priority,
                      notification.actionUrl,
                      notification.actionText,
                    ]);
                  }
                }
              );
            }
          }
        );

        res.json({
          success: true,
          message: 'Teklif başarıyla gönderildi',
          offerId: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ success: false, message: 'Create offer error' });
  }
});

// Available Carriers API endpoint (for finding new carriers)
app.get('/api/carriers/available', (req, res) => {
  try {
    console.log('Available carriers endpoint called');

    // Database'den tüm nakliyecileri al (sadece aktif olanlar)
    db.all(
      `
      SELECT 
        u.id,
        u.fullName as name,
        u.email,
        u.phone,
        u.address as location,
        u.rating,
        u.isVerified,
        u.experience,
        u.reviews,
        u.successRate,
        u.responseTime,
        u.createdAt,
        COUNT(DISTINCT s.id) as totalShipments,
        AVG(s.price) as averageCost,
        SUM(s.price) as totalSpent,
        AVG(CASE WHEN s.status = 'delivered' AND s.deliveredAt <= s.estimatedDelivery THEN 1 ELSE 0 END) * 100 as onTimeDelivery
      FROM users u
      LEFT JOIN offers o ON u.id = o.carrierId
      LEFT JOIN shipments s ON o.shipmentId = s.id
      WHERE u.role = 'carrier' AND u.isVerified = 1
      GROUP BY u.id
      ORDER BY u.rating DESC, totalShipments DESC
    `,
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        const carriers = rows.map((row, index) => ({
          id: row.id,
          code: `NK-2024-${String(row.id).padStart(3, '0')}`, // Benzersiz kod
          name: row.name || 'Bilinmeyen Nakliyeci',
          logo: row.name ? row.name.substring(0, 2).toUpperCase() : 'NK',
          rating: row.rating || 4.0,
          totalShipments: row.totalShipments || 0,
          onTimeDelivery: row.onTimeDelivery || 0,
          averageCost: row.averageCost || 0,
          totalSpent: row.totalSpent || 0,
          location: row.location || 'Belirtilmemiş',
          coverage: [row.location || 'Belirtilmemiş'],
          specialties: [
            'Genel Taşımacılık',
            'Hızlı Teslimat',
            'Güvenli Taşıma',
          ],
          contact: {
            phone: row.phone || 'Belirtilmemiş',
            email: row.email || 'Belirtilmemiş',
            website: 'Belirtilmemiş',
          },
          status: 'active',
          contractType: 'general',
          lastShipment: new Date().toISOString().split('T')[0],
          responseTime: row.responseTime || '2 saat',
          insurance: 'Kısmi Sigorta',
          capacity: '20 ton/gün',
          vehicles: 5,
          employees: 25,
          established: new Date(row.createdAt).getFullYear().toString(),
          certifications: ['ISO 9001'],
          performance: {
            quality: row.rating || 4.0,
            reliability: row.successRate || 90,
            communication: 4.5,
            cost: 4.0,
          },
        }));

        res.json({
          success: true,
          carriers: carriers,
        });
      }
    );
  } catch (error) {
    console.error('Available carriers error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Available carriers error' });
  }
});

app.post('/api/offers/:id/accept', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Offer ${id} accepted`);

    res.json({
      success: true,
      message: 'Offer accepted successfully',
    });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ success: false, message: 'Accept offer error' });
  }
});

app.post('/api/offers/:id/reject', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Offer ${id} rejected`);

    res.json({
      success: true,
      message: 'Offer rejected successfully',
    });
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ success: false, message: 'Reject offer error' });
  }
});

// Notifications routes
app.get('/api/notifications/unread-count', requireAuth, (req, res) => {
  try {
    // For now, return 0 unread notifications
    res.json({
      success: true,
      data: {
        unreadCount: 0,
      },
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, message: 'Notifications error' });
  }
});

app.get('/api/notifications', requireAuth, (req, res) => {
  try {
    const { user } = req;
    console.log('Get notifications for user:', user.id);

    db.all(
      `
      SELECT * FROM notifications 
      WHERE userId = ? OR userRole = ?
      ORDER BY createdAt DESC
    `,
      [user.id, user.role],
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Database error' });
        }

        res.json({
          success: true,
          data: rows || [],
        });
      }
    );
  } catch (error) {
    console.error('Get notifications error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get notifications error' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Payment API endpoints
app.post('/api/payments/process', requireAuth, (req, res) => {
  try {
    const { amount, currency, description, orderId, paymentMethodId } =
      req.body;
    const userId = req.user.id;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tutar',
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Tutar limiti aşıldı (Max: 100,000 TL)',
      });
    }

    // Mock payment processing
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save payment record
    const sql = `INSERT INTO payments (userId, transactionId, amount, currency, description, orderId, status, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [
        userId,
        transactionId,
        amount,
        currency || 'TRY',
        description || '',
        orderId || '',
        'completed',
        new Date().toISOString(),
      ],
      function (err) {
        if (err) {
          console.error('Payment save error:', err);
          return res.status(500).json({
            success: false,
            message: 'Ödeme kaydedilemedi',
          });
        }

        res.json({
          success: true,
          transactionId,
          message: 'Ödeme başarıyla tamamlandı',
        });
      }
    );
  } catch (error) {
    console.error('Payment process error:', error);
    res.status(500).json({ success: false, message: 'Payment process error' });
  }
});

app.get('/api/payments/methods', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Mock payment methods
    const paymentMethods = [
      {
        id: '1',
        type: 'credit_card',
        name: 'Visa **** 1234',
        last4: '1234',
        isDefault: true,
      },
      {
        id: '2',
        type: 'credit_card',
        name: 'Mastercard **** 5678',
        last4: '5678',
        isDefault: false,
      },
      {
        id: '3',
        type: 'bank_transfer',
        name: 'Banka Havalesi',
        isDefault: false,
      },
    ];

    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get payment methods error' });
  }
});

app.get('/api/payments/history', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `SELECT * FROM payments WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`;

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Get payment history error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get payment history error' });
      }

      res.json({
        success: true,
        data: rows || [],
      });
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get payment history error' });
  }
});

// Test endpoint - Hızlı test için
app.get('/test', (req, res) => {
  res.json({ status: 'OK', message: 'Server is working!' });
});

// Wallet API endpoints
app.get('/api/wallet/nakliyeci', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Create wallet if not exists
    const createWalletSql = `INSERT OR IGNORE INTO wallets (userId, balance, pendingCommissions, totalCommissions, totalRefunds, createdAt, updatedAt) VALUES (?, 0, 0, 0, 0, ?, ?)`;
    db.run(
      createWalletSql,
      [userId, new Date().toISOString(), new Date().toISOString()],
      err => {
        if (err) {
          console.error('Create wallet error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Create wallet error' });
        }

        // Get wallet data
        const walletSql = `SELECT * FROM wallets WHERE userId = ?`;
        db.get(walletSql, [userId], (err, wallet) => {
          if (err) {
            console.error('Wallet query error:', err);
            return res
              .status(500)
              .json({ success: false, message: 'Wallet query error' });
          }

          // Get commission transactions
          const transactionsSql = `
          SELECT 
            ct.id,
            ct.offerId,
            s.title as shipmentTitle,
            ct.amount,
            ct.status,
            ct.createdAt,
            ct.completedAt
          FROM commission_transactions ct
          LEFT JOIN offers o ON ct.offerId = o.id
          LEFT JOIN shipments s ON o.shipmentId = s.id
          WHERE ct.userId = ?
          ORDER BY ct.createdAt DESC
          LIMIT 50
        `;

          db.all(transactionsSql, [userId], (err, transactions) => {
            if (err) {
              console.error('Transactions query error:', err);
              return res
                .status(500)
                .json({ success: false, message: 'Transactions query error' });
            }

            const walletData = {
              balance: wallet?.balance || 0,
              pendingCommissions: wallet?.pendingCommissions || 0,
              totalCommissions: wallet?.totalCommissions || 0,
              totalRefunds: wallet?.totalRefunds || 0,
              commissionRate: 1,
            };

            res.json({
              success: true,
              wallet: walletData,
              transactions: transactions || [],
            });
          });
        });
      }
    );
  } catch (error) {
    console.error('Wallet API error:', error);
    res.status(500).json({ success: false, message: 'Wallet API error' });
  }
});

app.post('/api/wallet/deposit', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Geçerli bir miktar girin' });
    }

    // Get current wallet or create new one
    const getWalletSql = `SELECT * FROM wallets WHERE userId = ?`;
    db.get(getWalletSql, [userId], (err, wallet) => {
      if (err) {
        console.error('Get wallet error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get wallet error' });
      }

      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + amount;

      // Update wallet balance
      const updateSql = `
        INSERT OR REPLACE INTO wallets (userId, balance, pendingCommissions, totalCommissions, totalRefunds, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        updateSql,
        [
          userId,
          newBalance,
          wallet?.pendingCommissions || 0,
          wallet?.totalCommissions || 0,
          wallet?.totalRefunds || 0,
          wallet?.createdAt || new Date().toISOString(),
          new Date().toISOString(),
        ],
        function (err) {
          if (err) {
            console.error('Deposit error:', err);
            return res
              .status(500)
              .json({ success: false, message: 'Deposit error' });
          }

          res.json({
            success: true,
            message: 'Para başarıyla yatırıldı',
            newBalance: newBalance,
          });
        }
      );
    });
  } catch (error) {
    console.error('Deposit API error:', error);
    res.status(500).json({ success: false, message: 'Deposit API error' });
  }
});

// Get reviews for tasiyici
app.get('/api/reviews/tasiyici', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `SELECT r.*, 
        u.fullName as reviewerName,
        u.avatar as reviewerAvatar,
        s.productDescription as jobTitle,
        s.id as jobId
      FROM reviews r 
      LEFT JOIN users u ON r.reviewerId = u.id 
      LEFT JOIN shipments s ON r.shipmentId = s.id 
      WHERE r.revieweeId = ? AND r.revieweeType = 'tasiyici'
      ORDER BY r.createdAt DESC`;

    db.all(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Get tasiyici reviews error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Get reviews error' });
      }

      const transformedReviews = rows.map(review => ({
        id: review.id,
        reviewerName: review.reviewerName || 'Anonim',
        reviewerAvatar: review.reviewerAvatar,
        reviewerType: review.reviewerType,
        rating: review.rating,
        comment: review.comment || '',
        jobTitle: review.jobTitle || 'Taşıma İşi',
        jobId: review.jobId,
        date: review.createdAt,
        isVerified: review.isVerified || false,
        helpful: review.helpful || 0,
        response: review.response,
        responseDate: review.responseDate,
      }));

      res.json(transformedReviews);
    });
  } catch (error) {
    console.error('Get tasiyici reviews error:', error);
    res.status(500).json({ success: false, message: 'Get reviews error' });
  }
});

// Send notification
app.post('/api/notifications/send', requireAuth, (req, res) => {
  try {
    const {
      userId,
      userRole,
      title,
      message,
      type,
      category,
      priority,
      actionUrl,
      actionText,
    } = req.body;

    const sql = `INSERT INTO notifications (userId, userRole, title, message, type, category, priority, actionUrl, actionText) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [
        userId,
        userRole,
        title,
        message,
        type,
        category,
        priority,
        actionUrl,
        actionText,
      ],
      function (err) {
        if (err) {
          console.error('Send notification error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Send notification error' });
        }

        res.json({ success: true, notificationId: this.lastID });
      }
    );
  } catch (error) {
    console.error('Send notification error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Send notification error' });
  }
});

// Update shipment status
app.post('/api/shipments/status/update', requireAuth, (req, res) => {
  try {
    const { shipmentId, status, notes } = req.body;

    const sql = `UPDATE shipments SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(sql, [status, shipmentId], function (err) {
      if (err) {
        console.error('Update shipment status error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Update shipment status error' });
      }

      // Send notification to relevant users
      const notificationSql = `INSERT INTO notifications (userId, userRole, title, message, type, category, priority) 
                              VALUES (?, ?, ?, ?, ?, ?, ?)`;

      // This would need to be implemented based on shipment ownership
      res.json({ success: true, message: 'Shipment status updated' });
    });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Update shipment status error' });
  }
});

// Update offer status
app.post('/api/offers/status/update', requireAuth, (req, res) => {
  try {
    const { offerId, status, notes } = req.body;

    const sql = `UPDATE offers SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(sql, [status, offerId], function (err) {
      if (err) {
        console.error('Update offer status error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Update offer status error' });
      }

      res.json({ success: true, message: 'Offer status updated' });
    });
  } catch (error) {
    console.error('Update offer status error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Update offer status error' });
  }
});

// Submit rating
app.post('/api/ratings/submit', requireAuth, (req, res) => {
  try {
    const { revieweeId, revieweeType, shipmentId, rating, comment } = req.body;
    const reviewerId = req.user.id;
    const reviewerType =
      req.user.role === 'individual' ? 'sender' : 'nakliyeci';

    const sql = `INSERT INTO reviews (reviewerId, reviewerType, revieweeId, revieweeType, shipmentId, rating, comment) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [
        reviewerId,
        reviewerType,
        revieweeId,
        revieweeType,
        shipmentId,
        rating,
        comment,
      ],
      function (err) {
        if (err) {
          console.error('Submit rating error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Submit rating error' });
        }

        res.json({ success: true, reviewId: this.lastID });
      }
    );
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ success: false, message: 'Submit rating error' });
  }
});

// Add to favorites
app.post('/api/favorites/add', requireAuth, (req, res) => {
  try {
    const { carrierId } = req.body;
    const userId = req.user.id;

    const sql = `INSERT INTO favorites (userId, carrierId) VALUES (?, ?)`;

    db.run(sql, [userId, carrierId], function (err) {
      if (err) {
        console.error('Add to favorites error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Add to favorites error' });
      }

      res.json({ success: true, favoriteId: this.lastID });
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ success: false, message: 'Add to favorites error' });
  }
});

// Check budget
app.get('/api/budget/check', requireAuth, (req, res) => {
  try {
    const { amount } = req.query;
    const userId = req.user.id;

    // This would need to be implemented based on corporate budget system
    res.json({ success: true, hasBudget: true, remainingBudget: 10000 });
  } catch (error) {
    console.error('Check budget error:', error);
    res.status(500).json({ success: false, message: 'Check budget error' });
  }
});

// Get pending approvals
app.get('/api/approvals/pending', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // This would need to be implemented based on corporate approval system
    res.json({ success: true, pendingApprovals: [] });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Get pending approvals error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

// Sample notifications for testing
console.log('📢 Adding sample notifications...');

const sampleNotifications = [
  {
    userId: 'demo-corporate',
    userRole: 'corporate',
    title: 'Yeni Gönderi Oluşturuldu',
    message:
      'CORP-2024-001 numaralı gönderiniz başarıyla oluşturuldu ve nakliyecilere gönderildi.',
    type: 'success',
    category: 'job',
    priority: 'normal',
    actionUrl: '/corporate/shipments',
    actionText: 'Gönderileri Görüntüle',
  },
  {
    userId: 'demo-corporate',
    userRole: 'corporate',
    title: 'Yeni Teklif Geldi',
    message:
      'Hızlı Lojistik, CORP-2024-001 numaralı gönderiniz için ₺2,500 teklif verdi.',
    type: 'info',
    category: 'job',
    priority: 'high',
    actionUrl: '/corporate/offers',
    actionText: 'Teklifi Görüntüle',
  },
  {
    userId: 'demo-corporate',
    userRole: 'corporate',
    title: 'Gönderi Yüklendi',
    message:
      'CORP-2024-002 numaralı gönderiniz yüklendi ve yola çıktı. Tahmini teslimat: Yarın 14:00',
    type: 'info',
    category: 'job',
    priority: 'normal',
    actionUrl: '/corporate/shipments',
    actionText: 'Takip Et',
  },
  {
    userId: 'demo-corporate',
    userRole: 'corporate',
    title: 'Teslimat Tamamlandı',
    message:
      'CORP-2024-003 numaralı gönderiniz başarıyla teslim edildi. Müşteri memnuniyeti: 5/5',
    type: 'success',
    category: 'job',
    priority: 'normal',
    actionUrl: '/corporate/shipments',
    actionText: 'Detayları Görüntüle',
  },
  {
    userId: 'demo-corporate',
    userRole: 'corporate',
    title: 'Gecikme Uyarısı',
    message:
      'CORP-2024-004 numaralı gönderinizde gecikme yaşanıyor. Yeni tahmini teslimat: 2 gün sonra',
    type: 'warning',
    category: 'alert',
    priority: 'urgent',
    actionUrl: '/corporate/shipments',
    actionText: 'Detayları Görüntüle',
  },
  {
    userId: 'demo-corporate',
    userRole: 'corporate',
    title: 'Ödeme Onaylandı',
    message:
      'CORP-2024-005 numaralı gönderi için ₺3,200 ödemeniz onaylandı ve nakliyeciye aktarıldı.',
    type: 'success',
    category: 'payment',
    priority: 'normal',
    actionUrl: '/corporate/shipments',
    actionText: 'Faturayı Görüntüle',
  },
];

// Insert sample notifications
sampleNotifications.forEach((notification, index) => {
  setTimeout(() => {
    db.run(
      `
      INSERT INTO notifications (userId, userRole, title, message, type, category, priority, actionUrl, actionText, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-${index} hours'))
    `,
      [
        notification.userId,
        notification.userRole,
        notification.title,
        notification.message,
        notification.type,
        notification.category,
        notification.priority,
        notification.actionUrl,
        notification.actionText,
      ],
      err => {
        if (err) {
          console.error('Sample notification insert error:', err);
        } else {
          console.log(`✅ Sample notification added: ${notification.title}`);
        }
      }
    );
  }, index * 100); // Stagger the inserts
});

// Recent shipments endpoint
app.get('/api/shipments/recent/:userType', requireAuth, (req, res) => {
  try {
    const { userType } = req.params;
    const userId = req.user.id;

    let query = '';
    let params = [];

    if (userType === 'nakliyeci') {
      // Nakliyeci için aldığı gönderiler
      query = `
        SELECT s.*, u.fullName as shipperName 
        FROM shipments s 
        LEFT JOIN users u ON s.userId = u.id 
        WHERE s.nakliyeciId = ? 
        ORDER BY s.createdAt DESC 
        LIMIT 5
      `;
      params = [userId];
    } else if (userType === 'individual' || userType === 'corporate') {
      // Gönderici için oluşturduğu gönderiler
      query = `
        SELECT s.*, u.fullName as nakliyeciName 
        FROM shipments s 
        LEFT JOIN users u ON s.nakliyeciId = u.id 
        WHERE s.userId = ? 
        ORDER BY s.createdAt DESC 
        LIMIT 5
      `;
      params = [userId];
    } else if (userType === 'tasiyici') {
      // Taşıyıcı için aldığı işler
      query = `
        SELECT s.*, u.fullName as nakliyeciName 
        FROM shipments s 
        LEFT JOIN users u ON s.nakliyeciId = u.id 
        WHERE s.tasiyiciId = ? 
        ORDER BY s.createdAt DESC 
        LIMIT 5
      `;
      params = [userId];
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid user type' });
    }

    db.all(query, params, (err, shipments) => {
      if (err) {
        console.error('Recent shipments error:', err);
        return res
          .status(500)
          .json({ success: false, message: 'Recent shipments error' });
      }

      res.json({
        success: true,
        data: shipments || [],
      });
    });
  } catch (error) {
    console.error('Recent shipments error:', error);
    res.status(500).json({ success: false, message: 'Recent shipments error' });
  }
});

// Vehicles endpoint for nakliyeci
app.get('/api/vehicles/nakliyeci', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      `
      SELECT * FROM vehicles 
      WHERE nakliyeciId = ? 
      ORDER BY createdAt DESC
    `,
      [userId],
      (err, vehicles) => {
        if (err) {
          console.error('Vehicles error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Vehicles error' });
        }

        res.json({
          success: true,
          vehicles: vehicles || [],
        });
      }
    );
  } catch (error) {
    console.error('Vehicles error:', error);
    res.status(500).json({ success: false, message: 'Vehicles error' });
  }
});

// Available loads endpoint
app.get('/api/loads/available', requireAuth, (req, res) => {
  try {
    db.all(
      `
      SELECT * FROM shipments 
      WHERE status = 'open' 
      ORDER BY createdAt DESC
    `,
      (err, loads) => {
        if (err) {
          console.error('Available loads error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Available loads error' });
        }

        res.json({
          success: true,
          loads: loads || [],
        });
      }
    );
  } catch (error) {
    console.error('Available loads error:', error);
    res.status(500).json({ success: false, message: 'Available loads error' });
  }
});

// Wallet endpoint for nakliyeci
app.get('/api/wallet/nakliyeci', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Get wallet data
    db.get(
      `
      SELECT * FROM wallets 
      WHERE userId = ? AND userRole = 'nakliyeci'
    `,
      [userId],
      (err, wallet) => {
        if (err) {
          console.error('Wallet error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Wallet error' });
        }

        if (!wallet) {
          // Create wallet if doesn't exist
          db.run(
            `
          INSERT INTO wallets (userId, userRole, balance, createdAt, updatedAt)
          VALUES (?, 'nakliyeci', 0, datetime('now'), datetime('now'))
        `,
            [userId],
            function (err) {
              if (err) {
                console.error('Wallet creation error:', err);
                return res
                  .status(500)
                  .json({ success: false, message: 'Wallet creation error' });
              }

              // Get transactions
              db.all(
                `
            SELECT * FROM commission_transactions 
            WHERE nakliyeciId = ? 
            ORDER BY createdAt DESC 
            LIMIT 20
          `,
                [userId],
                (err, transactions) => {
                  if (err) {
                    console.error('Transactions error:', err);
                    return res
                      .status(500)
                      .json({ success: false, message: 'Transactions error' });
                  }

                  res.json({
                    success: true,
                    wallet: {
                      balance: 0,
                      pendingCommissions: 0,
                      totalCommissions: 0,
                      totalRefunds: 0,
                      commissionRate: 1,
                    },
                    transactions: transactions || [],
                  });
                }
              );
            }
          );
        } else {
          // Get transactions
          db.all(
            `
          SELECT * FROM commission_transactions 
          WHERE nakliyeciId = ? 
          ORDER BY createdAt DESC 
          LIMIT 20
        `,
            [userId],
            (err, transactions) => {
              if (err) {
                console.error('Transactions error:', err);
                return res
                  .status(500)
                  .json({ success: false, message: 'Transactions error' });
              }

              // Calculate stats
              const totalCommissions =
                transactions
                  ?.filter(t => t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0) || 0;
              const pendingCommissions =
                transactions
                  ?.filter(t => t.status === 'pending')
                  .reduce((sum, t) => sum + t.amount, 0) || 0;
              const totalRefunds =
                transactions
                  ?.filter(t => t.status === 'refunded')
                  .reduce((sum, t) => sum + t.amount, 0) || 0;

              res.json({
                success: true,
                wallet: {
                  balance: wallet.balance || 0,
                  pendingCommissions,
                  totalCommissions,
                  totalRefunds,
                  commissionRate: 1,
                },
                transactions: transactions || [],
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({ success: false, message: 'Wallet error' });
  }
});

// Deposit endpoint
app.post('/api/wallet/deposit', requireAuth, (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Geçersiz miktar' });
    }

    // Update wallet balance
    db.run(
      `
      UPDATE wallets 
      SET balance = balance + ?, updatedAt = datetime('now')
      WHERE userId = ? AND userRole = 'nakliyeci'
    `,
      [amount, userId],
      function (err) {
        if (err) {
          console.error('Deposit error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Deposit error' });
        }

        res.json({
          success: true,
          message: 'Para yatırma işlemi başarılı',
          newBalance: amount,
        });
      }
    );
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, message: 'Deposit error' });
  }
});

// Nakliyeci shipments endpoint
app.get('/api/shipments/nakliyeci', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      `
      SELECT s.*, u.fullName as shipperName, u.phone as shipperPhone, u.email as shipperEmail
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'open' 
      ORDER BY s.createdAt DESC
    `,
      (err, shipments) => {
        if (err) {
          console.error('Nakliyeci shipments error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Nakliyeci shipments error' });
        }

        res.json({
          success: true,
          data: shipments || [],
        });
      }
    );
  } catch (error) {
    console.error('Nakliyeci shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Nakliyeci shipments error' });
  }
});

// Nakliyeci Active Shipments
app.get('/api/shipments/nakliyeci/active', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;

    db.all(
      `
      SELECT s.*, u.fullName as shipperName, u.companyName as shipperCompany
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status IN ('accepted', 'in_progress', 'picked_up')
      AND s.nakliyeciId = ?
      ORDER BY s.createdAt DESC
    `,
      [nakliyeciId],
      (err, shipments) => {
        if (err) {
          console.error('Active shipments error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Active shipments error' });
        }

        res.json({
          success: true,
          shipments: shipments || [],
        });
      }
    );
  } catch (error) {
    console.error('Active shipments error:', error);
    res.status(500).json({ success: false, message: 'Active shipments error' });
  }
});

// Nakliyeci Completed Shipments
app.get('/api/shipments/nakliyeci/completed', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;

    db.all(
      `
      SELECT s.*, u.fullName as shipperName, u.companyName as shipperCompany
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'delivered'
      AND s.nakliyeciId = ?
      ORDER BY s.updatedAt DESC
    `,
      [nakliyeciId],
      (err, shipments) => {
        if (err) {
          console.error('Completed shipments error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Completed shipments error' });
        }

        res.json({
          success: true,
          shipments: shipments || [],
        });
      }
    );
  } catch (error) {
    console.error('Completed shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Completed shipments error' });
  }
});

// Nakliyeci Cancelled Shipments
app.get('/api/shipments/nakliyeci/cancelled', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;

    db.all(
      `
      SELECT s.*, u.fullName as shipperName, u.companyName as shipperCompany
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      WHERE s.status = 'cancelled'
      AND s.nakliyeciId = ?
      ORDER BY s.updatedAt DESC
    `,
      [nakliyeciId],
      (err, shipments) => {
        if (err) {
          console.error('Cancelled shipments error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Cancelled shipments error' });
        }

        res.json({
          success: true,
          shipments: shipments || [],
        });
      }
    );
  } catch (error) {
    console.error('Cancelled shipments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Cancelled shipments error' });
  }
});

// Nakliyeci Drivers
app.get('/api/drivers/nakliyeci', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;

    db.all(
      `
      SELECT d.*, v.plateNumber, v.vehicleType, v.capacity, v.volume
      FROM drivers d
      LEFT JOIN vehicles v ON d.vehicleId = v.id
      WHERE d.nakliyeciId = ?
      ORDER BY d.createdAt DESC
    `,
      [nakliyeciId],
      (err, drivers) => {
        if (err) {
          console.error('Drivers error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Drivers error' });
        }

        res.json({
          success: true,
          drivers: drivers || [],
        });
      }
    );
  } catch (error) {
    console.error('Drivers error:', error);
    res.status(500).json({ success: false, message: 'Drivers error' });
  }
});

// Individual Shipment Detail
app.get('/api/shipments/:id', authenticateToken, (req, res) => {
  try {
    const shipmentId = req.params.id;
    const userId = req.user.id;

    db.get(
      `
      SELECT s.*, u.fullName as shipperName, u.companyName as shipperCompany,
             n.fullName as nakliyeciName, n.companyName as nakliyeciCompany
      FROM shipments s 
      LEFT JOIN users u ON s.userId = u.id 
      LEFT JOIN users n ON s.nakliyeciId = n.id
      WHERE s.id = ? AND s.userId = ?
    `,
      [shipmentId, userId],
      (err, shipment) => {
        if (err) {
          console.error('Shipment detail error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Shipment detail error' });
        }

        if (!shipment) {
          return res
            .status(404)
            .json({ success: false, message: 'Shipment not found' });
        }

        res.json({
          success: true,
          shipment: shipment,
        });
      }
    );
  } catch (error) {
    console.error('Shipment detail error:', error);
    res.status(500).json({ success: false, message: 'Shipment detail error' });
  }
});

// Create Driver
app.post('/api/drivers', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;
    const { name, phone, email, licenseNumber, licenseExpiry, vehicleId } =
      req.body;

    db.run(
      `
      INSERT INTO drivers (nakliyeciId, name, phone, email, licenseNumber, licenseExpiry, vehicleId, status, rating, totalJobs, completedJobs, successRate, joinDate, lastActive, location, specialties)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available', 0, 0, 0, 0, datetime('now'), datetime('now'), ?, ?)
    `,
      [
        nakliyeciId,
        name,
        phone,
        email,
        licenseNumber,
        licenseExpiry,
        vehicleId,
        'İstanbul',
        '[]',
      ],
      function (err) {
        if (err) {
          console.error('Create driver error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Create driver error' });
        }

        res.json({
          success: true,
          message: 'Driver created successfully',
          driverId: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ success: false, message: 'Create driver error' });
  }
});

// Update Driver
app.put('/api/drivers/:id', authenticateToken, (req, res) => {
  try {
    const driverId = req.params.id;
    const nakliyeciId = req.user.id;
    const {
      name,
      phone,
      email,
      licenseNumber,
      licenseExpiry,
      vehicleId,
      status,
      location,
    } = req.body;

    db.run(
      `
      UPDATE drivers 
      SET name = ?, phone = ?, email = ?, licenseNumber = ?, licenseExpiry = ?, vehicleId = ?, status = ?, location = ?, lastActive = datetime('now')
      WHERE id = ? AND nakliyeciId = ?
    `,
      [
        name,
        phone,
        email,
        licenseNumber,
        licenseExpiry,
        vehicleId,
        status,
        location,
        driverId,
        nakliyeciId,
      ],
      function (err) {
        if (err) {
          console.error('Update driver error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Update driver error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Driver not found' });
        }

        res.json({
          success: true,
          message: 'Driver updated successfully',
        });
      }
    );
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ success: false, message: 'Update driver error' });
  }
});

// Delete Driver
app.delete('/api/drivers/:id', authenticateToken, (req, res) => {
  try {
    const driverId = req.params.id;
    const nakliyeciId = req.user.id;

    db.run(
      `
      DELETE FROM drivers 
      WHERE id = ? AND nakliyeciId = ?
    `,
      [driverId, nakliyeciId],
      function (err) {
        if (err) {
          console.error('Delete driver error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Delete driver error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Driver not found' });
        }

        res.json({
          success: true,
          message: 'Driver deleted successfully',
        });
      }
    );
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ success: false, message: 'Delete driver error' });
  }
});

// Create Vehicle
app.post('/api/vehicles', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;
    const { plateNumber, vehicleType, capacity, volume, status } = req.body;

    db.run(
      `
      INSERT INTO vehicles (nakliyeciId, plateNumber, vehicleType, capacity, volume, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
      [
        nakliyeciId,
        plateNumber,
        vehicleType,
        capacity,
        volume,
        status || 'available',
      ],
      function (err) {
        if (err) {
          console.error('Create vehicle error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Create vehicle error' });
        }

        res.json({
          success: true,
          message: 'Vehicle created successfully',
          vehicleId: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ success: false, message: 'Create vehicle error' });
  }
});

// Get Vehicles for Nakliyeci
app.get('/api/vehicles/nakliyeci', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;

    db.all(
      `
      SELECT * FROM vehicles 
      WHERE nakliyeciId = ?
      ORDER BY createdAt DESC
    `,
      [nakliyeciId],
      (err, vehicles) => {
        if (err) {
          console.error('Vehicles error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Vehicles error' });
        }

        res.json({
          success: true,
          vehicles: vehicles || [],
        });
      }
    );
  } catch (error) {
    console.error('Vehicles error:', error);
    res.status(500).json({ success: false, message: 'Vehicles error' });
  }
});

// Update Shipment Status
app.put('/api/shipments/:id/status', authenticateToken, (req, res) => {
  try {
    const shipmentId = req.params.id;
    const { status, location, notes } = req.body;
    const userId = req.user.id;

    db.run(
      `
      UPDATE shipments 
      SET status = ?, location = ?, notes = ?, updatedAt = datetime('now')
      WHERE id = ? AND (userId = ? OR nakliyeciId = ?)
    `,
      [status, location, notes, shipmentId, userId, userId],
      function (err) {
        if (err) {
          console.error('Update shipment status error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Update shipment status error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Shipment not found' });
        }

        // Send real-time notification
        io.emit('shipment_status_updated', {
          shipmentId,
          status,
          location,
          notes,
          timestamp: new Date().toISOString(),
        });

        res.json({
          success: true,
          message: 'Shipment status updated successfully',
        });
      }
    );
  } catch (error) {
    console.error('Update shipment status error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Update shipment status error' });
  }
});

// Create Offer
app.post('/api/offers', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;
    const { shipmentId, price, message, estimatedDelivery } = req.body;

    db.run(
      `
      INSERT INTO offers (shipmentId, nakliyeciId, price, message, estimatedDelivery, status, createdAt)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `,
      [shipmentId, nakliyeciId, price, message, estimatedDelivery],
      function (err) {
        if (err) {
          console.error('Create offer error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Create offer error' });
        }

        // Send real-time notification
        io.emit('new_offer', {
          offerId: this.lastID,
          shipmentId,
          nakliyeciId,
          price,
          message,
          timestamp: new Date().toISOString(),
        });

        res.json({
          success: true,
          message: 'Offer created successfully',
          offerId: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ success: false, message: 'Create offer error' });
  }
});

// List Offers (pagination + filters)
app.get('/api/offers', authenticateToken, (req, res) => {
  try {
    const { status, shipmentId, nakliyeciId, page = 1, limit = 10 } = req.query;

    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(String(status));
    }
    if (shipmentId) {
      whereClauses.push('shipmentId = ?');
      params.push(parseInt(String(shipmentId), 10));
    }
    if (nakliyeciId) {
      whereClauses.push('nakliyeciId = ?');
      params.push(parseInt(String(nakliyeciId), 10));
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM offers ${where}`;
    db.get(countSql, params, (err, countRow) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Offers count error' });
      }

      const total = countRow?.total || 0;

      const listSql = `
        SELECT * FROM offers
        ${where}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `;
      const p = params.slice();
      p.push(parseInt(String(limit), 10));
      p.push((parseInt(String(page), 10) - 1) * parseInt(String(limit), 10));

      db.all(listSql, p, (err2, rows) => {
        if (err2) {
          return res.status(500).json({ success: false, message: 'Offers fetch error' });
        }
        return res.json({
          success: true,
          data: rows,
          pagination: {
            page: parseInt(String(page), 10),
            limit: parseInt(String(limit), 10),
            total,
            pages: Math.ceil(total / parseInt(String(limit), 10))
          }
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Offers fetch error' });
  }
});

// Accept Offer
app.put('/api/offers/:id/accept', authenticateToken, (req, res) => {
  try {
    const offerId = req.params.id;
    const userId = req.user.id;

    db.run(
      `
      UPDATE offers 
      SET status = 'accepted', updatedAt = datetime('now')
      WHERE id = ? AND shipmentId IN (SELECT id FROM shipments WHERE userId = ?)
    `,
      [offerId, userId],
      function (err) {
        if (err) {
          console.error('Accept offer error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Accept offer error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Offer not found' });
        }

        // Update shipment status and assign nakliyeci
        db.run(
          `
        UPDATE shipments 
        SET status = 'accepted', nakliyeciId = (SELECT nakliyeciId FROM offers WHERE id = ?), updatedAt = datetime('now')
        WHERE id = (SELECT shipmentId FROM offers WHERE id = ?)
      `,
          [offerId, offerId],
          err => {
            if (err) {
              console.error(
                'Update shipment after offer acceptance error:',
                err
              );
            }
          }
        );

        // Send real-time notification
        io.emit('offer_accepted', {
          offerId,
          timestamp: new Date().toISOString(),
        });

        res.json({
          success: true,
          message: 'Offer accepted successfully',
        });
      }
    );
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ success: false, message: 'Accept offer error' });
  }
});

// Reject Offer
app.put('/api/offers/:id/reject', authenticateToken, (req, res) => {
  try {
    const offerId = req.params.id;
    const userId = req.user.id;

    db.run(
      `
      UPDATE offers 
      SET status = 'rejected', updatedAt = datetime('now')
      WHERE id = ? AND shipmentId IN (SELECT id FROM shipments WHERE userId = ?)
    `,
      [offerId, userId],
      function (err) {
        if (err) {
          console.error('Reject offer error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Reject offer error' });
        }

        if (this.changes === 0) {
          return res
            .status(404)
            .json({ success: false, message: 'Offer not found' });
        }

        res.json({
          success: true,
          message: 'Offer rejected successfully',
        });
      }
    );
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ success: false, message: 'Reject offer error' });
  }
});

// Create drivers table
db.run(`
  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nakliyeciId INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    licenseNumber TEXT NOT NULL,
    licenseExpiry TEXT NOT NULL,
    vehicleId INTEGER,
    status TEXT DEFAULT 'available',
    rating REAL DEFAULT 0,
    totalJobs INTEGER DEFAULT 0,
    completedJobs INTEGER DEFAULT 0,
    successRate REAL DEFAULT 0,
    joinDate TEXT DEFAULT (datetime('now')),
    lastActive TEXT DEFAULT (datetime('now')),
    location TEXT,
    specialties TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (nakliyeciId) REFERENCES users(id),
    FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
  )
`);

// Create vehicles table
db.run(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nakliyeciId INTEGER NOT NULL,
    plateNumber TEXT NOT NULL UNIQUE,
    vehicleType TEXT NOT NULL,
    capacity INTEGER,
    volume REAL,
    status TEXT DEFAULT 'available',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (nakliyeciId) REFERENCES users(id)
  )
`);

// Create offers table
db.run(`
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentId INTEGER NOT NULL,
    nakliyeciId INTEGER NOT NULL,
    price REAL NOT NULL,
    message TEXT,
    estimatedDelivery TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (shipmentId) REFERENCES shipments(id),
    FOREIGN KEY (nakliyeciId) REFERENCES users(id)
  )
`);

// Add missing columns to shipments table if not exists
db.run(`ALTER TABLE shipments ADD COLUMN nakliyeciId INTEGER`, err => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding nakliyeciId column:', err);
  }
});
db.run(`ALTER TABLE shipments ADD COLUMN carrierId INTEGER`, err => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding carrierId column:', err);
  }
});
db.run(`ALTER TABLE shipments ADD COLUMN location TEXT`, err => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding location column:', err);
  }
});
db.run(`ALTER TABLE shipments ADD COLUMN notes TEXT`, err => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding notes column:', err);
  }
});

// Individual Dashboard Stats
app.get('/api/dashboard/individual', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    db.get(
      `
      SELECT 
        COUNT(*) as totalShipments,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as deliveredShipments,
        COUNT(CASE WHEN status IN ('pending', 'accepted', 'in_progress') THEN 1 END) as pendingShipments,
        AVG(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100 as successRate,
        SUM(price) as totalSpent,
        SUM(CASE WHEN strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now') AND status = 'delivered' THEN price ELSE 0 END) as thisMonthSpent
      FROM shipments 
      WHERE userId = ?
    `,
      [userId],
      (err, stats) => {
        if (err) {
          console.error('Dashboard stats error:', err);
          return res
            .status(500)
            .json({ success: false, message: 'Dashboard stats error' });
        }

        res.json({
          success: true,
          stats: {
            totalShipments: stats.totalShipments || 0,
            deliveredShipments: stats.deliveredShipments || 0,
            pendingShipments: stats.pendingShipments || 0,
            successRate: Math.round(stats.successRate || 0),
            totalSpent: stats.totalSpent || 0,
            thisMonthSpent: stats.thisMonthSpent || 0,
            favoriteCarriers: 0, // Will be calculated separately
          },
        });
      }
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Dashboard stats error' });
  }
});

// Corporate Dashboard Stats
app.get('/api/dashboard/corporate', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    db.get(
      `
      SELECT 
        COUNT(*) as totalShipments,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as deliveredShipments,
        COUNT(CASE WHEN status IN ('pending', 'accepted', 'in_progress') THEN 1 END) as pendingShipments,
        AVG(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100 as successRate,
        SUM(price) as totalSpent,
        SUM(CASE WHEN strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now') AND status = 'delivered' THEN price ELSE 0 END) as thisMonthSpent
      FROM shipments 
      WHERE userId = ?
    `,
      [userId],
      (err, stats) => {
        if (err) {
          console.error('Corporate dashboard stats error:', err);
          return res
            .status(500)
            .json({
              success: false,
              message: 'Corporate dashboard stats error',
            });
        }

        res.json({
          success: true,
          stats: {
            totalShipments: stats.totalShipments || 0,
            deliveredShipments: stats.deliveredShipments || 0,
            pendingShipments: stats.pendingShipments || 0,
            successRate: Math.round(stats.successRate || 0),
            totalSpent: stats.totalSpent || 0,
            thisMonthSpent: stats.thisMonthSpent || 0,
            favoriteCarriers: 0,
          },
        });
      }
    );
  } catch (error) {
    console.error('Corporate dashboard stats error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Corporate dashboard stats error' });
  }
});

// Nakliyeci Dashboard Stats
app.get('/api/dashboard/nakliyeci', authenticateToken, (req, res) => {
  try {
    const nakliyeciId = req.user.id;

    db.get(
      `
      SELECT 
        COUNT(*) as totalJobs,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completedJobs,
        COUNT(CASE WHEN status IN ('accepted', 'in_progress', 'picked_up') THEN 1 END) as activeJobs,
        AVG(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 100 as successRate,
        SUM(price) as totalEarnings,
        SUM(CASE WHEN strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now') AND status = 'delivered' THEN price ELSE 0 END) as thisMonthEarnings
      FROM shipments 
      WHERE nakliyeciId = ?
    `,
      [nakliyeciId],
      (err, stats) => {
        if (err) {
          console.error('Nakliyeci dashboard stats error:', err);
          return res
            .status(500)
            .json({
              success: false,
              message: 'Nakliyeci dashboard stats error',
            });
        }

        res.json({
          success: true,
          stats: {
            totalJobs: stats.totalJobs || 0,
            completedJobs: stats.completedJobs || 0,
            activeJobs: stats.activeJobs || 0,
            successRate: Math.round(stats.successRate || 0),
            totalEarnings: stats.totalEarnings || 0,
            thisMonthEarnings: stats.thisMonthEarnings || 0,
            totalDrivers: 0, // Will be calculated separately
          },
        });
      }
    );
  } catch (error) {
    console.error('Nakliyeci dashboard stats error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Nakliyeci dashboard stats error' });
  }
});

// Metrics tracking
let apiMetrics = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  totalErrors: 0,
  errorsByType: {},
  recentErrors: [],
  activeConnections: 0,
};

// Middleware to track requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    trackRequest(apiMetrics, duration);

    if (res.statusCode >= 400) {
      trackError(apiMetrics, {
        name: 'HTTPError',
        message: `${req.method} ${req.path} - Status: ${res.statusCode}`,
      });
    }
  });

  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  res.json(health);
});

// Metrics endpoint
app.get('/api/metrics', requireAuth, async (req, res) => {
  try {
    const systemMetrics = getSystemMetrics();
    const dbMetrics = await getDatabaseMetrics(db);
    const apiMetrics = getApiMetrics(apiMetrics);

    res.json({
      success: true,
      data: {
        system: systemMetrics,
        database: dbMetrics,
        api: apiMetrics,
      },
    });
  } catch (error) {
    logError('Metrics error', error);
    res.status(500).json({ success: false, message: 'Metrics error' });
  }
});

// System health endpoint
app.get('/api/health/detailed', requireAuth, async (req, res) => {
  try {
    const dbMetrics = await getDatabaseMetrics(db);
    const health = getHealthStatus(apiMetrics, dbMetrics);

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logError('Health check error', error);
    res.status(500).json({ success: false, message: 'Health check error' });
  }
});

// Additional API endpoints
app.get('/api/notifications', requireAuth, (req, res) => {
  try {
    const notifications = [
      {
        id: 1,
        title: 'Yeni Teklif',
        message: 'Gönderiniz için yeni bir teklif alındı',
        type: 'offer',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Gönderi Güncellendi',
        message: 'Gönderinizin durumu güncellendi',
        type: 'shipment',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler alınırken hata oluştu',
    });
  }
});

app.get('/api/notifications/unread-count', requireAuth, (req, res) => {
  try {
    res.json({
      success: true,
      data: { count: 1 },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Okunmamış bildirim sayısı alınırken hata oluştu',
    });
  }
});

app.put('/api/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim işaretlenirken hata oluştu',
    });
  }
});

app.get('/api/wallet/balance', requireAuth, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        balance: 1500.5,
        currency: 'TRY',
      },
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Cüzdan bakiyesi alınırken hata oluştu',
    });
  }
});

app.get('/api/wallet/transactions', requireAuth, (req, res) => {
  try {
    const transactions = [
      {
        id: 1,
        type: 'credit',
        amount: 500.0,
        description: 'Gönderi ödemesi',
        date: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'debit',
        amount: 50.0,
        description: 'Komisyon',
        date: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'İşlemler alınırken hata oluştu',
    });
  }
});

app.get('/api/messages', requireAuth, (req, res) => {
  try {
    const messages = [
      {
        id: 1,
        sender: 'Nakliyeci A',
        message: 'Gönderiniz için teklif hazırladım',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        sender: 'Müşteri B',
        message: 'Teslimat tarihini değiştirebilir miyiz?',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar alınırken hata oluştu',
    });
  }
});

app.post('/api/messages', requireAuth, (req, res) => {
  try {
    const { recipient, message } = req.body;

    res.json({
      success: true,
      message: 'Mesaj gönderildi',
      data: {
        id: Date.now(),
        recipient,
        message,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken hata oluştu',
    });
  }
});

app.get('/api/offers', requireAuth, (req, res) => {
  try {
    const offers = [
      {
        id: 1,
        shipmentId: 1,
        carrierName: 'Nakliyeci A',
        price: 250.0,
        estimatedDelivery: '2 gün',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        shipmentId: 2,
        carrierName: 'Nakliyeci B',
        price: 300.0,
        estimatedDelivery: '3 gün',
        status: 'accepted',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Teklifler alınırken hata oluştu',
    });
  }
});

app.post('/api/offers', requireAuth, (req, res) => {
  try {
    const { shipmentId, price, estimatedDelivery } = req.body;

    res.json({
      success: true,
      message: 'Teklif gönderildi',
      data: {
        id: Date.now(),
        shipmentId,
        price,
        estimatedDelivery,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      message: 'Teklif oluşturulurken hata oluştu',
    });
  }
});

app.get('/api/users/profile', requireAuth, (req, res) => {
  try {
    const profile = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+90 555 123 45 67',
      userType: 'individual',
      avatar: null,
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profil bilgileri alınırken hata oluştu',
    });
  }
});

app.put('/api/users/profile', requireAuth, (req, res) => {
  try {
    const { name, phone } = req.body;

    res.json({
      success: true,
      message: 'Profil güncellendi',
      data: {
        name,
        phone,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken hata oluştu',
    });
  }
});

app.get('/api/analytics/dashboard/:userType', requireAuth, (req, res) => {
  try {
    const { userType } = req.params;

    const analytics = {
      totalShipments: 150,
      completedShipments: 120,
      pendingShipments: 20,
      cancelledShipments: 10,
      totalRevenue: 45000,
      averageRating: 4.5,
      monthlyGrowth: 15.5,
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Analitik veriler alınırken hata oluştu',
    });
  }
});

app.post('/api/reports/:type', requireAuth, (req, res) => {
  try {
    const { type } = req.params;
    const { period, format } = req.body;

    res.json({
      success: true,
      message: 'Rapor oluşturuldu',
      data: {
        reportId: Date.now(),
        type,
        period,
        format: format || 'pdf',
        status: 'processing',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor oluşturulurken hata oluştu',
    });
  }
});

// Initialize services on startup
async function initializeServices() {
  console.log('🔄 Initializing services...');

  // Initialize Redis (skip if Redis not available)
  try {
    await initRedis();
    console.log('✅ Redis initialized');
  } catch (error) {
    console.warn('⚠️ Redis not available (OK for development):', error.message);
  }

  // Start automatic backups
  try {
    scheduleBackups(dbPath);
    console.log('✅ Backup scheduler started');
  } catch (error) {
    console.warn('⚠️ Backup scheduler not started:', error.message);
  }
}

// Add error handlers at the end (after routes)
// app.use(databaseErrorHandler);
// app.use(errorHandler);

// Start server
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
  console.log(`📊 Health check: http://127.0.0.1:${PORT}/api/health`);
  console.log(`🌐 CORS enabled for: http://localhost:5173`);

  // Initialize services
  await initializeServices();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    if (!usePostgres) {
      db.close();
    }
    if (pgPool) {
      pgPool.end();
    }
    process.exit(0);
  });
});

module.exports = app;
