/**
 * Query Timeout Utility
 * Adds timeout support to database queries
 */

const { queryWithRetry } = require('./dbRetry');

/**
 * Execute query with timeout
 */
async function queryWithTimeout(pool, queryText, params = [], timeoutMs = 30000) {
  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Query timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = await queryWithRetry(pool, queryText, params);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Create timeout wrapper for pool.query
 */
function createTimeoutWrapper(pool, defaultTimeout = 30000) {
  const originalQuery = pool.query.bind(pool);

  pool.query = function(queryText, params) {
    return queryWithTimeout(pool, queryText, params, defaultTimeout);
  };

  return pool;
}

module.exports = {
  queryWithTimeout,
  createTimeoutWrapper,
};








