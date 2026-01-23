const request = require('supertest');
const app = require('../../backend/app');

describe('Security Middleware Tests', () => {
  let server;

  beforeAll(async () => {
    server = app;
  });

  afterAll(async () => {
    // no-op
  });

  describe('Rate Limiting', () => {
    test('should block too many requests', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(server)
            .post('/api/auth/login')
            .set('x-test-ratelimit', '1')
            .send({ email: 'ratelimit@example.com', password: 'wrongpassword' })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize malicious input', async () => {
      const maliciousInput = {
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        userType: 'individual',
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(maliciousInput);

      expect(response.status).toBe(400);
    });
  });

  describe('SQL Injection Protection', () => {
    test('should block SQL injection attempts', async () => {
      const sqlInjectionInput = {
        firstName: "'; DROP TABLE users; --",
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        userType: 'individual',
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(sqlInjectionInput);

      expect(response.status).toBe(400);
    });
  });

  describe('XSS Protection', () => {
    test('should block XSS attempts', async () => {
      const xssInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        userType: 'individual',
        companyName: '<iframe src="javascript:alert(1)"></iframe>',
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(xssInput);

      expect(response.status).toBe(400);
    });
  });

  describe('Password Validation', () => {
    test('should reject weak passwords', async () => {
      const weakPasswordInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: '123',
        userType: 'individual',
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(weakPasswordInput);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Password must be at least 8 characters'
      );
    });

    test('should accept strong passwords', async () => {
      const strongPasswordInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'StrongPass123!',
        userType: 'individual',
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(strongPasswordInput);

      expect(response.status).toBe(201);
    });
  });

  describe('Email Validation', () => {
    test('should reject invalid email formats', async () => {
      const invalidEmailInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'StrongPass123!',
        userType: 'individual',
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(invalidEmailInput);

      expect(response.status).toBe(400);
    });
  });
});
