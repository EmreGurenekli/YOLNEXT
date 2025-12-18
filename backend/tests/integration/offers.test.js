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
    return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
};

const ensureTestSchema = async () => {
    // Minimal schema required for this integration test file.
    // Keep it local to tests to avoid mutating production schema.
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

    // If the table existed from an earlier run, ensure required columns exist.
    // (CREATE TABLE IF NOT EXISTS does not add columns)
    const colExists = async (table, column) => {
        const r = await testPool.query(
            `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
            [table, column]
        );
        return r.rows.length > 0;
    };

    if (!(await colExists('shipments', 'price'))) {
        await testPool.query('ALTER TABLE shipments ADD COLUMN price NUMERIC');
    }
    if (!(await colExists('shipments', 'createdAt'))) {
        await testPool.query('ALTER TABLE shipments ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }
    if (!(await colExists('shipments', 'updatedAt'))) {
        await testPool.query('ALTER TABLE shipments ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }

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
            balance NUMERIC DEFAULT 0
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

    // Clean up previous test data
    await testPool.query(`DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`);
    await testPool.query(`DELETE FROM wallets WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`);
    await testPool.query(`DELETE FROM offers WHERE nakliyeci_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`);
    await testPool.query(`DELETE FROM shipments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com')`);
    await testPool.query(`DELETE FROM users WHERE email = $1 OR email = $2`, [testShipper.email, testCarrier.email]);

    // Create test users
    testShipper.db = await createTestUser(testShipper);
    testCarrier.db = await createTestUser(testCarrier);
    shipperToken = generateToken(testShipper.db);

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

    // Create an offer
    const offerPrice = 500.00;
    const offerRes = await testPool.query(
        `INSERT INTO offers (shipment_id, nakliyeci_id, price, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [testShipment.id, testCarrier.db.id, offerPrice]
    );
    testOffer = offerRes.rows[0];
});

afterAll(async () => {
    const raceWithTimeout = async (promise, ms) => {
        let t;
        const timeout = new Promise(resolve => {
            t = setTimeout(resolve, ms);
            if (t && typeof t.unref === 'function') t.unref();
        });
        try {
            return await Promise.race([promise, timeout]);
        } finally {
            if (t) clearTimeout(t);
        }
    };

    const closeServer = async (srv) => {
        if (!srv || !srv.listening) return;
        await raceWithTimeout(
            new Promise(resolve => srv.close(() => resolve(true))),
            2000
        );
    };

    // Avoid hanging the test process: do minimal teardown with timeout guards.
    try {
        if (testPool) {
            await raceWithTimeout(testPool.end(), 2000);
        }
    } catch (e) {
        // ignore
    }

    try {
        if (io && typeof io.close === 'function') {
            try {
                io.close();
            } catch (e) {
                // ignore
            }
        }
        await closeServer(server);
    } catch (e) {
        // ignore
    }

    try {
        if (originalPool && typeof originalPool.end === 'function') {
            await raceWithTimeout(originalPool.end(), 2000);
        }
    } catch (e) {
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
        const walletRes = await testPool.query('SELECT balance FROM wallets WHERE user_id = $1', [testCarrier.db.id]);
        const expectedBalance = 100.00 - (500.00 * 0.01); // 100 - 5 = 95
        expect(walletRes.rows.length).toBe(1);
        expect(parseFloat(walletRes.rows[0].balance)).toBeCloseTo(expectedBalance);

        // Check transaction record
        const transactionRes = await testPool.query(
            `SELECT * FROM transactions WHERE user_id = $1 AND type = 'commission'`,
            [testCarrier.db.id]
        );
        expect(transactionRes.rows.length).toBe(1);
        const transaction = transactionRes.rows[0];
        expect(transaction.reference_type).toBe('offer');
        expect(transaction.reference_id).toBe(testOffer.id.toString()); // aSsuming reference_id is string
        expect(parseFloat(transaction.amount)).toBeCloseTo(5.00);

        // Check offer status
        const offerRes = await testPool.query('SELECT status FROM offers WHERE id = $1', [testOffer.id]);
        expect(offerRes.rows[0].status).toBe('accepted');

        // Check shipment status
        const shipmentRes = await testPool.query('SELECT status, "acceptedOfferId", nakliyeci_id FROM shipments WHERE id = $1', [testShipment.id]);
        expect(shipmentRes.rows[0].status).toBe('offer_accepted');
        expect(shipmentRes.rows[0].acceptedOfferId).toBe(testOffer.id);
        expect(shipmentRes.rows[0].nakliyeci_id).toBe(testCarrier.db.id);
    });

    it('should fail to accept offer if carrier has insufficient funds for commission', async() => {
        // Setup: Create a new carrier with a low balance
        const poorCarrier = await createTestUser({
            firstName: 'Poor',
            lastName: 'Carrier',
            email: `poorcarrier-${uuidv4().split('-')[0]}@test.com`,
            password: 'password123',
            role: 'nakliyeci',
        });
        await testPool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [poorCarrier.id, 2.00]); // Only 2 TL balance

        // Create a new shipment and offer for this scenario
        const newShipmentRes = await testPool.query(
            `INSERT INTO shipments (user_id, title, status, "pickupCity", "deliveryCity")
             VALUES ($1, 'Test Shipment 2', 'waiting_for_offers', 'Izmir', 'Bursa')
             RETURNING *`,
            [testShipper.db.id]
        );
        const newShipment = newShipmentRes.rows[0];

        const newOfferRes = await testPool.query(
            `INSERT INTO offers (shipment_id, nakliyeci_id, price, status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING *`,
            [newShipment.id, poorCarrier.id, 500.00] // Offer is 500, commission is 5 TL
        );
        const newOffer = newOfferRes.rows[0];

        // 1. EXECUTE API CALL
        const response = await request(app)
            .post(`/api/offers/${newOffer.id}/accept`)
            .set('Authorization', `Bearer ${shipperToken}`)
            .send();

        // 2. ASSERT API RESPONSE
        expect(response.status).toBe(500); // Should be a server error because the transaction is rolled back
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Teklif kabul edilemedi');
        expect(response.body.details).toContain('yeterli bakiye bulunmuyor');

        // 3. ASSERT DATABASE STATE (ensure rollback)
        // Check wallet balance (should be unchanged)
        const walletRes = await testPool.query('SELECT balance FROM wallets WHERE user_id = $1', [poorCarrier.id]);
        expect(parseFloat(walletRes.rows[0].balance)).toBeCloseTo(2.00);

        // Check offer status (should still be pending)
        const offerRes = await testPool.query('SELECT status FROM offers WHERE id = $1', [newOffer.id]);
        expect(offerRes.rows[0].status).toBe('pending');
    });
});
