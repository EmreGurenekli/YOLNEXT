const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, panel_type, company_name, location, phone } = req.body;

    // Validation
    if (!name || !email || !password || !panel_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['individual', 'corporate', 'nakliyeci', 'tasiyici'].includes(panel_type)) {
      return res.status(400).json({ error: 'Invalid panel type' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        `INSERT INTO users (name, email, password, panel_type, company_name, location, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, panel_type, company_name || null, location || null, phone || null],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const userId = this.lastID;

          // Create carrier record if nakliyeci or tasiyici
          if (panel_type === 'nakliyeci' || panel_type === 'tasiyici') {
            db.run(
              `INSERT INTO carriers (user_id, company_name, location) VALUES (?, ?, ?)`,
              [userId, company_name || null, location || null]
            );
          }

          // Generate JWT token
          const token = jwt.sign(
            { userId, email, panel_type },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
              id: userId,
              name,
              email,
              panel_type,
              company_name,
              location
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    db.get(
      `SELECT id, name, email, password, panel_type, company_name, location, phone, avatar 
       FROM users WHERE email = ?`,
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, panel_type: user.panel_type },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            panel_type: user.panel_type,
            company_name: user.company_name,
            location: user.location,
            phone: user.phone,
            avatar: user.avatar
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  db.get(
    `SELECT id, name, email, panel_type, company_name, location, phone, avatar, created_at 
     FROM users WHERE id = ?`,
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    }
  );
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;