const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} = require('@jest/globals');
const request = require('supertest');
const app = require('../../backend/app');

describe('Shipment Workflow Integration', () => {
  let server;
  let individualToken;
  let nakliyeciToken;
  let individualId;
  let nakliyeciId;

  beforeEach(async () => {
    server = app;

    // Create individual user
    const individualResponse = await request(server)
      .post('/api/auth/register')
      .send({
        firstName: 'Individual',
        lastName: 'User',
        email: `individual_${Date.now()}@test.com`,
        password: 'password123',
        userType: 'individual',
      });

    individualToken = individualResponse.body.token;
    individualId = individualResponse.body.data.id;

    // Create nakliyeci user
    const nakliyeciResponse = await request(server)
      .post('/api/auth/register')
      .send({
        firstName: 'Nakliyeci',
        lastName: 'User',
        email: `nakliyeci_${Date.now()}@test.com`,
        password: 'password123',
        userType: 'nakliyeci',
        companyName: 'Test Logistics',
      });

    nakliyeciToken = nakliyeciResponse.body.token;
    nakliyeciId = nakliyeciResponse.body.data.id;
  });

  afterEach(async () => {
    // no-op; using app instance
  });

  describe('Complete Shipment Workflow', () => {
    it('should complete full shipment workflow from creation to delivery', async () => {
      // Step 1: Individual creates shipment
      const shipmentData = {
        title: 'Test Shipment',
        description: 'Test shipment description',
        pickupAddress: 'Istanbul, Turkey',
        deliveryAddress: 'Ankara, Turkey',
        weight: 10.5,
        price: 500.0,
        category: 'electronics',
        pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      };

      const createResponse = await request(server)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${individualToken}`)
        .send(shipmentData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const shipmentId = createResponse.body.data.id;

      // Step 2: Nakliyeci views open shipments
      const openShipmentsResponse = await request(server)
        .get('/api/shipments/open')
        .set('Authorization', `Bearer ${nakliyeciToken}`)
        .expect(200);

      expect(openShipmentsResponse.body.success).toBe(true);
      expect(openShipmentsResponse.body.data).toHaveLength(1);
      expect(openShipmentsResponse.body.data[0].id).toBe(shipmentId);

      // Step 3: Nakliyeci makes offer
      const offerData = {
        shipmentId: shipmentId,
        price: 450.0,
        message: 'I can deliver this for 450 TL',
        estimatedDelivery: new Date(
          Date.now() + 36 * 60 * 60 * 1000
        ).toISOString(),
      };

      const offerResponse = await request(server)
        .post('/api/offers')
        .set('Authorization', `Bearer ${nakliyeciToken}`)
        .send(offerData)
        .expect(200);

      expect(offerResponse.body.success).toBe(true);
      const offerId = offerResponse.body.data.id;

      // Step 4: Individual views offers
      const offersResponse = await request(server)
        .get(`/api/shipments/${shipmentId}/offers`)
        .set('Authorization', `Bearer ${individualToken}`)
        .expect(200);

      expect(offersResponse.body.success).toBe(true);
      expect(offersResponse.body.data).toHaveLength(1);
      expect(offersResponse.body.data[0].id).toBe(offerId);

      // Step 5: Individual accepts offer
      const acceptResponse = await request(server)
        .post(`/api/offers/${offerId}/accept`)
        .set('Authorization', `Bearer ${individualToken}`)
        .expect(200);

      expect(acceptResponse.body.success).toBe(true);

      // Step 6: Verify shipment status updated
      const shipmentResponse = await request(server)
        .get('/api/shipments')
        .set('Authorization', `Bearer ${individualToken}`)
        .expect(200);

      expect(shipmentResponse.body.success).toBe(true);
      const updatedShipment = shipmentResponse.body.data.find(
        s => s.id === shipmentId
      );
      expect(updatedShipment.status).toBe('accepted');

      // Step 7: Nakliyeci views accepted shipments
      const nakliyeciShipmentsResponse = await request(server)
        .get('/api/shipments/nakliyeci')
        .set('Authorization', `Bearer ${nakliyeciToken}`)
        .expect(200);

      expect(nakliyeciShipmentsResponse.body.success).toBe(true);
      expect(nakliyeciShipmentsResponse.body.data).toHaveLength(1);
      expect(nakliyeciShipmentsResponse.body.data[0].id).toBe(shipmentId);
    });

    it('should handle multiple offers for same shipment', async () => {
      // Create shipment
      const shipmentData = {
        title: 'Multi-Offer Shipment',
        description: 'Shipment with multiple offers',
        pickupAddress: 'Istanbul, Turkey',
        deliveryAddress: 'Izmir, Turkey',
        weight: 5.0,
        price: 300.0,
        category: 'furniture',
      };

      const createResponse = await request(server)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${individualToken}`)
        .send(shipmentData)
        .expect(201);

      const shipmentId = createResponse.body.data.id;

      // Create second nakliyeci
      const nakliyeci2Response = await request(server)
        .post('/api/auth/register')
        .send({
          firstName: 'Nakliyeci2',
          lastName: 'User',
          email: 'nakliyeci2@test.com',
          password: 'password123',
          userType: 'nakliyeci',
          companyName: 'Test Logistics 2',
        });

      const nakliyeci2Token = nakliyeci2Response.body.token;

      // First nakliyeci makes offer
      await request(server)
        .post('/api/offers')
        .set('Authorization', `Bearer ${nakliyeciToken}`)
        .send({
          shipmentId: shipmentId,
          price: 280.0,
          message: 'First offer',
        })
        .expect(200);

      // Second nakliyeci makes offer
      await request(server)
        .post('/api/offers')
        .set('Authorization', `Bearer ${nakliyeci2Token}`)
        .send({
          shipmentId: shipmentId,
          price: 250.0,
          message: 'Second offer',
        })
        .expect(200);

      // Individual views all offers
      const offersResponse = await request(server)
        .get(`/api/shipments/${shipmentId}/offers`)
        .set('Authorization', `Bearer ${individualToken}`)
        .expect(200);

      expect(offersResponse.body.success).toBe(true);
      expect(offersResponse.body.data).toHaveLength(2);
    });
  });
});
