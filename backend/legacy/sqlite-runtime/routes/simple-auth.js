const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const securityMiddleware = require('../middleware/security');
const router = express.Router();

// Simple in-memory user storage for demo
let users = [];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - userType
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               userType:
 *                 type: string
 *                 enum: [individual, corporate, nakliyeci, tasiyici]
 *                 example: "individual"
 *               companyName:
 *                 type: string
 *                 example: "Acme Corp"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userType:
 *                       type: string
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User already exists"
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().isLength({ min: 2 }),
    body('lastName').trim().isLength({ min: 2 }),
    body('userType').isIn(['individual', 'corporate', 'nakliyeci', 'tasiyici']),
  ],
  securityMiddleware.authLimiter,
  securityMiddleware.validateEmail,
  securityMiddleware.validatePassword,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        userType,
        phone,
        companyName,
      } = req.body;

      // Check if user already exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = {
        id: require('uuid').v4(),
        firstName,
        lastName,
        email,
        password: hashedPassword,
        userType,
        phone,
        companyName,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      users.push(user);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, userType: user.userType },
        process.env.JWT_SECRET ||
          (() => {
            console.error('JWT_SECRET environment variable is not set!');
            process.exit(1);
          })(),
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          companyName: user.companyName,
          phone: user.phone,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  securityMiddleware.authLimiter,
  securityMiddleware.validateEmail,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, userType: user.userType },
        process.env.JWT_SECRET ||
          (() => {
            console.error('JWT_SECRET environment variable is not set!');
            process.exit(1);
          })(),
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          companyName: user.companyName,
          phone: user.phone,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Demo login (quick access without credentials)
router.post('/demo-login', async (req, res) => {
  try {
    const { panelType = 'individual' } = req.body || {};

    const profiles = {
      individual: {
        id: 'demo-individual',
        firstName: 'Demo',
        lastName: 'Bireysel',
        email: 'demo.individual@yolnext.com',
        userType: 'individual',
        companyName: null,
        phone: '+900000000000',
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
      corporate: {
        id: 'demo-corporate',
        firstName: 'Demo',
        lastName: 'Kurumsal',
        email: 'demo.corporate@yolnext.com',
        userType: 'corporate',
        companyName: 'Demo A.Ş.',
        phone: '+900000000001',
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
      nakliyeci: {
        id: 'demo-nakliyeci',
        firstName: 'Demo',
        lastName: 'Nakliyeci',
        email: 'demo.nakliyeci@yolnext.com',
        userType: 'nakliyeci',
        companyName: 'Demo Lojistik',
        phone: '+900000000002',
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
      tasiyici: {
        id: 'demo-tasiyici',
        firstName: 'Demo',
        lastName: 'Taşıyıcı',
        email: 'demo.tasiyici@yolnext.com',
        userType: 'tasiyici',
        companyName: null,
        phone: '+900000000003',
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
    };

    const selected = profiles[panelType] || profiles.individual;

    const token = jwt.sign(
      {
        userId: selected.id,
        email: selected.email,
        userType: selected.userType,
      },
      process.env.JWT_SECRET ||
        (() => {
          console.error('JWT_SECRET environment variable is not set!');
          process.exit(1);
        })(),
      { expiresIn: '2d' }
    );

    return res.json({
      success: true,
      message: 'Demo login successful',
      user: selected,
      token,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: 'Demo login error' });
  }
});

module.exports = router;
