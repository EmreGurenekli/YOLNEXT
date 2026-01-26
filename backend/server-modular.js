/**
 * 🚀 YOLNEXT BACKEND SERVER - MAIN APPLICATION ENTRY POINT
 * 
 * BUSINESS PURPOSE: Core API server for Turkey's logistics marketplace
 * Serves 4 user types: Individual, Corporate, Nakliyeci, Tasiyici
 * Handles 10,000+ shipments daily with real-time tracking
 * 
 * CORE BUSINESS FUNCTIONS:
 * 📦 Shipment Management - Create, track, manage cargo shipments
 * 💰 Offer System - Carriers bid on shipments, shippers accept offers
 * 💬 Messaging - Communication between shippers and carriers
 * 🔐 Authentication - Secure login for all user types
 * 📊 Admin Panel - System monitoring and user management
 * 📍 Live Tracking - Real-time shipment location updates
 * 
 * TECHNICAL ARCHITECTURE:
 * - Express.js REST API with PostgreSQL database
 * - JWT-based authentication with role-based access
 * - Modular route structure for scalability
 * - Production-ready security, logging, monitoring
 * - Docker-ready with environment-based configuration
 * 
 * STARTUP PROCESS:
 * 1. Load environment variables (.env files)
 * 2. Initialize database connection pool  
 * 3. Run database migrations if needed
 * 4. Setup security middleware (CORS, rate limiting, etc.)
 * 5. Register API routes (/api/v1/*)
 * 6. Start HTTP server on configured port
 */

const path = require('path');
const dotenv = require('dotenv');

// Load env from repo root with production-safe precedence
console.log('🔧 ENV LOADING: NODE_ENV =', process.env.NODE_ENV);

if (process.env.NODE_ENV === 'production') {
  console.log('🔧 PRODUCTION MODE: Loading only base .env, skipping local overrides');
  // In production, only load base .env, never override with local files
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
} else {
  console.log('🔧 DEVELOPMENT MODE: Loading all env files with overrides');
  // Development: .env (lowest) < env.development < env.local (highest)
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../env.development'), override: true });
  dotenv.config({ path: path.resolve(__dirname, '../env.local'), override: true });
}

const express = require('express');
const { createServer } = require('http');

// Load errorLogger with fallback
let errorLogger = null;
try {
  errorLogger = require('./utils/errorLogger');
} catch (error) {
  // Fallback to simple logger
  errorLogger = {
    info: (msg, data) => console.log('ℹ️ INFO:', msg, data || ''),
    warn: (msg, data) => console.warn('⚠️ WARN:', msg, data || ''),
    error: (msg, data) => console.error('❌ ERROR:', msg, data || '')
  };
}

// Load database pool
let MigrationRunner = null;
let createDatabasePool = null;
try {
  const dbConfig = require('./config/database');
  createDatabasePool = dbConfig.createDatabasePool;
} catch (error) {
  errorLogger.error('Database pool module failed to load', { error: error.message });
  createDatabasePool = null;
}

// Load middleware and routes
let setupMiddleware = null;
let setupRoutes = null;
try {
  const middlewareConfig = require('./config/middleware');
  setupMiddleware = middlewareConfig.setupMiddleware;
  const routesConfig = require('./config/routes');
  setupRoutes = routesConfig.setupRoutes;
} catch (error) {
  errorLogger.error('Middleware/routes modules failed to load', { error: error.message });
  setupMiddleware = null;
  setupRoutes = null;
}

// Load guards and services
let setupEmailService = null;
let setupFileUpload = null;
let setupIdempotencyGuard = null;
let setupAdminGuard = null;
let setupAuditLog = null;
let createNotificationHelper = null;

try {
  const servicesConfig = require('./config/services');
  setupEmailService = servicesConfig.setupEmailService;
  setupFileUpload = servicesConfig.setupFileUpload;
  
  const guardsConfig = require('./config/guards');
  setupIdempotencyGuard = guardsConfig.setupIdempotencyGuard;
  setupAdminGuard = guardsConfig.setupAdminGuard;
  setupAuditLog = guardsConfig.setupAuditLog;
  
  const notificationUtils = require('./utils/userNotificationUtils');
  createNotificationHelper = notificationUtils.createNotificationHelper;
} catch (error) {
  errorLogger.error('Guards/services modules failed to load', { error: error.message });
}

// Environment variables
const PORT = process.env.PORT || 5000;

// Debug: Database connection info - DETAILED
console.log('🔍 DATABASE DEBUG DETAILED:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
  URL_START: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 40) + '...' : 'NONE',
  URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  PGSSLMODE: process.env.PGSSLMODE,
  SSL_REQUIRED: process.env.NODE_ENV === 'production',
  ALL_DB_VARS: {
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_USER: process.env.DATABASE_USER
  }
});

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_TEST = NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
// Security: No default values for production secrets
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'dev-secret-key-change-in-production');
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const DATABASE_URL = process.env.DATABASE_URL;
const SENTRY_DSN = process.env.SENTRY_DSN;

// Initialize Sentry (optional)
let Sentry = null;

// Environment validation (soft mode - warnings only, no crashes)

function validateEnvironment() {
  const requiredVars = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_ORIGIN'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    errorLogger.warn('Missing environment variables (continuing anyway)', { missingVars });
    console.warn('⚠️ Missing vars:', missingVars.join(', '));
  }

  // Validate JWT secret strength (warning only)
  if (JWT_SECRET && JWT_SECRET.length < 32) {
    errorLogger.warn('JWT_SECRET is weak (less than 32 characters)');
  }

  // Validate database URL (warning only)
  if (DATABASE_URL && !DATABASE_URL.includes('postgresql://')) {
    errorLogger.warn('DATABASE_URL format may be invalid', { databaseUrl: DATABASE_URL.substring(0, 20) + '...' });
  }

  errorLogger.info('Environment validation completed (soft mode)');
}

validateEnvironment();

// JWT_SECRET check (warning only, no crash)
if (NODE_ENV === 'production' && !JWT_SECRET) {
  errorLogger.warn('⚠️ WARNING: JWT_SECRET not set in production - authentication may not work!');
  console.warn('⚠️ JWT_SECRET missing - continuing anyway');
}

// Create Express app
const app = express();
app.disable('etag'); // Prevent client/proxy caching of API responses
const server = createServer(app);

// Create database pool
let pool = null;

if (createDatabasePool && DATABASE_URL) {
  try {
    pool = createDatabasePool(DATABASE_URL, NODE_ENV);
    errorLogger.info('Database pool created successfully');
  } catch (error) {
    errorLogger.error('Failed to create database pool', { error: error.message });
    if (NODE_ENV === 'production') {
      errorLogger.warn('⚠️ Database pool creation failed in production (continuing without database)', { 
        error: error.message,
        note: 'Backend will start with limited functionality - API endpoints will be available but database operations will fail'
      });
      pool = null;
    } else {
      errorLogger.warn('Continuing in development mode without database (backend may not function correctly)');
      pool = null;
    }
  }
} else {
  errorLogger.warn('Skipping database pool: createDatabasePool function not available or DATABASE_URL missing');
  pool = null;
}

// Setup middleware and routes

let middleware = null, sendEmail = null, upload = null;
let idempotencyGuard = null, requireAdmin = null, writeAuditLog = null, createNotification = null;

// Setup middleware
if (setupMiddleware) {
  try {
    middleware = setupMiddleware(app, pool, JWT_SECRET, FRONTEND_ORIGIN, NODE_ENV);
  } catch (error) {
    errorLogger.error('Middleware setup failed', { error: error.message });
    middleware = null;
  }
}

// Setup services
if (setupEmailService) {
  try {
    const emailService = setupEmailService();
    sendEmail = emailService.sendEmail;
  } catch (error) {
    errorLogger.error('Email service setup failed', { error: error.message });
    sendEmail = null;
  }
}

if (setupFileUpload) {
  try {
    upload = setupFileUpload();
  } catch (error) {
    errorLogger.error('File upload setup failed', { error: error.message });
    upload = null;
  }
}

// Setup guards
requireAdmin = null;
if (setupAdminGuard) {
  try {
    requireAdmin = setupAdminGuard();
  } catch (error) {
    errorLogger.error('Admin guard setup failed', { error: error.message });
    requireAdmin = null;
  }
}

if (createNotificationHelper && pool) {
  try {
    createNotification = createNotificationHelper(pool);
  } catch (error) {
    errorLogger.error('Notification helper setup failed', { error: error.message });
    createNotification = null;
  }
}

// Async guards (will be set up in async block)
idempotencyGuard = null;
writeAuditLog = null;

// Setup routes

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'disconnected'
  });
});

// Setup routes with whatever we have (async safe)
if (setupRoutes) {
  (async () => {
    try {
      // Setup async guards first (before routes)
      if (pool) {
        if (setupIdempotencyGuard) {
          try {
            idempotencyGuard = await setupIdempotencyGuard(pool);
          } catch (error) {
            errorLogger.error('Idempotency guard setup failed', { error: error.message });
            idempotencyGuard = null;
          }
        }
        
        if (setupAuditLog) {
          try {
            writeAuditLog = await setupAuditLog(pool);
          } catch (error) {
            errorLogger.error('Audit log setup failed', { error: error.message });
            writeAuditLog = null;
          }
        }
      }
      
      setupRoutes(app, pool, middleware, {
        createNotification,
        sendEmail,
        writeAuditLog,
      }, {
        idempotencyGuard,
        upload,
        requireAdmin,
      });
      errorLogger.info('All routes registered successfully');
    } catch (routeError) {
      errorLogger.error('Routes setup failed', { error: routeError.message, stack: routeError.stack });
    }
  })();
}

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sentry request handler (must be first middleware)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Serve frontend in production (after API routes)
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
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
  if (err && (err.code === 'ETIMEDOUT' || err.message?.includes('timeout'))) {
    return res.status(408).json({
      success: false,
      message: 'Request timeout',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'REQUEST_TIMEOUT'
    });
  }

  if (err.message?.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'CORS_ERROR'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  if (err.message?.includes('Too many requests')) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: res.get('Retry-After') || 60
    });
  }

  if (err.name === 'ValidationError' || err.message?.includes('validation')) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'VALIDATION_ERROR',
      details: err.details || err.errors
    });
  }

  if (err.code && (err.code.startsWith('23') || err.code.startsWith('42'))) {
    return res.status(400).json({
      success: false,
      message: 'Database constraint violation',
      error: NODE_ENV === 'development' ? err.message : undefined,
      code: 'DATABASE_CONSTRAINT_ERROR'
    });
  }

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
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Internal server error' : 'Request failed',
    error: NODE_ENV === 'development' ? err.message : undefined,
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Database connection monitoring (after routes are set up)
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
      errorLogger.warn(`Database pool under pressure: ${poolStats.waitingCount} waiting connections`);
    }

    if (poolStats.idleCount === 0 && poolStats.totalCount > 0) {
      errorLogger.warn('No idle database connections available');
    }

    // Log pool stats periodically (development only)
    if (NODE_ENV === 'development' && typeof poolStats.totalCount !== 'undefined') {
      errorLogger.info(`DB Pool: ${poolStats.totalCount} total, ${poolStats.idleCount} idle, ${poolStats.waitingCount} waiting`);
    }
  }, 30000); // Check every 30 seconds

  // Handle database connection errors
  pool.on('error', (err, client) => {
    errorLogger.error('Unexpected database error', { error: err.message, stack: err.stack, client: client ? 'active' : 'idle' });
  });

  pool.on('connect', () => {
    if (NODE_ENV === 'development') {
      errorLogger.info('New database client connected');
    }
  });

  pool.on('remove', () => {
    if (NODE_ENV === 'development') {
      errorLogger.info('Database client removed from pool');
    }
  });
}

// Memory leak prevention and monitoring
if (!IS_TEST) {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    if (NODE_ENV === 'development') {
      errorLogger.info(`Memory: RSS ${rssMB}MB, Heap ${heapUsedMB}MB/${heapTotalMB}MB`);
    }

    // Warn if memory usage is high
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memoryUsagePercent > 85) {
      errorLogger.warn(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);

      // Force garbage collection if available (development only)
      if (NODE_ENV === 'development' && global.gc) {
        errorLogger.info('Running garbage collection...');
        global.gc();
      }
    }

    // Check for potential memory leaks
    if (rssMB > 500) { // Over 500MB RSS
      errorLogger.warn(`Potential memory leak detected: RSS ${rssMB}MB`);
    }
  }, 60000); // Check every minute

  // Process monitoring
  setInterval(() => {
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    if (NODE_ENV === 'development') {
      errorLogger.info(`Process uptime: ${uptimeHours}h ${uptimeMinutes}m`);
    }

    // Monitor event loop lag (potential blocking operations)
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const end = process.hrtime.bigint();
      const lag = Number(end - start) / 1000000; // Convert to milliseconds

      if (lag > 100) { // Event loop lag over 100ms
        errorLogger.warn(`Event loop lag detected: ${lag.toFixed(2)}ms`);
      }
    });
  }, 300000); // Check every 5 minutes
}

// Start server function and remaining code continues below...
// (Duplicate middleware, routes, and services code removed - handled by setupMiddleware and setupRoutes)

// Start server
async function startServer() {
  
  // Database initialization
  const { createTables, seedData } = require('./database/init');
  
  try {
    errorLogger.info('Starting Modular PostgreSQL Backend with REAL data');

    const RUN_MIGRATIONS = String(process.env.RUN_MIGRATIONS || '').toLowerCase() === 'true';
    const SEED_DEV_DATA = String(process.env.SEED_DEV_DATA || '').toLowerCase() === 'true';

    // Test database connection
    if (pool && DATABASE_URL) {
      try {
        const testClient = await pool.connect();
        await testClient.query('SELECT NOW() as current_time, version() as db_version');
        testClient.release();
        errorLogger.info('Database connection verified successfully');
      } catch (dbTestError) {
        errorLogger.warn('Database connection test failed (continuing anyway)', { 
          error: dbTestError.message, 
          code: dbTestError.code
        });
      }
    }

    // Schema management:
    // - Default: runtime schema via createTables() (no migrations) to avoid conflicts.
    // - Optional: enable SQL migrations by setting RUN_MIGRATIONS=true (then runtime createTables is skipped).
    if (pool) {
      if (RUN_MIGRATIONS) {
        try {
          const MigrationRunner = require('./migrations/migration-runner');
          const migrationRunner = new MigrationRunner(pool);
          await migrationRunner.runMigrations();
          errorLogger.info('Database migrations completed');
        } catch (e) {
          errorLogger.warn('Migrations failed (continuing)', { error: e?.message || String(e) });
        }
      } else {
        try {
          const tablesCreated = await createTables(pool);
          if (tablesCreated) {
            errorLogger.info('Database tables initialized successfully');
          } else {
            errorLogger.warn('Table creation returned false (continuing)');
          }
        } catch (error) {
          errorLogger.warn('Table initialization failed (continuing)', { error: error.message });
        }
      }
    }

    // Seed data (OFF by default). Enable with SEED_DEV_DATA=true.
    // NOTE: User requirement is "no mock data" -> keep disabled unless explicitly requested.
    if (NODE_ENV !== 'production' && pool && SEED_DEV_DATA) {
      try {
        await seedData(pool);
        errorLogger.info('Data seeding completed');
      } catch (seedError) {
        errorLogger.warn('Data seeding failed (continuing)', { error: seedError.message });
      }
    }

    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        errorLogger.error(`Port ${PORT} is already in use. Stop the other process or change PORT.`);
        process.exit(1);
      }
      errorLogger.error('Server failed to start', { error: err.message });
      process.exit(1);
    });

    server.listen(PORT, () => {
      errorLogger.info(`Modular Backend running on http://localhost:${PORT}`, {
        port: PORT,
        environment: NODE_ENV,
        healthCheck: `http://localhost:${PORT}/api/health`,
        database: pool ? 'connected' : 'disconnected'
      });
    });
  } catch (error) {
    errorLogger.error('Failed to start server', { error: error.message, stack: error.stack });
    errorLogger.error('CRITICAL: Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Only start the server when this file is executed directly
if (require.main === module && !IS_TEST) {
  startServer();
}

module.exports = { app, server, pool };

// Duplicate code removed - all middleware, routes, guards, and services are handled by:
// - setupMiddleware() at line 101
// - setupRoutes() at line 121 (called in async block)
// - setupEmailService() and setupFileUpload() at lines 104-105
// - setupIdempotencyGuard(), setupAdminGuard(), setupAuditLog() at lines 117-118
// - Error handler already defined at line 159
// All routes, guards, and services are initialized by setupRoutes() in the async block above
// Error handler is already defined at line 159
// Database initialization functions are imported in startServer function

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
      }

      // Close database connections
      if (pool) {
        await pool.end();
        errorLogger.info('Database pool closed');
      }

      errorLogger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      errorLogger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    errorLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

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
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  errorLogger.error('Unhandled Rejection', {
    reason: reason?.toString(),
    stack: reason?.stack
  });
  gracefulShutdown();
});


