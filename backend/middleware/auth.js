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
            isDemo: true,
          };
          return next();
        }

        // Get user from database for real users
        if (pool) {
          const userResult = await pool.query(
            'SELECT id, email, role, isActive FROM users WHERE id = $1',
            [decoded.userId]
          );
          if (userResult.rows.length === 0) {
            return res.status(403).json({
              success: false,
              message: 'Invalid or inactive user',
            });
          }
          const dbUser = userResult.rows[0];
          if (dbUser.isActive === false) {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => {
      console.error('JWT_SECRET environment variable is not set!');
      process.exit(1);
    })());
    
    // Kullanıcıyı veritabanından bul
    let user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Kullanıcı tipi kontrolü
const requireUserType = (userTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!userTypes.includes(req.user.user_type)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Opsiyonel authentication
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => {
      console.error('JWT_SECRET environment variable is not set!');
      process.exit(1);
    })());
      const user = await User.findByPk(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Opsiyonel olduğu için hata durumunda devam et
    next();
  }
};

// Yetkilendirme kontrolü
const authorize = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Basit yetkilendirme kontrolü
    if (permissions.includes('admin') && req.user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  };
};

// Alias'lar
const auth = authenticateToken;
const protect = authenticateToken;

module.exports = {
  authenticateToken,
  requireUserType,
  optionalAuth,
  authorize,
  auth,
  protect
};

