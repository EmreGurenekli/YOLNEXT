const request = require('supertest');
const app = require('../../backend/app');

describe('Complete Business Workflow', () => {
  let individualToken, nakliyeciToken, tasiyiciToken;
  let individualId, nakliyeciId, tasiyiciId;
  let shipmentId, offerId;

  beforeAll(async () => {
    // Register individual user
    const individualData = {
      firstName: 'Individual',
      lastName: 'User',
      email: 'individual@test.com',
      password: 'password123',
      userType: 'individual',
    };

    await request(app).post('/api/auth/register').send(individualData);
    const individualLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: individualData.email, password: individualData.password });

    individualToken = individualLogin.body.token;
    individualId = individualLogin.body.data.id;

    // Register nakliyeci user
    const nakliyeciData = {
      firstName: 'Nakliyeci',
      lastName: 'User',
      email: `nakliyeci_${Date.now()}@test.com`,
      password: 'password123',
      userType: 'nakliyeci',
    };

    await request(app).post('/api/auth/register').send(nakliyeciData);
    const nakliyeciLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: nakliyeciData.email, password: nakliyeciData.password });

    nakliyeciToken = nakliyeciLogin.body.token;
    nakliyeciId = nakliyeciLogin.body.data.id;

    // Register tasiyici user
    const tasiyiciData = {
      firstName: 'Tasiyici',
      lastName: 'User',
      email: `tasiyici_${Date.now()}@test.com`,
      password: 'password123',
      userType: 'tasiyici',
    };

    await request(app).post('/api/auth/register').send(tasiyiciData);
    const tasiyiciLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: tasiyiciData.email, password: tasiyiciData.password });

    tasiyiciToken = tasiyiciLogin.body.token;
    tasiyiciId = tasiyiciLogin.body.data.id;
  });

  describe('Complete Shipment Workflow', () => {
    it('Step 1: Individual creates shipment', async () => {
      const shipmentData = {
        title: 'Test Shipment',
        description: 'Complete workflow test',
        category: 'electronics',
        weight: 15.0,
        pickupAddress: 'Istanbul, Turkey',
        deliveryAddress: 'Ankara, Turkey',
        price: 200.0,
      };

      const response = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${individualToken}`)
        .send(shipmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      shipmentId = response.body.data.id;
    });

    it('Step 2: Nakliyeci views open shipments', async () => {
      const response = await request(app)
        .get('/api/shipments/open')
        .set('Authorization', `Bearer ${nakliyeciToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('Step 3: Nakliyeci makes offer', async () => {
      const offerData = {
        shipmentId: shipmentId,
        price: 180.0,
        message: 'I can handle this shipment',
        estimatedDelivery: '2024-02-15',
      };

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${nakliyeciToken}`)
        .send(offerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      offerId = response.body.data.id;
    });

    it('Step 4: Individual accepts offer', async () => {
      const response = await request(app)
        .post(`/api/offers/${offerId}/accept`)
        .set('Authorization', `Bearer ${individualToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('Step 5: Check shipment status update', async () => {
      const response = await request(app)
        .get('/api/shipments')
        .set('Authorization', `Bearer ${individualToken}`)
        .expect(200);

      const shipment = response.body.data.find(s => s.id === shipmentId);
      expect(shipment.status).toBe('accepted');
    });
  });
});
