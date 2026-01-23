const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const SimpleUser = require('../models/SimpleUser');
const router = express.Router();

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
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 2 }),
    body('lastName').trim().isLength({ min: 2 }),
    body('userType').isIn(['individual', 'corporate', 'nakliyeci', 'tasiyici']),
  ],
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
      const User = new SimpleUser(req.db);
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        userType,
        phone,
        companyName,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, userType: user.userType },
        process.env.JWT_SECRET,
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
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
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
      const User = new SimpleUser(req.db);
      const user = await User.findOne({ email });
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
        process.env.JWT_SECRET,
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

// Demo login endpoint for quick access without real credentials
router.post('/demo-login', async (req, res) => {
  try {
    const { panelType = 'individual' } = req.body || {};

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

    const token = jwt.sign(
      {
        userId: selected.id,
        email: selected.email,
        userType: selected.panel_type,
      },
      process.env.JWT_SECRET || 'dev_demo_secret',
      { expiresIn: '2d' }
    );

    return res.json({
      success: true,
      message: 'Demo login successful',
      user: selected,
      token,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Demo login error' });
  }
});

module.exports = router;
