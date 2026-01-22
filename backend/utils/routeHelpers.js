/**
 * Route Helper Functions
 * Common utility functions used across route modules
 */

/**
 * Get pagination parameters from request
 * @param {Object} req - Express request object
 * @returns {Object} - Object with page, limit, and offset
 */
function getPagination(req) {
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 10, 10);
  const offset = (page - 1) * limit;

  return {
    page: page > 0 ? page : 1,
    limit: limit > 0 ? limit : 10,
    offset: offset >= 0 ? offset : 0,
  };
}

/**
 * Generate a unique tracking number
 * Format: YN-{timestamp}-{random}
 * @returns {string} - Tracking number
 */
function generateTrackingNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `YN-${timestamp}-${random}`;
}

module.exports = {
  getPagination,
  generateTrackingNumber,
};















