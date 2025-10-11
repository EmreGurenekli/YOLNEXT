const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const authRoutes = require('../routes/auth');

// Test app oluştur
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  beforeEach(async () => {
    // Test veritabanını temizle
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM users', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  });

  afterAll(() => {
    db.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        panel_type: 'individual',
        phone: '05321234567'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should not register user with existing email', async () => {
      // Önce bir kullanıcı oluştur
      const hashedPassword = await bcrypt.hash('password123', 10);
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (name, email, password, panel_type) VALUES (?, ?, ?, ?)',
          ['Existing User', 'existing@example.com', hashedPassword, 'individual'],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123',
        panel_type: 'individual'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const userData = {
        name: 'Test User',
        // email eksik
        password: 'password123',
        panel_type: 'individual'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should validate panel type', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        panel_type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid panel type');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Test kullanıcısı oluştur
      const hashedPassword = await bcrypt.hash('password123', 10);
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (name, email, password, panel_type) VALUES (?, ?, ?, ?)',
          ['Test User', 'test@example.com', hashedPassword, 'individual'],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should validate required fields', async () => {
      const loginData = {
        email: 'test@example.com'
        // password eksik
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('POST /api/auth/demo-login', () => {
    it('should login with demo individual account', async () => {
      const response = await request(app)
        .post('/api/auth/demo-login')
        .send({ userType: 'individual' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.user_type).toBe('individual');
    });

    it('should login with demo corporate account', async () => {
      const response = await request(app)
        .post('/api/auth/demo-login')
        .send({ userType: 'corporate' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.user_type).toBe('corporate');
    });

    it('should not login with invalid user type', async () => {
      const response = await request(app)
        .post('/api/auth/demo-login')
        .send({ userType: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid demo user type');
    });
  });

  describe('POST /api/auth/verify-token', () => {
    it('should verify valid token', async () => {
      // Önce bir kullanıcı oluştur ve token al
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (name, email, password, panel_type) VALUES (?, ?, ?, ?)',
          ['Test User', 'test@example.com', hashedPassword, 'individual'],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(userId);
    });

    it('should not verify invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should not verify expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token expired');
    });
  });
});



