#!/usr/bin/env node
/**
 * Smoke test for production deployment
 * Run: node smoke-test-prod.js https://api.yolnext.com
 */

const axios = require('axios');

const API_BASE = process.argv[2] || 'http://localhost:5000';
const MAX_RETRIES = 3;

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  console.log(`🧪 Running smoke tests against: ${API_BASE}\n`);

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(
          `   Data: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// Test 1: Health check
test('Health check endpoint', async () => {
  const res = await axios.get(`${API_BASE}/api/health`);
  if (res.data.status !== 'ok') throw new Error('Health check failed');
  if (res.data.checks.database.status !== 'healthy') {
    throw new Error('Database unhealthy');
  }
});

// Test 2: Readiness probe
test('Readiness probe', async () => {
  const res = await axios.get(`${API_BASE}/api/health/ready`);
  if (!res.data.ready) throw new Error('Not ready');
});

// Test 3: Liveness probe
test('Liveness probe', async () => {
  const res = await axios.get(`${API_BASE}/api/health/live`);
  if (!res.data.alive) throw new Error('Not alive');
});

// Test 4: Demo endpoint blocked (production)
test('Demo login blocked in production', async () => {
  try {
    await axios.post(`${API_BASE}/api/auth/demo-login`, {
      userType: 'individual',
    });
    throw new Error('Demo endpoint should return 404 in production');
  } catch (error) {
    if (error.response?.status !== 404) {
      throw new Error(`Expected 404, got ${error.response?.status}`);
    }
  }
});

// Test 5: Real registration works
test('User registration', async () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const res = await axios.post(`${API_BASE}/api/auth/register`, {
    email: uniqueEmail,
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
  });
  if (!res.data.success || !res.data.data.token) {
    throw new Error('Registration failed');
  }
  // Save token for next test
  global.TEST_TOKEN = res.data.data.token;
});

// Test 6: Authentication required
test('Protected endpoint requires auth', async () => {
  try {
    await axios.get(`${API_BASE}/api/shipments`);
    throw new Error('Should require authentication');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error(`Expected 401, got ${error.response?.status}`);
    }
  }
});

// Test 7: Authenticated request works
test('Authenticated request', async () => {
  if (!global.TEST_TOKEN) throw new Error('No token from registration');
  const res = await axios.get(`${API_BASE}/api/shipments`, {
    headers: { Authorization: `Bearer ${global.TEST_TOKEN}` },
  });
  if (!res.data.success) throw new Error('Authenticated request failed');
});

// Test 8: Profile endpoint (real DB)
test('Profile endpoint returns real data', async () => {
  if (!global.TEST_TOKEN) throw new Error('No token from registration');
  const res = await axios.get(`${API_BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${global.TEST_TOKEN}` },
  });
  if (!res.data.success || !res.data.data.email) {
    throw new Error('Profile endpoint failed');
  }
  if (res.data.data.email === 'demo@test.com') {
    throw new Error('Profile returned demo data (should be real)');
  }
});

// Test 9: Pagination in shipments
test('Shipments list has pagination', async () => {
  if (!global.TEST_TOKEN) throw new Error('No token');
  const res = await axios.get(`${API_BASE}/api/shipments?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${global.TEST_TOKEN}` },
  });
  if (!res.data.meta || typeof res.data.meta.total !== 'number') {
    throw new Error('Pagination metadata missing');
  }
});

// Test 10: Pagination in offers
test('Offers list has pagination', async () => {
  const res = await axios.get(`${API_BASE}/api/offers?page=1&limit=10`);
  if (!res.data.meta || typeof res.data.meta.total !== 'number') {
    throw new Error('Pagination metadata missing');
  }
});

// Test 11: Metrics endpoint (Prometheus)
test('Metrics endpoint available', async () => {
  const res = await axios.get(`${API_BASE}/metrics`, {
    headers: { Accept: 'text/plain' },
  });
  if (!res.data.includes('http_request_duration_seconds')) {
    throw new Error('Metrics format incorrect');
  }
});

// Test 12: CORS headers
test('CORS headers present', async () => {
  const res = await axios.options(`${API_BASE}/api/shipments`, {
    headers: {
      Origin: 'https://yolnext.com',
      'Access-Control-Request-Method': 'POST',
    },
  });
  if (!res.headers['access-control-allow-origin']) {
    throw new Error('CORS headers missing');
  }
});

run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
