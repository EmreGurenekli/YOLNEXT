// Authentication middleware extracted from postgres-backend.js

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware factory
 * Requires pool and JWT_SECRET to be passed
 */
function createAuthMiddleware(pool, JWT_SECRET) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token required',
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if this is a demo user
        if (decoded.isDemo) {
          req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            userType: decoded.userType,
            panel_type: decoded.panel_type || decoded.userType || decoded.role,
            isDemo: true,
          };
          return next();
        }

        // Get user from database for real users
        if (pool) {
          let userResult;
          try {
            userResult = await pool.query(
              'SELECT id, email, role, "isActive" as "isActive" FROM users WHERE id = $1',
              [decoded.userId]
            );
          } catch (e1) {
            try {
              userResult = await pool.query(
                'SELECT id, email, role, is_active as "isActive" FROM users WHERE id = $1',
                [decoded.userId]
              );
            } catch (e2) {
              userResult = await pool.query(
                'SELECT id, email, role FROM users WHERE id = $1',
                [decoded.userId]
              );
            }
          }
          if (userResult.rows.length === 0) {
            return res.status(403).json({
              success: false,
              message: 'Invalid or inactive user',
            });
          }
          const dbUser = userResult.rows[0];
          if (Object.prototype.hasOwnProperty.call(dbUser, 'isActive') && dbUser.isActive === false) {
            return res.status(403).json({
              success: false,
              message: 'Invalid or inactive user',
            });
          }
          req.user = dbUser;
        } else {
          req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          };
        }

        next();
      } catch (jwtError) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: error.message,
      });
    }
  };
}

module.exports = { createAuthMiddleware };
