const request = require('supertest');
const { Pool } = require('pg');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

jest.setTimeout(60000);

// Use the test setup configuration (must run before importing server-modular)
require('../setup');

// Import the app and the original pool from the server
const { app, server, io, pool: originalPool } = require('../../server-modular');

// ---- CONFIGURATION ----
const TEST_DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// ---- TEST STATE ----
let testPool;
let testShipper;
let testCarrier;
let testShipment;
let testOffer;
let shipperToken;
let carrierToken;

// ---- HELPER FUNCTIONS ----
const createTestUser = async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await testPool.query(
        `INSERT INTO users ("firstName", "lastName", email, password, role, "fullName")
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, "firstName", "lastName", email, role`,
        [user.firstName, user.lastName, user.email, hashedPassword, user.role, `${user.firstName} ${user.lastName}`]
    );
    return result.rows[0];
};

const generateToken = (user) => {
    return jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
};

const ensureTestSchema = async () => {
    // Minimal schema required for this integration test file.
    // Keep it local to tests to avoid mutating production schema.

    // Ensure a deterministic schema even if a previous run created different column names.
    // This file targets the test database only.
    await testPool.query('DROP TABLE IF EXISTS transactions CASCADE');
    await testPool.query('DROP TABLE IF EXISTS wallets CASCADE');
    await testPool.query('DROP TABLE IF EXISTS offers CASCADE');
    await testPool.query('DROP TABLE IF EXISTS shipments CASCADE');
    await testPool.query('DROP TABLE IF EXISTS users CASCADE');

    await testPool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            "firstName" TEXT,
            "lastName" TEXT,
            "fullName" TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            "isActive" BOOLEAN DEFAULT TRUE
        );
    `);

    await testPool.query(`
        CREATE TABLE IF NOT EXISTS shipments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title TEXT,
            status TEXT,
            "pickupCity" TEXT,
            "deliveryCity" TEXT,
            "acceptedOfferId" INTEGER,
            nakliyeci_id INTEGER REFERENCES users(id),
            price NUMERIC,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await testPool.query(`
        CREATE TABLE IF NOT EXISTS offers (
            id SERIAL PRIMARY KEY,
            shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
            nakliyeci_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            price NUMERIC,
            status TEXT,
            "estimatedDelivery" TIMESTAMP,
            message TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await testPool.query(`
        CREATE TABLE IF NOT EXISTS wallets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            balance NUMERIC DEFAULT 0,
            reserved_balance NUMERIC DEFAULT 0
        );
    `);

    await testPool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            type TEXT,
            amount NUMERIC,
            status TEXT,
            description TEXT,
            reference_type TEXT,
            reference_id TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

// ---- TEST LIFECYCLE ----
beforeAll(async () => {
    // Ensure test database exists before connecting
    const testUrl = new URL(TEST_DATABASE_URL);
    const dbName = testUrl.pathname.replace('/', '') || 'yolnext_test';

    const adminUrl = new URL(TEST_DATABASE_URL);
    adminUrl.pathname = '/postgres';

    const adminClient = new Client({ connectionString: adminUrl.toString() });
    try {
        await adminClient.connect();
        const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
        if (exists.rows.length === 0) {
            await adminClient.query(`CREATE DATABASE ${dbName}`);
        }
    } finally {
        await adminClient.end();
    }

    // Use a separate pool for test database interaction
    testPool = new Pool({ connectionString: TEST_DATABASE_URL });
    await testPool.connect();

    // Prevent long/hanging queries in CI/local by setting a sane timeout
    try {
        await testPool.query('SET statement_timeout TO 5000');
    } catch (e) {
        // ignore
    }

    await ensureTestSchema();

    // Define test users
    const uniqueId = uuidv4().split('-')[0];
    testShipper = {
        firstName: 'Test',
        lastName: 'Shipper',
        email: `shipper-${uniqueId}@test.com`,
        password: 'password123',
        role: 'individual',
    };
    testCarrier = {
        firstName: 'Test',
        lastName: 'Carrier',
        email: `carrier-${uniqueId}@test.com`,
        password: 'password123',
        role: 'nakliyeci',
    };

    // No cleanup needed: schema was recreated above.

    // Create test users
    testShipper.db = await createTestUser(testShipper);
    testCarrier.db = await createTestUser(testCarrier);
    shipperToken = generateToken(testShipper.db);
    carrierToken = generateToken(testCarrier.db);

    // Create wallet for carrier with initial balance
    const initialBalance = 100.00;
    await testPool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [testCarrier.db.id, initialBalance]);

    // Create a shipment
    const shipmentRes = await testPool.query(
        `INSERT INTO shipments (user_id, title, status, "pickupCity", "deliveryCity")
         VALUES ($1, 'Test Shipment', 'waiting_for_offers', 'Istanbul', 'Ankara')
         RETURNING *`,
        [testShipper.db.id]
    );
    testShipment = shipmentRes.rows[0];

    // Create an offer via API to exercise commission reservation logic
    const offerPrice = 500.00;
    const createOfferRes = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${carrierToken}`)
        .send({ shipmentId: testShipment.id, price: offerPrice, message: 'Test offer' });

    expect(createOfferRes.status).toBe(201);
    expect(createOfferRes.body.success).toBe(true);
    testOffer = createOfferRes.body.data;

    // After offer creation: commission should be reserved (hold)
    const walletAfterCreate = await testPool.query(
        'SELECT balance, reserved_balance FROM wallets WHERE user_id = $1',
        [testCarrier.db.id]
    );
    expect(walletAfterCreate.rows.length).toBe(1);
    expect(parseFloat(walletAfterCreate.rows[0].balance)).toBeCloseTo(100.00);
    expect(parseFloat(walletAfterCreate.rows[0].reserved_balance)).toBeCloseTo(5.00);
});

afterAll(async () => {
    const closeServer = async (srv) => {
        if (!srv || !srv.listening) return;
        await new Promise(resolve => srv.close(() => resolve(true)));
    };

    const closeIo = async (ioInstance) => {
        if (!ioInstance || typeof ioInstance.close !== 'function') return;
        await new Promise(resolve => {
            try {
                ioInstance.close(() => resolve(true));
            } catch (_) {
                resolve(true);
            }
        });
    };

    // Deterministic teardown: fully close resources so Jest can exit cleanly.
    try {
        await closeIo(io);
    } catch (_) {
        // ignore
    }

    try {
        await closeServer(server);
    } catch (_) {
        // ignore
    }

    try {
        if (testPool) await testPool.end();
    } catch (_) {
        // ignore
    }

    try {
        if (originalPool && typeof originalPool.end === 'function') {
            await originalPool.end();
        }
    } catch (_) {
        // ignore
    }
});

// ---- TEST SUITE ----
describe('POST /api/offers/:id/accept - Commission Logic', () => {
    it('should accept offer, deduct 1% commission, and create a transaction record', async () => {
        // Restore console.log for this test to see debug output from the route
        const originalLog = console.log;
        console.log = jest.fn();

        // 1. EXECUTE THE API CALL
        const response = await request(app)
            .post(`/api/offers/${testOffer.id}/accept`)
            .set('Authorization', `Bearer ${shipperToken}`)
            .send();

        // Restore console.log
        console.log = originalLog;

        // Print captured logs for debugging if test fails
        // (response.status !== 200) && console.log('Captured logs:', console.log.mock.calls);
        
        // 2. ASSERT API RESPONSE
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Teklif başarıyla kabul edildi');

        // 3. ASSERT DATABASE STATE
        // Check carrier's wallet
        const walletRes = await testPool.query('SELECT balance, reserved_balance FROM wallets WHERE user_id = $1', [testCarrier.db.id]);
        const expectedBalance = 100.00 - (500.00 * 0.01); // 100 - 5 = 95
        expect(walletRes.rows.length).toBe(1);
        expect(parseFloat(walletRes.rows[0].balance)).toBeCloseTo(expectedBalance);
        expect(parseFloat(walletRes.rows[0].reserved_balance)).toBeCloseTo(0.00);

        // Check transaction record
        const transactionRes = await testPool.query(
            `SELECT * FROM transactions WHERE user_id = $1 AND reference_type = 'offer' AND reference_id = $2 ORDER BY id ASC`,
            [testCarrier.db.id, testOffer.id.toString()]
        );
        expect(transactionRes.rows.length).toBeGreaterThanOrEqual(1);
        const captureTx = transactionRes.rows.find(r => r.type === 'commission_capture' || r.type === 'commission');
        expect(captureTx).toBeTruthy();
        expect(parseFloat(captureTx.amount)).toBeCloseTo(5.00);

        // Check offer status
        const offerRes = await testPool.query('SELECT status FROM offers WHERE id = $1', [testOffer.id]);
        expect(offerRes.rows[0].status).toBe('accepted');

        // Check shipment status
        const shipmentRes = await testPool.query('SELECT status, "acceptedOfferId", nakliyeci_id FROM shipments WHERE id = $1', [testShipment.id]);
        expect(shipmentRes.rows[0].status).toBe('offer_accepted');
        expect(shipmentRes.rows[0].acceptedOfferId).toBe(testOffer.id);
        expect(shipmentRes.rows[0].nakliyeci_id).toBe(testCarrier.db.id);
    });

    it('should fail to create offer if carrier has insufficient funds for commission reservation', async() => {
        // Setup: Create a new carrier with a low balance
        const poorCarrier = await createTestUser({
            firstName: 'Poor',
            lastName: 'Carrier',
            email: `poorcarrier-${uuidv4().split('-')[0]}@test.com`,
            password: 'password123',
            role: 'nakliyeci',
        });
        await testPool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [poorCarrier.id, 2.00]); // Only 2 TL balance

        const poorCarrierToken = generateToken(poorCarrier);

        // Create a new shipment for this scenario
        const newShipmentRes = await testPool.query(
            `INSERT INTO shipments (user_id, title, status, "pickupCity", "deliveryCity")
             VALUES ($1, 'Test Shipment 2', 'waiting_for_offers', 'Izmir', 'Bursa')
             RETURNING *`,
            [testShipper.db.id]
        );
        const newShipment = newShipmentRes.rows[0];

        // 1. EXECUTE API CALL (offer creation should fail due to inability to reserve)
        const response = await request(app)
            .post('/api/offers')
            .set('Authorization', `Bearer ${poorCarrierToken}`)
            .send({ shipmentId: newShipment.id, price: 500.00, message: 'Too expensive' });

        // 2. ASSERT API RESPONSE
        expect(response.status).toBe(402);
        expect(response.body.success).toBe(false);
        expect(response.body.message || response.body.error).toBeTruthy();

        // 3. ASSERT DATABASE STATE (ensure rollback)
        // Check wallet balance (should be unchanged)
        const walletRes = await testPool.query('SELECT balance FROM wallets WHERE user_id = $1', [poorCarrier.id]);
        expect(parseFloat(walletRes.rows[0].balance)).toBeCloseTo(2.00);

        // Ensure no offer row was created
        const offerRes = await testPool.query(
            'SELECT COUNT(*)::int as c FROM offers WHERE shipment_id = $1 AND nakliyeci_id = $2',
            [newShipment.id, poorCarrier.id]
        );
        expect(offerRes.rows[0].c).toBe(0);
    });
});
