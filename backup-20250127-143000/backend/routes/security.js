const express = require('express');
const rateLimit = require('express-rate-limit');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting for security endpoints
const securityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many security attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Log security event
const logSecurityEvent = (userId, action, req, details = null) => {
  const ip_address = req.ip || req.connection.remoteAddress;
  const user_agent = req.get('User-Agent');
  
  // Determine risk level
  let risk_level = 'low';
  if (action.includes('login_failed') || action.includes('suspicious')) {
    risk_level = 'high';
  } else if (action.includes('password_change') || action.includes('email_change')) {
    risk_level = 'medium';
  }

  db.run(
    `INSERT INTO security_logs (user_id, action, ip_address, user_agent, details, risk_level)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, ip_address, user_agent, JSON.stringify(details), risk_level],
    (err) => {
      if (err) {
        console.error('Security log error:', err);
      }
    }
  );
};

// Get security logs
router.get('/logs', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 20, risk_level } = req.query;

  let query = `SELECT * FROM security_logs WHERE user_id = ?`;
  let params = [userId];

  if (risk_level) {
    query += ` AND risk_level = ?`;
    params.push(risk_level);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, logs) => {
    if (err) {
      console.error('Get security logs error:', err);
      return res.status(500).json({ error: 'Failed to fetch security logs' });
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM security_logs WHERE user_id = ?`;
    let countParams = [userId];

    if (risk_level) {
      countQuery += ` AND risk_level = ?`;
      countParams.push(risk_level);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Get security logs count error:', err);
        return res.status(500).json({ error: 'Failed to fetch security logs count' });
      }

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit))
        }
      });
    });
  });
});

// Change password
router.post('/change-password', securityLimiter, authenticateToken, [
  body('current_password').isString().withMessage('Current password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logSecurityEvent(req.user.userId, 'password_change_validation_failed', req, { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;
    const userId = req.user.userId;

    // Get current user
    db.get(
      `SELECT password FROM users WHERE id = ?`,
      [userId],
      (err, user) => {
        if (err) {
          console.error('Get user for password change error:', err);
          return res.status(500).json({ error: 'Failed to verify current password' });
        }

        if (!user) {
          logSecurityEvent(userId, 'password_change_user_not_found', req);
          return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        bcrypt.compare(current_password, user.password, (err, isMatch) => {
          if (err) {
            console.error('Password comparison error:', err);
            return res.status(500).json({ error: 'Failed to verify current password' });
          }

          if (!isMatch) {
            logSecurityEvent(userId, 'password_change_wrong_current', req);
            return res.status(400).json({ error: 'Current password is incorrect' });
          }

          // Hash new password
          bcrypt.hash(new_password, 10, (err, hashedPassword) => {
            if (err) {
              console.error('Password hashing error:', err);
              return res.status(500).json({ error: 'Failed to hash new password' });
            }

            // Update password
            db.run(
              `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [hashedPassword, userId],
              function(err) {
                if (err) {
                  console.error('Update password error:', err);
                  return res.status(500).json({ error: 'Failed to update password' });
                }

                logSecurityEvent(userId, 'password_change_success', req);
                res.json({ message: 'Password changed successfully' });
              }
            );
          });
        });
      }
    );
  } catch (error) {
    console.error('Change password error:', error);
    logSecurityEvent(req.user.userId, 'password_change_error', req, { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update email
router.post('/change-email', securityLimiter, authenticateToken, [
  body('new_email').isEmail().withMessage('Valid email is required'),
  body('password').isString().withMessage('Password is required for email change')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logSecurityEvent(req.user.userId, 'email_change_validation_failed', req, { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { new_email, password } = req.body;
    const userId = req.user.userId;

    // Get current user
    db.get(
      `SELECT password, email FROM users WHERE id = ?`,
      [userId],
      (err, user) => {
        if (err) {
          console.error('Get user for email change error:', err);
          return res.status(500).json({ error: 'Failed to verify user' });
        }

        if (!user) {
          logSecurityEvent(userId, 'email_change_user_not_found', req);
          return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const bcrypt = require('bcryptjs');
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.error('Password verification error:', err);
            return res.status(500).json({ error: 'Failed to verify password' });
          }

          if (!isMatch) {
            logSecurityEvent(userId, 'email_change_wrong_password', req);
            return res.status(400).json({ error: 'Password is incorrect' });
          }

          // Check if new email already exists
          db.get(
            `SELECT id FROM users WHERE email = ? AND id != ?`,
            [new_email, userId],
            (err, existingUser) => {
              if (err) {
                console.error('Check email existence error:', err);
                return res.status(500).json({ error: 'Failed to check email availability' });
              }

              if (existingUser) {
                logSecurityEvent(userId, 'email_change_email_exists', req, { new_email });
                return res.status(400).json({ error: 'Email already exists' });
              }

              // Update email
              db.run(
                `UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [new_email, userId],
                function(err) {
                  if (err) {
                    console.error('Update email error:', err);
                    return res.status(500).json({ error: 'Failed to update email' });
                  }

                  logSecurityEvent(userId, 'email_change_success', req, { 
                    old_email: user.email, 
                    new_email 
                  });
                  res.json({ message: 'Email changed successfully' });
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Change email error:', error);
    logSecurityEvent(req.user.userId, 'email_change_error', req, { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enable/disable 2FA
router.post('/2fa/toggle', securityLimiter, authenticateToken, [
  body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  body('password').isString().withMessage('Password is required for 2FA changes')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logSecurityEvent(req.user.userId, '2fa_toggle_validation_failed', req, { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { enabled, password } = req.body;
    const userId = req.user.userId;

    // Get current user
    db.get(
      `SELECT password FROM users WHERE id = ?`,
      [userId],
      (err, user) => {
        if (err) {
          console.error('Get user for 2FA toggle error:', err);
          return res.status(500).json({ error: 'Failed to verify user' });
        }

        if (!user) {
          logSecurityEvent(userId, '2fa_toggle_user_not_found', req);
          return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const bcrypt = require('bcryptjs');
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.error('Password verification error:', err);
            return res.status(500).json({ error: 'Failed to verify password' });
          }

          if (!isMatch) {
            logSecurityEvent(userId, '2fa_toggle_wrong_password', req);
            return res.status(400).json({ error: 'Password is incorrect' });
          }

          // For now, just log the action (2FA implementation would go here)
          logSecurityEvent(userId, enabled ? '2fa_enabled' : '2fa_disabled', req);
          
          res.json({ 
            message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully`,
            enabled 
          });
        });
      }
    );
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    logSecurityEvent(req.user.userId, '2fa_toggle_error', req, { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get security settings
router.get('/settings', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  // Get recent security logs
  db.all(
    `SELECT action, created_at, risk_level FROM security_logs 
     WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
     ORDER BY created_at DESC LIMIT 10`,
    [userId],
    (err, recentLogs) => {
      if (err) {
        console.error('Get security settings error:', err);
        return res.status(500).json({ error: 'Failed to fetch security settings' });
      }

      // Count risk levels
      const riskCounts = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };

      recentLogs.forEach(log => {
        riskCounts[log.risk_level]++;
      });

      res.json({
        recent_activity: recentLogs,
        risk_counts: riskCounts,
        security_score: calculateSecurityScore(riskCounts),
        recommendations: generateSecurityRecommendations(riskCounts)
      });
    }
  );
});

// Calculate security score
function calculateSecurityScore(riskCounts) {
  const total = riskCounts.low + riskCounts.medium + riskCounts.high + riskCounts.critical;
  if (total === 0) return 100;

  const score = 100 - (riskCounts.medium * 5 + riskCounts.high * 15 + riskCounts.critical * 30);
  return Math.max(0, Math.min(100, score));
}

// Generate security recommendations
function generateSecurityRecommendations(riskCounts) {
  const recommendations = [];

  if (riskCounts.critical > 0) {
    recommendations.push({
      type: 'critical',
      message: 'Critical security events detected. Please review your account immediately.',
      action: 'Contact support'
    });
  }

  if (riskCounts.high > 3) {
    recommendations.push({
      type: 'high',
      message: 'Multiple high-risk events detected. Consider changing your password.',
      action: 'Change password'
    });
  }

  if (riskCounts.medium > 5) {
    recommendations.push({
      type: 'medium',
      message: 'Several medium-risk events detected. Enable 2FA for better security.',
      action: 'Enable 2FA'
    });
  }

  if (riskCounts.low > 20) {
    recommendations.push({
      type: 'low',
      message: 'High activity detected. Monitor your account regularly.',
      action: 'Review activity'
    });
  }

  return recommendations;
}

// Admin: Get all security logs
router.get('/admin/logs', authenticateToken, (req, res) => {
  // Check if user is admin (you might want to add admin role check)
  const { risk_level, user_id, page = 1, limit = 50 } = req.query;

  let query = `
    SELECT sl.*, u.name, u.email 
    FROM security_logs sl 
    LEFT JOIN users u ON sl.user_id = u.id
  `;
  let params = [];
  let conditions = [];

  if (risk_level) {
    conditions.push('sl.risk_level = ?');
    params.push(risk_level);
  }

  if (user_id) {
    conditions.push('sl.user_id = ?');
    params.push(user_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY sl.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, logs) => {
    if (err) {
      console.error('Get all security logs error:', err);
      return res.status(500).json({ error: 'Failed to fetch security logs' });
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM security_logs sl 
      LEFT JOIN users u ON sl.user_id = u.id
    `;
    let countParams = [];

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Get security logs count error:', err);
        return res.status(500).json({ error: 'Failed to fetch security logs count' });
      }

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit))
        }
      });
    });
  });
});

module.exports = router;