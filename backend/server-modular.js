// Modular backend server - Uses route modules
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const client = require('prom-client');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');
const errorLogger = require('./utils/errorLogger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'dev-secret-key-change-in-production');
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext';

if (NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET must be set in production!');
  process.exit(1);
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN.split(',').map(o => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// PostgreSQL connection
let pool;
try {
  pool = new Pool({
    connectionString: DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  pool.on('connect', () => console.log('✅ PostgreSQL connected'));
  pool.on('error', err => console.error('❌ PostgreSQL pool error:', err));
  console.log('✅ PostgreSQL pool created');
} catch (error) {
  console.error('❌ Error creating PostgreSQL pool:', error);
}

// Middleware
const allowedOrigins = FRONTEND_ORIGIN.split(',').map(o => o.trim());

try {
  const { trackRequest } = require('./utils/monitoring');
  app.use(trackRequest);
} catch (error) {
  console.warn('⚠️ Monitoring middleware not available:', error.message);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (NODE_ENV === 'development') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many auth requests' },
});

const offerSpeedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 5,
  delayMs: () => 200,
});

const messageSpeedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 15,
  delayMs: () => 100,
});

// Metrics
client.collectDefaultMetrics();
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (e) {
    res.status(500).end(e.message);
  }
});

// Sentry
const SENTRY_DSN = process.env.SENTRY_DSN || '';
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  app.use(Sentry.requestHandler());
}

// Email/SMS services
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const EMAIL_SMTP_URL = process.env.EMAIL_SMTP_URL || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@yolnext.local';
const TWILIO_SID = process.env.TWILIO_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';

let mailer = null;
if (EMAIL_SMTP_URL) {
  mailer = nodemailer.createTransport(EMAIL_SMTP_URL);
}

let smsClient = null;
if (TWILIO_SID && TWILIO_TOKEN) {
  smsClient = twilio(TWILIO_SID, TWILIO_TOKEN);
}

async function sendEmail(to, subject, text) {
  if (!mailer) return false;
  try {
    await mailer.sendMail({ from: EMAIL_FROM, to, subject, text });
    return true;
  } catch (e) {
    console.error('Email error:', e.message);
    return false;
  }
}

async function sendSMS(to, body) {
  if (!smsClient || !TWILIO_FROM) return false;
  try {
    await smsClient.messages.create({ from: TWILIO_FROM, to, body });
    return true;
  } catch (e) {
    console.error('SMS error:', e.message);
    return false;
  }
}

// File uploads
const multer = require('multer');
const fs = require('fs');
const uploadsDir = require('path').join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
} catch (error) {
  // Uploads directory creation failed
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});
app.use('/uploads', express.static(uploadsDir));

// Idempotency guard
(async () => {
  try {
    if (pool) {
      await pool.query(`CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        userId INTEGER,
        createdAt TIMESTAMP DEFAULT NOW()
      )`);
    }
  } catch (e) {
    console.error('Idempotency table initialization error:', e.message);
  }
})();

async function idempotencyGuard(req, res, next) {
  try {
    if (req.method !== 'POST') return next();
    const key = req.get('Idempotency-Key');
    if (!key) return next();
    const exists = await pool.query(
      'SELECT key FROM idempotency_keys WHERE key=$1',
      [key]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: true, message: 'Idempotent replay' });
    }
    await pool.query(
      'INSERT INTO idempotency_keys(key, method, path, userId) VALUES($1,$2,$3,$4)',
      [key, req.method, req.path, req.user?.id || null]
    );
    next();
  } catch (e) {
    next(e);
  }
}

// Audit logs
(async () => {
  try {
    if (pool) {
      await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        action TEXT NOT NULL,
        entity TEXT,
        entityId TEXT,
        ip TEXT,
        userAgent TEXT,
        metadata JSONB,
        createdAt TIMESTAMP DEFAULT NOW()
      )`);
    }
  } catch (e) {
    console.error('Audit log table error:', e.message);
  }
})();

async function writeAuditLog({ userId, action, entity, entityId, req, metadata }) {
  try {
    if (!pool) return;
    await pool.query(
      `INSERT INTO audit_logs(userId, action, entity, entityId, ip, userAgent, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        userId || null,
        action,
        entity || null,
        entityId || null,
        req.ip,
        req.headers['user-agent'] || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (e) {
    console.error('Audit write error:', e.message);
  }
}

// Authentication middleware
const { createAuthMiddleware } = require('./middleware/auth');
const authenticateToken = createAuthMiddleware(pool, JWT_SECRET);

// Notification helper
const { createNotificationHelper } = require('./utils/notifications');
const createNotification = createNotificationHelper(pool, io);

// Import route modules
const createAuthRoutes = require('./routes/v1/auth');
const createShipmentRoutes = require('./routes/v1/shipments');
const createMessageRoutes = require('./routes/v1/messages');
const createOfferRoutes = require('./routes/v1/offers');
const createDashboardRoutes = require('./routes/v1/dashboard');
const createNotificationRoutes = require('./routes/v1/notifications');
const createHealthRoutes = require('./routes/v1/health');

// Create route instances
const authRoutes = createAuthRoutes(pool, JWT_SECRET, createNotification, sendEmail);
const shipmentRoutes = createShipmentRoutes(pool, authenticateToken, createNotification, idempotencyGuard);
const messageRoutes = createMessageRoutes(pool, authenticateToken, createNotification, io, writeAuditLog, messageSpeedLimiter, idempotencyGuard, generalLimiter, upload);
const offerRoutes = createOfferRoutes(pool, authenticateToken, createNotification, sendEmail, sendSMS, writeAuditLog, offerSpeedLimiter, idempotencyGuard);
const dashboardRoutes = createDashboardRoutes(pool, authenticateToken);
const notificationRoutes = createNotificationRoutes(pool, authenticateToken);
const healthRoutes = createHealthRoutes(pool, NODE_ENV);

// Swagger documentation
try {
  const { setupSwagger } = require('./swagger');
  setupSwagger(app);
} catch (error) {
  console.warn('⚠️ Swagger setup failed:', error.message);
}

// Register routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/shipments', generalLimiter, shipmentRoutes);
app.use('/api/messages', generalLimiter, messageRoutes);
app.use('/api/offers', generalLimiter, offerRoutes);
app.use('/api/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/notifications', generalLimiter, notificationRoutes);
app.use('/api/health', healthRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined their room`);
  });

  socket.on('join_shipment', (shipmentId) => {
    socket.join(`shipment_${shipmentId}`);
    console.log(`✅ User joined shipment ${shipmentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  errorLogger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(NODE_ENV !== 'production' && { error: err.message }),
  });
});

if (SENTRY_DSN) {
  app.use(Sentry.errorHandler());
}

// Database initialization
const { createTables, seedData } = require('./database/init');

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Modular PostgreSQL Backend...');

    const tablesCreated = await createTables(pool);
    if (!tablesCreated) {
      console.log('⚠️ Table creation skipped - using existing tables');
    }

    if (NODE_ENV !== 'production') {
      const dataSeeded = await seedData(pool);
      if (!dataSeeded) {
        console.log('⚠️ Data seeding skipped');
      }
    }

    server.listen(PORT, () => {
      console.log(`🚀 Modular Backend running on http://localhost:${PORT}`);
      console.log(`✅ Using modular route structure!`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
      console.log(`🔌 WebSocket: Socket.IO enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();

module.exports = { app, server, pool, io };







