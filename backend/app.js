const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const MigrationRunner = require('./migrations/migration-runner');
const logger = require('./utils/logger');
const sqliteDb = require('./config/database-sqlite');
const { swaggerUi, specs } = require('./docs/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger, errorLogger } = require('./middleware/requestLogger');
const {
  metricsMiddleware,
  errorMetricsMiddleware,
} = require('./middleware/metrics');
const securityMiddleware = require('./middleware/security');

// Load environment configuration
require('./config/environment');

// Import routes (use simple-auth as single source)
const authRoutes = require('./routes/simple-auth');
const healthRoutes = require('./routes/health');

class YolNextApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    this.pool = null;
    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async setupDatabase() {
    try {
      // Try PostgreSQL first if available
      if (
        process.env.DATABASE_URL &&
        process.env.DATABASE_URL.includes('postgresql')
      ) {
        this.pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        // Test connection
        await this.pool.query('SELECT NOW()');
        logger.info('PostgreSQL database connected successfully');

        // Run migrations
        const migrationRunner = new MigrationRunner();
        await migrationRunner.runMigrations();
        await migrationRunner.close();
      } else {
        // Fallback to SQLite
        logger.warn('PostgreSQL not configured, using SQLite fallback');
        await sqliteDb.connect();
        this.pool = sqliteDb;
        logger.info('SQLite database connected successfully');
      }
    } catch (error) {
      logger.error('Database setup failed, using in-memory storage', {
        error: error.message,
      });
      // Continue without database for demo
      this.pool = null;
    }
  }

  setupMiddleware() {
    // Enhanced Security middleware
    this.app.use(securityMiddleware.helmetConfig);

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );

    // General API rate limiting
    this.app.use(securityMiddleware.apiLimiter);

    // Compression
    this.app.use(compression());

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(
        morgan('combined', {
          stream: {
            write: message => logger.info(message.trim()),
          },
        })
      );
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security middleware stack (body parsing'den sonra)
    this.app.use(securityMiddleware.sanitizeInput);
    this.app.use(securityMiddleware.sqlInjectionProtection);
    this.app.use(securityMiddleware.xssProtection);
    this.app.use((req, res, next) => {
      // Provide legacy X-XSS-Protection header expected by some tests
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = uuidv4();
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Request logging middleware
    this.app.use(requestLogger);

    // Metrics collection middleware
    this.app.use(metricsMiddleware);

    // Database middleware
    this.app.use((req, res, next) => {
      req.db = this.pool;
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.use('/health', healthRoutes);

    // Swagger documentation
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'YolNext API Documentation',
      })
    );

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/verify', require('./routes/verification'));
    this.app.use('/api/shipments', require('./routes/shipments'));
    this.app.use('/api/offers', require('./routes/offers-fixed'));
    this.app.use('/api/messages', require('./routes/messages-fixed'));
    this.app.use('/api/wallet', require('./routes/wallet'));

    // 404 handler
    this.app.use('*', notFoundHandler);
  }

  setupErrorHandling() {
    // Error logging middleware
    this.app.use(errorLogger);

    // Error metrics middleware
    this.app.use(errorMetricsMiddleware);

    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  async gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully`);

    try {
      // Close database connections
      if (this.pool) {
        await this.pool.end();
        logger.info('Database connections closed');
      }

      // Close server
      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      }
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  }

  async start() {
    try {
      this.server = this.app.listen(this.port, () => {
        logger.info(`YolNext API Server started on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const application = new YolNextApp();
  application.start();
}

// Export an Express app instance for testing (Supertest expects an Express app)
module.exports = new YolNextApp().app;
