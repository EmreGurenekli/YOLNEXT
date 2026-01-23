/**
 * Database Configuration
 * Centralized database pool creation and management
 */

const { Pool } = require('pg');
const errorLogger = require('../utils/errorLogger');

/**
 * Create PostgreSQL connection pool
 * @param {string} connectionString - Database connection string
 * @param {string} nodeEnv - Node environment (development/production)
 * @returns {Pool} PostgreSQL connection pool
 */
function createDatabasePool(connectionString, nodeEnv = 'development') {
  try {
    // Parse connection string or use individual parameters
    let poolConfig = {};

    if (connectionString) {
      poolConfig.connectionString = connectionString;
    } else {
      // Fallback to individual environment variables
      poolConfig = {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        database: process.env.DATABASE_NAME || 'yolnext',
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
      };
    }

    // Pool configuration
    poolConfig.max = parseInt(process.env.DB_POOL_MAX || '20', 10);
    poolConfig.idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10);
    poolConfig.connectionTimeoutMillis = parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10);

    // SSL configuration for production
    if (nodeEnv === 'production' || process.env.PGSSLMODE === 'require') {
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    }

    const pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      errorLogger.error('Unexpected database pool error', {
        error: err.message,
        code: err.code,
      });
    });

    // Test connection
    pool.query('SELECT NOW()', (err) => {
      if (err) {
        errorLogger.error('Database connection test failed', {
          error: err.message,
          code: err.code,
        });
      } else {
        errorLogger.info('Database pool created successfully', {
          max: poolConfig.max,
          environment: nodeEnv,
        });
      }
    });

    return pool;
  } catch (error) {
    errorLogger.error('Failed to create database pool', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  createDatabasePool,
};

