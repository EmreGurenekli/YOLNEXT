const path = require('path');
const { Pool } = require('pg');

try {
  const dotenv = require('dotenv');
  const root = path.resolve(__dirname, '..', '..');
  dotenv.config({ path: path.join(root, '.env') });
  dotenv.config({ path: path.join(root, 'env.development') });
  dotenv.config({ path: path.join(root, 'env.local'), override: true });
} catch (_) {
  // ignore
}

let pool = null;

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : undefined;
  const database = process.env.DATABASE_NAME;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;

  const cfg = {};

  const hasExplicit = Boolean(host || port || database || user || password);
  if (!hasExplicit && connectionString) {
    cfg.connectionString = connectionString;
  } else {
    if (host) cfg.host = host;
    if (port) cfg.port = port;
    if (database) cfg.database = database;
    if (user) cfg.user = user;
    if (password) cfg.password = password;
  }

  if (process.env.DB_POOL_MAX) {
    const max = parseInt(process.env.DB_POOL_MAX, 10);
    if (Number.isFinite(max) && max > 0) cfg.max = max;
  }

  if (process.env.DB_IDLE_TIMEOUT) {
    const idleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT, 10);
    if (Number.isFinite(idleTimeout) && idleTimeout > 0) {
      cfg.idleTimeoutMillis = idleTimeout;
    }
  }

  if (process.env.DB_CONNECTION_TIMEOUT) {
    const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT, 10);
    if (Number.isFinite(connectionTimeout) && connectionTimeout > 0) {
      cfg.connectionTimeoutMillis = connectionTimeout;
    }
  }

  if (String(process.env.PGSSLMODE || '').toLowerCase() === 'require') {
    cfg.ssl = { rejectUnauthorized: false };
  }

  return cfg;
}

function createDatabasePool(connectionString, nodeEnv = 'development') {
  if (pool) return pool; // Return existing pool if already created
  const config = buildPoolConfig();
  pool = new Pool(config);
  
  pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
  });
  
  pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
    // In development, don't crash on connection errors
    if (nodeEnv === 'production') {
      console.error('CRITICAL: Database connection failed in production');
    }
  });
  
  // Test connection in development
  if (nodeEnv === 'development') {
    pool.query('SELECT 1').catch((err) => {
      console.warn('⚠️  Database connection test failed (backend will continue but may not function correctly):', err.message);
      console.warn('   Make sure PostgreSQL is running and DATABASE_URL is correct');
    });
  }
  
  return pool;
}

module.exports = {
  createDatabasePool,
};

