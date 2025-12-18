// Auth routes - Modular version
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function createAuthRoutes(pool, JWT_SECRET, createNotification, sendEmail) {
  const router = express.Router();

  // Demo login endpoint for quick access without real credentials
  router.post('/demo-login', async (req, res) => {
    try {
      const body = req.body || {};
      const panelType = body.panelType || body.userType || 'individual';

      // Map demo profiles
      const profiles = {
        individual: {
          id: 101,
          name: 'Demo Bireysel',
          email: 'demo.individual@yolnext.com',
          panel_type: 'individual',
          company_name: null,
          tax_number: null,
        },
        admin: {
          id: 1000,
          name: 'Demo Admin',
          email: 'demo.admin@yolnext.com',
          panel_type: 'admin',
          company_name: null,
          tax_number: null,
        },
        corporate: {
          id: 102,
          name: 'Demo Kurumsal',
          email: 'demo.corporate@yolnext.com',
          panel_type: 'corporate',
          company_name: 'Demo A.Ş.',
          tax_number: '1234567890',
        },
        nakliyeci: {
          id: 103,
          name: 'Demo Nakliyeci',
          email: 'demo.nakliyeci@yolnext.com',
          panel_type: 'nakliyeci',
          company_name: 'Demo Lojistik',
          tax_number: '9988776655',
        },
        tasiyici: {
          id: 104,
          name: 'Demo Taşıyıcı',
          email: 'demo.tasiyici@yolnext.com',
          panel_type: 'tasiyici',
          company_name: null,
          tax_number: null,
        },
      };

      const selected = profiles[panelType] || profiles.individual;

      // Ensure demo user exists and is active.
      // IMPORTANT: do NOT force fixed IDs into the DB because the users table may use generated IDs.
      // Instead, lookup/create by email and use the actual DB id in the JWT.
      let effectiveUserId = selected.id;
      if (pool) {
        try {
          const fullName = selected.name || String(selected.email || '').split('@')[0] || 'Demo User';
          const role = selected.panel_type;

          // Try to find existing demo user by email
          const existingByEmail = await pool.query('SELECT id, role, "isActive" FROM users WHERE email = $1', [selected.email]);
          if (existingByEmail.rows && existingByEmail.rows.length > 0) {
            effectiveUserId = existingByEmail.rows[0].id;
            try {
              await pool.query(
                'UPDATE users SET "isActive" = true, role = COALESCE(role, $2), "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1',
                [effectiveUserId, role]
              );
            } catch (eCamelUpd) {
              await pool.query(
                'UPDATE users SET is_active = true, role = COALESCE(role, $2), updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [effectiveUserId, role]
              );
            }
          } else {
            const hashedPassword = await bcrypt.hash('demo_password', 10);
            // Try camelCase schema first, then snake_case fallback
            try {
              const ins = await pool.query(
                `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, "companyName", "isActive", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id`,
                [selected.email, hashedPassword, fullName, null, fullName, role, selected.company_name || null, true]
              );
              if (ins.rows && ins.rows[0]?.id) effectiveUserId = ins.rows[0].id;
            } catch (eCamel) {
              const ins = await pool.query(
                `INSERT INTO users (email, password, first_name, last_name, full_name, role, company_name, is_active, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id`,
                [selected.email, hashedPassword, fullName, null, fullName, role, selected.company_name || null, true]
              );
              if (ins.rows && ins.rows[0]?.id) effectiveUserId = ins.rows[0].id;
            }
          }
        } catch (e) {
          // Non-critical; demo login should still return a token even if DB write fails
        }
      }

      const token = jwt.sign(
        {
          userId: effectiveUserId,
          id: effectiveUserId,
          email: selected.email,
          role: selected.panel_type,
          userType: selected.panel_type,
          isDemo: true,
        },
        JWT_SECRET || process.env.JWT_SECRET || 'dev_demo_secret',
        { expiresIn: '2d' }
      );

      return res.json({
        success: true,
        message: 'Demo login successful',
        user: { ...selected, id: effectiveUserId },
        token,
        data: {
          token,
          user: { ...selected, id: effectiveUserId },
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: 'Demo login error' });
    }
  });

  // Forgot password (compatibility)
  router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body || {};

      // Always return success to avoid account enumeration.
      // If email exists and sendEmail is configured, we can best-effort send a reset link.
      if (pool && sendEmail && email) {
        try {
          const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
          if (userResult.rows.length > 0) {
            const token = jwt.sign(
              { type: 'password_reset', email },
              JWT_SECRET,
              { expiresIn: '1h' }
            );
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${encodeURIComponent(token)}`;
            await sendEmail(email, 'Şifre Sıfırlama', `Şifre sıfırlama bağlantısı: ${resetLink}`);
          }
        } catch (e) {
          // Non-critical
        }
      }

      return res.json({ success: true, message: 'If the email exists, a reset link will be sent.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
    }
  });

  // Reset password (compatibility)
  router.post('/reset-password', async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, error: 'Database not available' });
      }

      const { token, password } = req.body || {};
      if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token and password are required' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded || decoded.type !== 'password_reset' || !decoded.email) {
        return res.status(400).json({ success: false, message: 'Invalid reset token' });
      }

      if (String(password).length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE email = $2', [hashedPassword, decoded.email]);

      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
  });

  // Register endpoint
  router.post('/register', async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { email, password, firstName, lastName, role, userType, phone, companyName } = req.body;
      
      // Support both 'role' and 'userType' parameters (userType is from frontend)
      const finalRole = role || userType || 'individual';

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with unique nakliyeciCode (if nakliyeci)
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || email.split('@')[0];
      
      let user = null;
      let nakliyeciCode = null;
      let driverCode = null;
      const maxAttempts = 20; // Maximum attempts to generate unique code
      
      // Use transaction for atomic operation
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        if (finalRole === 'nakliyeci') {
          // Generate unique nakliyeciCode with retry mechanism
          let attempts = 0;
          let insertSuccess = false;
          
          while (!insertSuccess && attempts < maxAttempts) {
            // Generate random 5-digit number (10000-99999)
            const randomNum = Math.floor(10000 + Math.random() * 90000);
            nakliyeciCode = `YN-${randomNum}`;
            
            try {
              // Try to insert user with this code
              const result = await client.query(
                `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, phone, "companyName", "isActive", "nakliyeciCode", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id, email, "firstName", "lastName", "fullName", role, phone, "companyName", "isActive", "nakliyeciCode"`,
                [email, hashedPassword, firstName || null, lastName || null, fullName, finalRole, phone || null, companyName || null, true, nakliyeciCode]
              );
              
              user = result.rows[0];
              insertSuccess = true;
              console.log(`✅ User registered with unique nakliyeciCode: ${nakliyeciCode} (attempt ${attempts + 1})`);
            } catch (insertError) {
              // Check if error is due to unique constraint violation (nakliyeciCode)
              if (insertError.code === '23505' && insertError.constraint && insertError.constraint.includes('nakliyeciCode')) {
                // Code already exists, try again with new random number
                attempts++;
                console.log(`⚠️ NakliyeciCode ${nakliyeciCode} already exists, generating new code (attempt ${attempts})`);
                continue;
              } else if (insertError.code === '23505' && insertError.constraint && insertError.constraint.includes('email')) {
                // Email already exists (shouldn't happen due to earlier check, but handle it)
                await client.query('ROLLBACK');
                return res.status(400).json({
                  success: false,
                  message: 'Email already registered',
                });
              } else {
                // Other database error, rollback and throw
                await client.query('ROLLBACK');
                throw insertError;
              }
            }
          }
          
          if (!insertSuccess) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed to generate unique nakliyeciCode after ${maxAttempts} attempts`);
            return res.status(500).json({
              success: false,
              message: 'Benzersiz nakliyeci kodu oluşturulamadı. Lütfen tekrar deneyin.',
            });
          }
        } else if (finalRole === 'tasiyici') {
          let attempts = 0;
          let insertSuccess = false;
          while (!insertSuccess && attempts < maxAttempts) {
            const randomNum = Math.floor(10000 + Math.random() * 90000);
            driverCode = `YD-${randomNum}`;
            try {
              const result = await client.query(
                `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, phone, "companyName", "isActive", "nakliyeciCode", "driverCode", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id, email, "firstName", "lastName", "fullName", role, phone, "companyName", "isActive", "nakliyeciCode", "driverCode"`,
                [email, hashedPassword, firstName || null, lastName || null, fullName, finalRole, phone || null, companyName || null, true, null, driverCode]
              );
              user = result.rows[0];
              insertSuccess = true;
            } catch (insertError) {
              if (insertError.code === '23505' && insertError.constraint && insertError.constraint.includes('driverCode')) {
                attempts++;
                continue;
              }
              if (insertError.code === '23505' && insertError.constraint && insertError.constraint.includes('email')) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Email already registered' });
              }
              await client.query('ROLLBACK');
              throw insertError;
            }
          }
          if (!insertSuccess) {
            await client.query('ROLLBACK');
            return res.status(500).json({ success: false, message: 'Benzersiz taşıyıcı kodu oluşturulamadı. Lütfen tekrar deneyin.' });
          }
        } else {
          const result = await client.query(
            `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, phone, "companyName", "isActive", "nakliyeciCode", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, email, "firstName", "lastName", "fullName", role, phone, "companyName", "isActive", "nakliyeciCode"`,
            [email, hashedPassword, firstName || null, lastName || null, fullName, finalRole, phone || null, companyName || null, true, null]
          );
          user = result.rows[0];
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Create JWT token (use userId for consistency with middleware)
      const token = jwt.sign(
        {
          userId: user.id, // Use userId for consistency with middleware
          id: user.id, // Keep id for backward compatibility
          email: user.email,
          role: user.role || finalRole, // Ensure role is set correctly
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Send welcome notification
      if (createNotification) {
        await createNotification(
          user.id,
          'welcome',
          'Hoş Geldiniz!',
          'YOLNEXT platformuna başarıyla kaydoldunuz.',
          '/dashboard',
          'normal'
        );
      }

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            nakliyeciCode: user.nakliyeciCode || user.nakliyecicode || null,
            driverCode: user.driverCode || user.drivercode || null,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: error.message,
      });
    }
  });

  // Login endpoint
  router.post('/login', async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Find user - explicitly select nakliyeciCode to handle case sensitivity
      const result = await pool.query(
        `SELECT id, email, password, "firstName", "lastName", "fullName", role, phone, "companyName", "nakliyeciCode", "isActive", "lastLogin", "createdAt", "updatedAt" 
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const user = result.rows[0];

      if (user.isActive === false || user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'Account is disabled',
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Update last login
      await pool.query(
        'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Create JWT token (use userId for consistency with middleware)
      const token = jwt.sign(
        {
          userId: user.id, // Use userId for consistency with middleware
          id: user.id, // Keep id for backward compatibility
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstname || user.firstName,
            lastName: user.lastname || user.lastName,
            fullName: user.fullname || user.fullName,
            role: user.role,
            phone: user.phone,
            companyName: user.companyname || user.companyName,
            nakliyeciCode: user.nakliyeciCode || user.nakliyecicode || null,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: error.message,
      });
    }
  });

  // Get current user
  router.get('/me', async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token required',
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Support both userId and id in JWT token
      const userId = decoded.userId || decoded.id;
      
      const result = await pool.query(
        'SELECT id, email, firstName, lastName, fullName, role, phone, companyName, isVerified FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: {
          user: result.rows[0],
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  });

  // Email verification endpoint (moved to separate route, keeping for backward compatibility)
  router.post('/verify/email', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          isValid: false,
          message: 'Email is required',
        });
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.json({
          success: false,
          isValid: false,
          requiresCode: false,
          message: 'Invalid email format',
        });
      }

      // Check if email already exists
      if (pool) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          return res.json({
            success: false,
            isValid: false,
            requiresCode: false,
            message: 'Email already registered',
          });
        }
      }

      // In development, skip code verification and return valid
      // In production, you would send a verification code here
      return res.json({
        success: true,
        isValid: true,
        requiresCode: false,
        message: 'Email is valid',
      });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
        success: false,
        isValid: false,
        message: 'Email verification failed',
      });
    }
  });

  // Phone verification endpoint
  router.post('/verify/phone', async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          isValid: false,
          message: 'Phone is required',
        });
      }

      // Clean phone number (remove non-digits)
      const cleanPhone = phone.replace(/\D/g, '');

      // Basic phone format validation (Turkish format)
      // Accepts: +905551234567, 05551234567, 5551234567
      if (!/^(\+90|0)?[5][0-9]{9}$/.test(cleanPhone)) {
        return res.json({
          success: false,
          isValid: false,
          requiresCode: false,
          message: 'Invalid phone format',
        });
      }

      // Check if phone already exists
      if (pool) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE phone = $1',
          [cleanPhone]
        );

        if (existingUser.rows.length > 0) {
          return res.json({
            success: false,
            isValid: false,
            requiresCode: false,
            message: 'Phone already registered',
          });
        }
      }

      // In development, skip code verification and return valid
      // In production, you would send an SMS verification code here
      return res.json({
        success: true,
        isValid: true,
        requiresCode: false,
        message: 'Phone is valid',
      });
    } catch (error) {
      console.error('Phone verification error:', error);
      return res.status(500).json({
        success: false,
        isValid: false,
        message: 'Phone verification failed',
      });
    }
  });

  // Email verification code verify endpoint
  router.post('/verify/email/verify-code', async (req, res) => {
    try {
      const { email, code } = req.body;

      // In development, accept any code
      // In production, verify the code from database/cache
      return res.json({
        success: true,
        isValid: true,
        message: 'Email verified',
      });
    } catch (error) {
      console.error('Email code verification error:', error);
      return res.status(500).json({
        success: false,
        isValid: false,
        message: 'Code verification failed',
      });
    }
  });

  // Phone verification code verify endpoint
  router.post('/verify/phone/verify-code', async (req, res) => {
    try {
      const { phone, code } = req.body;

      // In development, accept any code
      // In production, verify the code from database/cache
      return res.json({
        success: true,
        isValid: true,
        message: 'Phone verified',
      });
    } catch (error) {
      console.error('Phone code verification error:', error);
      return res.status(500).json({
        success: false,
        isValid: true,
        message: 'Code verification failed',
      });
    }
  });

  return router;
}

module.exports = createAuthRoutes;

