const request = require('supertest');
const app = require('../../backend/app');

describe('Shipments API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Register and login a test user
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'shipmenttest@example.com',
      password: 'password123',
      userType: 'individual',
    };

    await request(app).post('/api/auth/register').send(userData);

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.data.id;
  });

  describe('POST /api/shipments', () => {
    it('should create a new shipment', async () => {
      const shipmentData = {
        title: 'Test Shipment',
        description: 'Test description',
        category: 'electronics',
        weight: 10.5,
        pickupAddress: 'Istanbul, Turkey',
        deliveryAddress: 'Ankara, Turkey',
        price: 100.0,
      };

      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shipmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(shipmentData.title);
    });

    it('should require authentication', async () => {
      const shipmentData = {
        title: 'Test Shipment',
        description: 'Test description',
      };

      await request(app).post('/api/shipments').send(shipmentData).expect(401);
    });
  });

  describe('GET /api/shipments', () => {
    it('should get user shipments', async () => {
      const response = await request(app)
        .get('/api/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/shipments').expect(401);
    });
  });
});
