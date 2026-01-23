/**
 * Modular Backend Server
 * Main entry point - uses modular configuration files
 */

const path = require('path');
const dotenv = require('dotenv');

// Load env from repo root with precedence:
// .env (lowest) < env.development < env.local (highest)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../env.development'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../env.local'), override: true });

const express = require('express');
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
const IS_TEST = NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'dev-secret-key-change-in-production');
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext';
const SENTRY_DSN = process.env.SENTRY_DSN;

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
    }
  }

  // Validate JWT secret strength
  if (JWT_SECRET && JWT_SECRET.length < 32) {
    errorLogger.warn('JWT_SECRET is weak (less than 32 characters) - use a strong secret in production');
  }

  // Validate database URL
  if (!DATABASE_URL.includes('postgresql://')) {
    errorLogger.error('DATABASE_URL must be a valid PostgreSQL connection string', { databaseUrl: DATABASE_URL.substring(0, 20) + '...' });
    process.exit(1);
  }

  errorLogger.info('Environment validation completed');
}

validateEnvironment();

if (NODE_ENV === 'production' && !JWT_SECRET) {
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

// Start server
async function startServer() {
  try {
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
        healthCheck: `http://localhost:${PORT}/api/health`
      });
    });
  } catch (error) {
    errorLogger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Only start the server when this file is executed directly
if (require.main === module && !IS_TEST) {
  startServer();
}

module.exports = { app, server, pool };
