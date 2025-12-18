/**
 * Database Connection Retry Logic
 * Implements exponential backoff for database connection retries
 */

const { Pool } = require('pg');

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_INITIAL_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 30000; // 30 seconds
const DEFAULT_MULTIPLIER = 2;

/**
 * Create PostgreSQL pool with retry logic
 */
async function createPoolWithRetry(config, options = {}) {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelay = DEFAULT_INITIAL_DELAY,
    maxDelay = DEFAULT_MAX_DELAY,
    multiplier = DEFAULT_MULTIPLIER,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const pool = new Pool(config);
      
      // Test connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log(`✅ Database connection successful (attempt ${attempt + 1})`);
      
      // Set up error handlers
      pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
        errorLogger.logError(err, { type: 'database_pool_error' });
      });
      
      return pool;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Database connection attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(delay, maxDelay);
        console.log(`🔄 Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        delay *= multiplier;
      }
    }
  }

  console.error('❌ Failed to connect to database after all retries');
  throw new Error(`Database connection failed after ${maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Execute query with retry logic
 */
async function queryWithRetry(pool, queryText, params = [], options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    multiplier = 2,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(queryText, params);
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === '23505' || // Unique violation
          error.code === '23503' || // Foreign key violation
          error.code === '23502' || // Not null violation
          error.code === '42703') { // Undefined column
        throw error;
      }
      
      // Retry on connection errors
      if (error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' ||
          error.message.includes('connection') ||
          error.message.includes('timeout')) {
        if (attempt < maxRetries) {
          console.warn(`⚠️ Query retry attempt ${attempt + 1}/${maxRetries}:`, error.message);
          await sleep(delay);
          delay = Math.min(delay * multiplier, maxDelay);
          continue;
        }
      }
      
      throw error;
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  createPoolWithRetry,
  queryWithRetry,
  sleep,
};








