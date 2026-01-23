<<<<<<< HEAD
/**
 * Modular Backend Server
 * Main entry point - uses modular configuration files
 */

=======
// Modular backend server - Uses route modules
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
const path = require('path');
const dotenv = require('dotenv');

// Load env from repo root with precedence:
// .env (lowest) < env.development < env.local (highest)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../env.development'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../env.local'), override: true });

const express = require('express');
<<<<<<< HEAD
const { createServer } = require('http');
const errorLogger = require('./utils/errorLogger');
const MigrationRunner = require('./migrations/migration-runner');
const { createDatabasePool } = require('./config/database');
const { setupMiddleware } = require('./config/middleware');
const { setupRoutes } = require('./config/routes');
const { setupEmailService, setupFileUpload } = require('./config/services');
const { setupIdempotencyGuard, setupAdminGuard, setupAuditLog } = require('./config/guards');
const { createNotificationHelper } = require('./utils/notifications');

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
=======
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const timeout = require('connect-timeout');
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
const MigrationRunner = require('./migrations/migration-runner');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
const IS_TEST = NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'dev-secret-key-change-in-production');
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext';
const SENTRY_DSN = process.env.SENTRY_DSN;

<<<<<<< HEAD
// Initialize Sentry (optional)
let Sentry = null;
if (SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: NODE_ENV,
      tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  } catch (e) {
    errorLogger.warn('Sentry initialization failed, continuing without it', { error: e.message });
  }
}

// Environment validation
function validateEnvironment() {
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_ORIGIN'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    errorLogger.error('Missing required environment variables', { missingVars });
    if (NODE_ENV === 'production') {
      errorLogger.error('CRITICAL: Cannot start in production without required environment variables', { missingVars });
      process.exit(1);
    } else {
      errorLogger.warn('Running in development mode with missing variables - this is not recommended for production', { missingVars });
=======
// Environment validation
function validateEnvironment() {
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'FRONTEND_ORIGIN'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    if (NODE_ENV === 'production') {
      console.error('💥 CRITICAL: Cannot start in production without required environment variables');
      process.exit(1);
    } else {
      console.warn('⚠️ Running in development mode with missing variables - this is not recommended for production');
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
    }
  }

  // Validate JWT secret strength
  if (JWT_SECRET && JWT_SECRET.length < 32) {
<<<<<<< HEAD
    errorLogger.warn('JWT_SECRET is weak (less than 32 characters) - use a strong secret in production');
=======
    console.warn('⚠️ JWT_SECRET is weak (less than 32 characters) - use a strong secret in production');
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  }

  // Validate database URL
  if (!DATABASE_URL.includes('postgresql://')) {
<<<<<<< HEAD
    errorLogger.error('DATABASE_URL must be a valid PostgreSQL connection string', { databaseUrl: DATABASE_URL.substring(0, 20) + '...' });
    process.exit(1);
  }

  errorLogger.info('Environment validation completed');
=======
    console.error('❌ DATABASE_URL must be a valid PostgreSQL connection string');
    process.exit(1);
  }

  console.log('✅ Environment validation completed');
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
}

validateEnvironment();

if (NODE_ENV === 'production' && !JWT_SECRET) {
<<<<<<< HEAD
  errorLogger.error('CRITICAL: JWT_SECRET must be set in production!');
  process.exit(1);
}

// Create Express app
const app = express();
app.disable('etag'); // Prevent client/proxy caching of API responses
const server = createServer(app);

// Create database pool
let pool;
try {
  pool = createDatabasePool(DATABASE_URL, NODE_ENV);
} catch (error) {
  errorLogger.error('Failed to create database pool', { error: error.message });
  process.exit(1);
}

// Setup middleware
const middleware = setupMiddleware(app, pool, JWT_SECRET, FRONTEND_ORIGIN, NODE_ENV);

// Setup services
const { sendEmail } = setupEmailService();
const upload = setupFileUpload();

// Setup guards and utilities (async)
let idempotencyGuard, requireAdmin, writeAuditLog, createNotification;

// Initialize synchronously where possible
requireAdmin = setupAdminGuard();
createNotification = createNotificationHelper(pool);

// Setup async guards and routes
(async () => {
  try {
    idempotencyGuard = await setupIdempotencyGuard(pool);
    writeAuditLog = await setupAuditLog(pool);
    
    // Setup routes after guards are ready
    setupRoutes(app, pool, middleware, {
      createNotification,
      sendEmail,
      writeAuditLog,
    }, {
      idempotencyGuard,
      upload,
      requireAdmin,
    });
  } catch (error) {
    errorLogger.error('Failed to setup guards', { error: error.message });
    process.exit(1);
  }
})();

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sentry request handler (must be first middleware)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Serve frontend in production (after API routes)
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
  });
}

// Sentry error handler (must be before other error middleware)
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  errorLogger.logApiError(err, req, { statusCode: res.statusCode || 500 });

  // Handle specific error types
=======
  console.error('❌ CRITICAL: JWT_SECRET must be set in production!');
  process.exit(1);
}

const app = express();
// Prevent client/proxy caching of API responses (304 breaks fetch(JSON) flows)
app.disable('etag');
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

// Compression middleware
app.use(compression({
  level: 6, // Good balance between speed and compression
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Request timeout middleware
app.use(timeout('30s')); // 30 second timeout for all requests
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// Enhanced security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  hsts: NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: 'deny' }
}));

app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// No-cache headers for API endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Enhanced request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = require('crypto').randomUUID();

  // Add request ID to request object
  req.requestId = requestId;

  // Log request details
  console.log(`📨 [${requestId}] ${req.method} ${req.path} - ${req.ip} - ${req.headers['user-agent']?.substring(0, 50) || 'Unknown'}`);

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log response details
    const logLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    const logMessage = `📤 [${requestId}] ${req.method} ${req.path} - ${statusCode} - ${duration}ms`;

    if (logLevel === 'error') {
      console.error(logMessage);
    } else if (logLevel === 'warn') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }

    // Audit log for sensitive operations
    if (req.user && (req.method !== 'GET' || req.path.includes('/auth'))) {
      writeAuditLog({
        userId: req.user.id,
        action: `${req.method}_${req.path.replace(/\//g, '_')}`,
        entity: req.path.split('/')[2], // Extract entity from path
        entityId: req.params.id || req.body.id,
        req: req
      }).catch(err => console.error('Audit log error:', err));
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
});

// API Documentation
try {
  const { swaggerUi, specs } = require('./docs/swagger');
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'YolNext API Documentation'
  }));
  console.log('✅ API Documentation available at /api-docs');
} catch (error) {
  console.warn('⚠️ API Documentation not available:', error.message);
}

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 100 : 10000,
  message: { success: false, message: 'Too many requests' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 5 : (IS_TEST ? 100000 : 1000),
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

// Email/SMS transports are initialized later in the file, but the health endpoint
// needs these symbols to exist to avoid ReferenceError.
let mailer = null;
let smsClient = null;

// Enhanced Health Check
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
    environment: NODE_ENV,
    checks: {}
  };

  try {
    // Database health check
    if (pool) {
      try {
        const dbStart = Date.now();
        await pool.query('SELECT 1');
        checks.checks.database = {
          status: 'healthy',
          response_time: Date.now() - dbStart,
          connections: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        };
      } catch (error) {
        checks.checks.database = {
          status: 'unhealthy',
          error: error.message
        };
        checks.status = 'degraded';
      }
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    checks.checks.memory = {
      status: 'healthy',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    };

    // CPU usage check
    const os = require('os');
    const loadAvg = os.loadavg();
    checks.checks.cpu = {
      status: 'healthy',
      loadAverage: loadAvg.map(l => l.toFixed(2)),
      cores: os.cpus().length
    };

    // Socket.IO health check
    if (io) {
      checks.checks.websocket = {
        status: 'healthy',
        connected_clients: io.engine.clientsCount
      };
    }

    // File system health check (non-critical)
    const fs = require('fs');
    const uploadsDir = require('path').join(__dirname, 'uploads');
    try {
      const stats = fs.statSync(uploadsDir);
      checks.checks.filesystem = {
        status: 'healthy',
        uploads_dir_exists: true,
        uploads_dir_writable: fs.accessSync ? true : false
      };
    } catch (error) {
      checks.checks.filesystem = {
        status: 'degraded',
        error: error.message
      };
      checks.status = 'degraded';
    }

    // External services health check
    checks.checks.external_services = {
      status: 'healthy',
      email_service: mailer ? 'configured' : 'not_configured',
      sms_service: smsClient ? 'configured' : 'not_configured'
    };

    // Response time
    checks.response_time = Date.now() - startTime;

    // Overall status determination
    // Critical: database. Non-critical: filesystem/external services/etc.
    const dbStatus = checks.checks?.database?.status;
    if (dbStatus === 'unhealthy') {
      checks.status = 'unhealthy';
    }

    const statusCode = checks.status === 'healthy' ? 200 :
                      checks.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(checks);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Readiness check (for Kubernetes/Docker)
app.get('/api/health/ready', async (req, res) => {
  try {
    // Critical services check
    if (pool) {
      await pool.query('SELECT 1');
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness check
app.get('/api/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Database connection monitoring
if (pool && !IS_TEST) {
  // Monitor database connection pool
  setInterval(() => {
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    // Log if pool is unhealthy
    if (poolStats.waitingCount > 10) {
      console.warn(`⚠️ Database pool under pressure: ${poolStats.waitingCount} waiting connections`);
    }

    if (poolStats.idleCount === 0 && poolStats.totalCount > 0) {
      console.warn('⚠️ No idle database connections available');
    }

    // Update metrics for monitoring
    if (typeof poolStats.totalCount !== 'undefined') {
      console.log(`🗄️ DB Pool: ${poolStats.totalCount} total, ${poolStats.idleCount} idle, ${poolStats.waitingCount} waiting`);
    }
  }, 30000); // Check every 30 seconds

  // Handle database connection errors
  pool.on('error', (err, client) => {
    console.error('❌ Unexpected database error:', err);
    errorLogger.logError(new Error('Database pool error'), {
      error: err.message,
      stack: err.stack,
      client: client ? 'active' : 'idle'
    });
  });

  pool.on('connect', (client) => {
    console.log('✅ New database client connected');
  });

  pool.on('remove', (client) => {
    console.log('❌ Database client removed from pool');
  });
}

// Memory leak prevention and monitoring
if (!IS_TEST) setInterval(() => {
  const memUsage = process.memoryUsage();
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

  console.log(`🧠 Memory: RSS ${rssMB}MB, Heap ${heapUsedMB}MB/${heapTotalMB}MB`);

  // Warn if memory usage is high
  const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  if (memoryUsagePercent > 85) {
    console.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(1)}%`);

    // Force garbage collection if available (development only)
    if (NODE_ENV === 'development' && global.gc) {
      console.log('🗑️ Running garbage collection...');
      global.gc();
    }
  }

  // Check for potential memory leaks
  if (rssMB > 500) { // Over 500MB RSS
    console.warn(`⚠️ Potential memory leak detected: RSS ${rssMB}MB`);
  }
}, 60000); // Check every minute

// Socket.IO memory leak prevention
if (io && !IS_TEST) {
  // Monitor connected clients
  setInterval(() => {
    const clientCount = io.engine.clientsCount;
    console.log(`🔌 Socket.IO: ${clientCount} connected clients`);

    if (clientCount > 1000) { // Too many concurrent connections
      console.warn(`⚠️ High number of Socket.IO connections: ${clientCount}`);
    }
  }, 30000); // Check every 30 seconds

  // Clean up on client disconnect
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      // Force cleanup of socket resources
      socket.removeAllListeners();
      socket.disconnect(true);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      socket.disconnect(true);
    });
  });
}

// Process monitoring
if (!IS_TEST) setInterval(() => {
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);

  console.log(`⏰ Process uptime: ${uptimeHours}h ${uptimeMinutes}m`);

  // Monitor event loop lag (potential blocking operations)
  const start = process.hrtime.bigint();
  setImmediate(() => {
    const end = process.hrtime.bigint();
    const lag = Number(end - start) / 1000000; // Convert to milliseconds

    if (lag > 100) { // Event loop lag over 100ms
      console.warn(`⚠️ Event loop lag detected: ${lag.toFixed(2)}ms`);
    }
  });
}, 300000); // Check every 5 minutes

// Email/SMS services
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const EMAIL_SMTP_URL = process.env.EMAIL_SMTP_URL || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@yolnext.local';
const TWILIO_SID = process.env.TWILIO_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';

mailer = null;
if (EMAIL_SMTP_URL) {
  mailer = nodemailer.createTransport(EMAIL_SMTP_URL);
}

smsClient = null;
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

      // Forward-compatible columns for true idempotent replays
      try {
        await pool.query('ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS status_code INTEGER');
      } catch (_) {
        // ignore
      }
      try {
        await pool.query('ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS response_body JSONB');
      } catch (_) {
        // ignore
      }
      try {
        await pool.query('ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS response_headers JSONB');
      } catch (_) {
        // ignore
      }
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
      'SELECT key, status_code, response_body, response_headers FROM idempotency_keys WHERE key=$1',
      [key]
    );

    if (exists.rows.length > 0) {
      const row = exists.rows[0];
      if (row && row.status_code && row.response_body != null) {
        try {
          const hdrs = row.response_headers || null;
          if (hdrs && typeof hdrs === 'object') {
            for (const [h, v] of Object.entries(hdrs)) {
              try {
                if (v != null) res.setHeader(h, v);
              } catch (_) {
                // ignore
              }
            }
          }
        } catch (_) {
          // ignore
        }

        return res.status(row.status_code).json(row.response_body);
      }

      return res.status(409).json({ success: true, message: 'Idempotent replay' });
    }

    await pool.query(
      'INSERT INTO idempotency_keys(key, method, path, userId) VALUES($1,$2,$3,$4)',
      [key, req.method, req.path, req.user?.id || null]
    );

    // Capture response snapshot for true idempotent replays
    let capturedBody;
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      capturedBody = body;
      return originalJson(body);
    };

    res.on('finish', async () => {
      try {
        if (!pool) return;
        if (capturedBody == null) return;
        const statusCode = res.statusCode;
        const headers = {};
        try {
          const ct = res.getHeader('content-type');
          if (ct) headers['content-type'] = String(ct);
        } catch (_) {
          // ignore
        }
        await pool.query(
          'UPDATE idempotency_keys SET status_code=$2, response_body=$3, response_headers=$4 WHERE key=$1',
          [key, statusCode, capturedBody, headers]
        );
      } catch (_) {
        // ignore
      }
    });

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
console.log('🔍 Loading route modules...');
const createAuthRoutes = require('./routes/v1/auth');
const createShipmentRoutes = require('./routes/v1/shipments');
const createMessageRoutes = require('./routes/v1/messages');
const createOfferRoutes = require('./routes/v1/offers');
const createDashboardRoutes = require('./routes/v1/dashboard');
const createNotificationRoutes = require('./routes/v1/notifications');
const createHealthRoutes = require('./routes/v1/health');
const createAnalyticsRoutes = require('./routes/v1/analytics');
const createRatingsRoutes = require('./routes/v1/ratings');
const createUsersRoutes = require('./routes/v1/users');
const createVehiclesRoutes = require('./routes/v1/vehicles');
const createLoadsRoutes = require('./routes/v1/loads');
const createCarrierRoutes = require('./routes/v1/carriers');
console.log('🔍 Loading drivers route...');
const createDriversRoutes = require('./routes/v1/drivers');
console.log('✅ Drivers route loaded successfully');
const createKvkkRoutes = require('./routes/v1/kvkk');
const createReportsRoutes = require('./routes/v1/reports');
const createLogsRoutes = require('./routes/v1/logs');
const createComplaintsRoutes = require('./routes/v1/complaints');
const createAgreementsRoutes = require('./routes/v1/agreements');
const createWalletRoutes = require('./routes/v1/wallet');
const createAdminRoutes = require('./routes/v1/admin');
let createCarrierMarketRoutes = null;
try {
  createCarrierMarketRoutes = require('./routes/v1/carrierMarket');
  console.log('✅ carrierMarket routes loaded: ./routes/v1/carrierMarket');
} catch (e) {
  console.warn('⚠️ carrierMarket routes not available:', e.message);
}

// Create route instances
const authRoutes = createAuthRoutes(pool, JWT_SECRET, createNotification, sendEmail);
const shipmentRoutes = createShipmentRoutes(pool, authenticateToken, createNotification, idempotencyGuard, io);
const messageRoutes = createMessageRoutes(pool, authenticateToken, createNotification, io, writeAuditLog, messageSpeedLimiter, idempotencyGuard, generalLimiter, upload);
const offerRoutes = createOfferRoutes(pool, authenticateToken, createNotification, sendEmail, sendSMS, writeAuditLog, offerSpeedLimiter, idempotencyGuard, io);
const dashboardRoutes = createDashboardRoutes(pool, authenticateToken);
const notificationRoutes = createNotificationRoutes(pool, authenticateToken);
const healthRoutes = createHealthRoutes(pool);
const analyticsRoutes = createAnalyticsRoutes(pool, authenticateToken);
const ratingsRoutes = createRatingsRoutes(pool, authenticateToken);
const usersRoutes = createUsersRoutes(pool, authenticateToken);
const vehiclesRoutes = createVehiclesRoutes(pool, authenticateToken);
const loadsRoutes = createLoadsRoutes(pool, authenticateToken);
const carriersRoutes = createCarrierRoutes(pool, authenticateToken);
console.log('✅ Creating drivers routes...');
const driversRoutes = createDriversRoutes(pool, authenticateToken);
console.log('✅ Drivers routes created successfully');
const kvkkRoutes = createKvkkRoutes(pool, authenticateToken);
const reportsRoutes = createReportsRoutes(pool, authenticateToken);
const logsRoutes = createLogsRoutes(pool, authenticateToken);
const complaintsRoutes = createComplaintsRoutes(pool, authenticateToken, upload);
const agreementsRoutes = createAgreementsRoutes(pool, authenticateToken);
const walletRoutes = createWalletRoutes(pool, authenticateToken);

// Admin middleware - requireAdmin checks if user.role === 'admin'
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'admin' && req.user.panel_type !== 'admin' && req.user.userType !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Import new admin system routes
const createDisputeRoutes = require('./routes/v1/disputes');
const createSuspiciousActivityRoutes = require('./routes/v1/suspicious-activity');
const createFinancialTransparencyRoutes = require('./routes/v1/financial-transparency');
const createAdminNotificationRoutes = require('./routes/v1/admin-notifications');
const createAdminBulkOperationsRoutes = require('./routes/v1/admin-bulk-operations');

// Import support system routes
const createSupportRoutes = require('./routes/v1/support');
const createAdminSupportRoutes = require('./routes/v1/admin-support');

// Import audit trail routes
const createAuditTrailRoutes = require('./routes/v1/audit-trail');

const adminRoutes = createAdminRoutes(pool, authenticateToken, requireAdmin, writeAuditLog);

// Create new admin system routes
const disputeRoutes = createDisputeRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification, io);
const suspiciousActivityRoutes = createSuspiciousActivityRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification, io);
const financialTransparencyRoutes = createFinancialTransparencyRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification);
const adminNotificationRoutes = createAdminNotificationRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification, io);
const adminBulkOperationsRoutes = createAdminBulkOperationsRoutes(pool, authenticateToken, requireAdmin, writeAuditLog, createNotification, io);

// Create support system routes
const supportRoutes = createSupportRoutes(pool, authenticateToken);
const adminSupportRoutes = createAdminSupportRoutes(pool, authenticateToken, requireAdmin);

// Create audit trail routes
const auditTrailRoutes = createAuditTrailRoutes(pool, authenticateToken, requireAdmin);

const carrierMarketRoutes = createCarrierMarketRoutes
  ? createCarrierMarketRoutes(pool, authenticateToken, createNotification)
  : (() => {
      const r = express.Router();
      r.use((_req, res) => res.status(501).json({ success: false, message: 'carrier-market routes not available' }));
      return r;
    })();

console.log(`✅ carrierMarket routes mounted: ${createCarrierMarketRoutes ? 'real' : 'fallback-501'}`);

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
app.use('/api/analytics', generalLimiter, analyticsRoutes);
app.use('/api/notifications', generalLimiter, notificationRoutes);
app.use('/api/ratings', generalLimiter, ratingsRoutes);
app.use('/api/carrier-market', generalLimiter, carrierMarketRoutes);
// Compatibility alias (older frontend/tests)
app.use('/api/carrierMarket', generalLimiter, carrierMarketRoutes);
app.use('/api/users', generalLimiter, usersRoutes);
app.use('/api/vehicles', generalLimiter, vehiclesRoutes);
app.use('/api/loads', generalLimiter, loadsRoutes);
app.use('/api/carriers', generalLimiter, carriersRoutes);
console.log('✅ Mounting drivers routes...');
app.use('/api/drivers', generalLimiter, driversRoutes);
console.log('✅ Drivers routes mounted successfully');
app.use('/api/kvkk', generalLimiter, kvkkRoutes);
app.use('/api/reports', generalLimiter, reportsRoutes);
app.use('/api/logs', generalLimiter, logsRoutes);
app.use('/api/complaints', generalLimiter, complaintsRoutes);
app.use('/api/agreements', generalLimiter, agreementsRoutes);
app.use('/api/wallet', generalLimiter, walletRoutes);
app.use('/api/admin', authenticateToken, generalLimiter, adminRoutes);

// Mount new admin system routes
app.use('/api/disputes', generalLimiter, disputeRoutes);
app.use('/api/suspicious-activity', generalLimiter, suspiciousActivityRoutes);
app.use('/api/financial', generalLimiter, financialTransparencyRoutes);
app.use('/api/admin-notifications', generalLimiter, adminNotificationRoutes);
app.use('/api/admin-bulk', generalLimiter, adminBulkOperationsRoutes);

// Mount support system routes
app.use('/api/support', generalLimiter, supportRoutes);
app.use('/api/admin/support', generalLimiter, adminSupportRoutes);

// Mount audit trail routes
app.use('/api/audit', generalLimiter, auditTrailRoutes);
// NOTE: /api/health is handled by the inline enhanced health endpoint above.
// Keep modular health check on a separate path to avoid route conflicts.
app.use('/api/healthz', healthRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} joined their room`);
  });

  const normalizeShipmentId = (payload) => {
    if (payload == null) return null;
    if (typeof payload === 'object') {
      return payload.shipmentId ?? payload.id ?? null;
    }
    return payload;
  };

  const joinShipmentRoom = (payload) => {
    const shipmentId = normalizeShipmentId(payload);
    if (shipmentId == null) return;
    socket.join(`shipment_${shipmentId}`);
    console.log(`✅ User joined shipment ${shipmentId}`);
  };

  const leaveShipmentRoom = (payload) => {
    const shipmentId = normalizeShipmentId(payload);
    if (shipmentId == null) return;
    socket.leave(`shipment_${shipmentId}`);
    console.log(`✅ User left shipment ${shipmentId}`);
  };

  socket.on('join_shipment', joinShipmentRoom);
  socket.on('join_shipment_room', joinShipmentRoom);
  socket.on('leave_shipment', leaveShipmentRoom);
  socket.on('leave_shipment_room', leaveShipmentRoom);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle timeout errors
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  if (err && (err.code === 'ETIMEDOUT' || err.message?.includes('timeout'))) {
    return res.status(408).json({
      success: false,
      message: 'Request timeout',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'REQUEST_TIMEOUT'
    });
  }

<<<<<<< HEAD
=======
  // Handle CORS errors
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  if (err.message?.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'CORS_ERROR'
    });
  }

<<<<<<< HEAD
=======
  // Handle payload too large errors
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

<<<<<<< HEAD
=======
  // Handle rate limit errors
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  if (err.message?.includes('Too many requests')) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: res.get('Retry-After') || 60
    });
  }

<<<<<<< HEAD
=======
  // Handle validation errors
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  if (err.name === 'ValidationError' || err.message?.includes('validation')) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'VALIDATION_ERROR',
      details: err.details || err.errors
    });
  }

<<<<<<< HEAD
=======
  // Handle database errors
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  if (err.code && (err.code.startsWith('23') || err.code.startsWith('42'))) {
    return res.status(400).json({
      success: false,
      message: 'Database constraint violation',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'DATABASE_CONSTRAINT_ERROR'
    });
  }

<<<<<<< HEAD
=======
  // Handle JWT errors
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token error',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'AUTH_TOKEN_ERROR'
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
<<<<<<< HEAD
  res.status(statusCode).json({
=======
  const errorResponse = {
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
    success: false,
    message: statusCode >= 500 ? 'Internal server error' : 'Request failed',
    error: NODE_ENV === 'development' ? err.message : undefined,
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
<<<<<<< HEAD
  });
});

// Database initialization
const { createTables, seedData } = require('./database/init');

// Graceful shutdown
function gracefulShutdown() {
  errorLogger.info('Starting graceful shutdown');

  server.close(async () => {
    errorLogger.info('HTTP server closed');

    try {
      // Close Sentry connections
      if (Sentry) {
        try {
          await Sentry.close(2000);
          errorLogger.info('Sentry client closed');
        } catch (e) {
          errorLogger.error('Error closing Sentry client', { error: e.message });
        }
=======
  };

  // Log error with context
  errorLogger.logError(new Error('Unhandled error'), {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json(errorResponse);
});

if (SENTRY_DSN) {
  app.use(Sentry.errorHandler());
}

// Database initialization
const { createTables, seedData } = require('./database/init');

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  gracefulShutdown();
});

async function gracefulShutdown() {
  console.log('⏳ Starting graceful shutdown...');

  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');

    try {
      // Close Socket.IO connections
      if (io) {
        await new Promise(resolve => {
          io.close(() => {
            console.log('✅ Socket.IO server closed');
            resolve();
          });
        });
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      }

      // Close database connections
      if (pool) {
        await pool.end();
<<<<<<< HEAD
        errorLogger.info('Database pool closed');
      }

      errorLogger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      errorLogger.error('Error during graceful shutdown', { error: error.message });
=======
        console.log('✅ Database pool closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
<<<<<<< HEAD
    errorLogger.error('Forced shutdown after timeout');
=======
    console.error('❌ Forced shutdown after timeout');
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
    process.exit(1);
  }, 30000);
}

<<<<<<< HEAD
// Handle process termination signals
process.on('SIGTERM', () => {
  errorLogger.info('SIGTERM received, shutting down gracefully');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  errorLogger.info('SIGINT received, shutting down gracefully');
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  errorLogger.error('Uncaught Exception', { error: error.message, stack: error.stack });
=======
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  try {
    if (errorLogger && typeof errorLogger.logError === 'function') {
      errorLogger.logError(new Error('Uncaught Exception'), {
        error: error.message,
        stack: error.stack,
      });
    }
  } catch (_) {
    // ignore
  }
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
<<<<<<< HEAD
  errorLogger.error('Unhandled Rejection', {
        reason: reason?.toString(),
    stack: reason?.stack
      });
=======
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    if (errorLogger && typeof errorLogger.logError === 'function') {
      errorLogger.logError(new Error('Unhandled Rejection'), {
        reason: reason?.toString(),
        stack: reason?.stack,
      });
    }
  } catch (_) {
    // ignore
  }
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  gracefulShutdown();
});

// Start server
async function startServer() {
  try {
<<<<<<< HEAD
    errorLogger.info('Starting Modular PostgreSQL Backend');

    // Run migrations
    if (!IS_TEST && NODE_ENV !== 'production') {
      try {
        const migrationRunner = new MigrationRunner(pool, errorLogger);
        await migrationRunner.runMigrations();
      } catch (e) {
        errorLogger.warn('Could not run migrations automatically', { error: e?.message || String(e) });
      }
    }

    // Initialize database tables
    const tablesCreated = await createTables(pool);
    if (!tablesCreated) {
      errorLogger.error('Canonical DB schema not satisfied. Refusing to start backend.');
      process.exit(1);
    }

    // Seed data (development only)
    if (NODE_ENV !== 'production') {
      const dataSeeded = await seedData(pool);
      if (!dataSeeded) {
        errorLogger.info('Data seeding skipped');
=======
    console.log('🚀 Starting Modular PostgreSQL Backend...');

    if (!IS_TEST && NODE_ENV !== 'production') {
      try {
        const migrationRunner = new MigrationRunner();
        await migrationRunner.runMigrations();
        await migrationRunner.close();
      } catch (e) {
        console.warn('⚠️ Could not run migrations automatically:', e?.message || e);
      }
    }

    const tablesCreated = await createTables(pool);
    if (!tablesCreated) {
      console.error('❌ Canonical DB schema not satisfied. Refusing to start backend.');
      process.exit(1);
    }

    if (NODE_ENV !== 'production') {
      const dataSeeded = await seedData(pool);
      if (!dataSeeded) {
        console.log('⚠️ Data seeding skipped');
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      }
    }

    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
<<<<<<< HEAD
        errorLogger.error(`Port ${PORT} is already in use. Stop the other process or change PORT.`);
        process.exit(1);
      }
      errorLogger.error('Server failed to start', { error: err.message });
=======
        console.error(`❌ Port ${PORT} is already in use. Stop the other process or change PORT.`);
        process.exit(1);
      }
      console.error('❌ Server failed to start:', err);
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      process.exit(1);
    });

    server.listen(PORT, () => {
<<<<<<< HEAD
      errorLogger.info(`Modular Backend running on http://localhost:${PORT}`, {
        port: PORT,
        environment: NODE_ENV,
        healthCheck: `http://localhost:${PORT}/api/health`
      });
    });
  } catch (error) {
    errorLogger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Only start the server when this file is executed directly
=======
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

// Only start the server when this file is executed directly.
// When imported (e.g., during Jest tests), exporting the app/server is enough.
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
if (require.main === module && !IS_TEST) {
  startServer();
}

<<<<<<< HEAD
module.exports = { app, server, pool };
=======
module.exports = { app, server, pool, io };







>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
